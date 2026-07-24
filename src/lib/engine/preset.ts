/**
 * Engine preset identifiers — client-safe (no server imports), so the testing
 * UI can reference them without pulling in the server-side engine config.
 */
export type EnginePreset = "env" | "mock" | "fast" | "quality";

export const ENGINE_COOKIE = "margin_engine";

export function isPreset(v: unknown): v is EnginePreset {
  return v === "env" || v === "mock" || v === "fast" || v === "quality";
}
