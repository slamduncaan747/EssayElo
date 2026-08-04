import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  DIMENSION_KEYS,
  type DimensionKey,
  type DimensionScores,
  type DimensionDetail,
  type EvaluationResult,
  type RevisionPriority,
  type StrengthCard,
} from "../evaluation/types";
import { finalDimensionStatus } from "../evaluation/copy";
import { buildFeedbackUserMessage, FEEDBACK_SCHEMA, FEEDBACK_SYSTEM } from "./prompt";

/**
 * Written coaching, generated separately from scoring.
 *
 * The scoring engine places the essay against the ranked reference field;
 * it is not a writing coach, and its feedback pass runs on a small model.
 * This module takes those scores as given and produces the actual coaching
 * with a frontier model, which is where feedback quality actually comes
 * from — a weak model writes generic advice no matter how good the prompt.
 */

export class FeedbackError extends Error {}

let cached: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!cached) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new FeedbackError("ANTHROPIC_API_KEY is not configured");
    }
    cached = new Anthropic({ maxRetries: 2 });
  }
  return cached;
}

interface RawFeedback {
  reader_snapshot: {
    current_impression: string;
    memorable_element: string;
    missing_dimension: string;
  };
  dimension_details: Array<{
    key: string;
    interpretation: string;
    what_readers_saw: string;
    excerpt: string;
    why_it_matters: string;
    revision_question: string;
    confidence_language: string;
  }>;
  strengths: Array<{
    category: string;
    title: string;
    explanation: string;
    excerpt: string;
    why_it_matters: string;
    protect_note: string;
  }>;
  revision_priorities: Array<{
    category: string;
    diagnosis: string;
    excerpt: string;
    why_it_matters: string;
    direction: string;
    question: string;
    success_test: string;
  }>;
  next_draft_plan: string[];
}

/**
 * Resolve a model-supplied excerpt to text that appears verbatim in the
 * essay, or null.
 *
 * An exact match is the normal case. The fallbacks exist because models
 * routinely normalize typographic characters (smart quotes to straight,
 * em dash to hyphen) and collapse whitespace across line breaks while
 * otherwise quoting faithfully — that is a formatting artifact, not a
 * fabricated quote. We locate the corresponding span and return the
 * ESSAY's own characters, so what we display is always the student's
 * actual text. Anything we cannot locate this way is dropped.
 */
