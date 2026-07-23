/**
 * Elo engine — deterministic, no LLM dependency (spec Part 6: fully unit-
 * testable with fake outcomes; a bug here corrupts every score silently).
 *
 * Design points from the spec:
 *  - Decaying K-factor with a noise floor: large early so the essay leaves its
 *    provisional start quickly, shrinking so later matches fine-tune — but
 *    never near-zero, because an LLM judgment is a fuzzier measurement than a
 *    board result. The rating keeps permanent slight mobility.
 *  - Update magnitude comes from the margin band (decisive / clear / narrow).
 *  - Per-match weight lets reliability post-processing damp or discard noisy
 *    judgments (order-swap flips, off-axis reasoning) without special cases.
 */

import type { Margin } from "@/lib/types";

export const K_INITIAL = 80;
export const K_FLOOR = 16;
export const K_DECAY_MATCHES = 5;

export const MARGIN_MULTIPLIER: Record<Margin, number> = {
  decisive: 1.0,
  clear: 0.75,
  narrow: 0.5,
};

/** Weight applied to a match whose stated differentiator was off-axis. */
export const OFF_AXIS_WEIGHT = 0.4;
/** Order-swap flip: pure noise — discarded from the rating entirely. */
export const SPLIT_WEIGHT = 0;

export function kFactor(matchesPlayed: number): number {
  return Math.max(K_FLOOR, K_INITIAL / (1 + matchesPlayed / K_DECAY_MATCHES));
}

export function expectedScore(elo: number, oppElo: number): number {
  return 1 / (1 + Math.pow(10, (oppElo - elo) / 400));
}

export interface EloUpdateInput {
  elo: number;
  oppElo: number;
  matchesPlayed: number;
  /** 1 = win, 0 = loss. Splits never reach here (weight 0 handles them). */
  outcome: 0 | 1;
  margin: Margin;
  /** Reliability weight in [0, 1]. */
  weight: number;
}

export function eloUpdate(input: EloUpdateInput): number {
  const { elo, oppElo, matchesPlayed, outcome, margin, weight } = input;
  if (weight <= 0) return elo;
  const k = kFactor(matchesPlayed) * MARGIN_MULTIPLIER[margin] * weight;
  const e = expectedScore(elo, oppElo);
  return elo + k * (outcome - e);
}

/**
 * Update for an unlocked corpus essay on the other side of a match. Corpus
 * ratings freeze once they have played enough matches (spec Part 5: only new
 * entrants move, so yesterday's score is today's score).
 */
export const CORPUS_FREEZE_MATCHES = 12;

export function corpusEloUpdate(
  corpusElo: number,
  corpusMatches: number,
  locked: boolean,
  userElo: number,
  corpusWon: boolean,
  margin: Margin,
  weight: number
): number {
  if (locked || corpusMatches >= CORPUS_FREEZE_MATCHES) return corpusElo;
  return eloUpdate({
    elo: corpusElo,
    oppElo: userElo,
    matchesPlayed: corpusMatches,
    outcome: corpusWon ? 1 : 0,
    margin,
    weight: weight * 0.5, // corpus moves slower than the entrant being placed
  });
}
