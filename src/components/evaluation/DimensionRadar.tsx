"use client";

import { DIMENSION_KEYS, type DimensionKey, type DimensionScores } from "@/lib/evaluation/types";
import { DIMENSION_LABELS, DIMENSION_SHORT_LABELS } from "@/lib/evaluation/copy";

/**
 * The seven-axis dimension chart. Shared by the live analytics rail and the
 * post-evaluation dimension explorer — the geometry and accessibility
 * story stay identical, only `mode` and the data change.
 *
 * Before any dimension has a value, only the grid and the 50-point
 * benchmark ring render: drawing a neutral polygon at that point would
 * read as a real (if middling) score, which it isn't.
 *
 * Layout note: the plot radius is deliberately a small fraction of the
 * viewBox so axis labels have room to sit *outside* the web at their
 * natural length. Labels are anchored by quadrant rather than always
 * centered, which is what keeps "Distinctiveness" from colliding with the
 * chart or getting clipped at the edge.
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

  // Fixed internal coordinate space; the SVG scales to `size`.
  const VB = 240;
  const cx = VB / 2;
  const cy = VB / 2;
  const r = 74; // plot radius — the rest of the box is label gutter
  const labelR = r + 26;

  const gridColor = onDark ? "rgba(250,246,238,.15)" : "var(--line)";
  const textColor = onDark ? "var(--on-dark-2)" : "var(--text-3)";
  const pulseSet = new Set(pulsingKeys);

  const present = keys.filter((k) => typeof dimensions[k] === "number");
  const coverage = present.length / n;
  const polygonOpacity = opacity ?? (present.length === 0 ? 0 : 0.3 + coverage * 0.3);

  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, frac: number): [number, number] => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * frac, cy + Math.sin(a) * r * frac];
  };

  const dataPoints = keys.map((k, i) => {
    const v = dimensions[k];
    const frac = typeof v === "number" ? Math.max(0.05, v / 100) : 0.02;
    return point(i, frac);
  });

  return (
    <div className="radar">
      <svg viewBox={`0 0 ${VB} ${VB}`} width={size} height={size} role="img" aria-hidden="true">
        {[0.25, 0.5, 0.75, 1].map((lvl) => (
          <polygon
            key={lvl}
            points={keys.map((_, i) => point(i, lvl).join(",")).join(" ")}
            fill="none"
            stroke={gridColor}
            strokeWidth={1}
          />
        ))}

        {keys.map((_, i) => {
          const [x, y] = point(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={gridColor} strokeWidth={1} />;
        })}

        {/* 50-point benchmark ring — the reference field's typical reading. */}
        <polygon
          points={keys.map((_, i) => point(i, 0.5).join(",")).join(" ")}
          fill="none"
          stroke={onDark ? "rgba(234,167,44,.45)" : "var(--gold-press)"}
          strokeWidth={1.25}
          strokeDasharray="3 3"
        />

        {present.length > 0 ? (
          <polygon
            points={dataPoints.map((p) => p.join(",")).join(" ")}
            fill="var(--brand)"
            fillOpacity={polygonOpacity * 0.55}
            stroke="var(--brand)"
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ transition: "all .7s var(--ease)" }}
          />
        ) : null}

        {present.length > 0 &&
          keys.map((k, i) => {
            if (typeof dimensions[k] !== "number") return null;
            const [x, y] = dataPoints[i];
            const pulsing = pulseSet.has(k);
            return (
              <circle
                key={k}
                cx={x}
                cy={y}
                r={pulsing ? 4.5 : 2.75}
                fill="var(--brand)"
                stroke={onDark ? "var(--dark)" : "var(--surface)"}
                strokeWidth={1.5}
                style={{ transition: "all .7s var(--ease)" }}
                className={pulsing ? "radar-point-pulse" : undefined}
              />
            );
          })}

        {keys.map((k, i) => {
          const a = angle(i);
          const lx = cx + Math.cos(a) * labelR;
          const ly = cy + Math.sin(a) * labelR;
          const cos = Math.cos(a);
          // Anchor by quadrant so side labels grow away from the chart
          // instead of overlapping it or clipping at the viewBox edge.
          const anchor = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
          const value = dimensions[k];
          const interactive = !!onSelectDimension;

          return (
            <g
              key={k}
              className={interactive ? "radar-label radar-label-tap" : "radar-label"}
              onClick={interactive ? () => onSelectDimension!(k) : undefined}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectDimension!(k);
                      }
                    }
                  : undefined
              }
            >
              <text
                x={lx}
                y={typeof value === "number" ? ly - 5 : ly}
                fontSize={11}
                fontWeight={800}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill={textColor}
              >
                {DIMENSION_SHORT_LABELS[k]}
              </text>
              {typeof value === "number" ? (
                <text
                  x={lx}
                  y={ly + 8}
                  fontSize={12}
                  fontWeight={900}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={onDark ? "var(--on-dark)" : "var(--text)"}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {Math.round(value)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Text alternative for screen readers / non-visual access. */}
      <ul className="sr-only">
        {keys.map((k) => (
          <li key={k}>
            {DIMENSION_LABELS[k]}:{" "}
            {typeof dimensions[k] === "number"
              ? `${Math.round(dimensions[k]!)} out of 100`
              : "not yet available"}
          </li>
        ))}
      </ul>
    </div>
  );
}
