/**
 * Domain types for the live evaluation experience and the post-evaluation
 * feedback dashboard.
 *
 * These are intentionally decoupled from the DB row shape in `@/lib/types`:
 * that file mirrors storage (including internal comparative fields like
 * wins/losses that must never reach the UI); this file is what the frontend
 * state machine and every component actually consume.
 */

export type EvaluationStatus =
  | "idle"
  | "submitting"
  | "reading"
  | "locating"
  | "mapping"
  | "verifying"
  | "synthesizing"
  | "complete"
  | "failed";

/** Live phases only — excludes the terminal/pre states. */
export const LIVE_PHASES: EvaluationStatus[] = [
  "reading",
  "locating",
  "mapping",
  "verifying",
  "synthesizing",
];

export type Confidence = "early" | "building" | "stable";

export type DimensionKey =
  | "distinctiveness"
  | "specificity"
  | "reflection"
  | "voice"
  | "structure"
  | "memorability"
  | "prose_control";

export const DIMENSION_KEYS: DimensionKey[] = [
  "distinctiveness",
  "specificity",
  "reflection",
  "voice",
  "structure",
  "memorability",
  "prose_control",
];

export type DimensionScores = Record<DimensionKey, number>;

export interface ScoreInterval {
  low: number;
  high: number;
}

export type InsightStatus = "tentative" | "emerging" | "confirmed";

/** Wire-level status also includes withdrawal — filtered out before it ever
 *  reaches the reducer's output state, per the "never show a retracted
 *  insight" rule. */
export type WireInsightStatus = InsightStatus | "withdrawn" | "contradicted";

export interface Insight {
  id: string;
  category: DimensionKey | string;
  status: InsightStatus;
  title: string;
  text: string;
  /** Must be an exact substring of the submitted essay, or omitted. */
  evidence: string | null;
}

interface WireInsight extends Omit<Insight, "status"> {
  status: WireInsightStatus;
}

// ---------------------------------------------------------------------------
// Post-evaluation report shapes
// ---------------------------------------------------------------------------

export interface ReaderSnapshot {
  currentImpression: string;
  memorableElement: string;
  missingDimension: string;
}

export interface DimensionDetail {
  key: DimensionKey;
  score: number;
  status: string;
  interpretation: string;
  evidenceCount: number;
  whatReadersSaw: string;
  excerpt: string | null;
  whyItMatters: string;
  revisionQuestion: string;
  confidenceLanguage: string;
}

export interface StrengthCard {
  category: DimensionKey | string;
  title: string;
  explanation: string;
  excerpt: string;
  whyItMatters: string;
  protectNote: string;
}

export interface RevisionPriority {
  rank: 1 | 2 | 3;
  category: DimensionKey | string;
  diagnosis: string;
  excerpt: string;
  whyItMatters: string;
  direction: string;
  question: string;
  successTest: string;
}

/** The complete, authoritative final payload. */
export interface EvaluationResult {
  evaluationId: string;
  score: number; // one decimal
  scoreInterval: ScoreInterval;
  tier: string;
  distanceToNextTier: number | null;
  dimensions: DimensionScores;
  strongestSignal: DimensionKey;
  focusArea: DimensionKey;
  confirmedInsights: Insight[];
  readerSnapshot: ReaderSnapshot;
  dimensionDetails: DimensionDetail[];
  strengths: StrengthCard[];
  revisionPriorities: RevisionPriority[];
  nextDraftPlan: string[];
  completedAt: string;
  /** True only for fixture/mock runs — never true in production. */
  mock: boolean;
}

/**
 * Guards against evaluation rows stored under the previous (pre-rebuild)
 * schema — wins/losses/ties, fractional dimensions, no `scoreInterval` or
 * `dimensionDetails`. Those rows exist in production for any essay scored
 * before this migration and must never be assumed to match the current
 * shape: destructuring a legacy `result` as if it were an `EvaluationResult`
 * throws (e.g. `result.scoreInterval` is `undefined`), which previously
 * crashed every page that renders the sidebar's recent-essays list. Callers
 * that read a stored `result` should validate it with this first and treat
 * a `false` as "needs a fresh evaluation," not attempt to render it.
 */
