import Link from "next/link";
import { bandLabel, type EssayListItem } from "@/lib/data";
import type { Plan } from "@/lib/types";
import { signOut } from "@/app/(auth)/actions";
import Icon, { type IconName } from "./Icon";

const NAV: { href: string; label: string; icon: IconName; key: string }[] = [
  { href: "/dashboard", label: "My evaluations", icon: "essays", key: "essays" },
  { href: "/essays/new", label: "New evaluation", icon: "plus", key: "drafts" },
  { href: "/how-scoring-works", label: "How scoring works", icon: "compass", key: "how" },
];

export default function Sidebar({
  plan,
  items,
  active,
  activeEssayId,
  evalsLeft,
  evalsTotal,
}: {
  plan: Plan;
  items: EssayListItem[];
  active: "essays" | "drafts" | "how";
  activeEssayId?: string;
  /** Full evaluations remaining this month, when the page has it to hand. */
  evalsLeft?: number;
  evalsTotal?: number;
}) {
  const recent = items.slice(0, 4);
  const pct =
    evalsLeft != null && evalsTotal ? Math.round((evalsLeft / evalsTotal) * 100) : null;
  const runningEssay = items.find((i) => i.latestEval?.status === "running") ?? null;

  return (
    <aside className="rail on-dark-scroll">
      <Link href="/dashboard" className="logo">
        <span className="logo-mark">M</span>
        <span className="logo-name" style={{ color: "var(--on-dark)" }}>
          Margin
        </span>
        {plan === "plus" ? <span className="badge-plus">Plus</span> : null}
      </Link>

      {NAV.map((n) => (
        <Link key={n.key} href={n.href} className={`navitem ${active === n.key ? "active" : ""}`}>
          <Icon name={n.icon} size={19} />
          {n.label}
        </Link>
      ))}

      {recent.length > 0 ? (
        <>
          <div className="rail-head">Recent</div>
          {recent.map(({ essay, latestEval }) => {
            const running = latestEval?.status === "running";
            const score =
              plan === "plus" && latestEval?.status === "done" && latestEval.result
                ? latestEval.result.score.toFixed(1)
                : bandLabel(latestEval);
            return (
              <Link
                key={essay.id}
                href={`/essays/${essay.id}`}
                className={`recent-item ${essay.id === activeEssayId ? "active" : ""}`}
              >
                <span>{essay.title}</span>
                {running ? (
                  <span className="recent-live" aria-label="Analysis in progress">
                    <span className="pulse-dot" />
                  </span>
                ) : score ? (
                  <b>{score}</b>
                ) : null}
              </Link>
            );
          })}
        </>
      ) : null}

      {runningEssay ? (
        <Link href={`/essays/${runningEssay.essay.id}`} className="rail-status">
          <span className="pulse-dot" />
          <span className="stack g1">
            <b>Analysis in progress</b>
            <span>{runningEssay.essay.title}</span>
          </span>
        </Link>
      ) : null}

      <div className="push" />

      {evalsLeft != null ? (
        <div className="quota">
          <div className="quota-top">
            <span className="label">Evaluations left</span>
            <b>
              {evalsLeft}
              {evalsTotal ? (
                <span style={{ color: "var(--on-dark-3)", fontSize: 12 }}>/{evalsTotal}</span>
              ) : null}
            </b>
          </div>
          {pct != null ? (
            <div className="meter meter-sm meter-dark">
              <div
                className="meter-fill"
                style={{ left: 0, width: `${pct}%`, background: "var(--gold)" }}
              />
            </div>
          ) : null}
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--on-dark-3)" }}>
            Quick checks stay free &amp; unlimited
          </span>
        </div>
      ) : null}

      {plan === "free" ? (
        <Link href="/upgrade" className="upsell">
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
