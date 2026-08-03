"use client";

import { useState } from "react";
import { DIMENSION_LABELS } from "@/lib/evaluation/copy";
import type { RevisionPriority } from "@/lib/evaluation/types";
import { trackEvaluationEvent } from "@/lib/analytics";
import Icon from "../Icon";

function PriorityCard({
  priority,
  defaultOpen,
  evaluationId,
}: {
  priority: RevisionPriority;
  defaultOpen: boolean;
  evaluationId: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const label = DIMENSION_LABELS[priority.category as keyof typeof DIMENSION_LABELS] ?? priority.category;

  return (
    <div className="card priority-card">
      <button
        type="button"
        className="priority-card-head"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) trackEvaluationEvent("revision_priority_opened", { evaluationId, priorityRank: priority.rank });
        }}
        aria-expanded={open}
      >
        <span className="priority-num">{priority.rank}</span>
        <span className="stack g1" style={{ flex: 1, textAlign: "left" }}>
          <span className="tiny">{label}</span>
          <span className="h3">{priority.diagnosis}</span>
        </span>
        <Icon name="chevron" size={16} style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .2s var(--ease)" }} />
      </button>

      {open ? (
        <div className="priority-card-body stack g3">
          <blockquote className="dimension-excerpt">&ldquo;{priority.excerpt}&rdquo;</blockquote>
          <p className="copy">{priority.whyItMatters}</p>
          <div className="note-fix">
            <b>Revision direction</b>
            {priority.direction}
          </div>
          <div className="note-fix">
            <b>A guiding question</b>
            {priority.question}
          </div>
          <div className="well" style={{ background: "var(--gold-50)", borderColor: "var(--gold-100)" }}>
            <span className="label">Success test</span>
            <p className="copy" style={{ marginTop: 6 }}>{priority.successTest}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Exactly three, ordered by impact. The top one opens by default; the
 *  other two stay collapsed so the page doesn't read like a punch list. */
export function RevisionPriorityCards({
  priorities,
  evaluationId,
}: {
  priorities: RevisionPriority[];
  evaluationId: string;
}) {
  if (priorities.length === 0) return null;
  return (
    <section className="stack g3" aria-labelledby="priorities-heading">
      <h2 id="priorities-heading" className="h2">
        Your highest-impact revisions
      </h2>
      <div className="stack g3">
        {priorities.slice(0, 3).map((p) => (
          <PriorityCard key={p.rank} priority={p} defaultOpen={p.rank === 1} evaluationId={evaluationId} />
        ))}
      </div>
    </section>
  );
}
