"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EvaluationView, MarkKind } from "@/lib/types";
import { tierForBand, tierForScore } from "@/lib/tier";
import MarkedEssay from "./MarkedEssay";
import InfoPopover from "./InfoPopover";
import Icon, { type IconName } from "./Icon";
import { NextRank, Rank, ScoreMeter, ScoreRing } from "./Score";

const KIND: Record<MarkKind, { label: string; bg: string; fg: string; icon: IconName }> = {
  standout: { label: "Standout", bg: "var(--gold)", fg: "var(--n-900)", icon: "star" },
  solid: { label: "Solid", bg: "var(--green)", fg: "#fff", icon: "check" },
  weak: { label: "Weak", bg: "var(--gold-press)", fg: "#fff", icon: "flag" },
  cliche: { label: "Cliché", bg: "var(--red)", fg: "#fff", icon: "cross" },
};

function markTitle(kind: MarkKind, note: string): string {
  const first = note.split(/[.—:]/)[0]?.trim();
  return first ? `${KIND[kind].label} — ${first}` : KIND[kind].label;
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

  const idx = active != null && active >= 0 ? active : isPlus && marks.length ? 0 : null;
  const counts = view.counts;
  const band = view.band;
  const mid = band ? (band.low + band.high) / 2 : 0;
  const tier =
    isPlus && view.exact != null
      ? tierForScore(view.exact)
      : band
        ? tierForBand(band.low, band.high)
        : null;

  async function share() {
    const s =
      isPlus && view.exact != null
        ? view.exact.toFixed(1)
        : band
          ? `${band.low}–${band.high}`
          : "";
    try {
      await navigator.clipboard.writeText(
        `My college essay scored ${s}/100 on Margin — deliberately stringent, the way admissions actually reads. ${location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function step(delta: number) {
    if (!marks.length) return;
    setActive(((idx ?? 0) + delta + marks.length) % marks.length);
  }

  return (
    <div className="workspace">
      <div className="doc">
        <div className="doc-bar">
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
          <div className="sheet">
            <MarkedEssay
              content={content}
              marks={marks}
              numbered={isPlus}
              activeIdx={isPlus ? idx : null}
              onMarkClick={isPlus ? (i) => setActive(i) : undefined}
            />
          </div>
        </div>

        <div className="doc-foot">
          {counts ? (
            <>
              <span className="chip chip-gold">{counts.standout} standout</span>
              {isPlus ? <span className="chip chip-green">{counts.solid} solid</span> : null}
              <span className="chip">{counts.weak} weak</span>
              <span className="chip chip-red">{counts.cliche} cliché</span>
            </>
          ) : null}
          <span style={{ marginLeft: "auto", color: "var(--text-4)" }}>
            {isPlus
              ? idx != null
                ? `Note ${idx + 1} highlighted`
                : "Tap a mark to inspect it"
              : "Tap a mark to see why — Plus"}
          </span>
        </div>
      </div>

      {/* ---------------- panel ---------------- */}
      <div className="panel">
        {isPlus ? (
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

              <div className="row g5 pop-in">
                <ScoreRing
                  value={view.exact ?? 0}
                  display={view.exact?.toFixed(1) ?? "—"}
                  size={128}
                  onDark
                />
                <div className="stack g3 grow">
                  {tier ? <Rank tier={tier} /> : null}
                  <NextRank score={view.exact ?? 0} onDark />
                </div>
              </div>

              <div className="tiles">
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
                  <div className="bars" style={{ height: 19, gap: 3 }}>
                    {(view.arc ?? []).map((v, i) => (
                      <div
                        key={i}
                        className="bar"
                        style={{ height: `${Math.max(v, 10)}%`, background: tierForScore(v).color }}
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
                  className="row g2"
                  style={{ fontSize: 12.5, fontWeight: 700, color: "#eda893", lineHeight: 1.5 }}
                >
                  <Icon name="flag" size={15} />
                  {view.direction_flag}
                </span>
              ) : null}
            </div>

            <div className="panel-body on-dark-scroll" style={{ gap: "var(--s2)" }}>
              {view.verdict ? (
                <div className="verdict">
                  <span className="label">The read</span>
                  <p>{view.verdict}</p>
                </div>
              ) : null}

              {view.biggest_detractor ? (
                <div className="note-fix" style={{ marginBottom: "var(--s2)" }}>
                  <b>Costing you the most</b>
                  {view.biggest_detractor}
                </div>
              ) : null}

              <div className="spread" style={{ marginBottom: 2 }}>
                <span className="label">
                  Notes · {idx != null ? idx + 1 : 1} of {marks.length}
                </span>
                <div className="meter meter-sm meter-dark" style={{ width: 88 }}>
                  <div
                    className="meter-fill"
                    style={{
                      left: 0,
                      width: `${marks.length ? (((idx ?? 0) + 1) / marks.length) * 100 : 0}%`,
                      background: "var(--gold)",
                    }}
                  />
                </div>
              </div>

              {marks.map((m, i) => {
                const meta = KIND[m.kind];
                if (i === idx) {
                  return (
                    <div key={i} className="note-card pop-in">
                      <div className="note-head">
                        <span className="note-badge" style={{ background: meta.bg, color: meta.fg }}>
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
                      style={{ background: meta.bg, color: meta.fg, opacity: 0.8 }}
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
                className="btn btn-onDark btn-icon"
                onClick={() => step(-1)}
                aria-label="Previous note"
              >
                <Icon name="arrowRight" size={17} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button className="btn btn-gold grow" onClick={() => step(1)}>
                Next note
                <Icon name="arrowRight" size={17} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="panel-body on-dark-scroll">
              <div className="spread">
                <span className="label">Essay review</span>
                <span className="row g3">
                  <span className="chip chip-onDark">Free</span>
                  <InfoPopover />
                </span>
              </div>

              <div className="stack g4 pop-in" style={{ alignItems: "center" }}>
                <ScoreRing
                  value={mid}
                  display={band ? `${band.low}–${band.high}` : "—"}
                  label="out of 100"
                  size={166}
                  onDark
                />
                {tier ? <Rank tier={tier} size="lg" onDark /> : null}
                {band ? (
                  <ScoreMeter low={band.low} high={band.high} color={tier!.color} onDark />
                ) : null}
                <span className="tiny center" style={{ color: "var(--on-dark-3)" }}>
                  {view.readers_split
                    ? "Readers split on this essay — the band reflects it."
                    : "Plus scales in to the exact score."}
                </span>
              </div>

              <div className="stack g3">
                <div className="spread">
                  <span className="label">Essay arc</span>
                  <span className="tiny" style={{ color: "var(--on-dark-3)" }}>
                    by paragraph
                  </span>
                </div>
                <div className="bars bars-dark" style={{ height: 100 }}>
                  {(view.arc ?? []).map((v, i) => (
                    <div
                      key={i}
                      className="bar"
                      title={`¶${i + 1} · ${Math.round(v)}`}
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
                  {(Object.keys(KIND) as MarkKind[]).map((k) => {
                    const meta = KIND[k];
                    return (
                      <div key={k} className="tally">
                        <span className="tally-mark" style={{ background: meta.bg, color: meta.fg }}>
                          <Icon name={meta.icon} size={13} strokeWidth={2.8} />
                        </span>
                        <span>{meta.label}</span>
                        <b style={k === "standout" ? { color: "var(--gold)" } : undefined}>
                          {counts[k]}
                        </b>
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
