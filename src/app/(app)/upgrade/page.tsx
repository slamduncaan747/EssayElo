import Sidebar from "@/components/Sidebar";
import { getProfile, listEssays, bandLabel } from "@/lib/data";
import { CheckoutButton, PortalButton } from "./UpgradeButtons";

export const metadata = { title: "Upgrade — Margin" };
export const dynamic = "force-dynamic";

/** Upgrade / paywall — design 11i. */
export default async function UpgradePage() {
  const [profile, items] = await Promise.all([getProfile(), listEssays()]);
  if (!profile) return null;
  const isPlus = profile.plan === "plus";
  const latestBand = bandLabel(items[0]?.latestEval ?? null);

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" />
      <main className="main" style={{ alignItems: "center", padding: "44px 24px" }}>
        <div style={{ width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
            <span style={{ font: "500 11px var(--mono)", letterSpacing: ".14em", color: "var(--accent)" }}>
              {isPlus ? "YOUR PLAN" : "UPGRADE"}
            </span>
            <span style={{ font: "500 34px/1.15 var(--serif)" }}>
              {isPlus
                ? "You're on Plus."
                : latestBand
                  ? `Your ${latestBand} is hiding a real number.`
                  : "Your score band is hiding a real number."}
            </span>
            <span style={{ font: "400 14px var(--sans)", color: "var(--muted)" }}>
              Plus scales in to the exact score and reviews every line.
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" }}>
            {/* Free */}
            <div className="card" style={{ background: "var(--paper)", borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ font: "600 16px var(--sans)" }}>Free</span>
                <span style={{ font: "600 28px var(--serif)" }}>$0</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, font: "400 13px/1.5 var(--sans)", color: "var(--body)" }}>
                <span>✓&nbsp; 3 evaluations a month</span>
                <span>✓&nbsp; Score band with honest uncertainty</span>
                <span>✓&nbsp; Essay arc by paragraph</span>
                <span>✓&nbsp; Mark counts — standout, weak, cliché</span>
                <span>✓&nbsp; Unlimited quick checks on edits</span>
                <span style={{ color: "var(--faint)" }}>✗&nbsp; Exact score</span>
                <span style={{ color: "var(--faint)" }}>✗&nbsp; Line-by-line notes &amp; fixes</span>
              </div>
              <span
                className="btn btn-outline"
                style={{ marginTop: "auto", width: "100%", padding: "11px 0", fontSize: 13, fontWeight: 500, cursor: "default" }}
              >
                {isPlus ? "Included in Plus" : "Current plan"}
              </span>
            </div>

            {/* Plus */}
            <div
              style={{
                background: "var(--ink)",
                color: "var(--cream)",
                borderRadius: 16,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                position: "relative",
                boxShadow: "0 20px 50px rgba(40,30,15,.28)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: -11,
                  right: 24,
                  background: "var(--gold)",
                  color: "var(--ink)",
                  font: "700 10px var(--mono)",
                  letterSpacing: ".08em",
                  padding: "5px 12px",
                  borderRadius: 12,
                }}
              >
                {isPlus ? "YOUR PLAN" : "MOST CHOSEN"}
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ font: "600 16px var(--sans)", color: "var(--gold)" }}>Plus</span>
                <span style={{ font: "600 28px var(--serif)" }}>
                  $12
                  <span style={{ font: "400 14px var(--sans)", color: "rgba(245,241,233,.5)" }}>/mo</span>
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, font: "400 13px/1.5 var(--sans)", color: "rgba(245,241,233,.9)" }}>
                <span>✓&nbsp; Everything in Free</span>
                <span style={{ color: "var(--gold)" }}>✓&nbsp; Exact score, to the tenth</span>
                <span style={{ color: "var(--gold)" }}>✓&nbsp; Every line reviewed, with fixes worth points</span>
                <span>✓&nbsp; Prose vs structure split + reliance check</span>
                <span>✓&nbsp; Evidence from 25 matchups instead of 10</span>
                <span>✓&nbsp; 15 evaluations a month</span>
              </div>
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {isPlus ? <PortalButton /> : <CheckoutButton />}
                <span style={{ textAlign: "center", font: "400 11px var(--sans)", color: "rgba(245,241,233,.45)" }}>
                  Cancel anytime · student pricing
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
