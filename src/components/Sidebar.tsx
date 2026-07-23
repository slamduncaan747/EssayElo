import Link from "next/link";
import { bandLabel, type EssayListItem } from "@/lib/data";
import { exactScore } from "@/lib/engine/scale";
import type { Plan } from "@/lib/types";
import { signOut } from "@/app/(auth)/actions";

export default function Sidebar({
  plan,
  items,
  active,
  activeEssayId,
}: {
  plan: Plan;
  items: EssayListItem[];
  active: "essays" | "drafts" | "how";
  activeEssayId?: string;
}) {
  const recent = items.slice(0, 3);
  return (
    <aside className="sidebar">
      <Link href="/dashboard" className="logo">
        <div className="logo-mark">M</div>
        <span className="logo-name">Margin</span>
        {plan === "plus" ? <span className="logo-plus">PLUS</span> : null}
      </Link>
      <Link href="/dashboard" className={`navitem ${active === "essays" ? "active" : ""}`}>
        My essays
      </Link>
      <Link href="/essays/new" className={`navitem ${active === "drafts" ? "active" : ""}`}>
        New essay
      </Link>
      <Link
        href="/how-scoring-works"
        className={`navitem ${active === "how" ? "active" : ""}`}
      >
        How scoring works
      </Link>

      {recent.length > 0 ? (
        <>
          <div className="recent-label">RECENT</div>
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

      {plan === "free" ? (
        <Link href="/upgrade" className="upsell-card">
          <b>Go Premium</b>
          <span>Exact scores + every line reviewed</span>
        </Link>
      ) : (
        <div style={{ marginTop: "auto" }} />
      )}
      <form action={signOut}>
        <button className="signout" type="submit">
          Sign out
        </button>
      </form>
    </aside>
  );
}
