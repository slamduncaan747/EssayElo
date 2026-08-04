import "server-only";
import { supabaseServer } from "./supabase/server";
import { isValidEvaluationResult } from "./evaluation/types";
import type { Draft, Essay, Evaluation, Plan, Profile } from "./types";

/**
 * Read helpers for server components. These use the request-scoped client, so
 * RLS guarantees the caller only ever sees their own rows.
 */

/** Rows scored before this rebuild carry a `result` in the old shape
 *  (wins/losses/dimensions as fractions, no scoreInterval). Treat those as
 *  if scoring hadn't produced a usable result yet, rather than letting
 *  every downstream reader crash on a shape it doesn't recognize — the
 *  live experience will transparently re-run and overwrite it. */
function sanitizeEvaluation(ev: Evaluation): Evaluation {
  if (ev.result && !isValidEvaluationResult(ev.result)) {
    return { ...ev, result: null };
  }
  return ev;
}

export interface EssayListItem {
  essay: Essay;
  latestDraft: Pick<Draft, "id" | "version" | "word_count"> | null;
  latestEval: Evaluation | null;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function listEssays(): Promise<EssayListItem[]> {
  const supabase = await supabaseServer();
  const { data: essays } = await supabase
    .from("essays")
    .select("*")
    .order("updated_at", { ascending: false });
  if (!essays?.length) return [];

  const ids = essays.map((e) => e.id);
  const [{ data: drafts }, { data: evals }] = await Promise.all([
    supabase
      .from("drafts")
      .select("id, essay_id, version, word_count")
      .in("essay_id", ids)
      .order("version", { ascending: false }),
    supabase
      .from("evaluations")
      .select("*")
      .in("essay_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  return (essays as Essay[]).map((essay) => {
    const latest = (evals ?? []).find((ev) => ev.essay_id === essay.id) as Evaluation | undefined;
    return {
      essay,
      latestDraft:
        (drafts?.find((d) => d.essay_id === essay.id) as EssayListItem["latestDraft"]) ?? null,
      latestEval: latest ? sanitizeEvaluation(latest) : null,
    };
  });
}

export function bandLabel(ev: Evaluation | null): string | null {
  if (!ev || ev.status !== "done" || !ev.result?.scoreInterval) return null;
  const { low, high } = ev.result.scoreInterval;
  return `${low}–${high}`;
}

export async function getEssayBundle(essayId: string): Promise<{
  essay: Essay;
  drafts: Draft[];
  evaluations: Evaluation[];
} | null> {
  const supabase = await supabaseServer();
  const { data: essay } = await supabase.from("essays").select("*").eq("id", essayId).single();
  if (!essay) return null;
  const [{ data: drafts }, { data: evaluations }] = await Promise.all([
    supabase
      .from("drafts")
      .select("*")
      .eq("essay_id", essayId)
      .order("version", { ascending: false }),
    supabase
      .from("evaluations")
      .select("*")
      .eq("essay_id", essayId)
      .order("created_at", { ascending: false }),
  ]);
  return {
    essay: essay as Essay,
    drafts: (drafts ?? []) as Draft[],
    evaluations: ((evaluations ?? []) as Evaluation[]).map(sanitizeEvaluation),
  };
}

export type { Plan };
