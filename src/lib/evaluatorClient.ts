import "server-only";
import { DIMENSION_KEYS, type DimensionKey, type DimensionScores, type EvaluationResult } from "./evaluation/types";
import { tierForScore } from "./tier";

/**
 * Server-only client for the deployed scoring engine.
 *
 * `EVALUATOR_API_URL` / `EVALUATOR_API_KEY` live in server-only env vars
 * (never `NEXT_PUBLIC_*`) and this module is never imported from a client
 * component — `server-only` enforces that at build time.
 *
 * The response shape below is inferred from the SSE contract the product
 * spec describes (the `evaluation.completed.result` example) since the
 * live endpoint could not be reached from this environment to confirm the
 * exact field names. `normalizeEvaluatorResponse` is deliberately
 * defensive — it accepts a few plausible spellings per field — so a small
 * naming mismatch degrades gracefully instead of crashing the request.
 * Tighten it once the real payload is confirmed against a live call.
 */

export interface EvaluatorRequest {
  essay: string;
  mock: boolean;
}

export class EvaluatorError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

/** Raw call to Cloud Run. Never logs essay text or the API key. */
export async function callEvaluator(req: EvaluatorRequest): Promise<unknown> {
  const url = `${env("EVALUATOR_API_URL").replace(/\/$/, "")}/v1/evaluations`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": env("EVALUATOR_API_KEY"),
    },
    body: JSON.stringify({ essay: req.essay, mock: req.mock }),
    // Real (non-mock) evaluations can legitimately take minutes — the
    // deployed service's own request timeout is ~220s and its Cloud Run
    // container timeout is 240s. Stay just under that so a slow-but-alive
    // request gets the service's own timeout response instead of us
    // aborting first and masking what actually happened.
    signal: AbortSignal.timeout(235_000),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    console.error("evaluator_api_error", { status: res.status, hasDetail: !!detail });
    throw new EvaluatorError("The evaluation service returned an error", res.status);
  }

  return res.json();
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function normalizeDimensions(raw: unknown): DimensionScores {
  const r = asRecord(raw);
  const out = {} as DimensionScores;
  for (const key of DIMENSION_KEYS) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    const v = num(pick(r, key, camel));
    out[key] = v != null ? Math.round(Math.max(0, Math.min(100, v))) : 0;
  }
  return out;
}

function strongestAndFocus(
  dims: DimensionScores,
  explicitStrong: unknown,
  explicitFocus: unknown
): { strongest: DimensionKey; focus: DimensionKey } {
  const strong = DIMENSION_KEYS.includes(explicitStrong as DimensionKey)
    ? (explicitStrong as DimensionKey)
    : DIMENSION_KEYS.reduce((a, b) => (dims[b] > dims[a] ? b : a));
  const focus = DIMENSION_KEYS.includes(explicitFocus as DimensionKey)
    ? (explicitFocus as DimensionKey)
    : DIMENSION_KEYS.reduce((a, b) => (dims[b] < dims[a] ? b : a));
  return { strongest: strong, focus };
}

function excerptOrNull(essay: string, candidate: unknown): string | null {
  const s = str(candidate);
  return s && essay.includes(s) ? s : null;
}

/** Normalizes a raw evaluator response into the frontend's canonical
 *  `EvaluationResult`. Every excerpt is re-validated against the essay
 *  text — evidence that isn't an exact substring is dropped rather than
 *  shown, per the "never fabricate a quote" rule. */
