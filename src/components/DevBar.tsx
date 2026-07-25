"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Plan } from "@/lib/types";
import type { EnginePreset } from "@/lib/engine/preset";

/**
 * TESTING ONLY — fixed top-right controls for plan tier and evaluation engine,
 * so both can be exercised without Stripe or a redeploy. Rendered only when
 * ALLOW_PLAN_TOGGLE=1.
 */

function engines(models: { fast: string; quality: string }) {
  return [
    { key: "mock" as const, label: "Mock", hint: "Zero cost — deterministic, no API calls" },
    { key: "fast" as const, label: "Fast", hint: `${models.fast} — cheap, big daily quota` },
    { key: "quality" as const, label: "Full", hint: `${models.quality} — best judgment` },
  ];
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          font: "800 8.5px var(--sans)",
          letterSpacing: ".12em",
          color: "var(--on-dark-3)",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 2 }}>{children}</div>
    </div>
  );
}

function Pill({
  active,
  accent,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  accent?: boolean;
  disabled: boolean;
  title?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
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
      {children}
    </button>
  );
}

export default function DevBar({
  plan,
  preset,
  models,
}: {
  plan: Plan;
  preset: EnginePreset;
  models: { fast: string; quality: string };
}) {
  const ENGINES = engines(models);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const working = busy || pending;

  async function post(url: string, body: unknown) {
    if (working) return;
    setBusy(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        gap: 14,
        background: "rgba(36,28,20,.94)",
        border: "1px solid rgba(246,241,231,.16)",
        borderRadius: 999,
        padding: "6px 10px",
        boxShadow: "0 8px 24px rgba(40,30,15,.3)",
        backdropFilter: "blur(6px)",
        opacity: working ? 0.6 : 1,
      }}
    >
      <Group label="PLAN">
        {(["free", "plus"] as const).map((p) => (
          <Pill
            key={p}
            active={plan === p}
            accent={p === "plus"}
            disabled={working}
            onClick={() => plan !== p && post("/api/dev/plan", { plan: p })}
          >
            {p === "free" ? "Free" : "Plus"}
          </Pill>
        ))}
      </Group>

      <span style={{ width: 1, alignSelf: "stretch", background: "rgba(246,241,231,.14)" }} />

      <Group label="ENGINE">
        {ENGINES.map((e) => (
          <Pill
            key={e.key}
            active={preset === e.key}
            disabled={working}
            title={e.hint}
            onClick={() => preset !== e.key && post("/api/dev/engine", { preset: e.key })}
          >
            {e.label}
          </Pill>
        ))}
      </Group>
    </div>
  );
}
