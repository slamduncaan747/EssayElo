"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";
import { trackEvaluationEvent } from "@/lib/analytics";

export function NextDraftPlan({
  steps,
  essayId,
  evaluationId,
  onReturnToEssay,
}: {
  steps: string[];
  essayId: string;
  evaluationId: string;
  onReturnToEssay: () => void;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDraft2() {
    trackEvaluationEvent("start_draft_2_clicked", { evaluationId });
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(`/api/essays/${essayId}/drafts`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/essays/${essayId}/edit?draft=${data.draft_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStarting(false);
    }
  }

  if (steps.length === 0) return null;

  return (
    <section className="card card-pad stack g4" aria-labelledby="plan-heading">
      <h2 id="plan-heading" className="h2">
        Your plan for Draft 2
      </h2>
      <ol className="plan-list">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="row wrap g3">
        <button className="btn btn-primary btn-xl" onClick={startDraft2} disabled={starting}>
          {starting ? "Starting…" : "Start Draft 2"}
          {starting ? null : <Icon name="arrowRight" size={18} />}
        </button>
        <button type="button" className="btn btn-plain" onClick={onReturnToEssay}>
          Return to essay
        </button>
      </div>
    </section>
  );
}
