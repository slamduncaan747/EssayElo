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

export type MarkKind = "standout" | "solid" | "weak" | "cliche";

export interface EssayMark {
  /** Verbatim excerpt from the essay this mark anchors to. */
  excerpt: string;
  kind: MarkKind;
  /** One-beat explanation, diagnosis-only. */
  note: string;
  /** A question or deletion suggestion — never supplied content. */
  fix: string | null;
  /** e.g. "+2–4" (points on the 0–100 scale) */
  impact: string | null;
}

export interface SynthesisResult {
  /** Per-paragraph quality, 0–100. */
  arc: number[];
  marks: EssayMark[];
  counts: { standout: number; solid: number; weak: number; cliche: number };
  biggest_positive: string;
  biggest_detractor: string;
  structure_score: number;
  /** Free tier shows counts + arc; note bodies are Plus-only (gated at the API). */
  readers_split: boolean;
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
  kind: EvaluationKind;
  status: EvaluationStatus;
  phase: EvaluationPhase;
  matches_done: number;
  budget: number;
  band: { low: number; high: number } | null;
  exact: number | null; // Plus only
  prose_score: number | null; // Plus only
  structure_score: number | null; // Plus only
  prose_tag: ProseTag | null; // Plus only
  direction_flag: string | null;
  arc: number[] | null;
  counts: SynthesisResult["counts"] | null;
  marks: EssayMark[] | null; // note/fix bodies stripped on free
  biggest_positive: string | null; // Plus only
  biggest_detractor: string | null; // Plus only
  readers_split: boolean;
  created_at: string;
  completed_at: string | null;
}
