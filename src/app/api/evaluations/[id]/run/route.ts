import { NextResponse } from "next/server";
import { handleApiError, requireUser } from "@/lib/api";
import { isUuid } from "@/lib/validate";
import { callEvaluator, EvaluatorError, normalizeEvaluatorResponse } from "@/lib/evaluatorClient";
import { evaluatorMockFlag } from "@/lib/evaluation/serverMock";
import { eventsFromRow } from "@/lib/evaluation/fromRow";
import { ERROR_COPY } from "@/lib/evaluation/copy";
import type { EvaluationEvent } from "@/lib/evaluation/types";
import type { Evaluation } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Triggers (or re-triggers) the actual scoring call for an evaluation that
 * belongs to the caller. Idempotent: calling it again on an already-done
 * evaluation with healthy feedback is a no-op that just returns the stored
 * result; calling it on a failed evaluation (scoring or feedback-only)
 * re-attempts the single, atomic evaluator call — the current API has no
 * way to regenerate feedback alone, so a feedback-only retry re-runs the
 * whole thing rather than duplicating the score.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (evaluation.status === "done" && evaluation.feedback_status !== "failed") {
      return NextResponse.json({ events: eventsFromRow(evaluation) });
    }

    const { data: draft } = await ctx.db
      .from("drafts")
      .select("content")
      .eq("id", evaluation.draft_id)
      .single();
    if (!draft) throw Object.assign(new Error("Draft missing"), { status: 500 });

    try {
      const raw = await callEvaluator({ essay: draft.content, mock: evaluatorMockFlag() });
      const result = normalizeEvaluatorResponse(raw, draft.content, evaluation.id, evaluatorMockFlag());

      const hasFeedback =
        result.dimensionDetails.length > 0 &&
        result.strengths.length > 0 &&
        result.revisionPriorities.length > 0;

      const { data: updated, error: updateErr } = await ctx.db
        .from("evaluations")
        .update({
          status: "done",
          feedback_status: hasFeedback ? "done" : "failed",
          feedback_error: hasFeedback ? null : "The written feedback did not come back complete.",
          result,
          error: null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", evaluation.id)
        .select()
        .single();
      if (updateErr) throw new Error(updateErr.message);
      evaluation = updated as Evaluation;
    } catch (evalError) {
      console.error("evaluation_run_failed", {
        evaluationId: evaluation.id,
        isEvaluatorError: evalError instanceof EvaluatorError,
      });

      const { data: updated, error: updateErr } = await ctx.db
        .from("evaluations")
        .update({ status: "failed", error: ERROR_COPY.scoring })
        .eq("id", evaluation.id)
        .select()
        .single();

      // Even if persisting the failure itself fails (a second, unrelated DB
      // error), the caller still needs a terminal event — otherwise the UI
      // is stuck showing "reading" forever with no way to retry.
      const failedEvents: EvaluationEvent[] = [
        { type: "analysis.started", sequence: 0, evaluation_id: evaluation.id },
        {
          type: "evaluation.failed",
          sequence: 1,
          evaluation_id: evaluation.id,
          stage: "scoring",
          message: ERROR_COPY.scoring,
          partialResult: null,
        },
      ];

      if (!updateErr && updated) evaluation = updated as Evaluation;
      return NextResponse.json({ events: updateErr ? failedEvents : eventsFromRow(evaluation) });
    }

    return NextResponse.json({ events: eventsFromRow(evaluation) });
  } catch (e) {
    return handleApiError(e);
  }
}
