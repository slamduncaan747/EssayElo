"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { EvaluationPhase } from "@/lib/types";

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
  placement: "Reading your essay…",
  match: "Scoring…",
  prose: "Measuring prose…",
  synthesis: "Finalizing…",
};

/**
 * Evaluating state (design 11d): essay under a scan line, dark panel with a
 * page-miniature loader. This component *drives* the evaluation — each poll
 * advances the tournament one step, so the run survives serverless limits
 * and resumes if the tab is reopened.
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
          addLog(`✓ phase=${current.phase} matches=${current.matches_done}/${current.budget} (${ms}ms)`);
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

  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <div className="workspace">
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="doc-header">
          <div className="doc-title">
            <b>{title}</b>
            <span className="chip">Draft {version}</span>
          </div>
          <span className="eval-status">
            <span className="pulse-dot" />
            EVALUATING
          </span>
        </div>
        <div className="essay-body">
          <div className="essay-text scan-wrap" style={{ position: "relative" }}>
            <div className="scan-line" />
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="panel-dark">
        <div className="panel-pad">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="mono-label" style={{ letterSpacing: ".14em" }}>EVALUATION</span>
            <span style={{ font: "italic 500 20px var(--serif)" }}>
              {failed ? "Something went wrong" : PHASE_LABEL[state.phase] ?? "Working…"}
            </span>
          </div>

          {failed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ font: "400 12.5px/1.6 var(--sans)", color: "rgba(245,241,233,.7)" }}>
                The evaluation hit an error (not counted against your limit) —{" "}
                <button
                  onClick={() => location.reload()}
                  style={{ color: "var(--gold)", textDecoration: "underline" }}
                >
                  try again
                </button>
                .
              </div>
              {errorMsg ? (
                <div
                  style={{
                    background: "rgba(163,75,50,.18)",
                    border: "1px solid rgba(163,75,50,.5)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    font: "400 11.5px/1.5 var(--mono)",
                    color: "#e8b7a6",
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
                    <div key={i} style={{ height: 8 }} />
                  ) : (
                    <div key={i} className="line" style={{ width: `${w}%` }} />
                  )
                )}
              </div>

              <div className="status-chips">
                <span className={`status-chip ${state.phase === "placement" ? "live" : ""}`}>
                  {state.phase === "placement" ? "structure…" : "structure ✓"}
                </span>
                <span className={`status-chip ${state.phase === "match" ? "live" : ""}`}>
                  {state.phase === "match"
                    ? `scoring ${state.matches_done}/${state.budget}…`
                    : state.phase === "placement"
                      ? "scoring"
                      : "scoring ✓"}
                </span>
                <span
                  className={`status-chip ${
                    state.phase === "prose" || state.phase === "synthesis" ? "live" : ""
                  }`}
                >
                  {state.phase === "synthesis" ? "finalizing…" : "prose"}
                </span>
              </div>

              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="eval-progress">
                  <div style={{ width: `${pct}%` }} />
                </div>
                <span
                  style={{
                    font: "400 11px var(--mono)",
                    color: "rgba(245,241,233,.4)",
                    textAlign: "center",
                  }}
                >
                  usually a few minutes
                </span>
              </div>
            </>
          )}

          {/* TEMP DEBUG: live step log. Remove with /api/diag once healthy. */}
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="mono-label" style={{ letterSpacing: ".12em" }}>
              STEP LOG
            </span>
            <div
              style={{
                background: "rgba(0,0,0,.28)",
                borderRadius: 10,
                padding: "10px 12px",
                maxHeight: 200,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {log.length === 0 ? (
                <span style={{ font: "400 11px var(--mono)", color: "rgba(245,241,233,.4)" }}>
                  waiting…
                </span>
              ) : (
                log.map((line, i) => (
                  <span
                    key={i}
                    style={{
                      font: "400 10.5px/1.45 var(--mono)",
                      color: line.includes("✗")
                        ? "#e8b7a6"
                        : line.includes("✓")
                          ? "rgba(201,162,90,.9)"
                          : "rgba(245,241,233,.6)",
                      wordBreak: "break-word",
                    }}
                  >
                    {line}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
