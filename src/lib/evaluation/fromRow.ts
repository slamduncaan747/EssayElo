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
    // Scored, but the coaching pass hasn't run yet. Surface the score-bearing
    // phase rather than completion — the client follows up with the feedback
    // request, and only that produces `evaluation.completed`.
    if (ev.feedback_status === "pending") {
      events.push({
        type: "analysis.update",
        sequence: 1,
        evaluation_id: ev.id,
        progress: 92,
        phase: "synthesizing",
        provisional_score: ev.result.score,
        score_interval: ev.result.scoreInterval,
        tier: ev.result.tier,
        distance_to_next_tier: ev.result.distanceToNextTier,
        confidence: "stable",
        dimensions: ev.result.dimensions,
        strongest_signal: ev.result.strongestSignal,
        focus_area: ev.result.focusArea,
      });
      events.push({
        type: "feedback.started",
        sequence: 2,
        evaluation_id: ev.id,
        progress: 94,
      });
      return events;
    }

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
