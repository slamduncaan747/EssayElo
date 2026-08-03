"use client";

import { TIERS } from "@/lib/tier";
import type { ScoreInterval } from "@/lib/evaluation/types";

/** Score interval, current tier, and distance to the next one. Tier is
 *  intentionally withheld until the backend has passed the initial
 *  "locating" phase — showing one off a single early snapshot would read
 *  as more certain than it is. */
export function ScoreIntervalDisplay({ interval, onDark = true }: { interval: ScoreInterval | null; onDark?: boolean }) {
  if (!interval) return null;
  return (
    <span className="tiny" style={{ color: onDark ? "var(--on-dark-3)" : "var(--text-4)" }}>
      Likely range: <b style={{ color: onDark ? "var(--on-dark-2)" : "var(--text-3)" }}>{interval.low}–{interval.high}</b>
    </span>
  );
}

export function TierProgress({
  tier,
  distanceToNextTier,
  onDark = true,
}: {
  tier: string | null;
  distanceToNextTier: number | null;
  onDark?: boolean;
}) {
  if (!tier) {
    return (
      <span className="tiny" style={{ color: onDark ? "var(--on-dark-3)" : "var(--text-4)" }}>
        Tier: still locating your range
      </span>
    );
  }
  const known = TIERS.find((t) => t.name === tier);
  return (
    <div className="stack g2" style={{ alignItems: "center" }}>
      <span className="rank rank-lg" style={{ background: onDark ? "rgba(250,246,238,.1)" : known?.soft, color: onDark ? "var(--on-dark)" : known?.ink }}>
        <span className="rank-dot" style={{ background: known?.color ?? "var(--brand)" }} />
        {tier}
      </span>
      {distanceToNextTier != null && distanceToNextTier > 0 ? (
        <span className="tiny" style={{ color: onDark ? "var(--on-dark-3)" : "var(--text-4)" }}>
          <b style={{ color: onDark ? "var(--on-dark-2)" : "var(--text-3)" }}>{distanceToNextTier}</b> points to the next tier
        </span>
      ) : null}
    </div>
  );
}
