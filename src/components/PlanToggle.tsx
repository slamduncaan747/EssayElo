"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Plan } from "@/lib/types";

/**
 * TESTING ONLY — fixed top-right switch between Free and Plus so both tiers
 * can be exercised without Stripe. Rendered only when ALLOW_PLAN_TOGGLE=1.
 */
export default function PlanToggle({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function set(next: Plan) {
    if (next === plan || busy) return;
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

  const working = busy || pending;

  return (
    <div
      style={{
        position: "fixed",
        top: 14,
        right: 16,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(36,31,23,.92)",
        border: "1px solid rgba(245,241,233,.16)",
        borderRadius: 999,
        padding: "5px 6px 5px 12px",
        boxShadow: "0 8px 24px rgba(40,30,15,.28)",
        backdropFilter: "blur(6px)",
        opacity: working ? 0.6 : 1,
      }}
    >
      <span
        style={{
          font: "500 9px var(--mono)",
          letterSpacing: ".12em",
          color: "rgba(245,241,233,.45)",
        }}
      >
        TEST
      </span>
      <div style={{ display: "flex", gap: 2 }}>
        {(["free", "plus"] as const).map((p) => {
          const active = plan === p;
          return (
            <button
              key={p}
              onClick={() => set(p)}
              disabled={working}
              style={{
                font: `${active ? 700 : 500} 11px var(--sans)`,
                padding: "5px 12px",
                borderRadius: 999,
                background: active ? (p === "plus" ? "var(--gold)" : "rgba(245,241,233,.16)") : "transparent",
                color: active
                  ? p === "plus"
                    ? "var(--ink)"
                    : "var(--cream)"
                  : "rgba(245,241,233,.5)",
                textTransform: "capitalize",
              }}
            >
              {p}
            </button>
          );
        })}
      </div>
    </div>
  );
}
