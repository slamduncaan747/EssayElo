"use client";

import Link from "next/link";
import { DIMENSION_LABELS, finalDimensionStatus } from "@/lib/evaluation/copy";
import type { DimensionDetail } from "@/lib/evaluation/types";
import Icon from "../Icon";

function statusColor(score: number): string {
  if (score >= 66) return "var(--green-ink)";
  if (score >= 45) return "var(--brand)";
  return "var(--gold-press)";
}

function DimensionCard({ detail, isPlus, defaultOpen }: { detail: DimensionDetail; isPlus: boolean; defaultOpen: boolean }) {
  const status = detail.status || finalDimensionStatus(detail.score);
  return (
    <details id={`dimension-${detail.key}`} className="dimension-card" open={defaultOpen}>
      <summary className="dimension-card-head">
        <span className="dimension-score-block">
          <b style={{ color: statusColor(detail.score) }}>{detail.score}</b>
          <span className="dimension-score-bar" aria-hidden="true">
            <span
              style={{
                width: `${Math.max(3, detail.score)}%`,
                background: statusColor(detail.score),
              }}
            />
          </span>
        </span>

        <span className="dimension-card-main">
          <span className="dimension-card-title">
            {DIMENSION_LABELS[detail.key]}
            <span className="dimension-status" style={{ color: statusColor(detail.score) }}>
              {status}
            </span>
          </span>
          {detail.interpretation ? (
            <span className="small">{detail.interpretation}</span>
          ) : null}
        </span>

        <Icon name="chevron" size={16} className="dimension-chevron" />
      </summary>

      <div className="dimension-card-body stack g3">
        {isPlus ? (
          <>
            {detail.whatReadersSaw ? (
              <div className="callout">
                <b>What readers consistently saw</b>
                {detail.whatReadersSaw}
              </div>
            ) : null}
            {detail.excerpt ? (
              <blockquote className="dimension-excerpt">&ldquo;{detail.excerpt}&rdquo;</blockquote>
            ) : null}
            {detail.whyItMatters ? <p className="copy">{detail.whyItMatters}</p> : null}
            {detail.revisionQuestion ? (
              <div className="callout callout-brand">
                <b>A question worth sitting with</b>
                {detail.revisionQuestion}
              </div>
            ) : null}
            {detail.confidenceLanguage ? (
              <span className="tiny">
                {detail.evidenceCount > 0 ? `Backed by ${detail.evidenceCount} pieces of evidence. ` : ""}
                {detail.confidenceLanguage}
              </span>
            ) : null}
          </>
        ) : (
          <div className="well stack g2">
            <span className="small">
              Plus unlocks the evidence behind this score — the exact excerpt, why it matters, and a
              revision question to work from.
            </span>
            <Link href="/upgrade" className="btn btn-plain btn-sm" style={{ width: "fit-content" }}>
              <Icon name="lock" size={14} />
              Unlock the full review
            </Link>
          </div>
        )}
      </div>
    </details>
  );
}

/** Seven interactive dimension cards. Clicking a radar axis in the rail
 *  scrolls to and expands the matching card here (see the plain-DOM
 *  `focusDimension` helper in FeedbackExperience — no cross-component
 *  state needed since `<details>` is natively addressable by id). */
export function DimensionExplorer({
  details,
  isPlus,
  onOpen,
}: {
  details: DimensionDetail[];
  isPlus: boolean;
  onOpen?: (key: string) => void;
}) {
  return (
    <section className="stack g3" aria-label="Dimension profile">
      <span className="label">Dimension profile</span>
      <div
        className="stack g2"
        onClick={(e) => {
          const target = (e.target as HTMLElement).closest("details");
          if (target?.id && target.open) onOpen?.(target.id.replace("dimension-", ""));
        }}
      >
        {details.map((d, i) => (
          <DimensionCard key={d.key} detail={d} isPlus={isPlus} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}
