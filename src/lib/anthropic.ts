import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ maxRetries: 3 });
  }
  return _client;
}

/**
 * Model configuration. Defaults to Opus for judgment quality; JUDGE runs
 * 2×(10–25) calls per evaluation, so ANTHROPIC_MODEL_JUDGE is the main
 * cost/latency lever (e.g. set it to claude-haiku-4-5).
 */
export const JUDGE_MODEL = process.env.ANTHROPIC_MODEL_JUDGE || "claude-opus-4-8";
export const SYNTH_MODEL = process.env.ANTHROPIC_MODEL_SYNTH || "claude-opus-4-8";

export const MOCK_JUDGE = process.env.MOCK_JUDGE === "1";

/**
 * One structured-output call: returns parsed JSON matching `schema`.
 * Retries once on unparseable output.
 */
export async function structuredCall<T>(opts: {
  model: string;
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
  thinking?: boolean;
}): Promise<T> {
  const client = anthropic();
  const make = async () => {
    const res = await client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 2048,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      ...(opts.thinking ? { thinking: { type: "adaptive" as const } } : {}),
      output_config: { format: { type: "json_schema", schema: opts.schema } },
    } as Parameters<typeof client.messages.create>[0]);
    const msg = res as { content: Array<{ type: string; text?: string }>; stop_reason?: string };
    if (msg.stop_reason === "refusal") {
      throw new Error("Model declined to evaluate this content");
    }
    const text = msg.content.find((b) => b.type === "text")?.text;
    if (!text) throw new Error("Empty model response");
    return JSON.parse(text) as T;
  };
  try {
    return await make();
  } catch (e) {
    if (e instanceof SyntaxError) return await make();
    throw e;
  }
}
