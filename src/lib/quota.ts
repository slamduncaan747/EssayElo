import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "./types";

/** Tier limits: full evaluations per calendar month. */
export const TIER = {
  free: { evalsPerMonth: 3 },
  plus: { evalsPerMonth: 15 },
} as const;

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function fullEvalsUsedThisMonth(
  db: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await db
    .from("evaluations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "full")
    .neq("status", "failed")
    .gte("created_at", monthStart());
  return count ?? 0;
}

export async function assertFullEvalAllowed(
  db: SupabaseClient,
  userId: string,
  plan: Plan
): Promise<void> {
  const used = await fullEvalsUsedThisMonth(db, userId);
  const limit = TIER[plan].evalsPerMonth;
  if (used >= limit) {
    const msg =
      plan === "free"
        ? `You've used all ${limit} free evaluations this month. Upgrade for ${TIER.plus.evalsPerMonth}/month.`
        : `You've used all ${limit} evaluations this month.`;
    const err = new Error(msg) as Error & { status: number };
    err.status = 402;
    throw err;
  }
}
