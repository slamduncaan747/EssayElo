import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "./types";

/** Tier limits: matches per evaluation, full evaluations per calendar month. */
export const TIER = {
  free: { matchBudget: 10, evalsPerMonth: 3 },
  plus: { matchBudget: 25, evalsPerMonth: 15 },
} as const;

export const QUICK_CHECK_BUDGET = 5;

/**
 * The tournament can't run more independent matches than it has opponents —
 * the judge is deterministic, so a rematch adds no information. Cap the budget
 * at the corpus size so the progress bar and confidence interval stay honest.
 */
export async function matchBudgetFor(
  db: SupabaseClient,
  plan: Plan
): Promise<number> {
  const { count } = await db
    .from("corpus_essays")
    .select("id", { count: "exact", head: true });
  return Math.max(1, Math.min(TIER[plan].matchBudget, (count ?? 0) - 1));
}
export const QUICK_CHECKS_PER_DAY = 20;

function monthStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function dayStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
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

export async function assertQuickCheckAllowed(
  db: SupabaseClient,
  userId: string
): Promise<void> {
  const { count } = await db
    .from("evaluations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", "quick")
    .gte("created_at", dayStart());
  if ((count ?? 0) >= QUICK_CHECKS_PER_DAY) {
    const err = new Error("Quick check limit reached for today") as Error & {
      status: number;
    };
    err.status = 429;
    throw err;
  }
}

/** Only one evaluation may run per user at a time. */
export async function assertNoRunningEvaluation(
  db: SupabaseClient,
  userId: string
): Promise<void> {
  const { count } = await db
    .from("evaluations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "running")
    // Ignore runs abandoned for over an hour.
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((count ?? 0) > 0) {
    const err = new Error("An evaluation is already running") as Error & {
      status: number;
    };
    err.status = 409;
    throw err;
  }
}
