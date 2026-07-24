import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import {
  validateEssayContent,
  validateEssayType,
  validateTitle,
  wordCount,
} from "@/lib/validate";
import {
  assertFullEvalAllowed,
  assertNoRunningEvaluation,
  matchBudgetFor,
} from "@/lib/quota";

export const runtime = "nodejs";

/** Create an essay + draft 1 and start its full evaluation. */
export async function POST(req: Request) {
  try {
    const ctx = await requireUser();
    const body = await req.json().catch(() => ({}));

    const content = validateEssayContent(body.content);
    const title = validateTitle(body.title);
    const essayType = validateEssayType(body.essay_type);

    await assertFullEvalAllowed(ctx.db, ctx.user.id, ctx.plan);
    await assertNoRunningEvaluation(ctx.db, ctx.user.id);

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

    const { data: evaluation, error: evalErr } = await ctx.db
      .from("evaluations")
      .insert({
        essay_id: essay.id,
        draft_id: draft.id,
        user_id: ctx.user.id,
        kind: "full",
        budget: await matchBudgetFor(ctx.db, ctx.plan),
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
