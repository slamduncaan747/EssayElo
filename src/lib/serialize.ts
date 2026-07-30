import type { Evaluation, EvaluationView, Plan } from "./types";
import { bandFromElo, exactScore } from "./engine/scale";

/**
 * Gate an evaluation row for the client by plan.
 *
 * Free tier: band (no false precision), win/loss/tie record, the dimension
 * hexagon, and short recurring strength/weakness summaries. Plus unlocks the
 * exact score and the full coaching report (reader impression, evidence,
 * revision questions, next-draft objective).
 */
export function evaluationView(ev: Evaluation, plan: Plan): EvaluationView {
  const isPlus = plan === "plus";
  const done = ev.status === "done" && ev.elo != null && ev.ci != null;
  const result = done ? ev.result : null;

  return {
    id: ev.id,
    status: ev.status,
    band: done ? bandFromElo(ev.elo!, ev.ci!) : null,
    exact: done && isPlus ? exactScore(ev.elo!) : null,
    wins: result?.wins ?? 0,
    losses: result?.losses ?? 0,
    ties: result?.ties ?? 0,
    dimensions: result?.dimensions ?? null,
    recurring_strengths: result?.recurring_strengths ?? [],
    recurring_weaknesses: result?.recurring_weaknesses ?? [],
    coaching: done && isPlus ? (result?.coaching ?? null) : null,
    created_at: ev.created_at,
    completed_at: ev.completed_at,
  };
}
