"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/Icon";

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
    <div className="stack" style={{ gap: 9 }}>
      {error ? <p className="error-text center">{error}</p> : null}
      <button className="btn btn-primary btn-block btn-xl" onClick={run} disabled={busy}>
        <Icon name="versus" size={18} />
        {busy ? "Starting…" : "Run full evaluation"}
      </button>
      <span className="tiny center" style={{ display: "block" }}>
        Quick checks are free &amp; unlimited · a full evaluation re-scores from scratch
      </span>
    </div>
  );
}
