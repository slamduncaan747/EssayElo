import Icon from "./Icon";
import { tierForScore, tierProgress, type Tier } from "@/lib/tier";

/**
 * Shared score furniture: the rank badge, the 0–100 meter, and the ring the
 * review panel leads with. Every screen that shows a number uses these, so a
 * score reads the same everywhere.
 */

export function TierBadge({
  tier,
  onDark = false,
  showIcon = true,
}: {
  tier: Tier;
  onDark?: boolean;
  showIcon?: boolean;
}) {
  return (
    <span
      className="tier"
      style={{
        background: onDark ? "rgba(246,241,231,.1)" : tier.soft,
        color: onDark ? "var(--on-dark)" : tier.ink,
      }}
    >
      <span className="tier-dot" style={{ background: tier.color }} />
      {showIcon && tier.key === "standout" ? <Icon name="crown" size={13} /> : null}
      {tier.name}
    </span>
  );
}

/** The 0–100 track with the score (or band) marked on it. */
export function ScoreMeter({
  low,
  high,
  color,
  onDark = false,
  ticks = true,
}: {
  low: number;
  high: number;
  color: string;
  onDark?: boolean;
  ticks?: boolean;
}) {
  const width = Math.max(high - low, 2.5);
  return (
    <div style={{ width: "100%" }}>
      <div className={`meter ${onDark ? "meter-dark" : ""}`}>
        <div
          className="meter-fill"
          style={{ left: `${low}%`, width: `${width}%`, background: color }}
        />
      </div>
      {ticks ? (
        <div className="meter-ticks">
          <span>0</span>
          <span>45 · typical</span>
          <span>100</span>
        </div>
      ) : null}
    </div>
  );
}

/** Big circular score. `label` sits under the number (e.g. the tier name). */
export function ScoreRing({
  value,
  display,
  label,
  size = 148,
  onDark = false,
}: {
  /** 0–100, drives the sweep. */
  value: number;
  /** What to print in the middle — "62.4" or "54–63". */
  display: string;
  label?: string;
  size?: number;
  onDark?: boolean;
}) {
  const tier = tierForScore(value);
  const stroke = Math.round(size * 0.085);
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const swept = Math.min(1, Math.max(0, value / 100)) * c;
  const long = display.length > 5;

  return (
    <div className={`ring ${onDark ? "ring-dark" : ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tier.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${swept} ${c}`}
          style={{ transition: "stroke-dasharray .8s cubic-bezier(.2,.9,.3,1)" }}
        />
      </svg>
      <div className="ring-value" style={{ color: onDark ? "var(--on-dark)" : "var(--text)" }}>
        <b style={{ fontSize: long ? size * 0.2 : size * 0.28 }}>{display}</b>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}

/** Progress toward the next rank — the "keep going" nudge. */
export function TierProgress({ score, onDark = false }: { score: number; onDark?: boolean }) {
  const tier = tierForScore(score);
  const pct = Math.round(tierProgress(score) * 100);
  if (tier.key === "standout") {
    return (
      <span className="tiny" style={{ color: onDark ? "var(--on-dark-3)" : undefined }}>
        Top rank reached — 0.4% of essays get here.
      </span>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <div className={`meter meter-sm ${onDark ? "meter-dark" : ""}`}>
        <div className="meter-fill" style={{ left: 0, width: `${pct}%`, background: tier.color }} />
      </div>
      <span className="tiny" style={{ color: onDark ? "var(--on-dark-3)" : undefined }}>
        {pct}% of the way to the next rank
      </span>
    </div>
  );
}
