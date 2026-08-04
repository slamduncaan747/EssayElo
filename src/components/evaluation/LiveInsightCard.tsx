"use client";

import { DIMENSION_LABELS } from "@/lib/evaluation/copy";
import type { Insight } from "@/lib/evaluation/types";
import Icon from "../Icon";

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
      className="insight-card fade-up"
      onClick={() => insight.evidence && scrollToEvidence(insight.id)}
      disabled={!insight.evidence}
    >
      <div className="insight-card-head">
        <span className="insight-mark">
          <Icon name="spark" size={13} />
        </span>
        <span>{insight.title}</span>
      </div>
      <p className="insight-card-body">{insight.text}</p>
      <span className="insight-card-foot">
        {label}
        {insight.evidence ? (
          <span className="insight-card-jump">
            Jump to line
            <Icon name="arrowRight" size={12} />
          </span>
        ) : null}
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
