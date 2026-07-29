"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Plan } from "@/lib/types";

/**
 * Dev-only switch — fixed top-right pill to flip between Free and Plus
 * without going through Stripe. Calls /api/dev/plan, which stays gated
 * behind ALLOW_PLAN_TOGGLE so it's inert on a real deployment.
 */
export default function PlanSwitch({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const working = busy || pending;

  async function setPlan(next: Plan) {
    if (working || next === plan) return;
    setBusy(true);
    try {
      const res = await fetch("/api/dev/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: next }),
      });
      if (res.ok) startTransition(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 16,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "rgba(36,28,20,.94)",
        border: "1px solid rgba(246,241,231,.16)",
        borderRadius: 999,
        padding: "6px 10px",
        boxShadow: "0 8px 24px rgba(40,30,15,.3)",
        backdropFilter: "blur(6px)",
        opacity: working ? 0.6 : 1,
      }}
    >
      <span
        style={{
          font: "800 8.5px var(--sans)",
          letterSpacing: ".12em",
          color: "var(--on-dark-3)",
        }}
      >
        PLAN
      </span>
      <div style={{ display: "flex", gap: 2 }}>
        {(["free", "plus"] as const).map((p) => {
          const active = plan === p;
          const accent = p === "plus";
          return (
            <button
              key={p}
              onClick={() => setPlan(p)}
              disabled={working}
              style={{
                font: `${active ? 900 : 700} 11px var(--sans)`,
                padding: "5px 11px",
                borderRadius: 999,
                background: active
                  ? accent
                    ? "var(--gold)"
                    : "rgba(246,241,231,.18)"
                  : "transparent",
                color: active ? (accent ? "var(--ink)" : "var(--on-dark)") : "var(--on-dark-3)",
              }}
            >
              {p === "free" ? "Free" : "Plus"}
            </button>
          );
        })}
      </div>
    </div>
  );
}
