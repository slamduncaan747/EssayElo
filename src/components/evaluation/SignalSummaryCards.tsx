"use client";

import { CONFIDENCE_LABEL, DIMENSION_LABELS, STILL_EMERGING } from "@/lib/evaluation/copy";
import type { Confidence, DimensionKey } from "@/lib/evaluation/types";

export function SignalSummaryCards({
  strongestSignal,
  focusArea,
  confidence,
}: {
  strongestSignal: DimensionKey | null;
  focusArea: DimensionKey | null;
  confidence: Confidence | null;
}) {
  return (
    <div className="tiles">
      <div className="tile">
        <span className="label">Strongest signal</span>
        <b style={{ color: strongestSignal ? "var(--green-hi)" : "var(--on-dark-3)", fontSize: 15 }}>
          {strongestSignal ? DIMENSION_LABELS[strongestSignal] : STILL_EMERGING}
        </b>
      </div>
      <div className="tile">
        <span className="label">Focus area</span>
        <b style={{ color: focusArea ? "var(--gold-hi)" : "var(--on-dark-3)", fontSize: 15 }}>
          {focusArea ? DIMENSION_LABELS[focusArea] : STILL_EMERGING}
        </b>
      </div>
      <div className="tile">
        <span className="label">Confidence</span>
        <b style={{ fontSize: 15 }}>{confidence ? CONFIDENCE_LABEL[confidence] : "Early"}</b>
      </div>
    </div>
  );
}
