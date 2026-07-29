"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

const STEPS = [
  { phase: "placement", label: "Read & place the essay" },
  { phase: "match", label: "Head-to-head matchups" },
  { phase: "prose", label: "Prose & structure" },
  { phase: "synthesis", label: "Assemble the review" },
] as const;

const HEADLINE: Record<string, string> = {
  placement: "Reading your essay",
  match: "Running matchups",
  prose: "Measuring prose",
  synthesis: "Writing your review",
};

const STEP_MS = 420;

/**
 * The "evaluating" moment: a scanning essay and a live checklist. Purely
 * cosmetic — steps through the same phases the real engine will report
 * through, on a fixed timer, then hands off to the caller.
 */
export default function EvaluatingView({
  title,
  version,
  content,
  onDone,
}: {
  title: string;
  version: number;
  content: string;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= STEPS.length) {
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, onDone]);

  const headline = HEADLINE[STEPS[Math.min(step, STEPS.length - 1)].phase];
  const pct = Math.min(100, (step / STEPS.length) * 100);
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className="workspace">
      <div className="doc">
        <div className="doc-bar">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
          <span className="live">
            <span className="pulse-dot" />
            Evaluating
          </span>
        </div>
        <div className="essay-body">
          <div className="sheet scan-wrap">
            <div className="scan-line" />
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
          <div className="stack g2">
            <span className="label">Evaluation</span>
            <span className="h2" style={{ color: "var(--on-dark)" }}>
              {headline}
            </span>
          </div>

          <div className="mini-page">
            <div className="read-band" />
            {[92, 100, 96, 58, 0, 98, 90, 44, 0, 95, 72, 0, 97, 62].map((w, i) =>
              w === 0 ? (
                <div key={i} style={{ height: 10 }} />
              ) : (
                <div key={i} className="line" style={{ width: `${w}%` }} />
              )
            )}
          </div>

          <div className="steps">
            {STEPS.map((s, i) => (
              <div
                key={s.phase}
                className={`step ${step > i ? "done" : ""} ${step === i ? "now" : ""}`}
              >
                <span className="step-mark">
                  {step > i ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                </span>
                {s.label}
              </div>
            ))}
          </div>

          <div className="stack g3">
            <div className="meter meter-sm meter-dark">
              <div
                className="meter-fill"
                style={{ left: 0, width: `${pct}%`, background: "var(--gold)" }}
              />
            </div>
            <span
              className="tiny center"
              style={{ color: "var(--on-dark-3)", display: "block" }}
            >
              Just a moment…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
