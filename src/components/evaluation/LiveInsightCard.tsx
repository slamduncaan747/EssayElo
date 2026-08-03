"use client";

import { DIMENSION_LABELS } from "@/lib/evaluation/copy";
import type { Insight } from "@/lib/evaluation/types";

function scrollToEvidence(insightId: string) {
  const el = document.getElementById(`evidence-${insightId}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** One insight, discovered mid-analysis. Concise by design: a title and one
 *  sentence, never raw model reasoning. */
export function LiveInsightCard({ insight }: { insight: Insight }) {
  const label = DIMENSION_LABELS[insight.category as keyof typeof DIMENSION_LABELS] ?? insight.category;
  return (
    <button
      type="button"
      className="note-card fade-up"
      style={{ textAlign: "left", width: "100%" }}
      onClick={() => insight.evidence && scrollToEvidence(insight.id)}
      disabled={!insight.evidence}
    >
      <div className="note-head">
        <span className="tally-mark" style={{ background: "var(--brand-50)", color: "var(--brand)" }}>
          ✦
        </span>
        {insight.title}
      </div>
      <p className="note-body">{insight.text}</p>
      <span className="tiny" style={{ color: "var(--gold-hi)" }}>
        {label}
      </span>
    </button>
  );
}

export function LiveInsightFeed({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return <p className="tiny">No confirmed observations yet — Margin is still reading closely.</p>;
  }
  return (
    <div className="stack g3">
      {insights
        .slice(-4)
        .reverse()
        .map((i) => (
          <LiveInsightCard key={i.id} insight={i} />
        ))}
    </div>
  );
}
