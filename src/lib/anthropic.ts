import Anthropic from "@anthropic-ai/sdk";

/**
 * LLM surface with a pluggable provider so evaluations can run on a free API
 * during testing (Groq, Google Gemini via their OpenAI-compatible endpoints,
 * OpenRouter, etc.) without changing any call site.
 *
 *   LLM_PROVIDER=anthropic       → Anthropic Messages API (default)
 *   LLM_PROVIDER=openai-compat   → any OpenAI-compatible /chat/completions API
 *
 * For openai-compat set LLM_BASE_URL + LLM_API_KEY (+ optional model names).
 * Example (Groq, free):
 *   LLM_PROVIDER=openai-compat
 *   LLM_BASE_URL=https://api.groq.com/openai/v1
 *   LLM_API_KEY=gsk_...
 *   LLM_MODEL_JUDGE=llama-3.3-70b-versatile
 */

export const PROVIDER = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

const DEFAULT_MODEL =
  PROVIDER === "anthropic" ? "claude-opus-4-8" : "llama-3.3-70b-versatile";

/**
 * Judge runs 2×(10–25) calls per evaluation, so the judge model is the main
 * cost/latency lever. Legacy ANTHROPIC_MODEL_* names still work.
 */
export const JUDGE_MODEL =
  process.env.LLM_MODEL_JUDGE || process.env.ANTHROPIC_MODEL_JUDGE || DEFAULT_MODEL;
export const SYNTH_MODEL =
  process.env.LLM_MODEL_SYNTH || process.env.ANTHROPIC_MODEL_SYNTH || DEFAULT_MODEL;

/**
 * Model for the two simple calls — placement (a 3-way triage) and prose (one
 * score). Neither needs the judging model's capability. Pointing this at a
 * smaller model saves the judge's quota and, on providers that meter per
 * model, spreads load across separate buckets. Defaults to the judge model.
 */
export const CHEAP_MODEL = process.env.LLM_MODEL_CHEAP || JUDGE_MODEL;

export const MOCK_JUDGE = process.env.MOCK_JUDGE === "1";

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    _anthropic = new Anthropic({ maxRetries: 3 });
  }
  return _anthropic;
}

export interface StructuredCallOpts {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  thinking?: boolean;
  /**
   * Compact human-readable description of the output shape. JSON-mode
   * providers get this instead of the serialized JSON Schema, which can cost
   * more tokens than the essays themselves. The Anthropic path always uses the
   * real schema (native structured outputs).
   */
  schemaHint?: string;
}

/** One structured-output call: returns parsed JSON matching `schema`. */
export async function structuredCall<T>(opts: StructuredCallOpts): Promise<T> {
  const call = PROVIDER === "openai-compat" ? openAiCompatCall : anthropicCall;
  const make = () => call<T>(opts);
  try {
    return await make();
  } catch (e) {
    // Retry once on unparseable output — models occasionally wrap JSON in prose.
    if (e instanceof SyntaxError) return await make();
    throw e;
  }
}

async function anthropicCall<T>(opts: StructuredCallOpts): Promise<T> {
  const res = await anthropic().messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
    ...(opts.thinking ? { thinking: { type: "adaptive" as const } } : {}),
    output_config: { format: { type: "json_schema", schema: opts.schema } },
  } as Parameters<ReturnType<typeof anthropic>["messages"]["create"]>[0]);
  const msg = res as {
    content: Array<{ type: string; text?: string }>;
    stop_reason?: string;
  };
  if (msg.stop_reason === "refusal") {
    throw new Error("Model declined to evaluate this content");
  }
  const text = msg.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Empty model response");
  return JSON.parse(text) as T;
}

/**
 * OpenAI-compatible chat-completions call using JSON mode. The schema is
 * embedded in the system message (json-mode providers require the word "json"
 * in the prompt and don't all support response_format.json_schema); the shared
 * one-retry parse in structuredCall covers the occasional stray wrapper.
 */
