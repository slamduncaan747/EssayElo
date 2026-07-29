import "server-only";
import { supabaseAdmin } from "./supabase/admin";
import type { Evaluation, Harvest, MatchWinner } from "./types";
import { eloToScore } from "./engine/scale";
import { clusterHarvest } from "./engine/assemble";

/**
 * Premium analysis: the accumulated head-to-head evidence behind a score.
 *
 * This is what the paid tier actually buys (spec Part 4): 25 matches produce
 * 25 sets of harvested reasoning instead of 10 — a pattern in 3 of 10 is
 * suggestive, the same pattern in 8 of 25 is a diagnosis. The data exists
 * either way; premium surfaces it.
 */

export interface MatchRecord {
  round: number;
  winner: MatchWinner;
  margin: string;
  weight: number;
  offAxis: boolean;
  oppScore: number;
  eloAfter: number;
  differentiator: string;
  reason: string | null;
}

export interface AnalysisData {
  score: number;
  ci: number;
  wins: number;
  losses: number;
  splits: number;
  discounted: number;
  strongestBeaten: number | null;
  weakestLostTo: number | null;
  records: MatchRecord[];
  trajectory: number[];
  clusters: ReturnType<typeof clusterHarvest>;
  intransitivity: number;
}

/**
 * Caller MUST have already verified the evaluation belongs to the user — the
 * matches table is service-role only (it references corpus content).
 */
export async function loadAnalysis(ev: Evaluation): Promise<AnalysisData | null> {
  if (ev.status !== "done" || ev.elo == null) return null;
  const db = supabaseAdmin();
  const { data } = await db
    .from("matches")
    .select("round, winner, margin, weight, off_axis, harvest, opp_elo, elo_after")
    .eq("evaluation_id", ev.id)
    .order("round", { ascending: true });

  const rows = (data ?? []) as Array<{
    round: number;
    winner: MatchWinner;
    margin: string;
    weight: number;
    off_axis: boolean;
    harvest: Harvest | null;
    opp_elo: number;
    elo_after: number;
  }>;

  const records: MatchRecord[] = rows.map((r) => ({
    round: r.round,
    winner: r.winner,
    margin: r.margin,
    weight: r.weight,
    offAxis: r.off_axis,
    oppScore: Math.round(eloToScore(r.opp_elo) * 10) / 10,
    eloAfter: r.elo_after,
    differentiator: r.harvest?.decisive_differentiator ?? "",
    reason: r.harvest?.win_reason ?? r.harvest?.loss_reason ?? null,
  }));

  const wins = records.filter((r) => r.winner === "user");
  const losses = records.filter((r) => r.winner === "opponent");

  return {
    score: eloToScore(ev.elo),
    ci: (ev.ci ?? 0) / 10,
    wins: wins.length,
    losses: losses.length,
    splits: records.filter((r) => r.winner === "split").length,
    discounted: records.filter((r) => r.offAxis).length,
    strongestBeaten: wins.length ? Math.max(...wins.map((r) => r.oppScore)) : null,
    weakestLostTo: losses.length ? Math.min(...losses.map((r) => r.oppScore)) : null,
    records,
    trajectory: records.map((r) => eloToScore(r.eloAfter)),
    clusters: clusterHarvest(
      rows.map((r) => ({ winner: r.winner, harvest: r.harvest, margin: r.margin }))
    ),
    intransitivity: ev.intransitivity ?? 0,
  };
}
