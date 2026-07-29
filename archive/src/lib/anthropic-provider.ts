/**
 * Provider selection, in its own module so the engine config and the LLM
 * client can both read it without a circular import.
 *
 *   LLM_PROVIDER=anthropic     → Anthropic Messages API (default)
 *   LLM_PROVIDER=openai-compat → any OpenAI-compatible /chat/completions API
 */
export const PROVIDER = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();
