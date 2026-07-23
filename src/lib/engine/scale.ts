/**
 * Score scale mapping.
 *
 * Internal ratings are Elo. The user-facing scale is 0–100, calibrated so that
 * 45 is a genuinely well-written but unremarkable essay and 80+ is near-
 * nonexistent (see the spec: percentile, not merit).
 *
 * elo = 1000 + score * 10  ⇔  score = (elo - 1000) / 10
 *
 * Anchor calibration (frozen corpus nodes):
 *   10 → 1100   self-damaging
 *   25 → 1250   competent with a visible weakness
 *   45 → 1450   the linchpin: polished, sincere, reveals nothing distinctive
 *   60 → 1600   distinctive but uneven
 *   80 → 1800   standout
 */

export const ELO_BASE = 1000;
export const ELO_PER_POINT = 10;

export function eloToScore(elo: number): number {
  return clamp((elo - ELO_BASE) / ELO_PER_POINT, 0, 100);
}

export function scoreToElo(score: number): number {
  return ELO_BASE + score * ELO_PER_POINT;
}

export function tierToElo(tier: number): number {
  // Placement triage returns 2 / 4 / 6 on the ten-point scale.
  return scoreToElo(tier * 10);
}

/**
 * Confidence interval half-width in Elo points, from effective match count and
 * measured intransitivity. Tuned so 10 clean matches ≈ ±45 Elo (±4.5 pts) and
 * 25 ≈ ±28 Elo. Free tier reports the band; showing a decimal after 10 matches
 * would be false authority.
 */
export function ciElo(effectiveMatches: number, intransitivityRate: number): number {
  const n = Math.max(effectiveMatches, 1);
  const base = 140 / Math.sqrt(n);
  return base * (1 + intransitivityRate);
}

export interface Band {
  low: number;
  high: number;
}

export function bandFromElo(elo: number, ciEloHalfWidth: number): Band {
  const s = eloToScore(elo);
  const half = ciEloHalfWidth / ELO_PER_POINT;
  return {
    low: Math.max(0, Math.round(s - half)),
    high: Math.min(100, Math.round(s + half)),
  };
}

/** Exact score, one decimal — Plus tier only. */
export function exactScore(elo: number): number {
  return Math.round(eloToScore(elo) * 10) / 10;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
