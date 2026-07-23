/**
 * Tournament step runner.
 *
 * An evaluation is a persisted state machine advanced one unit per HTTP call
 * (serverless-safe: no long-lived process, survives client disconnects, and
 * the evaluating screen's polling loop is the driver). Phases:
 *
 *   placement → match ×N → prose → synthesis → done      (full evaluation)
 *   match ×5 → synthesis → done                          (quick check)
 *
 * Concurrency is guarded by an atomic lock claim on the evaluation row.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Evaluation, Harvest, MatchWinner, Margin, ProseTag } from "@/lib/types";
import { corpusEloUpdate, eloUpdate } from "./elo";
import { pickOpponent, type Opponent } from "./matchmaker";
import { intransitivityRate, resolveSwapPair } from "./reliability";
import { judgeMatchPair, judgePlacement, judgeProse } from "./judge";
import { synthesize, type HarvestedMatch } from "./assemble";
import { ciElo, tierToElo, eloToScore } from "./scale";

const LOCK_SECONDS = 120;

export interface StepResult {
  status: Evaluation["status"];
  phase: Evaluation["phase"];
  matches_done: number;
  budget: number;
  busy?: boolean;
}

/** Atomically claim the evaluation for one step. Returns null if locked. */
async function claim(db: SupabaseClient, evalId: string): Promise<Evaluation | null> {
  const { data, error } = await db.rpc("claim_evaluation", {
    p_eval_id: evalId,
    p_lock_seconds: LOCK_SECONDS,
  });
  if (error) throw new Error(`claim failed: ${error.message}`);
  return (data as Evaluation[] | null)?.[0] ?? null;
}

async function release(db: SupabaseClient, evalId: string, patch: Record<string, unknown>) {
  const { error } = await db
    .from("evaluations")
    .update({ ...patch, lock_until: null })
    .eq("id", evalId);
  if (error) throw new Error(`release failed: ${error.message}`);
}

async function fail(db: SupabaseClient, evalId: string, message: string) {
  await db
    .from("evaluations")
    .update({ status: "failed", error: message.slice(0, 500), lock_until: null })
    .eq("id", evalId);
}

export async function stepEvaluation(
  db: SupabaseClient,
  evalId: string
): Promise<StepResult> {
  const ev = await claim(db, evalId);
  if (!ev) {
    // Someone else holds the lock — report current state as busy.
    const { data } = await db
      .from("evaluations")
      .select("status, phase, matches_done, budget")
      .eq("id", evalId)
      .single();
    return { ...(data as StepResult), busy: true };
  }
  if (ev.status !== "running") {
    await release(db, evalId, {});
    return pick(ev);
  }

  try {
    switch (ev.phase) {
      case "placement":
        return await stepPlacement(db, ev);
      case "match":
        return await stepMatch(db, ev);
      case "prose":
        return await stepProse(db, ev);
      case "synthesis":
        return await stepSynthesis(db, ev);
      default:
        await release(db, evalId, {});
        return pick(ev);
    }
  } catch (e) {
    await fail(db, evalId, e instanceof Error ? e.message : "step failed");
    throw e;
  }
}

function pick(ev: Evaluation): StepResult {
  return {
    status: ev.status,
    phase: ev.phase,
    matches_done: ev.matches_done,
    budget: ev.budget,
  };
}

async function draftContent(db: SupabaseClient, draftId: string): Promise<string> {
  const { data, error } = await db
    .from("drafts")
    .select("content")
    .eq("id", draftId)
    .single();
  if (error || !data) throw new Error("draft not found");
  return data.content as string;
}

// --- placement --------------------------------------------------------------

async function stepPlacement(db: SupabaseClient, ev: Evaluation): Promise<StepResult> {
  const essay = await draftContent(db, ev.draft_id);
  const tier = await judgePlacement(essay);
  const startElo = tierToElo(tier);
  await release(db, ev.id, {
    placement_tier: tier,
    start_elo: startElo,
    elo: startElo,
    phase: "match",
  });
  return { ...pick(ev), phase: "match" };
}

// --- match ------------------------------------------------------------------

