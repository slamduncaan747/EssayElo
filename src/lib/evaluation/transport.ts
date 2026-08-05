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
  /**
   * `autoStart` gates whether this transport is allowed to *trigger* work.
   *
   * Only the submit flow (and an explicit retry) may start an evaluation.
   * Revisiting an essay page must never re-trigger scoring — that is what
   * made every visit to a still-running evaluation kick off a fresh,
   * billable run of the evaluator. When false, we poll the read-only state
   * endpoint until the evaluation reaches a terminal state.
   */
  constructor(private autoStart: boolean) {}

  async startEvaluation(input: EvaluationInput): Promise<EvaluationSession> {
    // The actual network call happens in `subscribe` (see below) — for this
    // transport, "subscribing" and "kicking off the one real request" are
    // the same action, since there's no independent stream to attach to.
    return { evaluationId: input.evaluationId, mock: false };
  }

  subscribe(sessionId: string, onEvent: (event: EvaluationEvent) => void): () => void {
    let cancelled = false;
    let sequence = 0;

    const emit = (e: EvaluationEvent) => {
      if (!cancelled) onEvent({ ...e, sequence: sequence++ });
    };

    emit({ type: "analysis.started", sequence: 0, evaluation_id: sessionId });

    if (!this.autoStart) {
      // Read-only: watch an evaluation that was started elsewhere.
      let stopped = false;
      let lastSignature = "";
      const poll = async () => {
        while (!stopped && !cancelled) {
          try {
            const res = await fetch(`/api/evaluations/${sessionId}`);
            const data: { events: EvaluationEvent[] } = await res.json();
            if (cancelled) return;
            // Only dispatch when the server's view actually changed; the
            // reducer drops stale sequences, but re-emitting an identical
            // snapshot every few seconds is pure churn.
            const signature = JSON.stringify(data.events.map((e) => e.type));
            if (signature !== lastSignature) {
              lastSignature = signature;
              for (const e of data.events) emit(e);
            }
            if (
              data.events.some(
                (e) => e.type === "evaluation.completed" || e.type === "evaluation.failed"
              )
            ) {
              return;
            }
          } catch {
            /* transient — keep polling */
          }
          await new Promise((r) => setTimeout(r, 4000));
        }
      };
      poll();
      return () => {
        cancelled = true;
        stopped = true;
      };
    }

    /**
     * Two real signals, in order: scoring, then coaching. They are separate
     * requests because together they exceed a single serverless function's
     * time budget — and splitting them means the score lands in the UI while
     * the revision plan is still being written, instead of both appearing at
     * the very end.
     */
    (async () => {
      let scored: { events: EvaluationEvent[] };
      try {
        const res = await fetch(`/api/evaluations/${sessionId}/run`, { method: "POST" });
        scored = await res.json();
      } catch {
        emit({
          type: "evaluation.failed",
          sequence: 0,
          evaluation_id: sessionId,
          stage: "scoring",
          message: "We saved your essay, but the analysis did not finish. You can safely try again.",
          partialResult: null,
        });
        return;
      }
      if (cancelled) return;
      for (const e of scored.events) emit(e);

      // Only chase feedback when scoring actually left it pending.
      const needsFeedback = scored.events.some((e) => e.type === "feedback.started");
      if (!needsFeedback) return;

      try {
        const res = await fetch(`/api/evaluations/${sessionId}/feedback`, { method: "POST" });
        const data: { events: EvaluationEvent[] } = await res.json();
        if (cancelled) return;
        for (const e of data.events) emit(e);
      } catch {
        emit({
          type: "evaluation.failed",
          sequence: 0,
          evaluation_id: sessionId,
          stage: "feedback",
          message:
            "Your score is in, but the written feedback did not finish generating. You can safely try again — your score is safe either way.",
          partialResult: null,
        });
      }
    })();

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
