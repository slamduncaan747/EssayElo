"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RunFullButton({ essayId }: { essayId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/essays/${essayId}/evaluate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start evaluation");
      router.push(`/essays/${essayId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start evaluation");
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {error ? <p className="error-text" style={{ margin: 0, textAlign: "center" }}>{error}</p> : null}
      <button className="btn btn-dark" style={{ width: "100%", padding: "12px 0" }} onClick={run} disabled={busy}>
        {busy ? "Starting…" : "Run full evaluation"}
      </button>
      <span style={{ textAlign: "center", font: "400 11px var(--sans)", color: "var(--faint)" }}>
        Quick checks are free &amp; unlimited · full evaluation re-scores from scratch
      </span>
    </div>
  );
}
