import "server-only";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";
import { ApiError } from "./validate";
import type { Essay, Evaluation, Plan, Profile } from "./types";

export interface Ctx {
  user: User;
  profile: Profile;
  plan: Plan;
  /** Service-role client — call sites must have verified ownership first. */
  db: SupabaseClient;
}

/** Authenticate the request and load the caller's profile. */
export async function requireUser(): Promise<Ctx> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new ApiError(401, "Not signed in");

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) throw new ApiError(401, "Profile missing");
  return { user, profile: profile as Profile, plan: (profile as Profile).plan, db };
}

export async function requireOwnedEssay(ctx: Ctx, essayId: string): Promise<Essay> {
  const { data } = await ctx.db
    .from("essays")
    .select("*")
    .eq("id", essayId)
    .eq("user_id", ctx.user.id)
    .single();
  if (!data) throw new ApiError(404, "Essay not found");
  return data as Essay;
}

export async function requireOwnedEvaluation(
  ctx: Ctx,
  evalId: string
): Promise<Evaluation> {
  const { data } = await ctx.db
    .from("evaluations")
    .select("*")
    .eq("id", evalId)
    .eq("user_id", ctx.user.id)
    .single();
  if (!data) throw new ApiError(404, "Evaluation not found");
  return data as Evaluation;
}

export function handleApiError(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  const status = (e as { status?: number })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Request failed" },
      { status }
    );
  }
  console.error(e);
  // TEMP DEBUG: always surface the real message while stabilizing the
  // deployment. Tighten this (gate behind EXPOSE_ERRORS) before real launch.
  const detail = e instanceof Error ? e.message : String(e);
  return NextResponse.json({ error: "Something went wrong", detail }, { status: 500 });
}