async function openAiCompatCall<T>(opts: StructuredCallOpts): Promise<T> {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  if (!base || !key) {
    throw new Error("LLM_BASE_URL and LLM_API_KEY must be set for openai-compat");
  }
  const shape = opts.schemaHint ?? JSON.stringify(opts.schema);
  const system = `${opts.system}\n\nRespond with ONLY a JSON object, no prose or markdown, in exactly this shape:\n${shape}`;

  // Reasoning models (e.g. Gemini flash) spend output tokens thinking before
  // the JSON, so floor the budget and pass through the effort control. Not all
  // models accept reasoning_effort (Groq's Llama 400s on it) — so we drop it
  // and retry if the model rejects it, rather than requiring perfect env config.
  const reasoningEnv = process.env.LLM_REASONING_EFFORT;
  let sendReasoning = !!reasoningEnv;
  const maxTokens = Math.max(opts.maxTokens ?? 2048, reasoningEnv ? 1200 : 512);

  const buildBody = () =>
    JSON.stringify({
      model: opts.model,
      max_tokens: maxTokens,
      temperature: 0,
      response_format: { type: "json_object" },
      ...(sendReasoning && reasoningEnv ? { reasoning_effort: reasoningEnv } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: opts.user },
      ],
    });

  // Retry rate limits (429) and transient server errors, waiting out the
  // provider's stated retry window (header or message). Free tiers cap tokens-
  // per-minute, so a busy evaluation legitimately has to pause ~10s between
  // calls. Capped at 45s so a single call still finishes within the function
  // limit — run with JUDGE_SINGLE_READING=1 on token-limited tiers so each
  // step is one call rather than two.
  const MAX_ATTEMPTS = 7;
  let res!: Response;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: buildBody(),
    });
    if (res.ok) break;
    const detail = await res.text().catch(() => "");
    // Self-heal: model doesn't accept reasoning_effort — drop it and retry.
    if (res.status === 400 && sendReasoning && /reasoning_effort/i.test(detail)) {
      sendReasoning = false;
      continue;
    }
    // A per-day quota resets in hours, not seconds — retrying just burns the
    // request budget and the user's time. Surface it immediately.
    if (res.status === 429 && isDailyQuota(detail)) {
      throw new Error(quotaMessage(detail));
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const wait = retryWaitMs(res, detail, attempt);
    // Likewise, don't sit through a multi-minute window inside one request.
    if (wait > 60000) throw new Error(quotaMessage(detail));
    await new Promise((r) => setTimeout(r, wait));
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return JSON.parse(stripFence(content)) as T;
}

/** A daily (rather than per-minute) quota — no point retrying in-request. */
function isDailyQuota(body: string): boolean {
  return /per day|\bTPD\b|\bRPD\b|requests per day|free_tier_requests/i.test(body);
}

/** Turn a provider quota dump into something a human can act on. */
function quotaMessage(body: string): string {
  const when = body.match(/try again in ([\dhms.]+)/i)?.[1];
  return (
    `The evaluation model's quota is exhausted${when ? ` (resets in ${when})` : ""}. ` +
    `Switch LLM_MODEL_JUDGE to a model with its own quota (e.g. llama-3.1-8b-instant), ` +
    `set MOCK_JUDGE=1 to exercise the app without an API, or upgrade the provider plan.`
  );
}

/**
 * How long to wait before a retry. Prefer the provider's own signal: the
 * `retry-after` header, or a "try again in 8.39s" phrase in the body (Groq).
 * Falls back to exponential backoff. Capped at 45s.
 */
function retryWaitMs(res: Response, body: string, attempt: number): number {
  const header = Number(res.headers.get("retry-after"));
  let seconds = header > 0 ? header : 0;
  if (!seconds) {
    const m = body.match(/try again in ([\d.]+)\s*s/i);
    if (m) seconds = parseFloat(m[1]);
  }
  const ms = seconds > 0 ? seconds * 1000 : 1500 * 2 ** (attempt - 1);
  return Math.min(ms, 45000) + Math.random() * 500;
}

/** Some providers still wrap JSON in a ```json fence even in JSON mode. */
function stripFence(s: string): string {
  const trimmed = s.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1] : trimmed;
}
