"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../Icon";
import { AnalyticsRail } from "../evaluation/AnalyticsRail";
import { ReaderSnapshotCard } from "./ReaderSnapshotCard";
import { DimensionExplorer } from "./DimensionExplorer";
import { StrengthCards } from "./StrengthCards";
import { RevisionPriorityCards } from "./RevisionPriorityCards";
import { NextDraftPlan } from "./NextDraftPlan";
import { EssayAnalysisPane } from "../evaluation/EssayAnalysisPane";
import { initialViewState } from "@/lib/evaluation/reducer";
import { DIMENSION_KEYS, type DimensionDetail, type EvaluationResult } from "@/lib/evaluation/types";
import type { FeedbackStatus } from "@/lib/types";
import { trackEvaluationEvent } from "@/lib/analytics";

type Tab = "feedback" | "essay";

function focusDimension(key: string) {
  const el = document.getElementById(`dimension-${key}`);
  if (el instanceof HTMLDetailsElement) el.open = true;
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function FeedbackExperience({
  title,
  version,
  essayId,
  content,
  result,
  isPlus,
  feedbackStatus = "done",
  feedbackError,
  justCompleted = false,
}: {
  title: string;
  version: number;
  essayId: string;
  content: string;
  result: EvaluationResult;
  isPlus: boolean;
  feedbackStatus?: FeedbackStatus;
  feedbackError?: string | null;
  justCompleted?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("feedback");
  const [copied, setCopied] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [celebrating, setCelebrating] = useState(justCompleted);
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackEvaluationEvent("feedback_opened", { evaluationId: result.evaluationId, tier: result.tier });
    }
  }, [result.evaluationId, result.tier]);

  useEffect(() => {
    if (!justCompleted) return;
    const t = setTimeout(() => setCelebrating(false), 900);
    return () => clearTimeout(t);
  }, [justCompleted]);

  const feedbackFailed = feedbackStatus === "failed";
  const hasFeedback = !feedbackFailed && result.dimensionDetails.length > 0;

  async function retryFeedback() {
    setRetrying(true);
    try {
      await fetch(`/api/evaluations/${result.evaluationId}/run`, { method: "POST" });
      router.refresh();
    } finally {
      setRetrying(false);
    }
  }

  async function share() {
    const scoreText = isPlus ? result.score.toFixed(1) : `${result.scoreInterval.low}–${result.scoreInterval.high}`;
    trackEvaluationEvent("share_score_clicked", { evaluationId: result.evaluationId, tier: result.tier });
    try {
      await navigator.clipboard.writeText(
        `My college essay scored ${scoreText} on Margin, compared against a ranked reference field. ${location.origin}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  const railState = { ...initialViewState(), status: "complete" as const, ...deriveRailState(result) };

  return (
    <div className={`workspace ${celebrating ? "completion-flash" : ""}`}>
      <div className="doc">
        <div className="doc-bar">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
          <div className="tabs" role="tablist" aria-label="Essay view">
            <button role="tab" aria-selected={tab === "feedback"} className={tab === "feedback" ? "active" : ""} onClick={() => setTab("feedback")}>
              Feedback
            </button>
            <button role="tab" aria-selected={tab === "essay"} className={tab === "essay" ? "active" : ""} onClick={() => setTab("essay")}>
              Essay
            </button>
          </div>
        </div>

        <div className="essay-body">
          {tab === "essay" ? (
            <EssayAnalysisPane content={content} insights={result.confirmedInsights} scanning={false} />
          ) : (
            <div className="feedback-stack fade-up">
              <ReaderSnapshotCard
                snapshot={
                  isPlus
                    ? result.readerSnapshot
                    : {
                        currentImpression:
                          "Plus unlocks Margin's full written impression of your draft — what lands, what's memorable, and what's still unclear.",
                        memorableElement: "",
                        missingDimension: "",
                      }
                }
              />

              <DimensionExplorer details={result.dimensionDetails.length ? result.dimensionDetails : placeholderDetails(result)} isPlus={isPlus} onOpen={(key) => trackEvaluationEvent("dimension_opened", { evaluationId: result.evaluationId, dimension: key })} />

              {feedbackFailed ? (
                <div className="card card-pad stack g3" style={{ borderColor: "var(--gold-100)" }}>
                  <span className="h3">Your score is in — the written feedback needs another pass</span>
                  <p className="copy">{feedbackError || "We saved your essay, and your score is safe. The written feedback did not finish generating."}</p>
                  <button className="btn btn-gold" style={{ width: "fit-content" }} onClick={retryFeedback} disabled={retrying}>
                    {retrying ? "Retrying…" : "Retry feedback"}
                  </button>
                </div>
              ) : isPlus && hasFeedback ? (
                <>
                  <StrengthCards strengths={result.strengths} />
                  <RevisionPriorityCards priorities={result.revisionPriorities} evaluationId={result.evaluationId} />
                  <NextDraftPlan
                    steps={result.nextDraftPlan}
                    essayId={essayId}
                    evaluationId={result.evaluationId}
                    onReturnToEssay={() => setTab("essay")}
                  />
                </>
              ) : !isPlus ? (
                <div className="card card-pad stack g3" style={{ alignItems: "flex-start" }}>
                  <span className="h3">Unlock the full review</span>
                  <p className="copy">
                    Plus unlocks the exact score, two protected strengths, three ranked revision priorities with
                    evidence, and a concrete Draft 2 plan.
                  </p>
                  <a href="/upgrade" className="btn btn-gold">
                    <Icon name="lock" size={16} />
                    Go Plus
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <AnalyticsRail
          state={railState}
          mode="final"
          isPlus={isPlus}
          forceFinal
          onSelectDimension={(key) => {
            setTab("feedback");
            requestAnimationFrame(() => focusDimension(key));
          }}
          shareAction={
            <button className="btn btn-onDark btn-block" onClick={share}>
              <Icon name={copied ? "check" : "share"} size={16} />
              {copied ? "Copied!" : "Share score"}
            </button>
          }
        />
      </div>
    </div>
  );
}

function deriveRailState(result: EvaluationResult) {
  return {
    evaluationId: result.evaluationId,
    rawScore: result.score,
    scoreInterval: result.scoreInterval,
    tier: result.tier,
    distanceToNextTier: result.distanceToNextTier,
    confidence: "stable" as const,
    dimensions: result.dimensions,
    strongestSignal: result.strongestSignal,
    focusArea: result.focusArea,
    insights: result.confirmedInsights,
    provisional: false,
    result,
    progress: 100,
    progressIsDeterminate: true,
  };
}

function placeholderDetails(result: EvaluationResult): DimensionDetail[] {
  return DIMENSION_KEYS.map((key) => ({
    key,
    score: result.dimensions[key] ?? 0,
    status: "",
    interpretation: "",
    evidenceCount: 0,
    whatReadersSaw: "",
    excerpt: null,
    whyItMatters: "",
    revisionQuestion: "",
    confidenceLanguage: "",
  }));
}

export { focusDimension };
