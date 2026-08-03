"use client";

import { DIMENSION_KEYS, type DimensionKey, type DimensionScores } from "@/lib/evaluation/types";
import { DIMENSION_LABELS } from "@/lib/evaluation/copy";

/**
 * The seven-axis dimension chart. Shared by the live analytics rail and the
 * post-evaluation dimension explorer — the geometry and accessibility
 * story stay identical, only `mode` and the data change.
 *
 * Before any dimension has a value, only the grid and the 50-point
 * benchmark ring render: drawing a neutral polygon at that point would
 * read as a real (if middling) score, which it isn't.
 */
export function DimensionRadar({
  dimensions,
  pulsingKeys = [],
  size = 220,
  onDark = false,
  onSelectDimension,
  opacity,
}: {
  dimensions: Partial<DimensionScores>;
  pulsingKeys?: DimensionKey[];
  size?: number;
  onDark?: boolean;
  onSelectDimension?: (key: DimensionKey) => void;
  /** Overrides the auto opacity-by-coverage curve, e.g. for a fully-settled
   *  final chart. */
  opacity?: number;
}) {
  const keys = DIMENSION_KEYS;
  const n = keys.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.32;
  const labelR = size * 0.47;
  const gridColor = onDark ? "rgba(250,246,238,.16)" : "var(--line)";
  const textColor = onDark ? "var(--on-dark-2)" : "var(--text-3)";
  const pulseSet = new Set(pulsingKeys);

  const present = keys.filter((k) => typeof dimensions[k] === "number");
  const coverage = present.length / n;
  const polygonOpacity = opacity ?? (present.length === 0 ? 0 : 0.28 + coverage * 0.35);

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, frac: number): [number, number] => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * frac, cy + Math.sin(a) * r * frac];
  };

  const dataPoints = keys.map((k, i) => {
    const v = dimensions[k];
    const frac = typeof v === "number" ? Math.max(0.04, v / 100) : 0.02;
    return point(i, frac);
  });
  const dataPath = dataPoints.map((p) => p.join(",")).join(" ");

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} role="img" aria-hidden="true">
        {[0.25, 0.5, 0.75, 1].map((lvl) => (
          <polygon
            key={lvl}
            points={keys.map((_, i) => point(i, lvl).join(",")).join(" ")}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}
        {/* 50-point benchmark ring — the reference field's typical reading. */}
        <polygon
          points={keys.map((_, i) => point(i, 0.5).join(",")).join(" ")}
          fill="none"
          stroke={onDark ? "rgba(234,167,44,.4)" : "var(--gold-press)"}
          strokeWidth={1.25}
          strokeDasharray="2 3"
        />
        {keys.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={gridColor} strokeWidth={1} />;
        })}
        {present.length > 0 ? (
          <polygon
            points={dataPath}
            fill="var(--brand)"
            fillOpacity={polygonOpacity * 0.7}
            stroke="var(--brand)"
            strokeWidth={2}
            style={{ transition: "all .7s var(--ease)" }}
          />
        ) : null}
        {present.length > 0 &&
          keys.map((k, i) => {
            const v = dimensions[k];
            if (typeof v !== "number") return null;
            const [x, y] = dataPoints[i];
            const pulsing = pulseSet.has(k);
            return (
              <circle
                key={k}
                cx={x}
                cy={y}
                r={pulsing ? 4.5 : 3}
                fill="var(--brand)"
                style={{ transition: "all .7s var(--ease)" }}
                className={pulsing ? "radar-point-pulse" : undefined}
              />
            );
          })}
        {keys.map((k, i) => {
          const a = angle(i);
          const lx = cx + Math.cos(a) * labelR;
          const ly = cy + Math.sin(a) * labelR;
          const label = DIMENSION_LABELS[k];
          return (
            <text
              key={k}
              x={lx}
              y={ly}
              fontSize={9.5}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={textColor}
            >
              {label.length > 11 ? label.slice(0, 10) + "…" : label}
            </text>
          );
        })}
      </svg>

      {onSelectDimension ? (
        <div className="radar-axis-buttons" role="group" aria-label="Jump to a dimension">
          {keys.map((k) => (
            <button
              key={k}
              type="button"
              className="radar-axis-btn"
              onClick={() => onSelectDimension(k)}
              style={onDark ? { color: "var(--on-dark-2)" } : undefined}
            >
              {DIMENSION_LABELS[k]}
              {typeof dimensions[k] === "number" ? ` · ${Math.round(dimensions[k]!)}` : ""}
            </button>
          ))}
        </div>
      ) : null}

      {/* Text alternative for screen readers / non-visual access. */}
      <ul className="sr-only">
        {keys.map((k) => (
          <li key={k}>
            {DIMENSION_LABELS[k]}:{" "}
            {typeof dimensions[k] === "number" ? `${Math.round(dimensions[k]!)} out of 100` : "not yet available"}
          </li>
        ))}
      </ul>
    </div>
  );
}
