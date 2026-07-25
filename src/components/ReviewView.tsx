"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EvaluationView, MarkKind } from "@/lib/types";
import { tierForBand, tierForScore } from "@/lib/tier";
import MarkedEssay from "./MarkedEssay";
import InfoPopover from "./InfoPopover";
import Icon, { type IconName } from "./Icon";
import { ScoreMeter, ScoreRing, TierBadge, TierProgress } from "./Score";

const KIND_META: Record<
  MarkKind,
  { label: string; bg: string; fg: string; icon: IconName }
> = {
  standout: { label: "Standout", bg: "var(--gold)", fg: "var(--ink)", icon: "star" },
  solid: { label: "Solid", bg: "var(--green)", fg: "#fff", icon: "check" },
  weak: { label: "Weak", bg: "var(--gold-press)", fg: "#fff", icon: "flag" },
  cliche: { label: "Cliché", bg: "var(--red)", fg: "#fff", icon: "cross" },
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
    isPlus && marks.length
      ? marks.findIndex((m) => m.kind === "cliche" || m.kind === "weak")
      : null
  );
  const [copied, setCopied] = useState(false);

  const activeIdx = active != null && active >= 0 ? active : isPlus && marks.length ? 0 : null;
  const counts = view.counts;
  const band = view.band;
  const midpoint = band ? (band.low + band.high) / 2 : 0;
  const tier = isPlus && view.exact != null ? tierForScore(view.exact) : band ? tierForBand(band.low, band.high) : null;

  async function share() {
    const scoreText =
      isPlus && view.exact != null
        ? view.exact.toFixed(1)
        : band
          ? `${band.low}–${band.high}`
          : "";
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
      <div className="doc">
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
          <div className="essay-sheet">
            <MarkedEssay
              content={content}
              marks={marks}
              numbered={isPlus}
              activeIdx={isPlus ? activeIdx : null}
              onMarkClick={isPlus ? (i) => setActive(i) : undefined}
            />
          </div>
        </div>

        <div className="doc-footer">
          {counts ? (
            <>
              <span className="chip chip-gold">{counts.standout} standout</span>
              {isPlus ? <span className="chip chip-green">{counts.solid} solid</span> : null}
              <span className="chip">{counts.weak} weak</span>
              <span className="chip chip-red">{counts.cliche} cliché</span>
            </>
          ) : null}
          <span style={{ marginLeft: "auto", color: "var(--faint)" }}>
            {isPlus
              ? activeIdx != null
                ? `Note ${activeIdx + 1} highlighted`
                : "Tap a mark to inspect it"
              : "Tap a mark to see why — Plus"}
          </span>
        </div>
      </div>

      {/* ---------- right panel ---------- */}
      <div className="panel">
        {isPlus ? (
          /* Plus: exact score, channel tiles, note walkthrough. */
          <>
            <div className="panel-head">
              <div className="spread">
                <span className="label">Your score</span>
                <span className="chip chip-onDark">
                  Draft {version}
                  {view.completed_at
                    ? ` · ${new Date(view.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}`
                    : ""}
                </span>
              </div>

              <div
                className="pop-in"
                style={{ display: "flex", alignItems: "center", gap: 18 }}
              >
                <ScoreRing
                  value={view.exact ?? 0}
                  display={view.exact?.toFixed(1) ?? "—"}
                  size={124}
                  onDark
                />
                <div className="stack" style={{ gap: 9, flex: 1, minWidth: 0 }}>
                  {tier ? <TierBadge tier={tier} /> : null}
                  <TierProgress score={view.exact ?? 0} onDark />
                </div>
              </div>

              <div className="tile-grid">
                <div className="tile">
                  <span className="label">Prose</span>
                  <b style={{ color: "var(--gold)" }}>
                    {view.prose_score != null ? Number(view.prose_score).toFixed(1) : "—"}
                  </b>
                </div>
                <div className="tile">
                  <span className="label">Structure</span>
                  <b>
                    {view.structure_score != null
                      ? Number(view.structure_score).toFixed(1)
                      : "—"}
                  </b>
                </div>
                <div className="tile">
                  <span className="label">Arc</span>
                  <div className="bars" style={{ height: 22, gap: 3 }}>
                    {(view.arc ?? []).map((v, i) => (
                      <div
                        key={i}
                        className="bar"
                        style={{
                          height: `${Math.max(v, 8)}%`,
                          background: tierForScore(v).color,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {view.prose_tag && view.prose_tag !== "aligned" ? (
                <div className="note-fix">
                  <b>Reliance check</b>
                  {view.prose_tag === "carrying"
                    ? "Prose is carrying it — this reads better than it substantively is. Fragile against a reader who sees through polish."
                    : "Substance ahead of prose — rare material, undersold telling. Craft revision has real upside here."}
                </div>
              ) : null}

              {view.direction_flag ? (
                <span
                  style={{
                    display: "flex",
                    gap: 8,
                    font: "700 12px/1.5 var(--sans)",
                    color: "#e9a893",
                  }}
                >
                  <Icon name="flag" size={15} />
                  {view.direction_flag}
                </span>
              ) : null}
            </div>

            <div className="panel-body" style={{ gap: 9 }}>
              <div className="spread">
                <span className="label">
                  Notes · {activeIdx != null ? activeIdx + 1 : 1} of {marks.length}
                </span>
                <div className="meter meter-dark meter-sm" style={{ width: 92 }}>
                  <div
                    className="meter-fill"
                    style={{
                      left: 0,
                      width: `${marks.length ? (((activeIdx ?? 0) + 1) / marks.length) * 100 : 0}%`,
                      background: "var(--gold)",
                    }}
                  />
                </div>
              </div>

              {marks.map((m, i) => {
                const meta = KIND_META[m.kind];
                if (i === activeIdx) {
                  return (
                    <div key={i} className="note-card pop-in">
                      <div className="note-head">
                        <span
                          className="note-badge"
                          style={{ background: meta.bg, color: meta.fg }}
                        >
                          {i + 1}
                        </span>
                        <span>{markTitle(m.kind, m.note)}</span>
                      </div>
                      <span className="note-body">{m.note}</span>
                      {m.fix ? (
                        <div className="note-fix">
                          <b>Try this</b>
                          {m.fix}
                        </div>
                      ) : null}
                      <div className="note-foot">
                        <span>
                          {m.impact ? (
                            <>
                              Worth <b>{m.impact}</b>
                            </>
                          ) : (
                            meta.label
                          )}
                        </span>
                        <Link href={`/essays/${essayId}/edit`}>Fix in editor →</Link>
                      </div>
                    </div>
                  );
                }
                return (
                  <button key={i} className="note-row" onClick={() => setActive(i)}>
                    <span
                      className="note-badge"
                      style={{ background: meta.bg, color: meta.fg, opacity: 0.85 }}
                    >
                      {i + 1}
                    </span>
                    <span>{markTitle(m.kind, m.note)}</span>
                  </button>
                );
              })}
            </div>

            <div className="panel-foot">
              <button
                className="btn btn-onDark btn-sm"
                onClick={() => step(-1)}
                aria-label="Previous note"
                style={{ padding: "11px 14px" }}
              >
                ←
              </button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => step(1)}>
                Next note
                <Icon name="arrowRight" size={16} />
              </button>
            </div>
          </>
        ) : (
          /* Free: band, arc, mark counts, upgrade. */
          <>
          <div className="panel-body">
            <div className="spread">
              <span className="label">Essay review</span>
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span className="chip chip-onDark">Free</span>
                <InfoPopover />
              </span>
            </div>

            <div
              className="stack pop-in"
              style={{ alignItems: "center", gap: 14, padding: "4px 0" }}
            >
              <ScoreRing
                value={midpoint}
                display={band ? `${band.low}–${band.high}` : "—"}
                label="out of 100"
                size={158}
                onDark
              />
              {tier ? <TierBadge tier={tier} onDark /> : null}
              {band ? (
                <ScoreMeter low={band.low} high={band.high} color={tier!.color} onDark />
              ) : null}
              <span className="tiny center" style={{ color: "var(--on-dark-3)" }}>
                {view.readers_split
                  ? "Readers split on this essay — the band reflects it."
                  : "Plus scales in to the exact score."}
              </span>
            </div>

            <div className="stack" style={{ gap: 8 }}>
              <div className="spread">
                <span className="label">Essay arc</span>
                <span className="tiny" style={{ color: "var(--on-dark-3)" }}>
                  by paragraph
                </span>
              </div>
              <div className="bars bars-dark" style={{ height: 66 }}>
                {(view.arc ?? []).map((v, i) => (
                  <div
                    key={i}
                    className="bar"
                    title={`¶${i + 1}`}
                    style={{ height: `${Math.max(v, 8)}%`, background: tierForScore(v).color }}
                  />
                ))}
              </div>
              <div className="bar-labels">
                {(view.arc ?? []).map((_, i) => (
                  <span key={i}>¶{i + 1}</span>
                ))}
              </div>
            </div>

            {counts ? (
              <div className="stack">
                {(Object.keys(KIND_META) as MarkKind[]).map((k) => {
                  const meta = KIND_META[k];
                  return (
                    <div key={k} className="count-row">
                      <span
                        className="count-dot"
                        style={{ background: meta.bg, color: meta.fg }}
                      >
                        <Icon name={meta.icon} size={12} strokeWidth={2.8} />
                      </span>
                      <span>{meta.label}</span>
                      <span
                        className="count-val"
                        style={k === "standout" ? { color: "var(--gold)" } : undefined}
                      >
                        {counts[k]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}

          </div>

          <div className="panel-foot panel-foot-stack">
            <Link href="/upgrade" className="btn btn-gold btn-block">
              <Icon name="lock" size={16} />
              Unlock the full review
            </Link>
            <button className="btn btn-onDark btn-block" onClick={share}>
              <Icon name={copied ? "check" : "share"} size={16} />
              {copied ? "Copied!" : "Share score"}
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
