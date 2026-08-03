import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { isUuid, validateEssayContent, wordCount } from "@/lib/validate";
import { assertFullEvalAllowed } from "@/lib/quota";

export const runtime = "nodejs";

/**
 * Saves any edits to a draft and starts a new evaluation for it — the
 * same "create running, score asynchronously" pattern as the first
 * evaluation (see /api/essays), just against an existing essay/draft.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const { id, draftId } = await params;
    if (!isUuid(id) || !isUuid(draftId)) throw Object.assign(new Error("Not found"), { status: 404 });
    const ctx = await requireUser();

    const { data: draft } = await ctx.db
      .from("drafts")
      .select("id, essay_id")
      .eq("id", draftId)
      .eq("essay_id", id)
      .single();
    if (!draft) throw Object.assign(new Error("Not found"), { status: 404 });

    const { data: essay } = await ctx.db
      .from("essays")
      .select("id")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .single();
    if (!essay) throw Object.assign(new Error("Not found"), { status: 404 });

    const body = await req.json().catch(() => ({}));
    if (typeof body.content === "string") {
      const content = validateEssayContent(body.content);
      await ctx.db
        .from("drafts")
        .update({ content, word_count: wordCount(content), updated_at: new Date().toISOString() })
        .eq("id", draftId);
    }

    await assertFullEvalAllowed(ctx.db, ctx.user.id, ctx.plan);

    const { data: evaluation, error: evalErr } = await ctx.db
      .from("evaluations")
      .insert({
        essay_id: id,
        draft_id: draftId,
        user_id: ctx.user.id,
        kind: "full",
        budget: 1,
        status: "running",
      })
      .select()
      .single();
    if (evalErr) throw new Error(evalErr.message);

    return NextResponse.json({ evaluation_id: evaluation.id }, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
