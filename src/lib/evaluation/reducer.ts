import { ERROR_COPY } from "./copy";
import {
  DIMENSION_KEYS,
  INITIAL_VIEW_STATE,
  type DimensionScores,
  type EvaluationEvent,
  type EvaluationViewState,
  type Insight,
} from "./types";

/**
 * Pure reducer: raw transport events in, canonical view state out.
 *
 * Idempotency contract: events carry a monotonically increasing `sequence`.
 * Anything at or below the sequence we've already applied is a duplicate or
 * a stale replay (reconnection, retry) and is dropped. Progress never moves
 * backward, and never reaches 100 before an `evaluation.completed` event.
 */
export function evaluationReducer(
  state: EvaluationViewState,
  event: EvaluationEvent,
  opts: { mock?: boolean } = {}
): EvaluationViewState {
  if (event.sequence <= state.sequence && state.sequence >= 0) return state;

  const base: EvaluationViewState = {
    ...state,
    sequence: event.sequence,
    evaluationId: event.evaluation_id,
    mock: opts.mock ?? state.mock,
  };

  switch (event.type) {
    case "analysis.started": {
      return {
        ...base,
        status: "reading",
        progress: Math.max(state.progress, 1),
        progressIsDeterminate: true,
      };
    }

    case "analysis.update": {
      const cappedProgress = Math.min(99, event.progress);
      const dimensions: Partial<DimensionScores> = { ...state.dimensions };
      if (event.dimensions) {
        for (const k of DIMENSION_KEYS) {
          const v = event.dimensions[k];
          if (typeof v === "number") dimensions[k] = v;
        }
      }
      return {
        ...base,
        status: event.phase,
        progress: Math.max(state.progress, cappedProgress),
        progressIsDeterminate: true,
        rawScore: event.provisional_score ?? state.rawScore,
        scoreInterval: event.score_interval ?? state.scoreInterval,
        tier: event.tier ?? state.tier,
        distanceToNextTier: event.distance_to_next_tier ?? state.distanceToNextTier,
        confidence: event.confidence,
        dimensions,
        strongestSignal: event.strongest_signal ?? state.strongestSignal,
        focusArea: event.focus_area ?? state.focusArea,
        provisional: true,
      };
    }

    case "insight.update": {
      const incoming = event.insight;
      const insights = state.insights.filter((i) => i.id !== incoming.id);
      if (incoming.status === "withdrawn" || incoming.status === "contradicted") {
        return { ...base, insights };
      }
      if (incoming.status === "tentative") {
        // Tentative insights stay hidden from the UI by design.
        return { ...base, insights };
      }
      const clean: Insight = {
        id: incoming.id,
        category: incoming.category,
        status: incoming.status,
        title: incoming.title,
        text: incoming.text,
        evidence: incoming.evidence,
      };
      return { ...base, insights: [...insights, clean] };
    }

    case "feedback.started": {
      return {
        ...base,
        status: "synthesizing",
        progress: Math.max(state.progress, Math.min(99, event.progress)),
        progressIsDeterminate: true,
      };
    }

    case "evaluation.completed": {
      return {
        ...base,
        status: "complete",
        progress: 100,
        progressIsDeterminate: true,
        rawScore: event.result.score,
        scoreInterval: event.result.scoreInterval,
        tier: event.result.tier,
        distanceToNextTier: event.result.distanceToNextTier,
        confidence: "stable",
        dimensions: event.result.dimensions,
        strongestSignal: event.result.strongestSignal,
        focusArea: event.result.focusArea,
        insights: event.result.confirmedInsights,
        provisional: false,
        result: event.result,
        error: null,
      };
    }

    case "evaluation.failed": {
      const partial = event.partialResult;
      return {
        ...base,
        status: "failed",
        error: { stage: event.stage, message: event.message || ERROR_COPY[event.stage] },
        ...(partial
          ? {
              rawScore: partial.score,
              scoreInterval: partial.scoreInterval,
              tier: partial.tier,
              distanceToNextTier: partial.distanceToNextTier,
              dimensions: partial.dimensions,
              strongestSignal: partial.strongestSignal,
              focusArea: partial.focusArea,
              provisional: event.stage === "feedback" ? false : state.provisional,
            }
          : {}),
      };
    }

    default:
      return base;
  }
}

export function initialViewState(): EvaluationViewState {
  return { ...INITIAL_VIEW_STATE };
}
