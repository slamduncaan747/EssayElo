/**
 * Engine convergence test — spec Part 7, build order #1.
 *
 * Pure code, no LLM: synthetic essays with known "true" strengths play
 * adaptive tournaments where match outcomes are sampled from a logistic model
 * of the true gap (noisier than chess, like our judge). Verifies:
 *
 *  1. Convergence — recovered ratings correlate strongly with truth.
 *  2. Discrimination (degrade test analog) — a 15-point-weaker clone scores
 *     meaningfully lower, every time.
 *  3. Stability (repeat test) — the same essay re-run lands in a tight band.
 *
 * Run: npm run test:engine
 */
import { eloUpdate } from "../src/lib/engine/elo";
import { pickOpponent, type Opponent } from "../src/lib/engine/matchmaker";
import { scoreToElo, eloToScore, tierToElo } from "../src/lib/engine/scale";
import type { Margin } from "../src/lib/types";

// Deterministic RNG (mulberry32) so the test is reproducible.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Fake {
  id: string;
  trueScore: number; // 0–100
  elo: number;
}

/** Simulated judge: logistic on the true gap, with margin from |gap|. */
function judge(a: number, b: number, rand: () => number): { aWins: boolean; margin: Margin } {
  const gap = a - b;
  const pA = 1 / (1 + Math.pow(10, -gap / 18)); // ~18 display points = 90% win
  const aWins = rand() < pA;
  const ag = Math.abs(gap);
  const margin: Margin = ag > 20 ? "decisive" : ag > 9 ? "clear" : "narrow";
  return { aWins, margin };
}

function placementTier(trueScore: number): number {
  return trueScore >= 55 ? 6 : trueScore >= 30 ? 4 : 2;
}

function runTournament(
  trueScore: number,
  pool: Fake[],
  budget: number,
  rand: () => number
): number {
  let elo = tierToElo(placementTier(trueScore));
  const used = new Set<string>();
  const opponents: Opponent[] = pool.map((p) => ({ id: p.id, elo: p.elo }));
  for (let round = 0; round < budget; round++) {
    const opp = pickOpponent(elo, round, opponents, used, rand);
    if (!opp) break;
    used.add(opp.id);
    const oppTrue = pool.find((p) => p.id === opp.id)!.trueScore;
    // Order-swap: two readings; disagreement = discarded match.
    const r1 = judge(trueScore, oppTrue, rand);
    const r2 = judge(trueScore, oppTrue, rand);
    if (r1.aWins !== r2.aWins) continue;
    elo = eloUpdate({
      elo,
      oppElo: opp.elo,
      matchesPlayed: round,
      outcome: r1.aWins ? 1 : 0,
      margin: r1.margin,
      weight: 1,
    });
  }
  return eloToScore(elo);
}

function spearman(xs: number[], ys: number[]): number {
  const rank = (arr: number[]) => {
    const sorted = arr.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const ranks = new Array(arr.length).fill(0);
    sorted.forEach(([, orig], r) => (ranks[orig] = r));
    return ranks;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const d2 = rx.reduce((acc, r, i) => acc + (r - ry[i]) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}

function main() {
  const rand = rng(42);

  // Corpus mirroring the real seed: spread across the range, ratings = truth.
  const corpusScores = [10, 15, 20, 25, 28, 32, 36, 40, 42, 45, 45, 48, 52, 55, 60, 62, 68, 75, 80];
  const pool: Fake[] = corpusScores.map((s, i) => ({
    id: `c${i}`,
    trueScore: s,
    elo: scoreToElo(s),
  }));

  let failures = 0;
  const check = (name: string, ok: boolean, detail: string) => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${detail}`);
    if (!ok) failures++;
  };

  // 1. Convergence across the range.
  const truths = [12, 22, 33, 41, 47, 53, 58, 65, 72];
  const recovered = truths.map((t) => runTournament(t, pool, 10, rand));
  const rho = spearman(truths, recovered);
  const meanAbs =
    truths.reduce((acc, t, i) => acc + Math.abs(t - recovered[i]), 0) / truths.length;
  check("convergence: rank order recovered", rho >= 0.95, `spearman=${rho.toFixed(3)}`);
  check("convergence: mean abs error < 8 pts", meanAbs < 8, `mae=${meanAbs.toFixed(1)}`);

  // 2. Degrade test analog: strong essay vs 15-pt-weaker clone, 20 trials.
  let degradeWins = 0;
  const TRIALS = 20;
  for (let i = 0; i < TRIALS; i++) {
    const strong = runTournament(62, pool, 10, rand);
    const butchered = runTournament(47, pool, 10, rand);
    if (strong > butchered) degradeWins++;
  }
  check(
    "degrade: weaker clone scores lower",
    degradeWins === TRIALS,
    `${degradeWins}/${TRIALS} trials`
  );

  // 3. Repeat test: same essay, 12 runs, tight cluster.
  const repeats = Array.from({ length: 12 }, () => runTournament(48, pool, 10, rand));
  const mean = repeats.reduce((a, b) => a + b, 0) / repeats.length;
  const sd = Math.sqrt(repeats.reduce((a, b) => a + (b - mean) ** 2, 0) / repeats.length);
  check("repeat: sd < 5 pts at budget 10", sd < 5, `mean=${mean.toFixed(1)} sd=${sd.toFixed(2)}`);

  // 4. Premium budget tightens the estimate.
  const repeats25 = Array.from({ length: 12 }, () => runTournament(48, pool, 25, rand));
  const mean25 = repeats25.reduce((a, b) => a + b, 0) / repeats25.length;
  const sd25 = Math.sqrt(
    repeats25.reduce((a, b) => a + (b - mean25) ** 2, 0) / repeats25.length
  );
  check("budget 25 is tighter than 10", sd25 <= sd, `sd10=${sd.toFixed(2)} sd25=${sd25.toFixed(2)}`);

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll engine checks passed.");
}

main();
