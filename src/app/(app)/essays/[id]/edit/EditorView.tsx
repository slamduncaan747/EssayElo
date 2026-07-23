"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface HistoryEntry {
  version: number;
  band: string | null;
}

export default function EditorView({
  essayId,
  title,
  version,
  initialContent,
  evaluatedWordCount,
  lastBand,
  hint,
  history,
  canQuickCheck,
}: {
  essayId: string;
  title: string;
  version: number;
  initialContent: string;
  evaluatedWordCount: number;
  lastBand: string | null;
  hint: string | null;
  history: HistoryEntry[];
  canQuickCheck: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContent = useRef(content);
  latestContent.current = content;

  const words = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/essays/${essayId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: latestContent.current }),
      });
      if (res.ok) {
        setSavedAt(new Date());
        setDirty(false);
      }
    } finally {
      setSaving(false);
    }
  }, [essayId]);

  function onChange(next: string) {
    setContent(next);
    setDirty(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 1500);
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function quickCheck() {
    setError(null);
    setChecking(true);
    try {
      if (dirty) await save();
      const res = await fetch(`/api/essays/${essayId}/quick-check`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start quick check");
      router.push(`/essays/${essayId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start quick check");
      setChecking(false);
    }
  }

  const savedLabel = saving
    ? "saving…"
    : savedAt
      ? `autosaved ${Math.max(1, Math.round((Date.now() - savedAt.getTime()) / 1000))}s ago`
      : dirty
        ? "unsaved edits"
        : "up to date";

  return (
    <div className="workspace">
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="doc-header">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">
              Draft {version}
              {dirty ? " · unsaved edits" : ""}
            </span>
          </div>
          <div className="tabs">
            <Link href={`/essays/${essayId}`}>Review</Link>
            <span className="active">Edit</span>
            <Link href={`/essays/${essayId}/history`}>History</Link>
          </div>
        </div>

        <div className="essay-body">
          <textarea
            className="editor-area"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck
          />
        </div>

        <div className="doc-footer">
          <span>
            {evaluatedWordCount > 0 && evaluatedWordCount !== words
              ? `${evaluatedWordCount} → ${words} words`
              : `${words} words`}
          </span>
          <span style={{ color: "#c9c2b2" }}>·</span>
          <span>{savedLabel}</span>
          {error ? <span className="error-text">{error}</span> : null}
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn btn-outline"
              style={{ padding: "7px 14px", fontSize: 11.5, fontWeight: 500 }}
              onClick={() => {
                setContent(initialContent);
                setDirty(true);
                if (timer.current) clearTimeout(timer.current);
                timer.current = setTimeout(save, 400);
              }}
            >
              Discard edits
            </button>
            <button
              className="btn btn-accent"
              style={{ padding: "7px 16px", fontSize: 11.5 }}
              onClick={quickCheck}
              disabled={checking || !canQuickCheck}
              title={canQuickCheck ? undefined : "Run a full evaluation first"}
            >
              {checking ? "Starting…" : `Quick check draft ${version}`}
            </button>
          </span>
        </div>
      </div>

      <div className="panel-light">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="mono-label">LAST EVALUATION</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ font: "600 34px var(--serif)", color: "var(--accent)" }}>
              {lastBand ?? "—"}
            </span>
            <span style={{ font: "400 11px/1.45 var(--sans)", color: "var(--muted)" }}>
              quick check to see
              <br />
              where this draft lands
            </span>
          </div>
        </div>

        {hint ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="mono-label">WHILE YOU EDIT</span>
            <div className="hint-card">{hint}</div>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="mono-label">DRAFT HISTORY</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {history.map((h, i) => (
                <div key={h.version} className={`history-row ${i === 0 ? "top" : ""}`}>
                  <span>Draft {h.version}</span>
                  <b>{h.band ?? "not scored"}</b>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: "auto", font: "400 11px/1.5 var(--sans)", color: "var(--faint)" }}>
          Quick checks are free &amp; unlimited
        </div>
      </div>
    </div>
  );
}
