import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { Rank } from "@/components/Score";
import TopNav from "@/components/TopNav";
import { TIERS, tierRange } from "@/lib/tier";

export const metadata = { title: "How scoring works — Margin" };

const SECTIONS: { icon: IconName; tint: string; ink: string; h: string; p: string }[] = [
  {
    icon: "versus",
    tint: "var(--brand-50)",
    ink: "var(--brand)",
    h: "The score is a percentile, not a grade.",
    p: "Your number answers one question: what fraction of applicant essays does this outrank? It comes from head-to-head comparisons against a calibrated pool of real and reference essays — the same way chess ratings work. Nobody hand-waves a 7/10.",
  },
  {
    icon: "target",
    tint: "var(--red-50)",
    ink: "var(--red-ink)",
    h: "It is deliberately stringent.",
    p: "A genuinely well-written, sincere, polished essay scores around 45. That is not an insult — it is the honest middle of a strong applicant pool. Polish gets you to 45. Only revealing a person few others could reveal climbs higher. 80+ is near-nonexistent, and we keep it that way on purpose.",
  },
  {
    icon: "compass",
    tint: "var(--gold-50)",
    ink: "var(--gold-press)",
    h: "What actually moves the number.",
    p: "Each comparison asks one question: which essay leaves the reader knowing a more specific, less producible person? Not which is better written, more moving, or about a weightier topic. A mundane topic revealing a rare person beats a profound topic revealing a familiar one.",
  },
  {
    icon: "pencil",
    tint: "var(--brand-50)",
    ink: "var(--brand)",
    h: "Prose is measured separately.",
    p: "Writing quality never moves your score — it is measured on its own channel and reported as a flag: prose is carrying it (reads better than it is), or substance ahead of prose (rare material, undersold telling). That tells you where to spend your remaining effort.",
  },
  {
    icon: "crown",
    tint: "var(--gold-50)",
    ink: "var(--gold-press)",
    h: "Free shows a band. Plus shows the number.",
    p: "After 10 matchups we can place your band honestly; showing a decimal would be false precision. Plus runs 25 matchups — tight enough to justify the exact score — and surfaces all the evidence: every note, every fix, every reason your essay won or lost a matchup.",
  },
  {
    icon: "chart",
    tint: "var(--green-50)",
    ink: "var(--green-ink)",
    h: "Every score is uncertain, and we say so.",
    p: "When independent readings disagree about your essay, your band gets wider and we tell you. A precise-looking number that doesn't correspond to anything real is worse than no number at all.",
  },
];

export default function HowScoringWorks() {
  return (
    <div className="land">
      <TopNav />

      <main className="band" style={{ maxWidth: 860, paddingBottom: "var(--s10)" }}>
        <div className="stack g5" style={{ padding: "var(--s9) 0 var(--s7)" }}>
          <span className="eyebrow">
            <Icon name="compass" size={13} />
            How scoring works
          </span>
          <h1 className="display" style={{ fontSize: "clamp(34px,4.4vw,52px)" }}>
            A number that <span style={{ color: "var(--brand)" }}>means</span> something.
          </h1>
          <p className="lede">
            Every point is earned in a matchup against another essay. Here is exactly how it
            works, and why the scale is set where it is.
          </p>
        </div>

        <div className="ladder" style={{ marginBottom: "var(--s9)" }}>
          {TIERS.map((t, i) => (
            <div key={t.key} className={`rung rung-w${TIERS.length - i}`}>
              <span className="rung-score num" style={{ color: t.ink }}>
                {tierRange(t)}
              </span>
              <span className="rung-body">
                <span className="rung-name">
                  <Rank tier={t} />
                </span>
                <span className="rung-blurb">{t.blurb}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="stack g4">
          {SECTIONS.map((s) => (
            <section key={s.h} className="card card-pad" style={{ display: "flex", gap: "var(--s5)" }}>
              <span className="stat-icon" style={{ background: s.tint, color: s.ink }}>
                <Icon name={s.icon} size={20} />
              </span>
              <div className="stack g3">
                <h2 className="h2">{s.h}</h2>
                <p className="copy">{s.p}</p>
              </div>
            </section>
          ))}
        </div>

        <div className="row wrap g4" style={{ marginTop: "var(--s8)" }}>
          <Link href="/signup" className="btn btn-primary btn-xl">
            Score your essay free
            <Icon name="arrowRight" size={20} />
          </Link>
          <span className="small">3 free evaluations · no card</span>
        </div>
      </main>
    </div>
  );
}
