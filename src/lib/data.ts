import "server-only";
import { supabaseServer } from "./supabase/server";
import type { Draft, Essay, Evaluation, Plan, Profile } from "./types";
import { bandFromElo } from "./engine/scale";

/**
 * Read helpers for server components. These use the request-scoped client, so
 * RLS guarantees the caller only ever sees their own rows.
 */

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

  return (essays as Essay[]).map((essay) => ({
    essay,
    latestDraft:
      (drafts?.find((d) => d.essay_id === essay.id) as EssayListItem["latestDraft"]) ?? null,
    latestEval: ((evals ?? []).find((ev) => ev.essay_id === essay.id) as Evaluation) ?? null,
  }));
}

export function bandLabel(ev: Evaluation | null): string | null {
  if (!ev || ev.status !== "done" || ev.elo == null || ev.ci == null) return null;
  const b = bandFromElo(ev.elo, ev.ci);
  return `${b.low}–${b.high}`;
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
    evaluations: (evaluations ?? []) as Evaluation[],
  };
}

export type { Plan };
