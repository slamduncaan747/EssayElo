import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { Rank } from "@/components/Score";
import TopNav from "@/components/TopNav";
import { TIERS, tierRange } from "@/lib/tier";

export const metadata = { title: "How scoring works — Margin" };

const SECTIONS: { icon: IconName; tint: string; ink: string; h: string; p: string }[] = [
  {
    icon: "compass",
    tint: "var(--brand-50)",
    ink: "var(--brand)",
    h: "The score is a percentile, not a grade.",
    p: "Your number answers one question: where does this essay fall against a carefully ranked reference field? Margin evaluates your essay by comparing it against that field — the same way chess ratings place a player relative to a pool of games, not a fixed answer key. Nobody hand-waves a 7/10.",
  },
  {
    icon: "target",
    tint: "var(--red-50)",
    ink: "var(--red-ink)",
    h: "It is deliberately stringent.",
    p: "A genuinely well-written, sincere, polished essay scores around 45. That is not an insult — it is the honest middle of a strong applicant pool. Polish gets you to 45. Only revealing a person few others could reveal climbs higher. 80+ is near-nonexistent, and we keep it that way on purpose.",
  },
  {
    icon: "chart",
    tint: "var(--gold-50)",
    ink: "var(--gold-press)",
    h: "What actually moves the number.",
    p: "Margin reads for seven qualities: distinctiveness, specificity, reflection, voice, structure, memorability, and prose control. The question behind all of them is the same one a real reader asks — does this leave them knowing a more specific, less interchangeable person? Not which essay is more dramatic, or about a weightier topic. A mundane topic revealing a rare person outscores a profound topic revealing a familiar one.",
  },
  {
    icon: "pencil",
    tint: "var(--brand-50)",
    ink: "var(--brand)",
    h: "Prose control is measured on its own axis.",
    p: "Writing quality is one of the seven dimensions, not a multiplier on the others. A polished essay with little to say and a rough draft revealing something real can land in the same range — the profile tells you which is which.",
  },
  {
    icon: "crown",
    tint: "var(--gold-50)",
    ink: "var(--gold-press)",
    h: "Free shows a band. Plus shows the number.",
    p: "Early in the analysis, we can only place your score honestly within a range; showing a decimal at that point would be false precision. Once the range has narrowed enough, Plus unlocks the exact score and the full evidence behind it — every dimension, every excerpt, every revision priority.",
  },
  {
    icon: "chart",
    tint: "var(--green-50)",
    ink: "var(--green-ink)",
    h: "Every score is uncertain, and we say so.",
    p: "When Margin's read on your essay isn't yet settled, your band stays wide and we tell you. A precise-looking number that doesn't correspond to anything real is worse than no number at all.",
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
            Margin evaluates your essay against a carefully ranked reference field. Here is
            exactly how that works, and why the scale is set where it is.
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
