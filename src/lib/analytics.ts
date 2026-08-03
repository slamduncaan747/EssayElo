"use client";

/**
 * Product analytics — interaction only, never content. Every call site is
 * typed against a fixed event/property whitelist so a future "just pass
 * the essay text for debugging" doesn't slip in accidentally.
 */

export type AnalyticsEvent =
  | "evaluation_started"
  | "evaluation_first_live_update"
  | "evaluation_completed"
  | "evaluation_failed"
  | "feedback_opened"
  | "dimension_opened"
  | "revision_priority_opened"
  | "start_draft_2_clicked"
  | "share_score_clicked";

export interface AnalyticsProps {
  evaluationId?: string;
  mock?: boolean;
  phase?: string;
  dimension?: string;
  priorityRank?: number;
  tier?: string;
  stage?: string;
  durationMs?: number;
}

const FORBIDDEN_KEY_PATTERN = /essay|content|excerpt|evidence|email|name|feedback|prose|reasoning/i;

function assertSafe(props: AnalyticsProps) {
  if (process.env.NODE_ENV === "production") return;
  for (const key of Object.keys(props)) {
    if (FORBIDDEN_KEY_PATTERN.test(key)) {
      // eslint-disable-next-line no-console
      console.warn(`analytics: refusing to send suspicious property "${key}"`);
    }
  }
}

export function trackEvaluationEvent(event: AnalyticsEvent, props: AnalyticsProps = {}) {
  assertSafe(props);
  if (typeof window === "undefined") return;
  // No analytics provider is wired up yet — this is the single seam every
  // call site already goes through, so plugging one in later (Segment,
  // PostHog, etc.) never touches component code.
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, props);
  }
}
