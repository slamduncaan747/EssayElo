"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EvaluationPhase } from "@/lib/types";
import Icon from "./Icon";

interface StepState {
  status: string;
  phase: EvaluationPhase | string;
  matches_done: number;
  budget: number;
  busy?: boolean;
  error?: string | null;
  detail?: string;
}

function ts(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

const PHASE_LABEL: Record<string, string> = {
  placement: "Reading your essay",
  match: "Running matchups",
  prose: "Measuring prose",
  synthesis: "Writing your review",
};

/** Ordered phases, for the checklist. */
const STEPS: { phase: string; label: string }[] = [
  { phase: "placement", label: "Read & place the essay" },
  { phase: "match", label: "Head-to-head matchups" },
  { phase: "prose", label: "Prose & structure" },
  { phase: "synthesis", label: "Assemble the review" },
];
const ORDER = STEPS.map((s) => s.phase);

/**
 * Evaluating state: the essay under a scan line, a dark panel with a live
 * checklist. This component *drives* the evaluation — each poll advances the
 * tournament one step, so the run survives serverless limits and resumes if
 * the tab is reopened.
 */
export default function EvaluatingView({
  evaluationId,
  title,
  version,
  content,
  initial,
}: {
  evaluationId: string;
  title: string;
  version: number;
  content: string;
  initial: StepState;
}) {
  const router = useRouter();
  const [state, setState] = useState<StepState>(initial);
  const [failed, setFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const running = useRef(false);

  const addLog = useCallback((line: string) => {
    setLog((l) => [...l.slice(-40), `${ts()}  ${line}`]);
  }, []);

  const drive = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    addLog(`start · phase=${initial.phase} matches=${initial.matches_done}/${initial.budget}`);
    let errors = 0;
    let current: StepState = initial;
    while (current.status === "running") {
      const t0 = Date.now();
      try {
        const res = await fetch(`/api/evaluations/${evaluationId}/step`, { method: "POST" });
        const body = (await res.json().catch(() => ({}))) as StepState;
        const ms = Date.now() - t0;
        if (!res.ok) {
          // Non-step error (auth, ownership, unexpected). Body may carry detail.
          const detail = body.detail || body.error || `HTTP ${res.status}`;
          addLog(`✗ HTTP ${res.status} (${ms}ms): ${detail}`);
          errors++;
          if (errors >= 4) {
            setErrorMsg(detail);
            setFailed(true);
            break;
          }
          await new Promise((r) => setTimeout(r, 1500 * errors));
          continue;
        }
        current = body;
        errors = 0;
        setState(current);
        if (current.status === "failed") {
          addLog(`✗ failed (${ms}ms): ${current.error ?? "unknown"}`);
        } else if (current.busy) {
          addLog(`… busy, another worker holds the lock (${ms}ms)`);
          await new Promise((r) => setTimeout(r, 2500));
        } else {
          addLog(
            `✓ phase=${current.phase} matches=${current.matches_done}/${current.budget} (${ms}ms)`
          );
        }
      } catch (e) {
        const detail = e instanceof Error ? e.message : "network error";
        addLog(`✗ exception: ${detail}`);
        errors++;
        if (errors >= 4) {
          setErrorMsg(detail);
          setFailed(true);
          break;
        }
        await new Promise((r) => setTimeout(r, 1500 * errors));
      }
    }
    if (current.status === "done") {
      addLog("✓ done — loading results");
      router.refresh();
    }
    if (current.status === "failed") {
      setErrorMsg(current.error ?? "The evaluation failed.");
      setFailed(true);
    }
  }, [evaluationId, initial, router, addLog]);

  useEffect(() => {
    void drive();
  }, [drive]);

  // Progress: placement 5%, matches 5–80%, prose 85%, synthesis 92%.
  const pct =
    state.phase === "placement"
      ? 5
      : state.phase === "match"
        ? 5 + (state.matches_done / Math.max(state.budget, 1)) * 75
        : state.phase === "prose"
          ? 85
          : 92;

  const currentStep = ORDER.indexOf(String(state.phase));
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className="workspace">
      <div className="doc">
        <div className="doc-header">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
          <span className="live-badge">
            <span className="pulse-dot" />
            Evaluating
          </span>
        </div>
        <div className="essay-body">
          <div className="essay-sheet scan-wrap">
            <div className="scan-line" />
            <div className="essay-text">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="stack" style={{ gap: 5 }}>
            <span className="label">Evaluation</span>
            <span className="h2" style={{ color: "var(--on-dark)" }}>
              {failed ? "Something went wrong" : (PHASE_LABEL[state.phase] ?? "Working…")}
            </span>
            {!failed && state.phase === "match" ? (
              <span className="small" style={{ color: "var(--on-dark-3)" }}>
                {state.matches_done} of {state.budget} matchups judged
              </span>
            ) : null}
          </div>

          {failed ? (
            <div className="stack" style={{ gap: 14 }}>
              <span className="copy" style={{ color: "var(--on-dark-2)" }}>
                The evaluation hit an error — it wasn&rsquo;t counted against your limit.
              </span>
              <button className="btn btn-gold btn-block" onClick={() => location.reload()}>
                Try again
              </button>
              {errorMsg ? (
                <div
                  style={{
                    background: "rgba(194,84,58,.18)",
                    border: "1.5px solid rgba(194,84,58,.5)",
                    borderRadius: "var(--r-sm)",
                    padding: "11px 13px",
                    font: "400 11.5px/1.5 var(--mono)",
                    color: "#e9a893",
                    wordBreak: "break-word",
                  }}
                >
                  {errorMsg}
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="page-mini">
                <div className="read-band" />
                {[90, 100, 96, 58, 0, 98, 92, 44, 0, 95, 70, 0, 97, 62].map((w, i) =>
                  w === 0 ? (
                    <div key={i} style={{ height: 9 }} />
                  ) : (
                    <div key={i} className="line" style={{ width: `${w}%` }} />
                  )
                )}
              </div>

              <div className="steps">
                {STEPS.map((s, i) => {
                  const done = currentStep > i;
                  const live = currentStep === i;
                  return (
                    <div
                      key={s.phase}
                      className={`step ${done ? "done" : ""} ${live ? "live" : ""}`}
                    >
                      <span className="step-mark">
                        {done ? <Icon name="check" size={12} strokeWidth={3} /> : i + 1}
                      </span>
                      {s.label}
                    </div>
                  );
                })}
              </div>

              <div className="stack" style={{ gap: 8, marginTop: 4 }}>
                <div className="meter meter-dark meter-sm">
                  <div
                    className="meter-fill"
                    style={{ left: 0, width: `${pct}%`, background: "var(--gold)" }}
                  />
                </div>
                <span
                  className="tiny center"
                  style={{ color: "var(--on-dark-3)", display: "block" }}
                >
                  Usually a few minutes — you can close this tab and come back.
                </span>
              </div>
            </>
          )}

          {/* Diagnostics, folded away until asked for. */}
          <div className="push stack" style={{ gap: 8 }}>
            <button className="log-toggle" onClick={() => setShowLog((v) => !v)}>
              <Icon
                name="chevronDown"
                size={13}
                style={{ transform: showLog ? "none" : "rotate(-90deg)" }}
              />
              Technical details
            </button>
            {showLog ? (
              <div className="log-box">
                {log.length === 0 ? (
                  <span className="log-line">waiting…</span>
                ) : (
                  log.map((line, i) => (
                    <span
                      key={i}
                      className={`log-line ${line.includes("✗") ? "bad" : line.includes("✓") ? "ok" : ""}`}
                    >
                      {line}
                    </span>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
