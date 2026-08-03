import type { Evaluation, Plan } from "./types";
import type { EvaluationResult } from "./evaluation/types";

/**
 * Gate a completed evaluation's result for the client by plan, mirroring
 * the previous free/plus boundary: free sees the score band, the tier, the
 * dimension profile, and the strongest-signal/focus-area summary; Plus
 * unlocks the exact decimal score and the full written feedback report
 * (reader snapshot, expandable dimension evidence, strength cards, revision
 * priorities, next-draft plan). Stripped server-side, not just hidden in
 * the UI, so a free account never receives Plus-only content over the wire.
 */
export interface EvaluationView {
  id: string;
  status: Evaluation["status"];
  feedbackStatus: Evaluation["feedback_status"];
  isPlus: boolean;
  error: string | null;
  feedbackError: string | null;
  createdAt: string;
  completedAt: string | null;
  result: EvaluationResult | null;
}

export function evaluationView(ev: Evaluation, plan: Plan): EvaluationView {
  const isPlus = plan === "plus";
  let result: EvaluationResult | null = ev.result;

  if (result && !isPlus) {
    result = {
      ...result,
      readerSnapshot: { currentImpression: "", memorableElement: "", missingDimension: "" },
      dimensionDetails: result.dimensionDetails.map((d) => ({
        ...d,
        excerpt: null,
        whatReadersSaw: "",
        revisionQuestion: "",
        confidenceLanguage: "",
      })),
      strengths: [],
      revisionPriorities: [],
      nextDraftPlan: [],
    };
  }

  return {
    id: ev.id,
    status: ev.status,
    feedbackStatus: ev.feedback_status,
    isPlus,
    error: ev.error,
    feedbackError: ev.feedback_error,
    createdAt: ev.created_at,
    completedAt: ev.completed_at,
    result,
  };
}
