"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RetryEvaluate({ essayId }: { essayId: string }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
      <p style={{ margin: 0, font: "400 13px/1.6 var(--sans)", color: "var(--muted)" }}>
        The last evaluation didn&rsquo;t finish. It wasn&rsquo;t counted against your monthly limit.
      </p>
      {error ? <p className="error-text" style={{ margin: 0 }}>{error}</p> : null}
      <button className="btn btn-accent" onClick={retry} disabled={busy}>
        {busy ? "Starting…" : "Run evaluation again"}
      </button>
    </div>
  );
}
