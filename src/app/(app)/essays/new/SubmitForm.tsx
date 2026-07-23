"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

const TYPES = [
  "Common App personal statement",
  "School supplemental",
  '"Why us?" essay',
] as const;

/** Strip pasted rich-text artifacts: smart quotes stay, layout junk goes. */
function cleanPaste(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
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
  if (words.length >= 3 && words.length <= 12 && first.length <= 80) return first.replace(/[.:]$/, "");
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

  function applyText(next: string, fromPaste: boolean) {
    setContent(next);
    if (fromPaste) setPasted(true);
    if (!typeTouched) setEssayType(detectType(next, next.split(/\s+/).filter(Boolean).length));
    if (!titleTouched && next.trim()) setTitle(suggestTitle(next.trim()));
  }

  async function submit() {
    setError(null);
    if (content.trim().length < 400) {
      setError("Paste the full essay first (at least 400 characters).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title: title || "Untitled essay", essay_type: essayType }),
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
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, alignItems: "stretch" }}>
      <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <textarea
          ref={areaRef}
          className="editor-area"
          style={{ flex: 1, padding: "26px 30px", maxWidth: "none", minHeight: 420 }}
          placeholder="Paste your essay here…"
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
        <div className="doc-footer" style={{ borderTop: "1px solid var(--border-soft)" }}>
          {pasted ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)" }} />
              Pasted — formatting cleaned
            </span>
          ) : (
            <span style={{ color: "var(--faint)" }}>Formatting is stripped automatically</span>
          )}
          <span style={{ marginLeft: "auto", font: "500 12px var(--mono)" }}>{words} words</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span className="mono-label">ESSAY TYPE</span>
          {TYPES.map((t) => {
            const selected = essayType === t;
            return (
              <button
                key={t}
                onClick={() => {
                  setEssayType(t);
                  setTypeTouched(true);
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: selected ? "var(--cream)" : "var(--paper)",
                  border: selected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 13px",
                  font: `${selected ? 500 : 400} 12.5px var(--sans)`,
                  color: selected ? "var(--ink)" : "var(--muted)",
                  textAlign: "left",
                }}
              >
                <span>{t}</span>
                {selected ? <span style={{ color: "var(--accent)" }}>✓</span> : null}
              </button>
            );
          })}
          {!typeTouched && content ? (
            <span style={{ font: "400 11px var(--sans)", color: "var(--faint)" }}>
              Detected — tap to change
            </span>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <span className="mono-label">TITLE</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setTitleTouched(true);
            }}
            maxLength={200}
            placeholder="Essay title"
            style={{
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 13px",
              font: "400 13px var(--serif)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
          <button
            className="btn btn-dark"
            style={{ width: "100%", padding: "13px 0", fontSize: 14 }}
            onClick={submit}
            disabled={submitting || evalsLeft <= 0}
          >
            {submitting ? "Starting…" : "Evaluate essay"}
          </button>
          <span style={{ textAlign: "center", font: "400 11px var(--sans)", color: "var(--faint)" }}>
            {evalsLeft > 0
              ? `Uses 1 of ${evalsLeft} evaluations left · ~1 min`
              : "No evaluations left this month"}
          </span>
        </div>
      </div>
    </div>
  );
}
