import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { TierBadge } from "@/components/Score";
import { TIERS, tierCeiling } from "@/lib/tier";

export const metadata = { title: "How scoring works — Margin" };

const SECTIONS: { icon: IconName; h: string; p: string }[] = [
  {
    icon: "swords",
    h: "The score is a percentile, not a grade.",
    p: "Your number answers one question: what fraction of applicant essays does this outrank? It comes from head-to-head comparisons against a calibrated pool of real and reference essays — the same way chess ratings work. Nobody hand-waves a 7/10.",
  },
  {
    icon: "target",
    h: "It is deliberately stringent.",
    p: "A genuinely well-written, sincere, polished essay scores around 45. That is not an insult — it is the honest middle of a strong applicant pool. Polish gets you to 45. Only revealing a person few others could reveal climbs higher. 80+ is near-nonexistent, and we keep it that way on purpose.",
  },
  {
    icon: "compass",
    h: "What actually moves the number.",
    p: "Each comparison asks one question: which essay leaves the reader knowing a more specific, less producible person? Not which is better written, more moving, or about a weightier topic. A mundane topic revealing a rare person beats a profound topic revealing a familiar one.",
  },
  {
    icon: "pencil",
    h: "Prose is measured separately.",
    p: "Writing quality never moves your score — it is measured on its own channel and reported as a flag: 'prose is carrying it' (reads better than it is) or 'substance ahead of prose' (rare material, undersold telling). That tells you where to spend your remaining effort.",
  },
  {
    icon: "crown",
    h: "Free shows a band. Plus shows the number.",
    p: "After 10 matchups we can place your band honestly; showing a decimal would be false precision. Plus runs 25 matchups — tight enough to justify the exact score — and surfaces all the evidence: every note, every fix, every reason your essay won or lost a matchup.",
  },
  {
    icon: "chart",
    h: "Every score is uncertain, and we say so.",
    p: "When independent readings disagree about your essay, your band gets wider and we tell you. A precise-looking number that doesn't correspond to anything real is worse than no number at all.",
  },
];

export default function HowScoringWorks() {
  return (
    <div className="land">
      <nav className="land-nav">
        <Link href="/" className="logo" style={{ margin: 0, padding: 0 }}>
          <div className="logo-mark">M</div>
          <span className="logo-name">Margin</span>
        </Link>
        <div className="links">
          <Link href="/upgrade">Pricing</Link>
          <Link href="/login" style={{ color: "var(--text)" }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Score your essay
          </Link>
        </div>
      </nav>

      <main className="land-section" style={{ maxWidth: 780, paddingBottom: 80 }}>
        <span className="eyebrow">
          <Icon name="compass" size={13} />
          How scoring works
        </span>
        <h1 className="display" style={{ margin: "16px 0 12px", fontSize: "clamp(34px,4.6vw,50px)" }}>
          A number that <span style={{ color: "var(--brand)" }}>means</span> something.
        </h1>
        <p className="lede">
          Every point is earned in a matchup against another essay. Here is exactly how.
        </p>

        <div className="ladder" style={{ margin: "30px 0 40px" }}>
          {TIERS.map((t) => (
            <div key={t.key} className="ladder-row">
              <b style={{ color: t.ink }}>
                {t.key === "standout" ? "80+" : `${t.min}–${tierCeiling(t) - 1}`}
              </b>
              <TierBadge tier={t} />
              <span>{t.blurb}</span>
            </div>
          ))}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          {SECTIONS.map((s) => (
            <section key={s.h} className="card" style={{ padding: "22px 24px", display: "flex", gap: 16 }}>
              <span
                className="stat-icon"
                style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              >
                <Icon name={s.icon} size={19} />
              </span>
              <div className="stack" style={{ gap: 7 }}>
                <h2 className="h2">{s.h}</h2>
                <p className="copy" style={{ color: "var(--muted)" }}>
                  {s.p}
                </p>
              </div>
            </section>
          ))}
        </div>

        <div className="row" style={{ marginTop: 34, gap: 14, flexWrap: "wrap" }}>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Score your essay free
            <Icon name="arrowRight" size={19} />
          </Link>
          <span className="small">3 free evaluations · no card</span>
        </div>
      </main>
    </div>
  );
}
