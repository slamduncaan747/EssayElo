"use client";

import { useEffect, useRef, useState } from "react";
import { ScoreRing } from "../Score";
import { DimensionRadar } from "./DimensionRadar";
import { SignalSummaryCards } from "./SignalSummaryCards";
import { ScoreIntervalDisplay, TierProgress } from "./TierProgress";
import { ContinuousProgressBar } from "./ContinuousProgressBar";
import { LiveInsightFeed } from "./LiveInsightCard";
import { useScoreBuffer } from "@/lib/evaluation/useScoreBuffer";
import { PHASE_COPY } from "@/lib/evaluation/copy";
import type { DimensionKey, EvaluationViewState } from "@/lib/evaluation/types";

/**
 * The right analytics rail — the one persistent surface that spans the
 * live evaluation and the post-evaluation feedback dashboard. `mode`
 * controls the two sections that only make sense mid-analysis (the
 * continuous progress bar and the live insight feed).
 */
export function AnalyticsRail({
  state,
  mode,
  isPlus,
  shareAction,
  forceFinal = false,
  onSelectDimension,
}: {
  state: EvaluationViewState;
  mode: "live" | "final";
  isPlus: boolean;
  shareAction?: React.ReactNode;
  /** Treat the score/dimensions as settled even though `state.status` isn't
   *  "complete" — used when scoring succeeded but feedback generation
   *  failed, so the number itself is still authoritative. */
  forceFinal?: boolean;
  onSelectDimension?: (key: DimensionKey) => void;
}) {
  const isFinal = state.status === "complete" || forceFinal;
  const { displayed, delta } = useScoreBuffer(state.rawScore, isFinal);
  const [pulsingKeys, setPulsingKeys] = useState<DimensionKey[]>([]);
  const prevDims = usePrevious(state.dimensions);

  useEffect(() => {
    if (!prevDims) return;
    const moved = (Object.keys(state.dimensions) as DimensionKey[]).filter((k) => {
      const prev = prevDims[k];
      const cur = state.dimensions[k];
      return typeof prev === "number" && typeof cur === "number" && Math.abs(cur - prev) >= 4;
    });
    if (moved.length) {
      setPulsingKeys(moved);
      const t = setTimeout(() => setPulsingKeys([]), 1400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dimensions]);

  const scoreDisplay = isFinal
    ? isPlus
      ? displayed?.toFixed(1) ?? "—"
      : state.scoreInterval
        ? `${state.scoreInterval.low}–${state.scoreInterval.high}`
        : "—"
    : displayed != null
      ? String(Math.round(displayed))
      : "—";

  return (
    <div className="panel-body on-dark-scroll">
      <div className="spread">
        <span className="label">{isFinal ? "Margin score" : "Evaluation status"}</span>
        {!isFinal ? <span className="chip chip-onDark">{PHASE_COPY[state.status].headline}</span> : null}
      </div>

      <div className="stack g3 pop-in" style={{ alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <ScoreRing value={displayed ?? 0} display={scoreDisplay} label="MARGIN SCORE" size={148} onDark />
          {delta != null ? (
            <span className={`score-delta ${delta >= 0 ? "up" : "down"}`} aria-hidden="true">
              {delta >= 0 ? "+" : ""}
              {delta}
            </span>
          ) : null}
        </div>
        {!isFinal ? (
          <span className="chip chip-gold">{state.provisional ? "Provisional" : "Final"}</span>
        ) : null}
        <ScoreIntervalDisplay interval={state.scoreInterval} />
        <TierProgress tier={state.tier} distanceToNextTier={state.distanceToNextTier} />
      </div>

      <div className="stack g3" style={{ alignItems: "center" }}>
        <span className="label">Dimension profile</span>
        <DimensionRadar
          dimensions={state.dimensions}
          pulsingKeys={pulsingKeys}
          size={210}
          onDark
          opacity={isFinal ? 0.55 : undefined}
          onSelectDimension={onSelectDimension}
        />
      </div>

      <SignalSummaryCards
        strongestSignal={state.strongestSignal}
        focusArea={state.focusArea}
        confidence={state.confidence}
      />

      {mode === "live" ? (
        <>
          <div className="stack g2">
            <div className="spread">
              <span className="label">Progress</span>
              <span className="tiny">{Math.round(state.progress)}%</span>
            </div>
            <ContinuousProgressBar progress={state.progress} determinate={state.progressIsDeterminate} onDark />
          </div>

          <div className="stack g3">
            <span className="label">Recent insights</span>
            <LiveInsightFeed insights={state.insights} />
          </div>
        </>
      ) : null}

      {shareAction}
    </div>
  );
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const previous = ref.current;
  useEffect(() => {
    ref.current = value;
  });
  return previous;
}