export function resolveExcerpt(essay: string, excerpt: string): string | null {
  const trimmed = excerpt?.trim();
  if (!trimmed || trimmed.length < 3) return null;

  if (essay.includes(trimmed)) return trimmed;

  // Build a regex from the excerpt that tolerates whitespace runs and
  // typographic variants, then read the matched span back out of the essay.
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped
    .replace(/\s+/g, "\\s+")
    .replace(/['‘’ʼ]/g, "['‘’ʼ]")
    .replace(/["“”]/g, "[\"“”]")
    .replace(/[-‐‑‒–—]/g, "[-‐‑‒–—]")
    .replace(/…|\\\.\\\.\\\./g, "(?:…|\\.\\.\\.)");

  try {
    const m = new RegExp(pattern, "i").exec(essay);
    if (m && m[0]) return m[0];
  } catch {
    /* pattern too exotic — fall through */
  }
  return null;
}

function asKey(value: string): DimensionKey | null {
  return DIMENSION_KEYS.includes(value as DimensionKey) ? (value as DimensionKey) : null;
}

/** Turn the model's raw JSON into the canonical result shape, dropping any
 *  evidence that cannot be verified against the essay. */
export function normalizeFeedback(
  raw: RawFeedback,
  essay: string,
  dimensions: DimensionScores
): Pick<
  EvaluationResult,
  "readerSnapshot" | "dimensionDetails" | "strengths" | "revisionPriorities" | "nextDraftPlan"
> {
  const details: DimensionDetail[] = [];
  for (const key of DIMENSION_KEYS) {
    const found = raw.dimension_details?.find((d) => asKey(d.key) === key);
    const score = dimensions[key] ?? 0;
    details.push({
      key,
      score,
      status: finalDimensionStatus(score),
      interpretation: found?.interpretation?.trim() ?? "",
      evidenceCount: 0,
      whatReadersSaw: found?.what_readers_saw?.trim() ?? "",
      excerpt: found ? resolveExcerpt(essay, found.excerpt) : null,
      whyItMatters: found?.why_it_matters?.trim() ?? "",
      revisionQuestion: found?.revision_question?.trim() ?? "",
      confidenceLanguage: found?.confidence_language?.trim() ?? "",
    });
  }
  // Strongest first — the explorer reads top-down.
  details.sort((a, b) => b.score - a.score);

  // Plain loops rather than filter/map chains: an unverifiable excerpt drops
  // the whole card, and the counts are capped, which reads more clearly here
  // than a predicate chain over a widened `category` field.
  const strengths: StrengthCard[] = [];
  for (const s of raw.strengths ?? []) {
    if (strengths.length >= 2) break;
    const excerpt = resolveExcerpt(essay, s.excerpt);
    if (!excerpt) continue;
    strengths.push({
      category: asKey(s.category) ?? "voice",
      title: s.title?.trim() ?? "",
      explanation: s.explanation?.trim() ?? "",
      excerpt,
      whyItMatters: s.why_it_matters?.trim() ?? "",
      protectNote: s.protect_note?.trim() ?? "Protect this in revision.",
    });
  }

  const revisionPriorities: RevisionPriority[] = [];
  for (const p of raw.revision_priorities ?? []) {
    if (revisionPriorities.length >= 3) break;
    const excerpt = resolveExcerpt(essay, p.excerpt);
    if (!excerpt) continue;
    revisionPriorities.push({
      rank: (revisionPriorities.length + 1) as 1 | 2 | 3,
      category: asKey(p.category) ?? "reflection",
      diagnosis: p.diagnosis?.trim() ?? "",
      excerpt,
      whyItMatters: p.why_it_matters?.trim() ?? "",
      direction: p.direction?.trim() ?? "",
      question: p.question?.trim() ?? "",
      successTest: p.success_test?.trim() ?? "",
    });
  }

  return {
    readerSnapshot: {
      currentImpression: raw.reader_snapshot?.current_impression?.trim() ?? "",
      memorableElement: resolveExcerpt(essay, raw.reader_snapshot?.memorable_element ?? "") ?? "",
      missingDimension: raw.reader_snapshot?.missing_dimension?.trim() ?? "",
    },
    dimensionDetails: details,
    strengths,
    revisionPriorities,
    nextDraftPlan: (raw.next_draft_plan ?? [])
      .map((s) => s?.trim())
      .filter((s): s is string => !!s)
      .slice(0, 5),
  };
}

export interface FeedbackInput {
  essay: string;
  score: number;
  tier: string;
  dimensions: DimensionScores;
  strongestSignal: DimensionKey;
  focusArea: DimensionKey;
}

export async function generateFeedback(input: FeedbackInput) {
  const client = anthropic();

  // Streaming: the full coaching report is a large structured payload and a
  // non-streaming request at this max_tokens risks an HTTP timeout.
  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 32000,
    system: FEEDBACK_SYSTEM,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema: FEEDBACK_SCHEMA as unknown as Record<string, unknown>,
      },
    },
    messages: [{ role: "user", content: buildFeedbackUserMessage(input) }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "refusal") {
    throw new FeedbackError("The coaching model declined to evaluate this essay");
  }
  if (message.stop_reason === "max_tokens") {
    throw new FeedbackError("The coaching response was truncated");
  }

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new FeedbackError("Empty coaching response");

  let raw: RawFeedback;
  try {
    raw = JSON.parse(text.text) as RawFeedback;
  } catch {
    throw new FeedbackError("Coaching response was not valid JSON");
  }

  const normalized = normalizeFeedback(raw, input.essay, input.dimensions);

  // A report with no verifiable evidence is not worth showing — surface it
  // as a feedback failure so the score is preserved and the user can retry,
  // rather than rendering empty cards.
  if (normalized.revisionPriorities.length === 0 || normalized.strengths.length === 0) {
    throw new FeedbackError("Coaching response contained no verifiable evidence");
  }

  return normalized;
}
