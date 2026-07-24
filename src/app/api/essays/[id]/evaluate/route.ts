import { NextResponse } from "next/server";
import { handleApiError, requireOwnedEssay, requireUser } from "@/lib/api";
import { ApiError, isUuid } from "@/lib/validate";
import {
  assertFullEvalAllowed,
  assertNoRunningEvaluation,
  matchBudgetFor,
} from "@/lib/quota";

export const runtime = "nodejs";

/** Start a full evaluation (re-scores from scratch) of the latest draft. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(400, "Invalid id");
    const ctx = await requireUser();
    await requireOwnedEssay(ctx, id);
    await assertFullEvalAllowed(ctx.db, ctx.user.id, ctx.plan);
    await assertNoRunningEvaluation(ctx.db, ctx.user.id);

    const { data: draft } = await ctx.db
      .from("drafts")
      .select("id")
      .eq("essay_id", id)
      .order("version", { ascending: false })
      .limit(1)
      .single();
    if (!draft) throw new ApiError(404, "Draft not found");

    const { data: evaluation, error } = await ctx.db
      .from("evaluations")
      .insert({
        essay_id: id,
        draft_id: draft.id,
        user_id: ctx.user.id,
        kind: "full",
        budget: await matchBudgetFor(ctx.db, ctx.plan),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ evaluation_id: evaluation.id }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
