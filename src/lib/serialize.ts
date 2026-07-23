import type { Evaluation, EvaluationView, Plan } from "./types";
import { bandFromElo, exactScore } from "./engine/scale";

/**
 * Gate an evaluation row for the client by plan.
 *
 * Free tier: band only (no false precision after 10 matches), arc, mark
 * positions + kinds and counts — but note/fix bodies stripped. The data
 * exists either way; Plus surfaces it. That's the honest upsell.
 */
export function evaluationView(ev: Evaluation, plan: Plan): EvaluationView {
  const isPlus = plan === "plus";
  const done = ev.status === "done" && ev.elo != null && ev.ci != null;
  const result = done ? ev.result : null;

  return {
    id: ev.id,
    kind: ev.kind,
    status: ev.status,
    phase: ev.phase,
    matches_done: ev.matches_done,
    budget: ev.budget,
    band: done ? bandFromElo(ev.elo!, ev.ci!) : null,
    exact: done && isPlus ? exactScore(ev.elo!) : null,
    prose_score: done && isPlus ? ev.prose_score : null,
    structure_score: done && isPlus ? ev.structure_score : null,
    prose_tag: done && isPlus ? ev.prose_tag : null,
    direction_flag: done ? ev.direction_flag : null,
    arc: result?.arc ?? null,
    counts: result?.counts ?? null,
    marks: result
      ? result.marks.map((m) =>
          isPlus ? m : { ...m, note: "", fix: null, impact: null }
        )
      : null,
    biggest_positive: done && isPlus ? result?.biggest_positive ?? null : null,
    biggest_detractor: done && isPlus ? result?.biggest_detractor ?? null : null,
    readers_split: result?.readers_split ?? false,
    created_at: ev.created_at,
    completed_at: ev.completed_at,
  };
}