async function stepMatch(db: SupabaseClient, ev: Evaluation): Promise<StepResult> {
  const essay = await draftContent(db, ev.draft_id);

  const [{ data: corpusRows, error: corpusErr }, { data: priorMatches }] =
    await Promise.all([
      db
        .from("corpus_essays")
        .select("id, elo, locked, match_count")
        .neq("owner_draft_id", ev.draft_id),
      db
        .from("matches")
        .select("corpus_essay_id, winner, opp_elo, weight")
        .eq("evaluation_id", ev.id),
    ]);
  if (corpusErr || !corpusRows?.length) throw new Error("corpus unavailable");

  const used = new Set<string>((priorMatches ?? []).map((m) => m.corpus_essay_id as string));
  const pool: Opponent[] = corpusRows.map((c) => ({ id: c.id as string, elo: c.elo as number }));
  const opponent = pickOpponent(ev.elo!, ev.matches_done, pool, used);
  if (!opponent) throw new Error("no opponents available");

  const oppRow = corpusRows.find((c) => c.id === opponent.id)!;
  const { data: oppContent } = await db
    .from("corpus_essays")
    .select("content")
    .eq("id", opponent.id)
    .single();
  if (!oppContent) throw new Error("opponent content missing");

  // Order-swap stability: two readings, presentation reversed.
  const [v1, v2] = await judgeMatchPair(essay, oppContent.content as string);
  const resolved = resolveSwapPair(v1, v2);

  const eloBefore = ev.elo!;
  let eloAfter = eloBefore;
  if (resolved.winner !== "split") {
    eloAfter = eloUpdate({
      elo: eloBefore,
      oppElo: opponent.elo,
      matchesPlayed: ev.matches_done,
      outcome: resolved.winner === "user" ? 1 : 0,
      margin: resolved.margin,
      weight: resolved.weight,
    });
    // Accretion: unlocked corpus entrants move too (slowly, until frozen).
    const newOppElo = corpusEloUpdate(
      opponent.elo,
      oppRow.match_count as number,
      oppRow.locked as boolean,
      eloBefore,
      resolved.winner === "opponent",
      resolved.margin,
      resolved.weight
    );
    await db
      .from("corpus_essays")
      .update({ elo: newOppElo, match_count: (oppRow.match_count as number) + 1 })
      .eq("id", opponent.id);
  }

  const directionFlag = resolved.harvest.direction_flag;

  await db.from("matches").insert({
    evaluation_id: ev.id,
    corpus_essay_id: opponent.id,
    round: ev.matches_done,
    winner: resolved.winner,
    margin: resolved.margin,
    weight: resolved.weight,
    off_axis: resolved.offAxis,
    harvest: resolved.harvest,
    elo_before: eloBefore,
    elo_after: eloAfter,
    opp_elo: opponent.elo,
  });

  const matchesDone = ev.matches_done + 1;
  const nextPhase =
    matchesDone >= ev.budget ? (ev.kind === "full" ? "prose" : "synthesis") : "match";

  await release(db, ev.id, {
    elo: eloAfter,
    matches_done: matchesDone,
    phase: nextPhase,
    ...(directionFlag && !ev.direction_flag ? { direction_flag: directionFlag } : {}),
  });
  return { status: "running", phase: nextPhase, matches_done: matchesDone, budget: ev.budget };
}

// --- prose ------------------------------------------------------------------

async function proseTagFor(
  db: SupabaseClient,
  elo: number,
  proseScore: number
): Promise<ProseTag> {
  // Neighbors at the same substance tier: corpus essays within ±60 Elo.
  const { data } = await db
    .from("corpus_essays")
    .select("prose_score")
    .gte("elo", elo - 60)
    .lte("elo", elo + 60)
    .not("prose_score", "is", null);
  const neighbors = (data ?? []).map((r) => r.prose_score as number);
  if (neighbors.length < 3) return "aligned";
  const avg = neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
  const gap = proseScore - avg;
  if (gap > 12) return "carrying";
  if (gap < -12) return "substance_ahead";
  return "aligned";
}

async function stepProse(db: SupabaseClient, ev: Evaluation): Promise<StepResult> {
  const essay = await draftContent(db, ev.draft_id);
  const { prose_score, note } = await judgeProse(essay);
  const tag = await proseTagFor(db, ev.elo!, prose_score);
  void note;
  await release(db, ev.id, {
    prose_score,
    prose_tag: tag,
    phase: "synthesis",
  });
  return { status: "running", phase: "synthesis", matches_done: ev.matches_done, budget: ev.budget };
}

// --- synthesis + finalize ----------------------------------------------------

async function stepSynthesis(db: SupabaseClient, ev: Evaluation): Promise<StepResult> {
  const essay = await draftContent(db, ev.draft_id);
  const { data: matchRows } = await db
    .from("matches")
    .select("winner, opp_elo, weight, harvest")
    .eq("evaluation_id", ev.id);

  const matches = (matchRows ?? []) as {
    winner: MatchWinner;
    opp_elo: number;
    weight: number;
    harvest: Harvest | null;
  }[];

  const intrans = intransitivityRate(
    matches.map((m) => ({ winner: m.winner, oppElo: m.opp_elo }))
  );
  const effective = matches.reduce((a, m) => a + (m.weight > 0 ? 1 : 0), 0);
  const ci = ciElo(Math.max(effective, 1), intrans);
  const score = eloToScore(ev.elo!);

  const result = await synthesize({
    essay,
    score,
    matches: matches as HarvestedMatch[],
    proseScore: ev.prose_score,
    proseNote: null,
  });

  // Accretion: the evaluated draft joins the corpus (full evaluations only).
  if (ev.kind === "full") {
    await db.from("corpus_essays").upsert(
      {
        content: essay,
        source: "user",
        locked: false,
        elo: ev.elo,
        match_count: ev.matches_done,
        prose_score: ev.prose_score,
        owner_draft_id: ev.draft_id,
      },
      { onConflict: "owner_draft_id" }
    );
  }

  await release(db, ev.id, {
    status: "done",
    phase: "done",
    ci,
    intransitivity: intrans,
    structure_score: result.structure_score,
    result,
    completed_at: new Date().toISOString(),
  });
  return { status: "done", phase: "done", matches_done: ev.matches_done, budget: ev.budget };
}
