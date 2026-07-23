import { NextResponse } from "next/server";
import { handleApiError, requireOwnedEssay, requireUser } from "@/lib/api";
import { ApiError, isUuid } from "@/lib/validate";
import {
  assertNoRunningEvaluation,
  assertQuickCheckAllowed,
  QUICK_CHECK_BUDGET,
} from "@/lib/quota";

export const runtime = "nodejs";

/**
 * Quick check: 5 matches starting from the previous full evaluation's rating
 * — enough to see movement without re-scoring from scratch. Free & unlimited
 * (soft daily cap against abuse).
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw new ApiError(400, "Invalid id");
    const ctx = await requireUser();
    await requireOwnedEssay(ctx, id);
    await assertQuickCheckAllowed(ctx.db, ctx.user.id);
    await assertNoRunningEvaluation(ctx.db, ctx.user.id);

    // Anchor point: the most recent completed evaluation of this essay.
    const { data: prev } = await ctx.db
      .from("evaluations")
      .select("id, elo")
      .eq("essay_id", id)
      .eq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (!prev?.elo) {
      throw new ApiError(400, "Run a full evaluation before quick-checking edits");
    }

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
        kind: "quick",
        budget: QUICK_CHECK_BUDGET,
        // Quick checks skip placement: start from the previous position.
        phase: "match",
        elo: prev.elo,
        start_elo: prev.elo,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ evaluation_id: evaluation.id }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
