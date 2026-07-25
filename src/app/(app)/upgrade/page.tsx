import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { getProfile, listEssays, bandLabel } from "@/lib/data";
import { CheckoutButton, PortalButton } from "./UpgradeButtons";

export const metadata = { title: "Upgrade — Margin" };
export const dynamic = "force-dynamic";

const FREE = [
  { on: true, t: "3 evaluations a month" },
  { on: true, t: "Score band with honest uncertainty" },
  { on: true, t: "Essay arc by paragraph" },
  { on: true, t: "Mark counts — standout, weak, cliché" },
  { on: true, t: "Unlimited quick checks on edits" },
  { on: false, t: "Exact score" },
  { on: false, t: "Line-by-line notes & fixes" },
];

const PLUS = [
  { gold: false, t: "Everything in Free" },
  { gold: true, t: "Exact score, to the tenth" },
  { gold: true, t: "Every line reviewed, with fixes worth points" },
  { gold: false, t: "Prose vs structure split + reliance check" },
  { gold: false, t: "Evidence from 25 matchups instead of 10" },
  { gold: false, t: "15 evaluations a month" },
];

export default async function UpgradePage() {
  const [profile, items] = await Promise.all([getProfile(), listEssays()]);
  if (!profile) return null;
  const isPlus = profile.plan === "plus";
  const latestBand = bandLabel(items[0]?.latestEval ?? null);

  return (
    <div className="shell">
      <Sidebar plan={profile.plan} items={items} active="essays" />
      <main className="main">
        <div className="page page-narrow" style={{ maxWidth: 960 }}>
          <div className="stack g4 center" style={{ alignItems: "center" }}>
            <span className="eyebrow">
              <Icon name="crown" size={13} />
              {isPlus ? "Your plan" : "Upgrade"}
            </span>
            <h1 className="display" style={{ fontSize: "clamp(28px,3.6vw,42px)" }}>
              {isPlus
                ? "You're on Plus."
                : latestBand
                  ? `Your ${latestBand} is hiding a real number.`
                  : "Your score band is hiding a real number."}
            </h1>
            <p className="lede" style={{ maxWidth: 520 }}>
              Plus scales in to the exact score and reviews every line of the essay.
            </p>
          </div>

          <div className="plans">
            <div className="plan plan-free">
              <div className="stack g2">
                <span className="h2">Free</span>
                <span className="price">$0</span>
              </div>
              <div className="stack g3">
                {FREE.map((f) => (
                  <span key={f.t} className={`feat ${f.on ? "" : "feat-off"}`}>
                    <Icon
                      name={f.on ? "check" : "cross"}
                      size={17}
                      strokeWidth={2.6}
                      style={{ color: f.on ? "var(--green)" : "var(--text-4)" }}
                    />
                    {f.t}
                  </span>
                ))}
              </div>
              <span className="btn btn-plain btn-block push" style={{ cursor: "default" }}>
                {isPlus ? "Included in Plus" : "Current plan"}
              </span>
            </div>

            <div className="plan plan-plus">
              <span className="plan-tag">{isPlus ? "Your plan" : "Most chosen"}</span>
              <div className="stack g2">
                <span className="h2" style={{ color: "var(--gold-hi)" }}>
                  Plus
                </span>
                <span className="price">
                  $12<span>/mo</span>
                </span>
              </div>
              <div className="stack g3">
                {PLUS.map((f) => (
                  <span
                    key={f.t}
                    className="feat"
                    style={{ color: f.gold ? "var(--gold-hi)" : "var(--on-dark-2)" }}
                  >
                    <Icon
                      name="check"
                      size={17}
                      strokeWidth={2.6}
                      style={{ color: f.gold ? "var(--gold)" : "var(--green-hi)" }}
                    />
                    {f.t}
                  </span>
                ))}
              </div>
              <div className="push stack g3">
                {isPlus ? <PortalButton /> : <CheckoutButton />}
                <span className="tiny center" style={{ color: "var(--on-dark-3)" }}>
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
