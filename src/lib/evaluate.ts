import "server-only";
import { scoreToElo } from "./engine/scale";
import type { ProseTag, SynthesisResult } from "./types";

/**
 * Placeholder for the real scoring engine, which is being rewritten from
 * scratch as a separate Python API. Every essay gets a fixed score of 5 out
 * of 100 — no LLM calls, no network. Swap this out once the real API lands.
 */

export const STUB_SCORE = 5;
const STUB_CI_ELO = 30; // ±3 points on the 0–100 scale

export interface StubEvaluation {
  elo: number;
  ci: number;
  prose_score: number;
  prose_tag: ProseTag;
  structure_score: number;
  direction_flag: string | null;
  intransitivity: number;
  result: SynthesisResult;
}

function paragraphCount(content: string): number {
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
  return Math.max(paragraphs.length, 1);
}

export function runStubEvaluation(content: string): StubEvaluation {
  return {
    elo: scoreToElo(STUB_SCORE),
    ci: STUB_CI_ELO,
    prose_score: STUB_SCORE,
    prose_tag: "aligned",
    structure_score: STUB_SCORE,
    direction_flag: null,
    intransitivity: 0,
    result: {
      verdict:
        "The scoring engine is being rebuilt — this is a placeholder score, not a real read of your essay yet.",
      arc: Array(paragraphCount(content)).fill(STUB_SCORE),
      marks: [],
      counts: { standout: 0, solid: 0, weak: 0, cliche: 0 },
      biggest_positive: "",
      biggest_detractor: "",
      structure_score: STUB_SCORE,
      readers_split: false,
    },
  };
}
