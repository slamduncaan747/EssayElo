import "server-only";
import type { Evaluation } from "../types";
import { isValidEvaluationResult, type EvaluationEvent } from "./types";
import { ERROR_COPY } from "./copy";

/** Turns a DB evaluation row into the terminal event(s) a transport would
 *  have emitted for it. Used by both the reload/reconnect GET route and the
 *  run route's response, so the client always sees the same event shape
 *  regardless of which one produced it. Callers here read the row straight
 *  from the DB (not through `@/lib/data`'s sanitized helpers), so a
 *  pre-rebuild `result` shape is re-validated rather than trusted. */
export function eventsFromRow(ev: Evaluation): EvaluationEvent[] {
  const events: EvaluationEvent[] = [
    { type: "analysis.started", sequence: 0, evaluation_id: ev.id },
  ];

  if (ev.status === "done" && ev.result && !isValidEvaluationResult(ev.result)) {
    events.push({
      type: "evaluation.failed",
      sequence: 1,
      evaluation_id: ev.id,
      stage: "scoring",
      message: "This essay was scored under an older version of Margin. Try again for an up-to-date result.",
      partialResult: null,
    });
    return events;
  }

  if (ev.status === "done" && ev.result) {
    if (ev.feedback_status === "failed") {
      events.push({
        type: "evaluation.failed",
        sequence: 1,
        evaluation_id: ev.id,
        stage: "feedback",
        message: ev.feedback_error || ERROR_COPY.feedback,
        partialResult: {
          score: ev.result.score,
          scoreInterval: ev.result.scoreInterval,
          tier: ev.result.tier,
          distanceToNextTier: ev.result.distanceToNextTier,
          dimensions: ev.result.dimensions,
          strongestSignal: ev.result.strongestSignal,
          focusArea: ev.result.focusArea,
        },
      });
    } else {
      events.push({
        type: "evaluation.completed",
        sequence: 1,
        evaluation_id: ev.id,
        result: ev.result,
      });
    }
    return events;
  }

  if (ev.status === "failed") {
    events.push({
      type: "evaluation.failed",
      sequence: 1,
      evaluation_id: ev.id,
      stage: "scoring",
      message: ev.error || ERROR_COPY.scoring,
      partialResult: null,
    });
    return events;
  }

  // Still running: only the started event exists so far.
  return events;
}
