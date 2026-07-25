import Link from "next/link";
import { bandLabel, type EssayListItem } from "@/lib/data";
import { exactScore } from "@/lib/engine/scale";
import type { Plan } from "@/lib/types";
import { signOut } from "@/app/(auth)/actions";
import Icon, { type IconName } from "./Icon";

const NAV: { href: string; label: string; icon: IconName; key: string }[] = [
  { href: "/dashboard", label: "My essays", icon: "stack", key: "essays" },
  { href: "/essays/new", label: "Score an essay", icon: "plus", key: "drafts" },
  { href: "/how-scoring-works", label: "How scoring works", icon: "compass", key: "how" },
];

export default function Sidebar({
  plan,
  items,
  active,
  activeEssayId,
  evalsLeft,
}: {
  plan: Plan;
  items: EssayListItem[];
  active: "essays" | "drafts" | "how";
  activeEssayId?: string;
  /** Full evaluations remaining this month, when the page has it to hand. */
  evalsLeft?: number;
}) {
  const recent = items.slice(0, 4);
  return (
    <aside className="rail">
      <Link href="/dashboard" className="logo logo-dark">
        <div className="logo-mark">M</div>
        <span className="logo-name">Margin</span>
        {plan === "plus" ? <span className="badge-plus">Plus</span> : null}
      </Link>

      {NAV.map((n) => (
        <Link
          key={n.key}
          href={n.href}
          className={`navitem ${active === n.key ? "active" : ""}`}
        >
          <Icon name={n.icon} size={19} />
          {n.label}
        </Link>
      ))}

      {recent.length > 0 ? (
        <>
          <div className="rail-section">Recent</div>
          {recent.map(({ essay, latestEval }) => {
            const score =
              plan === "plus" && latestEval?.status === "done" && latestEval.elo != null
                ? exactScore(latestEval.elo).toFixed(1)
                : bandLabel(latestEval);
            return (
              <Link
                key={essay.id}
                href={`/essays/${essay.id}`}
                className={`recent-item ${essay.id === activeEssayId ? "active" : ""}`}
              >
                <span>{essay.title}</span>
                {score ? <b>{score}</b> : null}
              </Link>
            );
          })}
        </>
      ) : null}

      <div className="push" />

      {evalsLeft != null ? (
        <div className="quota-card">
          <div className="spread">
            <span className="label">Evaluations left</span>
            <b>{evalsLeft}</b>
          </div>
          <span style={{ font: "700 11px var(--sans)", color: "var(--on-dark-3)" }}>
            Quick checks stay free &amp; unlimited
          </span>
        </div>
      ) : null}

      {plan === "free" ? (
        <Link href="/upgrade" className="upsell-card">
          <b>
            <Icon name="crown" size={15} />
            Go Plus
          </b>
          <span>Exact scores, every line reviewed, 15 evaluations a month.</span>
        </Link>
      ) : null}

      <form action={signOut}>
        <button className="signout" type="submit">
          Sign out
        </button>
      </form>
    </aside>
  );
}
