"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EvaluationView, MarkKind } from "@/lib/types";
import MarkedEssay from "./MarkedEssay";
import InfoPopover from "./InfoPopover";

const KIND_META: Record<MarkKind, { label: string; bg: string; fg: string; sym: string }> = {
  standout: { label: "Standout", bg: "var(--gold)", fg: "var(--ink)", sym: "!" },
  solid: { label: "Solid", bg: "var(--green)", fg: "#fff", sym: "✓" },
  weak: { label: "Weak", bg: "var(--gold-weak)", fg: "var(--ink)", sym: "?" },
  cliche: { label: "Cliché", bg: "var(--red)", fg: "#fff", sym: "✗" },
};

function markTitle(kind: MarkKind, note: string): string {
  const meta = KIND_META[kind];
  const first = note.split(/[.—:]/)[0]?.trim();
  return first ? `${meta.label} — ${first}` : meta.label;
}

export default function ReviewView({
  essayId,
  title,
  version,
  content,
  view,
  plan,
}: {
  essayId: string;
  title: string;
  version: number;
  content: string;
  view: EvaluationView;
  plan: "free" | "plus";
}) {
  const isPlus = plan === "plus";
  const marks = useMemo(() => view.marks ?? [], [view.marks]);
  const [active, setActive] = useState<number | null>(
    isPlus && marks.length ? marks.findIndex((m) => m.kind === "cliche" || m.kind === "weak") : null
  );
  const [copied, setCopied] = useState(false);

  const activeIdx = active != null && active >= 0 ? active : isPlus && marks.length ? 0 : null;
  const counts = view.counts;
  const band = view.band;

  async function share() {
    const scoreText = isPlus && view.exact != null ? view.exact.toFixed(1) : band ? `${band.low}–${band.high}` : "";
    try {
      await navigator.clipboard.writeText(
        `My college essay scored ${scoreText}/100 on Margin — deliberately stringent, the way admissions actually reads. ${location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function step(delta: number) {
    if (!marks.length) return;
    const cur = activeIdx ?? 0;
    setActive((cur + delta + marks.length) % marks.length);
  }

  return (
    <div className="workspace">
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="doc-header">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
          <div className="tabs">
            <span className="active">Review</span>
            <Link href={`/essays/${essayId}/edit`}>Edit</Link>
            {isPlus ? (
              <Link href={`/essays/${essayId}/analysis`}>Analysis</Link>
            ) : (
              <Link href={`/essays/${essayId}/history`}>History</Link>
            )}
          </div>
        </div>

        <div className="essay-body">
          <MarkedEssay
            content={content}
            marks={marks}
            numbered={isPlus}
            activeIdx={isPlus ? activeIdx : null}
            onMarkClick={isPlus ? (i) => setActive(i) : undefined}
          />
        </div>

        <div className="doc-footer">
          {counts ? (
            <>
              <span>{counts.standout} standout</span>
              {isPlus ? <span>{counts.solid} solid</span> : null}
              <span>{counts.weak} weak</span>
              <span>{counts.cliche} cliché</span>
            </>
          ) : null}
          <span style={{ marginLeft: "auto", color: "var(--faint)" }}>
            {isPlus
              ? activeIdx != null
                ? `note ${activeIdx + 1} highlighted`
                : "tap a mark to inspect it"
              : "Tap a mark to see why — Premium"}
          </span>
        </div>
      </div>

      {/* ---------- right panel ---------- */}
      <div className="panel-dark">
        {isPlus ? (
          /* Premium (design 10a): exact score, tiles, note stepper. */
          <>
            <div
              style={{
                padding: "20px 22px 16px",
                borderBottom: "1px solid rgba(245,241,233,.1)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="score-exact">{view.exact?.toFixed(1)}</span>
                <span style={{ font: "400 10.5px var(--mono)", color: "rgba(245,241,233,.4)" }}>
                  draft {version} ·{" "}
                  {view.completed_at
                    ? new Date(view.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : ""}
                </span>
              </div>
              <div className="tile-grid">
                <div className="tile">
                  <span className="mono-label">PROSE</span>
                  <b className="gold">{view.prose_score != null ? Number(view.prose_score).toFixed(1) : "—"}</b>
                </div>
                <div className="tile">
                  <span className="mono-label">STRUCTURE</span>
                  <b>{view.structure_score != null ? Number(view.structure_score).toFixed(1) : "—"}</b>
                </div>
                <div className="tile">
                  <span className="mono-label">ARC</span>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18 }}>
                    {(view.arc ?? []).map((v, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: `${Math.max(v, 6)}%`,
                          borderRadius: 2,
                          background: v < 40 ? "var(--red)" : v < 65 ? "rgba(201,162,90,.7)" : "var(--gold)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {view.prose_tag && view.prose_tag !== "aligned" ? (
                <span style={{ font: "400 11.5px/1.5 var(--sans)", color: "rgba(245,241,233,.6)" }}>
                  {view.prose_tag === "carrying"
                    ? "Prose is carrying it — this reads better than it substantively is. Fragile against a reader who sees through polish."
                    : "Substance ahead of prose — rare material, undersold telling. Craft revision has real upside here."}
                </span>
              ) : null}
              {view.direction_flag ? (
                <span style={{ font: "400 11.5px/1.5 var(--sans)", color: "#e2a191" }}>
                  ⚑ {view.direction_flag}
                </span>
              ) : null}
            </div>

            <div className="panel-pad" style={{ gap: 8, paddingTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono-label" style={{ letterSpacing: ".12em" }}>
                  NOTES · {activeIdx != null ? activeIdx + 1 : 1} OF {marks.length}
                </span>
                <div className="progress-mini">
                  <div
                    style={{
                      width: `${marks.length ? (((activeIdx ?? 0) + 1) / marks.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {marks.map((m, i) => {
                const meta = KIND_META[m.kind];
                if (i === activeIdx) {
                  return (
                    <div key={i} className="note-expanded">
                      <div className="note-head">
                        <span className="note-badge" style={{ background: meta.bg, color: meta.fg }}>
                          {i + 1}
                        </span>
                        <span>{markTitle(m.kind, m.note)}</span>
                      </div>
                      <span className="note-body">{m.note}</span>
                      {m.fix ? (
                        <div className="note-fix">
                          <b>FIX</b>
                          {m.fix}
                        </div>
                      ) : null}
                      <div className="note-foot">
                        <span>
                          {m.impact ? (
                            <>
                              Impact <b>{m.impact}</b>
                            </>
                          ) : (
                            <span style={{ color: "rgba(245,241,233,.35)" }}>{meta.label}</span>
                          )}
                        </span>
                        <Link href={`/essays/${essayId}/edit`}>Fix in editor</Link>
                      </div>
                    </div>
                  );
                }
                return (
                  <button key={i} className="note-row" onClick={() => setActive(i)}>
                    <span className="note-badge" style={{ background: meta.bg, color: meta.fg, opacity: 0.85 }}>
                      {i + 1}
                    </span>
                    <span>{markTitle(m.kind, m.note)}</span>
                  </button>
                );
              })}
            </div>

            <div className="stepper-bar">
              <button className="stepper-prev" onClick={() => step(-1)}>
                ←
              </button>
              <button className="stepper-next" onClick={() => step(1)}>
                Next note →
              </button>
            </div>
          </>
        ) : (
          /* Free reveal (design 11e): band, arc, counts, locked notes. */
          <div className="panel-pad" style={{ padding: 24, gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono-label" style={{ letterSpacing: ".14em" }}>ESSAY REVIEW</span>
              <span className="pill-free">Free</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "4px 0" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, position: "relative" }}>
                <span className="score-band">
                  {band ? `${band.low}–${band.high}` : "—"}
                </span>
                <InfoPopover />
              </div>
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5 }}>
                <div className="track">
                  {band ? (
                    <div
                      className="track-fill"
                      style={{ left: `${band.low}%`, width: `${Math.max(band.high - band.low, 2)}%` }}
                    />
                  ) : null}
                </div>
                <div className="track-scale">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>
              <span style={{ font: "400 11.5px var(--sans)", color: "rgba(245,241,233,.5)" }}>
                Premium scales in to the exact score
              </span>
              {view.readers_split ? (
                <span style={{ font: "400 11px var(--sans)", color: "rgba(245,241,233,.45)" }}>
                  Readers split on this essay — the band reflects it.
                </span>
              ) : null}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="mono-label" style={{ letterSpacing: ".1em" }}>ESSAY ARC</span>
                <span className="mono-label" style={{ letterSpacing: 0, textTransform: "none" }}>
                  by paragraph
                </span>
              </div>
              <div className="arc-bars">
                {(view.arc ?? []).map((v, i) => (
                  <div
                    key={i}
                    className="arc-bar"
                    style={{
                      height: `${Math.max(v, 6)}%`,
                      background: v < 40 ? "var(--red)" : v < 65 ? "rgba(201,162,90,.75)" : "var(--gold)",
                    }}
                  />
                ))}
              </div>
              <div className="arc-labels">
                {(view.arc ?? []).map((_, i) => (
                  <span key={i}>¶{i + 1}</span>
                ))}
              </div>
            </div>

            {counts ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {(Object.keys(KIND_META) as MarkKind[]).map((k) => {
                  const meta = KIND_META[k];
                  return (
                    <div key={k} className="count-row">
                      <span className="count-dot" style={{ background: meta.bg, color: meta.fg }}>
                        {meta.sym}
                      </span>
                      <span>{meta.label}</span>
                      <span className="count-val" style={k === "standout" ? { color: "var(--gold)" } : undefined}>
                        {counts[k]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href="/upgrade" className="btn btn-gold" style={{ width: "100%", padding: "13px 0" }}>
                Start Full Review
              </Link>
              <button className="btn btn-outline-light" style={{ width: "100%", padding: "10px 0" }} onClick={share}>
                {copied ? "Copied!" : "Share score"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
