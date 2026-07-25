"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";

export default function RetryEvaluate({
  essayId,
  title,
}: {
  essayId: string;
  title?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/essays/${essayId}/evaluate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start evaluation");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start evaluation");
      setBusy(false);
    }
  }

  return (
    <div className="card empty">
      <span
        className="stat-icon"
        style={{ background: "var(--brand-soft)", color: "var(--brand)", width: 52, height: 52 }}
      >
        <Icon name="versus" size={24} />
      </span>
      {title ? <h1 className="h1">{title}</h1> : null}
      <p className="small" style={{ maxWidth: 380 }}>
        The last evaluation didn&rsquo;t finish. It wasn&rsquo;t counted against your monthly
        limit — run it again whenever you&rsquo;re ready.
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="btn btn-primary btn-xl" onClick={retry} disabled={busy}>
        {busy ? "Starting…" : "Run evaluation again"}
      </button>
    </div>
  );
}
