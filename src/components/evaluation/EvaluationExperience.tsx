"use client";

import { useEffect, useState } from "react";
import Icon from "../Icon";
import { AnalyticsRail } from "./AnalyticsRail";
import { EvaluationPhaseHeader } from "./EvaluationPhaseHeader";
import { EssayAnalysisPane } from "./EssayAnalysisPane";
import { useEvaluation } from "@/lib/evaluation/useEvaluation";
import type { FixtureScenario } from "@/lib/evaluation/transport";
import { FeedbackExperience } from "../feedback/FeedbackExperience";
import { trackEvaluationEvent } from "@/lib/analytics";

/**
 * The live evaluation screen: the essay stays visible throughout, a compact
 * header carries the current phase and progress, and the right rail
 * evolves alongside it. On completion it hands off into the feedback
 * dashboard itself — the spec's "signature moment" is one continuous
 * component, not a route change.
 */
export function EvaluationExperience({
  title,
  version,
  essayId,
  evaluationId,
  content,
  isPlus,
  mock,
  fixtureScenario,
  /** What the server already knew when this page rendered. When it's
   *  "failed", the very first mount must NOT auto-retry — only an explicit
   *  click on "Try again" should re-trigger scoring. */
  initialStatus = "running",
}: {
  title: string;
  version: number;
  essayId: string;
  evaluationId: string;
  content: string;
  isPlus: boolean;
  mock: boolean;
  fixtureScenario?: FixtureScenario;
  initialStatus?: "running" | "failed";
}) {
  const [retryNonce, setRetryNonce] = useState(0);

  return (
    <EvaluationLive
      key={`${evaluationId}-${retryNonce}`}
      title={title}
      version={version}
      essayId={essayId}
      evaluationId={evaluationId}
      content={content}
      isPlus={isPlus}
      mock={mock}
      fixtureScenario={fixtureScenario}
      alreadyResolved={initialStatus === "failed" && retryNonce === 0}
      onRetry={() => setRetryNonce((n) => n + 1)}
    />
  );
}

function EvaluationLive({
  title,
  version,
  essayId,
  evaluationId,
  content,
  isPlus,
  mock,
  fixtureScenario,
  alreadyResolved,
  onRetry,
}: {
  title: string;
  version: number;
  essayId: string;
  evaluationId: string;
  content: string;
  isPlus: boolean;
  mock: boolean;
  fixtureScenario?: FixtureScenario;
  alreadyResolved: boolean;
  onRetry: () => void;
}) {
  const state = useEvaluation({
    evaluationId,
    essayId,
    essayContent: content,
    mock,
    fixtureScenario,
    alreadyResolved,
  });

  useEffect(() => {
    if (state.status !== "idle" && state.status !== "submitting") {
      trackEvaluationEvent("evaluation_first_live_update", { evaluationId, mock });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status !== "idle" && state.status !== "submitting"]);

  useEffect(() => {
    if (state.status === "complete") trackEvaluationEvent("evaluation_completed", { evaluationId, mock });
    if (state.status === "failed") {
      trackEvaluationEvent("evaluation_failed", { evaluationId, mock, stage: state.error?.stage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (state.status === "complete" && state.result) {
    return (
      <FeedbackExperience
        title={title}
        version={version}
        content={content}
        result={state.result}
        isPlus={isPlus}
        essayId={essayId}
        justCompleted
      />
    );
  }

  if (state.status === "failed" && state.error?.stage === "feedback") {
    // Scoring succeeded; only the written feedback failed. Preserve and
    // show the score and dimension profile — never blank-slate a result
    // the reader already has.
    return (
      <div className="workspace">
        <div className="doc">
          <div className="doc-bar">
            <div className="doc-title">
              <b>{title}</b>
              <span className="chip">Draft {version}</span>
            </div>
          </div>
          <div className="essay-body">
            <EssayAnalysisPane content={content} insights={state.insights} scanning={false} />
          </div>
        </div>
        <div className="panel">
          <AnalyticsRail state={state} mode="final" isPlus={isPlus} forceFinal />
          <div className="panel-foot panel-foot-stack">
            <p className="copy" style={{ color: "var(--on-dark-2)" }}>
              {state.error.message}
            </p>
            <button className="btn btn-gold btn-block" onClick={onRetry}>
              Retry feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div className="workspace">
        <div className="doc">
          <div className="doc-bar">
            <div className="doc-title">
              <b>{title}</b>
              <span className="chip">Draft {version}</span>
            </div>
          </div>
          <div className="essay-body">
            <EssayAnalysisPane content={content} insights={[]} scanning={false} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-body on-dark-scroll" style={{ justifyContent: "center" }}>
            <div className="stack g4" style={{ alignItems: "center", textAlign: "center" }}>
              <span className="stat-icon" style={{ background: "var(--dark-raised)", color: "var(--gold)" }}>
                <Icon name="compass" size={22} />
              </span>
              <span className="h3" style={{ color: "var(--on-dark)" }}>
                We hit a snag
              </span>
              <p className="copy" style={{ color: "var(--on-dark-2)", textAlign: "center" }}>
                {state.error?.message}
              </p>
              <button className="btn btn-gold" onClick={onRetry}>
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const scanning = state.status === "idle" || state.status === "submitting" || state.status === "reading";

  return (
    <div className="workspace">
      <div className="doc">
        <div className="doc-bar">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
        </div>
        <div className="essay-body">
          <EvaluationPhaseHeader
            status={state.status}
            progress={state.progress}
            progressIsDeterminate={state.progressIsDeterminate}
            mock={mock}
          />
          <EssayAnalysisPane content={content} insights={state.insights} scanning={scanning} />
        </div>
      </div>

      <div className="panel">
        <AnalyticsRail state={state} mode="live" isPlus={isPlus} />
      </div>
    </div>
  );
}
