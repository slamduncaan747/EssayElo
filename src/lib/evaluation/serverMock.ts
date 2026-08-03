import "server-only";

/**
 * The single place that decides whether a request is allowed to touch mock
 * behavior. Both flags are derived purely from server-controlled
 * environment state — never from anything a browser sends — per the "mock
 * must be decided by the server, not requestable by the client" rule.
 */

/** True on every non-production deployment (local dev, preview/staging). */
export function isNonProduction(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** True when the live UI should run entirely off the client-side fixture
 *  script instead of calling the evaluator service at all — the default in
 *  development, so the experience can be built without API credentials.
 *  Set EVAL_TRANSPORT=api in a non-production env to exercise the real
 *  proxy + evaluator integration (still with mock:true, see below). */
export function shouldUseFixtureTransport(): boolean {
  return isNonProduction() && process.env.EVAL_TRANSPORT !== "api";
}

/** The `mock` flag sent to the evaluator service itself. Always false in
 *  production, regardless of anything else. */
export function evaluatorMockFlag(): boolean {
  return isNonProduction();
}
