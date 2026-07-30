"use client";

import Link from "next/link";
import { useState } from "react";
import type { EvaluationView } from "@/lib/types";
import { tierForBand, tierForScore } from "@/lib/tier";
import InfoPopover from "./InfoPopover";
import Icon from "./Icon";
import { DimensionRadar, NextRank, Rank, ScoreRing } from "./Score";

export default function ReviewView({
  title,
  version,
  content,
  view,
  plan,
}: {
  title: string;
  version: number;
  content: string;
  view: EvaluationView;
  plan: "free" | "plus";
}) {
  const isPlus = plan === "plus";
  const band = view.band;
  const mid = band ? (band.low + band.high) / 2 : 0;
  const tier =
    isPlus && view.exact != null
      ? tierForScore(view.exact)
      : band
        ? tierForBand(band.low, band.high)
        : null;
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());
  const coaching = view.coaching;
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="workspace">
      <div className="doc">
        <div className="doc-bar">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
        </div>
        <div className="essay-body">
          <div className="sheet">
            <div className="essay-text">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body on-dark-scroll">
          <div className="spread">
            <span className="label">Essay review</span>
            <span className="row g3">
              <span className="chip chip-onDark">{isPlus ? "Plus" : "Free"}</span>
              {!isPlus ? <InfoPopover /> : null}
            </span>
          </div>

          <div className="stack g4 pop-in" style={{ alignItems: "center" }}>
            <ScoreRing
              value={isPlus ? (view.exact ?? 0) : mid}
              display={
                isPlus ? (view.exact?.toFixed(1) ?? "—") : band ? `${band.low}–${band.high}` : "—"
              }
              label="out of 100"
              size={150}
              onDark
            />
            {tier ? <Rank tier={tier} size="lg" onDark /> : null}
            {isPlus ? <NextRank score={view.exact ?? 0} onDark /> : null}
          </div>

          <div className="tiles">
            <div className="tile">
              <span className="label">Wins</span>
              <b style={{ color: "var(--green-ink)" }}>{view.wins}</b>
            </div>
            <div className="tile">
              <span className="label">Losses</span>
              <b style={{ color: "var(--red-ink)" }}>{view.losses}</b>
            </div>
            <div className="tile">
              <span className="label">Ties</span>
              <b>{view.ties}</b>
            </div>
          </div>

          {view.dimensions ? (
            <div className="stack g3" style={{ alignItems: "center" }}>
              <span className="label">Dimension profile</span>
              <DimensionRadar dimensions={view.dimensions} size={200} onDark />
            </div>
          ) : null}

          {view.recurring_strengths.length || view.recurring_weaknesses.length ? (
            <div className="stack g2">
              {view.recurring_strengths.map((s, i) => (
                <div key={`s${i}`} className="tally">
                  <span className="tally-mark" style={{ background: "var(--green)", color: "#fff" }}>
                    <Icon name="check" size={13} strokeWidth={2.8} />
                  </span>
                  <span>{s.summary}</span>
                  <b style={{ color: "var(--green-ink)" }}>×{s.frequency}</b>
                </div>
              ))}
              {view.recurring_weaknesses.map((w, i) => (
                <div key={`w${i}`} className="tally">
                  <span className="tally-mark" style={{ background: "var(--red)", color: "#fff" }}>
                    <Icon name="flag" size={13} strokeWidth={2.8} />
                  </span>
                  <span>{w.summary}</span>
                  <b style={{ color: "var(--red-ink)" }}>×{w.frequency}</b>
                </div>
              ))}
            </div>
          ) : null}

          {isPlus && coaching ? (
            <>
              <div className="verdict">
                <span className="label">Reader impression</span>
                <p>{coaching.reader_impression.learns}</p>
                <p className="small">Likely to remember: {coaching.reader_impression.remembers}</p>
                <p className="small">Remains unclear: {coaching.reader_impression.unclear}</p>
              </div>

              {coaching.strengths.length > 0 ? (
                <div className="stack g3">
                  <span className="label">Comparative strengths</span>
                  {coaching.strengths.map((s, i) => (
                    <div key={i} className="note-fix">
                      <b style={{ textTransform: "capitalize" }}>{s.dimension}</b>
                      {s.evidence}
                    </div>
                  ))}
                </div>
              ) : null}

              {coaching.weaknesses.length > 0 ? (
                <div className="stack g3">
                  <span className="label">Comparative weaknesses</span>
                  {coaching.weaknesses.map((w, i) => (
                    <div key={i} className="note-fix">
                      <b style={{ textTransform: "capitalize" }}>{w.dimension}</b>
                      {w.evidence}
                      <span className="tiny" style={{ display: "block", marginTop: 4 }}>
                        {w.why_it_matters}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {coaching.revision_questions.length > 0 ? (
                <div className="stack g2">
                  <span className="label">Revision questions</span>
                  {coaching.revision_questions.map((q, i) => (
                    <span key={i} className="copy">
                      {i + 1}. {q}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="note-fix">
                <b>Next-draft objective</b>
                {coaching.next_objective}
              </div>
            </>
          ) : null}
        </div>

        <div className="panel-foot panel-foot-stack">
          {!isPlus ? (
            <Link href="/upgrade" className="btn btn-gold btn-block">
              <Icon name="lock" size={16} />
              Unlock the full review
            </Link>
          ) : null}
          <button className="btn btn-onDark btn-block" onClick={share}>
            <Icon name={copied ? "check" : "share"} size={16} />
            {copied ? "Copied!" : "Share score"}
          </button>
        </div>
      </div>
    </div>
  );
}
