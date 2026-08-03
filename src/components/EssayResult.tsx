"use client";

import { EvaluationExperience } from "./evaluation/EvaluationExperience";
import { FeedbackExperience } from "./feedback/FeedbackExperience";
import type { EvaluationView } from "@/lib/serialize";
import type { FixtureScenario } from "@/lib/evaluation/transport";

/**
 * Dispatches to the right screen for an essay's current evaluation state.
 * A fully "done" evaluation (revisited later, not fresh off submission)
 * skips the live machinery entirely and renders the feedback dashboard
 * straight from the server-provided result — no need to replay a transport
 * for something that already settled.
 */
export default function EssayResult({
  title,
  version,
  content,
  essayId,
  view,
  plan,
  mock,
  fixtureScenario,
}: {
  title: string;
  version: number;
  content: string;
  essayId: string;
  view: EvaluationView;
  plan: "free" | "plus";
  mock: boolean;
  fixtureScenario?: FixtureScenario;
}) {
  const isPlus = plan === "plus";

  if (view.status === "done" && view.result) {
    return (
      <FeedbackExperience
        title={title}
        version={version}
        essayId={essayId}
        content={content}
        result={view.result}
        isPlus={isPlus}
        feedbackStatus={view.feedbackStatus}
        feedbackError={view.feedbackError}
      />
    );
  }

  return (
    <EvaluationExperience
      title={title}
      version={version}
      essayId={essayId}
      evaluationId={view.id}
      content={content}
      isPlus={isPlus}
      mock={mock}
      fixtureScenario={fixtureScenario}
      initialStatus={view.status === "failed" ? "failed" : "running"}
    />
  );
}
