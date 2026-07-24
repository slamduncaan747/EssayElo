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
  const system = `${opts.system}\n\nRespond with ONLY a JSON object, no prose or markdown, matching this JSON schema exactly:\n${JSON.stringify(opts.schema)}`;

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

  // Retry rate limits (429) and transient server errors with backoff. Free
  // tiers throttle aggressively; an evaluation makes ~21 calls in a burst.
  // Bounded so one call's total retry time (~1.5+3+6+12 ≈ 22s) stays well
  // under the serverless function limit even when fully throttled.
  const MAX_ATTEMPTS = 5;
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
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === MAX_ATTEMPTS) {
      throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 300)}`);
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait =
      retryAfter > 0
        ? Math.min(retryAfter * 1000, 15000)
        : Math.min(1500 * 2 ** (attempt - 1), 12000);
    await new Promise((r) => setTimeout(r, wait + Math.random() * 400));
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return JSON.parse(stripFence(content)) as T;
}

/** Some providers still wrap JSON in a ```json fence even in JSON mode. */
function stripFence(s: string): string {
  const trimmed = s.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fence ? fence[1] : trimmed;
}
