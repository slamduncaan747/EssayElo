"use client";

import { useEffect, useReducer, useRef } from "react";
import { evaluationReducer, initialViewState } from "./reducer";
import { FinalResponseTransport, FixtureTransport, type EvaluationTransport, type FixtureScenario } from "./transport";
import type { EvaluationViewState } from "./types";

/**
 * Wires an `EvaluationTransport` to the reducer and exposes one canonical
 * `EvaluationViewState`. Survives remounts (navigate away and back) because
 * it always re-derives from `getCurrentState` first, then subscribes for
 * anything that happens after — the evaluation itself lives server-side.
 */
export function useEvaluation(opts: {
  evaluationId: string;
  essayId: string;
  essayContent: string;
  /** Server-decided — never trust a client-supplied flag for this. */
  mock: boolean;
  fixtureScenario?: FixtureScenario;
  /** Skip the network call and go straight to `subscribe`/`getCurrentState`
   *  replay — used when an evaluation is already complete/failed on load. */
  alreadyResolved?: boolean;
  /** Whether this mount is allowed to *start* work. False for ordinary page
   *  visits, which watch an existing evaluation rather than launching one. */
  autoStart?: boolean;
}): EvaluationViewState {
  const [state, dispatch] = useReducer(
    (s: EvaluationViewState, action: Parameters<typeof evaluationReducer>[1]) =>
      evaluationReducer(s, action, { mock: opts.mock }),
    undefined,
    initialViewState
  );

  const transportRef = useRef<EvaluationTransport | null>(null);
  if (!transportRef.current) {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    transportRef.current = opts.mock
      ? new FixtureTransport(opts.essayContent, opts.fixtureScenario ?? "default", !!reducedMotion)
      : new FinalResponseTransport(opts.autoStart ?? false);
  }

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    const transport = transportRef.current!;

    async function run() {
      if (opts.alreadyResolved) {
        const events = await transport.getCurrentState(opts.evaluationId);
        if (cancelled) return;
        for (const e of events) dispatch(e);
        return;
      }
      unsubscribe = transport.subscribe(opts.evaluationId, (event) => {
        if (!cancelled) dispatch(event);
      });
      await transport.startEvaluation({ essayId: opts.essayId, evaluationId: opts.evaluationId });
    }

    run();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.evaluationId]);

  return state;
}
