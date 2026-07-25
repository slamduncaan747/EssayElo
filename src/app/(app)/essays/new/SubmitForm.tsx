"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";

const TYPES = [
  "Common App personal statement",
  "School supplemental",
  '"Why us?" essay',
] as const;

const MIN_CHARS = 400;

/** Strip pasted rich-text artifacts: smart quotes stay, layout junk goes. */
function cleanPaste(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function detectType(text: string, words: number): (typeof TYPES)[number] {
  const t = text.toLowerCase();
  if (/why (us|this (school|college|university))|why i want to attend/.test(t)) return TYPES[2];
  if (words > 0 && words <= 350) return TYPES[1];
  return TYPES[0];
}

function suggestTitle(text: string): string {
  const first = text.split(/\n/)[0] ?? "";
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length >= 3 && words.length <= 12 && first.length <= 80)
    return first.replace(/[.:]$/, "");
  return words.slice(0, 6).join(" ").replace(/[,;.:]$/, "") || "Untitled essay";
}

export default function SubmitForm({ evalsLeft }: { evalsLeft: number }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [essayType, setEssayType] = useState<string>(TYPES[0]);
  const [typeTouched, setTypeTouched] = useState(false);
  const [pasted, setPasted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const words = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);
  const chars = content.trim().length;
  const ready = chars >= MIN_CHARS;

  function applyText(next: string, fromPaste: boolean) {
    setContent(next);
    if (fromPaste) setPasted(true);
    if (!typeTouched) setEssayType(detectType(next, next.split(/\s+/).filter(Boolean).length));
    if (!titleTouched && next.trim()) setTitle(suggestTitle(next.trim()));
  }

  async function submit() {
    setError(null);
    if (!ready) {
      setError("Paste the full essay first — at least 400 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          title: title || "Untitled essay",
          essay_type: essayType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/essays/${data.essay_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 300px",
        gap: "var(--s5)",
        alignItems: "stretch",
      }}
    >
      <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <textarea
          ref={areaRef}
          className="editor-area"
          style={{ flex: 1, padding: "var(--s7) var(--s8)", minHeight: 460 }}
          placeholder="Paste your essay here…"
          aria-label="Essay text"
          value={content}
          onChange={(e) => applyText(e.target.value, false)}
          onPaste={(e) => {
            e.preventDefault();
            const text = cleanPaste(e.clipboardData.getData("text/plain"));
            const el = areaRef.current!;
            const next =
              content.slice(0, el.selectionStart) + text + content.slice(el.selectionEnd);
            applyText(next, true);
          }}
        />
        <div className="doc-foot">
          {pasted ? (
            <span className="chip chip-green">
              <Icon name="check" size={13} strokeWidth={3} />
              Formatting cleaned
            </span>
          ) : (
            <span style={{ color: "var(--text-4)" }}>Formatting is stripped automatically</span>
          )}
          <span style={{ marginLeft: "auto" }} className="num">
            {words} words
          </span>
        </div>
      </div>

      <div className="stack g6">
        <div className="stack g3">
          <span className="label">Essay type</span>
          {TYPES.map((t) => {
            const on = essayType === t;
            return (
              <button
                key={t}
                className={`choice ${on ? "on" : ""}`}
                onClick={() => {
                  setEssayType(t);
                  setTypeTouched(true);
                }}
              >
                <span>{t}</span>
                <span className="choice-mark">
                  <Icon name="check" size={12} strokeWidth={3.2} />
                </span>
              </button>
            );
          })}
          {!typeTouched && content ? (
            <span className="tiny">Detected from your essay — tap to change</span>
          ) : null}
        </div>

        <div className="field">
          <label htmlFor="essay-title">Title</label>
          <input
            id="essay-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleTouched(true);
            }}
            maxLength={200}
            placeholder="Essay title"
          />
        </div>

        <div className="push stack g3">
          {error ? <p className="error-text">{error}</p> : null}
          {content && !ready ? (
            <div className="stack g2">
              <div className="meter meter-sm">
                <div
                  className="meter-fill"
                  style={{ left: 0, width: `${Math.min(100, (chars / MIN_CHARS) * 100)}%` }}
                />
              </div>
              <span className="tiny">{MIN_CHARS - chars} more characters to go</span>
            </div>
          ) : null}
          <button
            className="btn btn-primary btn-block btn-xl"
            onClick={submit}
            disabled={submitting || evalsLeft <= 0}
          >
            {submitting ? "Starting…" : "Evaluate essay"}
            {submitting ? null : <Icon name="arrowRight" size={19} />}
          </button>
          <span className="tiny center" style={{ display: "block" }}>
            {evalsLeft > 0
              ? `Uses 1 of ${evalsLeft} evaluations left · about a minute`
              : "No evaluations left this month"}
          </span>
        </div>
      </div>
    </div>
  );
}
