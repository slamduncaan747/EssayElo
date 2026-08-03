"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";

export default function DraftEditor({
  essayId,
  draftId,
  version,
  initialContent,
  evalsLeft,
}: {
  essayId: string;
  draftId: string;
  version: number;
  initialContent: string;
  evalsLeft: number;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/essays/${essayId}/drafts/${draftId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/essays/${essayId}?fresh=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="workspace" style={{ gridTemplateColumns: "1fr" }}>
      <div className="doc">
        <div className="doc-bar">
          <div className="doc-title">
            <b>Draft {version}</b>
            <span className="chip chip-brand">Editing</span>
          </div>
          <button className="btn btn-primary" onClick={submit} disabled={submitting || evalsLeft <= 0}>
            {submitting ? "Starting…" : "Evaluate this draft"}
            {submitting ? null : <Icon name="arrowRight" size={16} />}
          </button>
        </div>
        <div className="essay-body">
          <div className="sheet sheet-fill">
            <textarea
              className="editor-area"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              aria-label="Draft text"
            />
          </div>
        </div>
        <div className="doc-foot">
          {error ? <span className="error-text">{error}</span> : null}
          <span style={{ marginLeft: "auto" }} className="tiny">
            {evalsLeft > 0 ? `Uses 1 of ${evalsLeft} evaluations left` : "No evaluations left this month"}
          </span>
        </div>
      </div>
    </div>
  );
}
