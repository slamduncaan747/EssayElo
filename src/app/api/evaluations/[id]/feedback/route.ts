import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { isUuid } from "@/lib/validate";
import { generateFeedback } from "@/lib/feedback/generate";
import { eventsFromRow } from "@/lib/evaluation/fromRow";
import { ERROR_COPY } from "@/lib/evaluation/copy";
import { isValidEvaluationResult } from "@/lib/evaluation/types";
import type { Evaluation } from "@/lib/types";

export const runtime = "nodejs";
// The coaching pass runs a frontier model at high effort over a full essay;
// a few minutes is normal. Kept separate from scoring precisely so neither
// stage has to fit in the other's time budget.
export const maxDuration = 300;

/**
 * Generates (or regenerates) the written coaching for an already-scored
 * evaluation. Requires a valid stored result — this never re-runs scoring,
 * so a feedback retry can never change the student's score.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUuid(id)) throw Object.assign(new Error("Not found"), { status: 404 });
    const ctx = await requireUser();

    const { data: evRow } = await ctx.db
      .from("evaluations")
      .select("*")
      .eq("id", id)
      .eq("user_id", ctx.user.id)
      .single();
    if (!evRow) throw Object.assign(new Error("Not found"), { status: 404 });
    let evaluation = evRow as Evaluation;

    if (!isValidEvaluationResult(evaluation.result)) {
      // Nothing to write coaching about yet.
      return NextResponse.json({ events: eventsFromRow(evaluation) });
    }
    if (evaluation.feedback_status === "done") {
      return NextResponse.json({ events: eventsFromRow(evaluation) });
    }

    const { data: draft } = await ctx.db
      .from("drafts")
      .select("content")
      .eq("id", evaluation.draft_id)
      .single();
    if (!draft) throw Object.assign(new Error("Draft missing"), { status: 500 });

    const scored = evaluation.result;

    try {
      const coaching = await generateFeedback({
        essay: draft.content,
        score: scored.score,
        tier: scored.tier,
        dimensions: scored.dimensions,
        strongestSignal: scored.strongestSignal,
        focusArea: scored.focusArea,
      });

      const { data: updated, error: updateErr } = await ctx.db
        .from("evaluations")
        .update({
          feedback_status: "done",
          feedback_error: null,
          result: { ...scored, ...coaching },
        })
        .eq("id", evaluation.id)
        .select()
        .single();
      if (updateErr) throw new Error(updateErr.message);
      evaluation = updated as Evaluation;
    } catch (feedbackError) {
      console.error("feedback_generation_failed", {
        evaluationId: evaluation.id,
        errorClass: feedbackError instanceof Error ? feedbackError.name : typeof feedbackError,
        message: feedbackError instanceof Error ? feedbackError.message : undefined,
      });

      // The score stays exactly as it was — only the coaching is marked
      // failed, so the rail keeps showing a real, authoritative result.
      const { data: updated } = await ctx.db
        .from("evaluations")
        .update({ feedback_status: "failed", feedback_error: ERROR_COPY.feedback })
        .eq("id", evaluation.id)
        .select()
        .single();
      if (updated) evaluation = updated as Evaluation;
    }

    return NextResponse.json({ events: eventsFromRow(evaluation) });
  } catch (e) {
    return handleApiError(e);
  }
}
