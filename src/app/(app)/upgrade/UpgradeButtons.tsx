"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export function CheckoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout unavailable");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout unavailable");
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn btn-gold btn-block btn-xl" onClick={go} disabled={busy}>
        {busy ? "Redirecting…" : "Unlock the full review"}
        {busy ? null : <Icon name="arrowRight" size={18} />}
      </button>
      {error ? (
        <p className="error-text center" style={{ marginTop: 6 }}>
          {error}
        </p>
      ) : null}
    </>
  );
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) window.location.href = data.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-onDark btn-block" onClick={go} disabled={busy}>
      {busy ? "Opening…" : "Manage subscription"}
    </button>
  );
}
