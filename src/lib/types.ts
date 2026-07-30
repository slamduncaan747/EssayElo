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
export type EvaluationStatus = "running" | "done" | "failed";
export type EvaluationPhase =
  | "placement"
  | "match"
  | "prose"
  | "synthesis"
  | "done";

export type ProseTag = "carrying" | "substance_ahead" | "aligned";

export interface Evaluation {
  id: string;
  essay_id: string;
  draft_id: string;
  user_id: string;
  kind: EvaluationKind;
  budget: number;
  matches_done: number;
  status: EvaluationStatus;
  phase: EvaluationPhase;
  elo: number | null;
  start_elo: number | null;
  ci: number | null;
  placement_tier: number | null;
  prose_score: number | null;
  prose_tag: ProseTag | null;
  structure_score: number | null;
  direction_flag: string | null;
  intransitivity: number;
  result: SynthesisResult | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export type Margin = "decisive" | "clear" | "narrow";
export type MatchWinner = "user" | "opponent" | "split";

/** Fields harvested from a single head-to-head judgment (byproducts of the verdict). */
export interface Harvest {
  decisive_differentiator: string;
  axis: "producibility" | "execution" | "cohesion" | "other";
  win_reason: string | null;
  loss_reason: string | null;
  most_producible_revelation: string;
  producibility_estimate: string;
  met_person_moment: string | null;
  wasted_opportunity: string | null;
  direction_flag: string | null;
}

export interface MatchRow {
  id: string;
  evaluation_id: string;
  corpus_essay_id: string;
  round: number;
  winner: MatchWinner;
  margin: Margin;
  weight: number;
  off_axis: boolean;
  harvest: Harvest | null;
  elo_before: number;
  elo_after: number;
  opp_elo: number;
}

/** The seven axes judges compare essays on, each 0–1. */
export interface DimensionScores {
  distinctiveness: number;
  specificity: number;
  reflection: number;
  voice: number;
  structure: number;
  prompt_fulfillment: number;
  memorability: number;
}

export interface RecurringPoint {
  category: keyof DimensionScores | string;
  frequency: number;
  summary: string;
}

export interface CoachingReport {
  reader_impression: { learns: string; remembers: string; unclear: string };
  strengths: { dimension: string; evidence: string }[];
  weaknesses: { dimension: string; evidence: string; why_it_matters: string }[];
  revision_questions: string[];
  next_objective: string;
}

export interface SynthesisResult {
  wins: number;
  losses: number;
  ties: number;
  dimensions: DimensionScores;
  recurring_strengths: RecurringPoint[];
  recurring_weaknesses: RecurringPoint[];
  /** Plus-only deep coaching pass; absent until synthesized. */
  coaching: CoachingReport | null;
}

export interface CorpusEssay {
  id: string;
  content: string;
  source: "anchor" | "seed" | "user";
  locked: boolean;
  elo: number;
  match_count: number;
  prose_score: number | null;
}

/** Public (gated) shape returned to the client for an evaluation. */
export interface EvaluationView {
  id: string;
  status: EvaluationStatus;
  band: { low: number; high: number } | null;
  exact: number | null; // Plus only
  wins: number;
  losses: number;
  ties: number;
  dimensions: DimensionScores | null;
  recurring_strengths: RecurringPoint[];
  recurring_weaknesses: RecurringPoint[];
  coaching: CoachingReport | null; // Plus only
  created_at: string;
  completed_at: string | null;
}
