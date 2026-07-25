"use client";

import { useMemo } from "react";
import type { EssayMark } from "@/lib/types";

interface Range {
  start: number;
  end: number;
  kind: EssayMark["kind"];
  idx: number;
}

/** Locate each mark's excerpt in the text (first non-overlapping occurrence). */
function computeRanges(content: string, marks: EssayMark[]): Range[] {
  const ranges: Range[] = [];
  for (let i = 0; i < marks.length; i++) {
    const m = marks[i];
    if (!m.excerpt) continue;
    let from = 0;
    while (from < content.length) {
      const at = content.indexOf(m.excerpt, from);
      if (at === -1) break;
      const end = at + m.excerpt.length;
      const overlaps = ranges.some((r) => at < r.end && end > r.start);
      if (!overlaps) {
        ranges.push({ start: at, end, kind: m.kind, idx: i });
        break;
      }
      from = at + 1;
    }
  }
  return ranges.sort((a, b) => a.start - b.start);
}

/**
 * The essay with inline marks. `activeIdx` spotlights one mark and recedes
 * the rest (premium walkthrough); `numbered` adds superscript note numbers.
 */
export default function MarkedEssay({
  content,
  marks,
  activeIdx = null,
  numbered = false,
  onMarkClick,
}: {
  content: string;
  marks: EssayMark[];
  activeIdx?: number | null;
  numbered?: boolean;
  onMarkClick?: (idx: number) => void;
}) {
  const ranges = useMemo(() => computeRanges(content, marks), [content, marks]);

  const paragraphs = useMemo(() => {
    const parts: { text: string; offset: number }[] = [];
    let offset = 0;
    for (const chunk of content.split(/(\n\s*\n)/)) {
      if (!/^\n\s*\n$/.test(chunk) && chunk.trim()) {
        parts.push({ text: chunk, offset });
      }
      offset += chunk.length;
    }
    return parts;
  }, [content]);

  return (
    <div className={`essay-text ${activeIdx != null ? "essay-dimmed" : ""}`}>
      {paragraphs.map((p, pi) => {
        const pStart = p.offset;
        const pEnd = p.offset + p.text.length;
        const inPara = ranges.filter((r) => r.start < pEnd && r.end > pStart);
        const nodes: React.ReactNode[] = [];
        let cursor = pStart;
        for (const r of inPara) {
          const s = Math.max(r.start, pStart);
          const e = Math.min(r.end, pEnd);
          if (s > cursor) nodes.push(content.slice(cursor, s));
          const active = activeIdx === r.idx;
          nodes.push(
            <span
              key={`${r.idx}-${s}`}
              className={`mark-span mark-${r.kind} ${active ? "mark-active" : ""}`}
              onClick={onMarkClick ? () => onMarkClick(r.idx) : undefined}
              style={onMarkClick ? { cursor: "pointer" } : undefined}
            >
              {content.slice(s, e)}
              {numbered ? (
                <sup
                  className="mark-num"
                  style={{
                    color:
                      r.kind === "cliche"
                        ? "var(--red)"
                        : r.kind === "weak"
                          ? "var(--gold-press)"
                          : r.kind === "solid"
                            ? "var(--green)"
                            : "var(--gold-press)",
                  }}
                >
                  {" "}
                  {r.idx + 1}
                </sup>
              ) : null}
            </span>
          );
          cursor = e;
        }
        if (cursor < pEnd) nodes.push(content.slice(cursor, pEnd));
        return <p key={pi}>{nodes}</p>;
      })}
    </div>
  );
}
