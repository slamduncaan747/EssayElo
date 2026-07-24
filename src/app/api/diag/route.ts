import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { judgeModel, PROVIDER, structuredCall } from "@/lib/anthropic";
import { judgeMatchPair } from "@/lib/engine/judge";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Temporary deployment diagnostic. Visit /api/diag to see, in one JSON blob,
 * whether the DB, the RPC grant, and the LLM call each work — without exposing
 * any secret values (only booleans + error messages). Remove this route once
 * the deployment is healthy.
 */
export async function GET() {
  const out: Record<string, unknown> = {
    provider: PROVIDER,
    judgeModel: judgeModel(),
    env: {
      LLM_PROVIDER: process.env.LLM_PROVIDER ?? "(unset → defaults to anthropic)",
      LLM_BASE_URL: process.env.LLM_BASE_URL ?? "(unset)",
      LLM_API_KEY_present: !!process.env.LLM_API_KEY,
      LLM_MODEL_JUDGE: process.env.LLM_MODEL_JUDGE ?? "(unset)",
      LLM_REASONING_EFFORT: process.env.LLM_REASONING_EFFORT ?? "(unset)",
      ANTHROPIC_API_KEY_present: !!process.env.ANTHROPIC_API_KEY,
      SUPABASE_URL_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SERVICE_ROLE_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ANON_present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  };

  // 1. DB reachability + corpus seeded?
  try {
    const db = supabaseAdmin();
    const { count, error } = await db
      .from("corpus_essays")
      .select("id", { count: "exact", head: true });
    out.corpusCount = error ? `ERROR: ${error.message}` : count;

    // 2. RPC grant (dummy id → should return empty set, not a permission error)
    const { error: rpcErr } = await db.rpc("claim_evaluation", {
      p_eval_id: "00000000-0000-0000-0000-000000000000",
      p_lock_seconds: 1,
    });
    out.rpc = rpcErr ? `ERROR: ${rpcErr.message}` : "ok";
  } catch (e) {
    out.db = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. LLM call through the exact product path.
  const started = Date.now();
  try {
    const r = await structuredCall<{ tier: number }>({
      model: judgeModel(),
      system: "You triage essays. Return JSON.",
      user: 'Return {"tier": 4}.',
      schema: {
        type: "object",
        properties: { tier: { type: "integer" } },
        required: ["tier"],
        additionalProperties: false,
      },
      maxTokens: 400,
    });
    out.llm = { ok: true, ms: Date.now() - started, sample: r };
  } catch (e) {
    out.llm = {
      ok: false,
      ms: Date.now() - started,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  // 4. The real head-to-head call (complex nested schema) through the judge.
  const t2 = Date.now();
  try {
    const [v] = await judgeMatchPair(
      "I keep a spreadsheet of every word I have ever mispronounced in public. Column D is witnesses. Writing the humiliation down converts it to data, and data does not hurt.",
      "My mission trip to Guatemala changed my life and taught me not to take things for granted."
    );
    out.judge = { ok: true, ms: Date.now() - t2, userWon: v.userWon, margin: v.margin };
  } catch (e) {
    out.judge = {
      ok: false,
      ms: Date.now() - t2,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return NextResponse.json(out, { status: 200 });
}
