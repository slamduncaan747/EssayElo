import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import {
  validateEssayContent,
  validateEssayType,
  validateTitle,
  wordCount,
} from "@/lib/validate";
import { assertFullEvalAllowed } from "@/lib/quota";
import { runStubEvaluation } from "@/lib/evaluate";

export const runtime = "nodejs";

/**
 * Create an essay + draft 1 and score it immediately.
 *
 * Scoring is a local stub for now (see src/lib/evaluate.ts) — a real,
 * separately-hosted engine will replace it, but the row shape (status
 * "done" up front, elo/ci/result populated) stays the same either way.
 */
export async function POST(req: Request) {
  try {
    const ctx = await requireUser();
    const body = await req.json().catch(() => ({}));

    const content = validateEssayContent(body.content);
    const title = validateTitle(body.title);
    const essayType = validateEssayType(body.essay_type);

    await assertFullEvalAllowed(ctx.db, ctx.user.id, ctx.plan);

    const { data: essay, error: essayErr } = await ctx.db
      .from("essays")
      .insert({ user_id: ctx.user.id, title, essay_type: essayType })
      .select()
      .single();
    if (essayErr) throw new Error(essayErr.message);

    const { data: draft, error: draftErr } = await ctx.db
      .from("drafts")
      .insert({
        essay_id: essay.id,
        version: 1,
        content,
        word_count: wordCount(content),
      })
      .select()
      .single();
    if (draftErr) throw new Error(draftErr.message);

    const scored = runStubEvaluation();
    const { data: evaluation, error: evalErr } = await ctx.db
      .from("evaluations")
      .insert({
        essay_id: essay.id,
        draft_id: draft.id,
        user_id: ctx.user.id,
        kind: "full",
        budget: 1,
        matches_done: 1,
        status: "done",
        phase: "done",
        ...scored,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (evalErr) throw new Error(evalErr.message);

    return NextResponse.json(
      { essay_id: essay.id, evaluation_id: evaluation.id },
      { status: 201 }
    );
  } catch (e) {
    return handleApiError(e);
  }
}
