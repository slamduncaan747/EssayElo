"use client";

import React from "react";
import type { Insight } from "@/lib/evaluation/types";

/** Splits a paragraph around any insight evidence it contains, wrapping
 *  each match in a soft highlight the reader can scan without it feeling
 *  like the essay was defaced. Never invents a highlight — evidence is
 *  matched by exact substring only. */
function renderParagraph(text: string, insights: Insight[], scanning: boolean) {
  const matches = insights
    .filter((i) => i.evidence && text.includes(i.evidence))
    .map((i) => ({ insight: i, index: text.indexOf(i.evidence!) }))
    .sort((a, b) => a.index - b.index);

  if (matches.length === 0 || scanning) {
    return <p>{text}</p>;
  }

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach(({ insight, index }, i) => {
    const evidence = insight.evidence!;
    if (index < cursor) return; // overlapping match — skip, keep the earlier one
    if (index > cursor) nodes.push(text.slice(cursor, index));
    nodes.push(
      <mark
        key={`${insight.id}-${i}`}
        id={`evidence-${insight.id}`}
        className={`essay-mark essay-mark-${insight.status}`}
        title={insight.title}
      >
        {evidence}
      </mark>
    );
    cursor = index + evidence.length;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <p>{nodes}</p>;
}

export function EssayAnalysisPane({
  content,
  insights,
  scanning,
}: {
  content: string;
  insights: Insight[];
  /** True during the earliest "reading" phase, before any evidence exists
   *  — shows a gentle scanning treatment instead of highlights. */
  scanning: boolean;
}) {
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className={`sheet scan-wrap ${scanning ? "" : ""}`}>
      {scanning ? <div className="scan-line" /> : null}
      <div className="essay-text">
        {paragraphs.map((p, i) => (
          <React.Fragment key={i}>{renderParagraph(p, insights, scanning)}</React.Fragment>
        ))}
      </div>
    </div>
  );
}
