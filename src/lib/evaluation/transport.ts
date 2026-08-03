import {
  buildFailedFixtureEvents,
  buildFeedbackFailureFixtureEvents,
  buildFixtureEvents,
  fixtureTiming,
} from "./fixtures";
import type { EvaluationEvent, EvaluationInput, EvaluationSession } from "./types";

/**
 * The seam between the UI and however evaluation progress actually arrives.
 * Three implementations share this interface: a development fixture that
 * plays back a scripted event timeline, the current final-response API
 * (one blocking call, no real intermediate signal), and — once the backend
 * exposes it — a real SSE stream. Components only ever see `EvaluationEvent`s
 * through `subscribe`, so swapping the transport never touches them.
 */
export interface EvaluationTransport {
  startEvaluation(input: EvaluationInput): Promise<EvaluationSession>;
  subscribe(sessionId: string, onEvent: (event: EvaluationEvent) => void): () => void;
  getCurrentState(sessionId: string): Promise<EvaluationEvent[]>;
}

export type FixtureScenario = "default" | "failed" | "feedback-failure";

/**
 * Development-only transport. Never reachable in production: the caller
 * must be handed this instance by a server-rendered `mock` flag computed
 * from `process.env.NODE_ENV`, not from any client-supplied value.
 */
export class FixtureTransport implements EvaluationTransport {
  constructor(
    private essay: string,
    private scenario: FixtureScenario = "default",
    private reducedMotion = false
  ) {}

  private events(evaluationId: string): EvaluationEvent[] {
    switch (this.scenario) {
      case "failed":
        return buildFailedFixtureEvents(evaluationId);
      case "feedback-failure":
        return buildFeedbackFailureFixtureEvents(this.essay, evaluationId);
      default:
        return buildFixtureEvents(this.essay, evaluationId);
    }
  }

  async startEvaluation(input: EvaluationInput): Promise<EvaluationSession> {
    return { evaluationId: input.evaluationId, mock: true };
  }

  subscribe(sessionId: string, onEvent: (event: EvaluationEvent) => void): () => void {
    const script = this.events(sessionId);
    const timing = fixtureTiming(this.reducedMotion);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    let elapsed = 0;
    script.forEach((event, i) => {
      elapsed += timing[i] ?? 900;
      const t = setTimeout(() => {
        if (!cancelled) onEvent(event);
      }, elapsed);
      timers.push(t);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }

  async getCurrentState(sessionId: string): Promise<EvaluationEvent[]> {
    return this.events(sessionId);
  }
}

/**
 * Production transport for the current, non-streaming Cloud Run endpoint.
 * There is exactly one real signal here: the HTTP response. Everything
 * before it is an honest, indeterminate "reading" wait — no fabricated
 * score or dimension movement, and no timer-driven phase advancement.
 */
export class FinalResponseTransport implements EvaluationTransport {
  async startEvaluation(input: EvaluationInput): Promise<EvaluationSession> {
    // The actual network call happens in `subscribe` (see below) — for this
    // transport, "subscribing" and "kicking off the one real request" are
    // the same action, since there's no independent stream to attach to.
    return { evaluationId: input.evaluationId, mock: false };
  }

  subscribe(sessionId: string, onEvent: (event: EvaluationEvent) => void): () => void {
    let cancelled = false;
    let sequence = 0;

    onEvent({ type: "analysis.started", sequence: sequence++, evaluation_id: sessionId });

    fetch(`/api/evaluations/${sessionId}/run`, { method: "POST" })
      .then((res) => res.json())
      .then((data: { events: EvaluationEvent[] }) => {
        if (cancelled) return;
        for (const e of data.events) onEvent({ ...e, sequence: sequence++ });
      })
      .catch(() => {
        if (cancelled) return;
        onEvent({
          type: "evaluation.failed",
          sequence: sequence++,
          evaluation_id: sessionId,
          stage: "scoring",
          message: "We saved your essay, but the analysis did not finish. You can safely try again.",
          partialResult: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }

  /** Non-mutating: reflects whatever the DB already holds, for reload and
   *  reconnection. Never re-triggers the evaluator call. */
  async getCurrentState(sessionId: string): Promise<EvaluationEvent[]> {
    const res = await fetch(`/api/evaluations/${sessionId}`);
    const data = await res.json();
    return (data.events as EvaluationEvent[]) ?? [];
  }
}