export function normalizeEvaluatorResponse(
  raw: unknown,
  essay: string,
  evaluationId: string,
  mock: boolean
): EvaluationResult {
  const r = asRecord(raw);
  const scoreRaw = num(pick(r, "score", "overall_score", "final_score")) ?? 0;
  const score = Math.round(Math.max(0, Math.min(100, scoreRaw)) * 10) / 10;

  const intervalRaw = asRecord(pick(r, "score_interval", "interval", "band"));
  const scoreInterval = {
    low: num(pick(intervalRaw, "low")) ?? Math.max(0, Math.round(score - 5)),
    high: num(pick(intervalRaw, "high")) ?? Math.min(100, Math.round(score + 5)),
  };

  const dimensions = normalizeDimensions(pick(r, "dimensions", "dimension_scores"));
  const { strongest, focus } = strongestAndFocus(
    dimensions,
    pick(r, "strongest_signal", "strongestSignal"),
    pick(r, "focus_area", "focusArea")
  );

  const tier = str(pick(r, "tier")) ?? tierForScore(score).name;
  const distanceToNextTier = num(pick(r, "distance_to_next_tier", "distanceToNextTier"));

  const snapshotRaw = asRecord(pick(r, "reader_snapshot", "readerSnapshot"));
  const readerSnapshot = {
    currentImpression:
      str(pick(snapshotRaw, "current_impression", "currentImpression")) ??
      "Margin has read your draft closely and is still forming a full written impression.",
    memorableElement:
      excerptOrNull(essay, pick(snapshotRaw, "memorable_element", "memorableElement")) ?? "",
    missingDimension:
      str(pick(snapshotRaw, "missing_dimension", "missingDimension")) ??
      "What the reader still wants to understand about you.",
  };

  const dimensionDetailsRaw = pick(r, "dimension_details", "dimensionDetails");
  const dimensionDetails = Array.isArray(dimensionDetailsRaw)
    ? dimensionDetailsRaw
        .map((d) => asRecord(d))
        .filter((d) => DIMENSION_KEYS.includes(pick(d, "key") as DimensionKey))
        .map((d) => ({
          key: pick(d, "key") as DimensionKey,
          score: dimensions[pick(d, "key") as DimensionKey],
          status: str(pick(d, "status")) ?? "",
          interpretation: str(pick(d, "interpretation")) ?? "",
          evidenceCount: num(pick(d, "evidence_count", "evidenceCount")) ?? 0,
          whatReadersSaw: str(pick(d, "what_readers_saw", "whatReadersSaw")) ?? "",
          excerpt: excerptOrNull(essay, pick(d, "excerpt")),
          whyItMatters: str(pick(d, "why_it_matters", "whyItMatters")) ?? "",
          revisionQuestion: str(pick(d, "revision_question", "revisionQuestion")) ?? "",
          confidenceLanguage: str(pick(d, "confidence_language", "confidenceLanguage")) ?? "",
        }))
    : [];

  const strengthsRaw = pick(r, "strengths");
  const strengths = Array.isArray(strengthsRaw)
    ? strengthsRaw
        .slice(0, 2)
        .map((s) => asRecord(s))
        .map((s) => ({
          category: str(pick(s, "category")) ?? "voice",
          title: str(pick(s, "title")) ?? "",
          explanation: str(pick(s, "explanation")) ?? "",
          excerpt: excerptOrNull(essay, pick(s, "excerpt")) ?? "",
          whyItMatters: str(pick(s, "why_it_matters", "whyItMatters")) ?? "",
          protectNote: str(pick(s, "protect_note", "protectNote")) ?? "Protect this in revision.",
        }))
        .filter((s) => s.excerpt)
    : [];

  const prioritiesRaw = pick(r, "revision_priorities", "revisionPriorities");
  const revisionPriorities = Array.isArray(prioritiesRaw)
    ? prioritiesRaw
        .slice(0, 3)
        .map((p) => asRecord(p))
        .map((p, i) => ({
          rank: (i + 1) as 1 | 2 | 3,
          category: str(pick(p, "category")) ?? "reflection",
          diagnosis: str(pick(p, "diagnosis")) ?? "",
          excerpt: excerptOrNull(essay, pick(p, "excerpt")) ?? "",
          whyItMatters: str(pick(p, "why_it_matters", "whyItMatters")) ?? "",
          direction: str(pick(p, "direction")) ?? "",
          question: str(pick(p, "question", "guiding_question")) ?? "",
          successTest: str(pick(p, "success_test", "successTest")) ?? "",
        }))
        .filter((p) => p.excerpt)
    : [];

  const planRaw = pick(r, "next_draft_plan", "nextDraftPlan");
  const nextDraftPlan = Array.isArray(planRaw)
    ? planRaw.map((s) => str(s)).filter((s): s is string => !!s).slice(0, 5)
    : [];

  const insightsRaw = pick(r, "confirmed_insights", "insights");
  const confirmedInsights = Array.isArray(insightsRaw)
    ? insightsRaw
        .map((i) => asRecord(i))
        .filter((i) => str(pick(i, "status")) !== "withdrawn" && str(pick(i, "status")) !== "contradicted")
        .map((i, idx) => ({
          id: str(pick(i, "id")) ?? `insight-${idx}`,
          category: str(pick(i, "category")) ?? "voice",
          status: "confirmed" as const,
          title: str(pick(i, "title")) ?? "",
          text: str(pick(i, "text")) ?? "",
          evidence: excerptOrNull(essay, pick(i, "evidence")),
        }))
    : [];

  return {
    evaluationId,
    score,
    scoreInterval,
    tier,
    distanceToNextTier,
    dimensions,
    strongestSignal: strongest,
    focusArea: focus,
    confirmedInsights,
    readerSnapshot,
    dimensionDetails,
    strengths,
    revisionPriorities,
    nextDraftPlan,
    completedAt: new Date().toISOString(),
    mock,
  };
}