export function isValidEvaluationResult(value: unknown): value is EvaluationResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  const interval = r.scoreInterval as Record<string, unknown> | undefined;
  return (
    typeof r.score === "number" &&
    !!interval &&
    typeof interval.low === "number" &&
    typeof interval.high === "number" &&
    !!r.dimensions &&
    typeof r.dimensions === "object" &&
    Array.isArray(r.dimensionDetails) &&
    Array.isArray(r.strengths) &&
    Array.isArray(r.revisionPriorities) &&
    Array.isArray(r.confirmedInsights) &&
    Array.isArray(r.nextDraftPlan)
  );
}

// ---------------------------------------------------------------------------
// Transport event contract (mirrors the desired SSE backend contract)
// ---------------------------------------------------------------------------

interface BaseEvent {
  sequence: number;
  evaluation_id: string;
}

export interface AnalysisStartedEvent extends BaseEvent {
  type: "analysis.started";
}

export interface AnalysisUpdateEvent extends BaseEvent {
  type: "analysis.update";
  progress: number;
  phase: EvaluationStatus;
  provisional_score: number | null;
  score_interval: ScoreInterval | null;
  tier: string | null;
  distance_to_next_tier: number | null;
  confidence: Confidence;
  dimensions: Partial<DimensionScores> | null;
  strongest_signal: DimensionKey | null;
  focus_area: DimensionKey | null;
}

export interface InsightUpdateEvent extends BaseEvent {
  type: "insight.update";
  insight: WireInsight;
}

export interface FeedbackStartedEvent extends BaseEvent {
  type: "feedback.started";
  progress: number;
}

export interface EvaluationCompletedEvent extends BaseEvent {
  type: "evaluation.completed";
  result: EvaluationResult;
}

export interface EvaluationFailedEvent extends BaseEvent {
  type: "evaluation.failed";
  stage: "scoring" | "feedback";
  message: string;
  /** Present when the scoring stage succeeded before feedback failed, so the
   *  UI can preserve the score instead of discarding it. */
  partialResult: Pick<
    EvaluationResult,
    "score" | "scoreInterval" | "tier" | "distanceToNextTier" | "dimensions" | "strongestSignal" | "focusArea"
  > | null;
}

export type EvaluationEvent =
  | AnalysisStartedEvent
  | AnalysisUpdateEvent
  | InsightUpdateEvent
  | FeedbackStartedEvent
  | EvaluationCompletedEvent
  | EvaluationFailedEvent;

// ---------------------------------------------------------------------------
// Canonical view state — the single source of truth every component reads.
// ---------------------------------------------------------------------------

export interface EvaluationViewState {
  status: EvaluationStatus;
  evaluationId: string | null;
  sequence: number;
  /** 0-100, monotonically non-decreasing, never 100 before `complete`. */
  progress: number;
  /** True while progress is a meaningful signal; false for the honest
   *  indeterminate wait of the non-streaming production transport. */
  progressIsDeterminate: boolean;
  rawScore: number | null;
  scoreInterval: ScoreInterval | null;
  tier: string | null;
  distanceToNextTier: number | null;
  confidence: Confidence | null;
  dimensions: Partial<DimensionScores>;
  strongestSignal: DimensionKey | null;
  focusArea: DimensionKey | null;
  insights: Insight[];
  provisional: boolean;
  result: EvaluationResult | null;
  error: { stage: "scoring" | "feedback"; message: string } | null;
  /** True only when driven by the development fixture transport. */
  mock: boolean;
}

export const INITIAL_VIEW_STATE: EvaluationViewState = {
  status: "idle",
  evaluationId: null,
  sequence: -1,
  progress: 0,
  progressIsDeterminate: false,
  rawScore: null,
  scoreInterval: null,
  tier: null,
  distanceToNextTier: null,
  confidence: null,
  dimensions: {},
  strongestSignal: null,
  focusArea: null,
  insights: [],
  provisional: true,
  result: null,
  error: null,
  mock: false,
};

export interface EvaluationSession {
  evaluationId: string;
  mock: boolean;
}

export interface EvaluationInput {
  essayId: string;
  evaluationId: string;
}
