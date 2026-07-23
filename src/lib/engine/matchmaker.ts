/**
 * Adaptive matchmaker (spec Part 4).
 *
 * Information is highest against near-equal opponents, but the first job is
 * fast placement — so early matches spread (at the estimate, then above, then
 * below), later matches cluster near the converging estimate. This is why 10
 * adaptive matches outperform 10 random ones.
 */

export interface Opponent {
  id: string;
  elo: number;
}

/** Elo offsets for the early spread rounds, then converging windows. */
const EARLY_OFFSETS = [0, 150, -150];

export function pickOpponent(
  currentElo: number,
  round: number, // 0-based
  pool: Opponent[],
  usedIds: Set<string>,
  rand: () => number = Math.random
): Opponent | null {
  const available = pool.filter((p) => !usedIds.has(p.id));
  if (available.length === 0) return null;

  let target: number;
  let window: number;

  if (round < EARLY_OFFSETS.length) {
    target = currentElo + EARLY_OFFSETS[round];
    window = 200;
  } else {
    target = currentElo;
    // Window tightens as the estimate converges: 160 → 60.
    window = Math.max(60, 160 - (round - EARLY_OFFSETS.length) * 20);
  }

  // Rank by distance to target; sample among the nearest few so repeated
  // evaluations of the same essay don't walk an identical opponent path.
  const ranked = [...available].sort(
    (a, b) => Math.abs(a.elo - target) - Math.abs(b.elo - target)
  );
  const inWindow = ranked.filter((p) => Math.abs(p.elo - target) <= window);
  const candidates = (inWindow.length >= 2 ? inWindow : ranked).slice(0, 3);
  return candidates[Math.floor(rand() * candidates.length)] ?? null;
}
