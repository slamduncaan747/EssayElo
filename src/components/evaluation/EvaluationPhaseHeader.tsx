"use client";

import { PHASE_COPY } from "@/lib/evaluation/copy";
import type { EvaluationStatus } from "@/lib/evaluation/types";
import { ContinuousProgressBar } from "./ContinuousProgressBar";

/**
 * Compact phase/progress header shown above the essay while it's being
 * read. An ARIA live region announces phase changes only — not every
 * progress tick or score update — so screen reader users get the same
 * "calm" experience sighted users do.
 */
export function EvaluationPhaseHeader({
  status,
  progress,
  progressIsDeterminate,
  mock,
}: {
  status: EvaluationStatus;
  progress: number;
  progressIsDeterminate: boolean;
  mock: boolean;
}) {
  const copy = PHASE_COPY[status];
  return (
    <div className="phase-header">
      <div className="spread">
        <span className="live">
          <span className="pulse-dot" />
          Analyzing
        </span>
        {mock ? <span className="chip chip-brand">Dev fixture</span> : null}
      </div>
      <div className="stack g1">
        <span className="h3" aria-live="polite">
          {copy.headline}
        </span>
        <span className="small">{copy.secondary}</span>
      </div>
      <ContinuousProgressBar progress={progress} determinate={progressIsDeterminate} />
    </div>
  );
}
