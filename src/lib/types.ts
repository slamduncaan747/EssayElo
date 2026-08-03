import type { EvaluationResult } from "./evaluation/types";

/** Shared domain types. The DB is the source of truth; these mirror its rows. */

export type Plan = "free" | "plus";

export interface Profile {
  id: string;
  email: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface Essay {
  id: string;
  user_id: string;
  title: string;
  essay_type: string;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  essay_id: string;
  version: number;
  content: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export type EvaluationKind = "full" | "quick";
export type EvaluationRunStatus = "running" | "done" | "failed";
export type FeedbackStatus = "pending" | "done" | "failed";

/**
 * A row in `evaluations`. Scoring now happens entirely in the external
 * evaluator service (see `@/lib/evaluatorClient`); this row just tracks
 * lifecycle and holds the normalized result once it lands. `result` carries
 * everything the UI needs — score, dimensions, tier, and the full feedback
 * report — so there is nothing comparative (wins/losses/matchups) in the
 * shape the frontend ever touches.
 */
export interface Evaluation {
  id: string;
  essay_id: string;
  draft_id: string;
  user_id: string;
  kind: EvaluationKind;
  status: EvaluationRunStatus;
  feedback_status: FeedbackStatus;
  result: EvaluationResult | null;
  error: string | null;
  feedback_error: string | null;
  created_at: string;
  completed_at: string | null;
}
