/**
 * Reliability post-processing (spec Part 2 — convergence, never self-report).
 *
 * Confidence-weighted updates were explicitly rejected: reported confidence
 * tracks the confound, not correctness. Instead, three behavioral signals:
 *
 * 1. Order-swap stability — every match runs twice with presentation reversed.
 *    Agreement → trustworthy; a flip → pure noise, discarded (weight 0) but
 *    recorded, because "readers disagree about this essay" is real feedback.
 * 2. Cross-match intransitivity — if results order opponents inconsistently
 *    with the corpus's own ordering, judgment noise is high: widen the CI.
 * 3. Reason-axis auditing — a differentiator argued off-axis (prose, emotion,
 *    topic weight) means the confound crept in: down-weight that match.
 */

import type { Harvest, Margin, MatchWinner } from "@/lib/types";
import { OFF_AXIS_WEIGHT, SPLIT_WEIGHT } from "./elo";

export interface SingleVerdict {
  /** True if the user's essay won this reading. */
  userWon: boolean;
  margin: Margin;
  harvest: Harvest;
}

export interface ResolvedMatch {
  winner: MatchWinner;
  margin: Margin;
  weight: number;
  offAxis: boolean;
  harvest: Harvest;
}

const MARGIN_RANK: Record<Margin, number> = { narrow: 0, clear: 1, decisive: 2 };

/** Phrases that signal the judgment slid onto a disallowed axis. */
const OFF_AXIS_PATTERN =
  /\b(better written|beautiful(ly)? (written|prose)|writing quality|more (moving|emotional|powerful|impressive)|emotional(ly)? (power|impact|intensity)|heavier topic|more polished)\b/i;

export function auditAxis(harvest: Harvest): boolean {
  if (harvest.axis === "other") return true;
  return OFF_AXIS_PATTERN.test(harvest.decisive_differentiator);
}

/**
 * Combine the two order-swapped readings of one match into a single resolved
 * outcome. The weaker margin of two agreeing readings is kept (conservative).
 */
export function resolveSwapPair(a: SingleVerdict, b: SingleVerdict): ResolvedMatch {
  if (a.userWon !== b.userWon) {
    return {
      winner: "split",
      margin: "narrow",
      weight: SPLIT_WEIGHT,
      offAxis: false,
      harvest: a.harvest,
    };
  }
  const margin = MARGIN_RANK[a.margin] <= MARGIN_RANK[b.margin] ? a.margin : b.margin;
  const offAxis = auditAxis(a.harvest) && auditAxis(b.harvest);
  return {
    winner: a.userWon ? "user" : "opponent",
    margin,
    weight: offAxis ? OFF_AXIS_WEIGHT : 1,
    offAxis,
    harvest: a.harvest,
  };
}

/**
 * Resolve a single (non-swapped) reading. No split detection is possible, so
 * reliability comes only from the reason-axis audit and, downstream, from
 * cross-match intransitivity.
 */
export function resolveSingle(v: SingleVerdict): ResolvedMatch {
  const offAxis = auditAxis(v.harvest);
  return {
    winner: v.userWon ? "user" : "opponent",
    margin: v.margin,
    weight: offAxis ? OFF_AXIS_WEIGHT : 1,
    offAxis,
    harvest: v.harvest,
  };
}

export interface MatchOutcomeLite {
  winner: MatchWinner;
  oppElo: number;
}

/**
 * Intransitivity rate: pairs of (win vs stronger, loss vs clearly weaker)
 * opponents. Uses the corpus's own ordering as the reference. Returns a rate
 * in [0, 1] used to widen the confidence interval and, at the product level,
 * to report "readers split on this essay."
 */
export function intransitivityRate(matches: MatchOutcomeLite[]): number {
  const wins = matches.filter((m) => m.winner === "user").map((m) => m.oppElo);
  const losses = matches.filter((m) => m.winner === "opponent").map((m) => m.oppElo);
  if (wins.length === 0 || losses.length === 0) return 0;
  let inversions = 0;
  let pairs = 0;
  const MARGIN_ELO = 80; // require a clear gap before calling it an inversion
  for (const w of wins) {
    for (const l of losses) {
      pairs++;
      if (l < w - MARGIN_ELO) inversions++;
    }
  }
  return pairs === 0 ? 0 : inversions / pairs;
}
