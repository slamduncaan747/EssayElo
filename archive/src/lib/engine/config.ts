import { AsyncLocalStorage } from "node:async_hooks";
import { PROVIDER } from "@/lib/anthropic-provider";

/**
 * Request-scoped engine configuration.
 *
 * The evaluation engine normally reads its models from the environment. For
 * testing, a cookie can override them per request — letting you switch between
 * a zero-cost mock, a fast/cheap model, and the full-quality model without
 * redeploying. Carried through the call stack with AsyncLocalStorage so the
 * judge functions don't need a config parameter threaded through them.
 */

export type { EnginePreset } from "./preset";
export { ENGINE_COOKIE, isPreset } from "./preset";
import type { EnginePreset } from "./preset";

export interface EngineConfig {
  preset: EnginePreset;
  mock: boolean;
  judgeModel: string;
  synthModel: string;
  cheapModel: string;
}

/** Sensible fast/quality pairs per provider. */
export function models() {
  return PROVIDER === "anthropic"
    ? { fast: "claude-haiku-4-5", quality: "claude-opus-4-8" }
    : {
        fast: process.env.LLM_MODEL_FAST || "llama-3.1-8b-instant",
        quality: process.env.LLM_MODEL_JUDGE || "llama-3.3-70b-versatile",
      };
}

export function envConfig(): EngineConfig {
  const defaultModel =
    PROVIDER === "anthropic" ? "claude-opus-4-8" : "llama-3.3-70b-versatile";
  const judge =
    process.env.LLM_MODEL_JUDGE || process.env.ANTHROPIC_MODEL_JUDGE || defaultModel;
  return {
    preset: "env",
    mock: process.env.MOCK_JUDGE === "1",
    judgeModel: judge,
    synthModel:
      process.env.LLM_MODEL_SYNTH || process.env.ANTHROPIC_MODEL_SYNTH || defaultModel,
    cheapModel: process.env.LLM_MODEL_CHEAP || judge,
  };
}

export function configFor(preset: EnginePreset): EngineConfig {
  const base = envConfig();
  const m = models();
  switch (preset) {
    case "mock":
      return { ...base, preset, mock: true };
    case "fast":
      return {
        ...base,
        preset,
        mock: false,
        judgeModel: m.fast,
        // Synthesis is one call per evaluation (not per-match), so routing it
        // through the quality model costs little — and it needs the headroom:
        // it carries the full essay plus clustered evidence, which can exceed
        // small models' per-minute token caps (e.g. Groq's 6k TPM on
        // llama-3.1-8b-instant).
        synthModel: m.quality,
        cheapModel: m.fast,
      };
    case "quality":
      return {
        ...base,
        preset,
        mock: false,
        judgeModel: m.quality,
        synthModel: m.quality,
        cheapModel: m.fast,
      };
    default:
      return base;
  }
}

const store = new AsyncLocalStorage<EngineConfig>();

/** Current config — the request-scoped override, else the environment. */
export function engine(): EngineConfig {
  return store.getStore() ?? envConfig();
}

export function runWithEngine<T>(cfg: EngineConfig, fn: () => Promise<T>): Promise<T> {
  return store.run(cfg, fn);
}
