import Icon from "./Icon";
import { pointsToNext, tierForScore, tierProgress, type Tier } from "@/lib/tier";

/**
 * Shared score furniture. Every screen that shows a number builds it from
 * these, so a score keeps one identity across the whole product.
 */

/** The rank name as a pill. */
export function Rank({
  tier,
  size = "md",
  onDark = false,
}: {
  tier: Tier;
  size?: "md" | "lg";
  onDark?: boolean;
}) {
  return (
    <span
      className={`rank ${size === "lg" ? "rank-lg" : ""}`}
      style={{
        background: onDark ? "rgba(250,246,238,.1)" : tier.soft,
        color: onDark ? "var(--on-dark)" : tier.ink,
      }}
    >
      <span className="rank-dot" style={{ background: tier.color }} />
      {tier.key === "standout" ? <Icon name="crown" size={13} /> : null}
      {tier.name}
    </span>
  );
}

/** Circular medallion holding the score itself — the trophy of the system. */
export function Medal({
  value,
  display,
  size = 64,
}: {
  value: number;
  display: string;
  size?: number;
}) {
  const tier = tierForScore(value);
  // Gold is too light to carry white text; the top rank takes dark ink instead.
  const ink = tier.key === "standout" ? "var(--n-900)" : "#fff";
  return (
    <span
      className="medal"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, ${tier.color}, ${tier.deep})`,
        fontSize: display.length > 3 ? size * 0.28 : size * 0.36,
        color: ink,
      }}
    >
      {display}
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
  small = false,
}: {
  low: number;
  high: number;
  color: string;
  onDark?: boolean;
  ticks?: boolean;
  small?: boolean;
}) {
  return (
    <div style={{ width: "100%" }}>
      <div className={`meter ${small ? "meter-sm" : ""} ${onDark ? "meter-dark" : ""}`}>
        <div
          className="meter-fill"
          style={{
            left: `${low}%`,
            width: `${Math.max(high - low, 2.5)}%`,
            background: color,
          }}
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

/** Big circular score. `display` is what gets printed — "62.4" or "54–63". */
export function ScoreRing({
  value,
  display,
  label,
  size = 152,
  onDark = false,
}: {
  value: number;
  display: string;
  label?: string;
  size?: number;
  onDark?: boolean;
}) {
  const tier = tierForScore(value);
  const stroke = Math.round(size * 0.09);
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const swept = Math.min(1, Math.max(0, value / 100)) * c;
  const long = display.length > 4;

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
          style={{ transition: "stroke-dasharray .9s var(--ease)" }}
        />
      </svg>
      <div className="ring-value" style={{ color: onDark ? "var(--on-dark)" : "var(--text)" }}>
        <b style={{ fontSize: long ? size * 0.235 : size * 0.31 }}>{display}</b>
        {label ? <span>{label}</span> : null}
      </div>
    </div>
  );
}

/** Progress toward the next rank — the "keep going" nudge. */
export function NextRank({ score, onDark = false }: { score: number; onDark?: boolean }) {
  const tier = tierForScore(score);
  const ahead = pointsToNext(score);
  const pct = Math.round(tierProgress(score) * 100);

  if (!ahead) {
    return (
      <span className="tiny" style={onDark ? { color: "var(--on-dark-3)" } : undefined}>
        Top rank reached — 0.4% of essays get here.
      </span>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, width: "100%" }}>
      <div className={`meter meter-sm ${onDark ? "meter-dark" : ""}`}>
        <div className="meter-fill" style={{ left: 0, width: `${pct}%`, background: tier.color }} />
      </div>
      <span className="tiny" style={onDark ? { color: "var(--on-dark-3)" } : undefined}>
        <b style={{ color: onDark ? "var(--on-dark-2)" : "var(--text-3)" }}>
          {ahead.points} points
        </b>{" "}
        to {ahead.next.name}
      </span>
    </div>
  );
}
