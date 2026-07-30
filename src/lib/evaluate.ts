import "server-only";
import { scoreToElo } from "./engine/scale";
import type { SynthesisResult } from "./types";

/**
 * Placeholder for the real scoring engine, which is being rewritten from
 * scratch as a separate Python API. Every essay gets a fixed score of 5 out
 * of 100 and neutral placeholder dimensions — no LLM calls, no network.
 */

export const STUB_SCORE = 5;
const STUB_CI_ELO = 30; // ±3 points on the 0–100 scale

export interface StubEvaluation {
  elo: number;
  ci: number;
  result: SynthesisResult;
}

export function runStubEvaluation(): StubEvaluation {
  return {
    elo: scoreToElo(STUB_SCORE),
    ci: STUB_CI_ELO,
    result: {
      wins: 0,
      losses: 0,
      ties: 0,
      dimensions: {
        distinctiveness: 0.5,
        specificity: 0.5,
        reflection: 0.5,
        voice: 0.5,
        structure: 0.5,
        prompt_fulfillment: 0.5,
        memorability: 0.5,
      },
      recurring_strengths: [],
      recurring_weaknesses: [],
      coaching: {
        reader_impression: {
          learns: "The scoring engine is being rebuilt — this is a placeholder, not a real read of your essay yet.",
          remembers: "—",
          unclear: "—",
        },
        strengths: [],
        weaknesses: [],
        revision_questions: [],
        next_objective: "Check back once the new engine is live for a real next-draft objective.",
      },
    },
  };
}
