"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/Icon";

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

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

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
    ? "Saving…"
    : savedAt
      ? `Autosaved ${Math.max(1, Math.round((Date.now() - savedAt.getTime()) / 1000))}s ago`
      : dirty
        ? "Unsaved edits"
        : "Up to date";

  return (
    <div className="workspace">
      <div className="doc">
        <div className="doc-header">
          <div className="doc-title">
            <b>{title}</b>
            <span className={`chip ${dirty ? "chip-brand" : ""}`}>
              Draft {version}
              {dirty ? " · unsaved" : ""}
            </span>
          </div>
          <div className="tabs">
            <Link href={`/essays/${essayId}`}>Review</Link>
            <span className="active">Edit</span>
            <Link href={`/essays/${essayId}/history`}>History</Link>
          </div>
        </div>

        <div className="essay-body">
          <div className="essay-sheet">
            <textarea
              className="editor-area"
              value={content}
              onChange={(e) => onChange(e.target.value)}
              spellCheck
            />
          </div>
        </div>

        <div className="doc-footer">
          <span className="num">
            {evaluatedWordCount > 0 && evaluatedWordCount !== words
              ? `${evaluatedWordCount} → ${words} words`
              : `${words} words`}
          </span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span>{savedLabel}</span>
          {error ? <span className="error-text">{error}</span> : null}
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="btn btn-ghost"
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
              className="btn btn-primary btn-sm"
              onClick={quickCheck}
              disabled={checking || !canQuickCheck}
              title={canQuickCheck ? undefined : "Run a full evaluation first"}
            >
              <Icon name="bolt" size={15} />
              {checking ? "Starting…" : "Quick check"}
            </button>
          </span>
        </div>
      </div>

      <div className="panel-light">
        <div className="stack" style={{ gap: 10 }}>
          <span className="label">Last evaluation</span>
          <div className="row" style={{ gap: 14 }}>
            <span
              className="num"
              style={{ font: "900 34px var(--sans)", color: "var(--brand)", letterSpacing: "-.03em" }}
            >
              {lastBand ?? "—"}
            </span>
            <span className="tiny">
              Quick check to see
              <br />
              where this draft lands
            </span>
          </div>
        </div>

        {hint ? (
          <div className="stack" style={{ gap: 9 }}>
            <span className="label">While you edit</span>
            <div className="hint-card">
              <Icon name="spark" size={17} />
              <span>{hint}</span>
            </div>
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="stack" style={{ gap: 9 }}>
            <span className="label">Draft history</span>
            <div className="stack" style={{ gap: 7 }}>
              {history.map((h, i) => (
                <div key={h.version} className={`history-row ${i === 0 ? "top" : ""}`}>
                  <span>Draft {h.version}</span>
                  <b>{h.band ?? "not scored"}</b>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="push">
          <span className="tiny" style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <Icon name="bolt" size={14} />
            Quick checks are free &amp; unlimited
          </span>
        </div>
      </div>
    </div>
  );
}
