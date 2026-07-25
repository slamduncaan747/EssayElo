import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { Medal, Rank, ScoreRing } from "@/components/Score";
import { TIERS, tierRange } from "@/lib/tier";
import TopNav from "@/components/TopNav";

const STEPS: { icon: IconName; tint: string; ink: string; h: string; p: string }[] = [
  {
    icon: "pencil",
    tint: "var(--brand-50)",
    ink: "var(--brand)",
    h: "Paste your essay",
    p: "Formatting stripped, word count checked, prompt detected. Under a minute from paste to score.",
  },
  {
    icon: "versus",
    tint: "var(--gold-50)",
    ink: "var(--gold-press)",
    h: "It plays matchups",
    p: "Your essay goes head-to-head against a calibrated pool, one question at a time — exactly how chess ratings are earned.",
  },
  {
    icon: "target",
    tint: "var(--green-50)",
    ink: "var(--green-ink)",
    h: "Fix what matters",
    p: "Plus reviews every line: what's carrying the essay, what's dragging it, and which fixes are worth real points.",
  },
];

export default function Landing() {
  return (
    <div className="land">
      <TopNav />

      <section className="band hero">
        <div className="stack g6">
          <span className="eyebrow">
            <Icon name="spark" size={13} />
            For students aiming at the T20
          </span>
          <h1 className="display" style={{ textWrap: "pretty" }}>
            Your essay has a score.
            <br />
            <span style={{ color: "var(--brand)" }}>Most people never learn it.</span>
          </h1>
          <p className="lede" style={{ maxWidth: 480 }}>
            Margin scores your college essay out of 100 by playing it against thousands of
            others — deliberately stringent, the way admissions actually reads.
          </p>
          <div className="row wrap g4">
            <Link href="/signup" className="btn btn-primary btn-xl">
              Score your essay free
              <Icon name="arrowRight" size={20} />
            </Link>
            <span className="small">3 free evaluations · no card</span>
          </div>
          <div className="hero-proof">
            <div>
              <b>48,000+</b>
              <span>essays scored</span>
            </div>
            <div>
              <b>44.2</b>
              <span>average score</span>
            </div>
            <div>
              <b>0.4%</b>
              <span>ever score 80+</span>
            </div>
          </div>
        </div>

        {/* Product shot */}
        <div className="device">
          <div className="device-main">
            <div className="spread">
              <span className="label">Essay review</span>
              <span className="chip chip-onDark">Free</span>
            </div>

            <div className="stack g4" style={{ alignItems: "center" }}>
              <ScoreRing value={58} display="54–63" label="out of 100" size={168} onDark />
              <Rank tier={TIERS[2]} size="lg" onDark />
            </div>

            <div>
              <div className="spread" style={{ marginBottom: 10 }}>
                <span className="label">Essay arc</span>
                <span className="tiny" style={{ color: "var(--on-dark-3)" }}>
                  by paragraph
                </span>
              </div>
              <div className="bars bars-dark" style={{ height: 96 }}>
                {[74, 88, 46, 91, 33].map((h, i) => (
                  <div
                    key={i}
                    className="bar"
                    style={{
                      height: `${h}%`,
                      background:
                        h < 40 ? "var(--red)" : h < 65 ? "var(--brand)" : "var(--gold)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="note-fix">
              <b>Biggest detractor</b>
              &ldquo;¶4 fades at the close — the cliché is doing the damage.&rdquo;
            </div>
          </div>

          <div className="device-chip" style={{ top: 78, left: -52 }}>
            <Medal value={88} display="88" size={38} />
            <span>
              <b>Standout</b>
              <span>top 0.4%</span>
            </span>
          </div>
          <div className="device-chip" style={{ bottom: 54, right: -46 }}>
            <span
              className="stat-icon"
              style={{
                background: "var(--green-50)",
                color: "var(--green-ink)",
                width: 34,
                height: 34,
              }}
            >
              <Icon name="arrowUp" size={17} />
            </span>
            <span>
              <b>+9 pts</b>
              <span>after edits</span>
            </span>
          </div>
        </div>
      </section>

      <section className="band band-pad" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="label">How it works</span>
          <h2 className="h1">Three steps to a number that means something.</h2>
        </div>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <div key={s.h} className="step-card">
              <span className="step-card-n">{i + 1}</span>
              <span
                className="step-card-icon"
                style={{ background: s.tint, color: s.ink }}
              >
                <Icon name={s.icon} size={22} />
              </span>
              <span className="h2">{s.h}</span>
              <span className="copy" style={{ color: "var(--text-3)" }}>
                {s.p}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="band band-pad" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="label">The ladder</span>
          <h2 className="h1">Six ranks. Almost nobody reaches the top.</h2>
          <p className="lede">
            45 is a genuinely well-written essay — the honest middle of a strong applicant
            pool. Polish gets you there. Only revealing a person few others could reveal
            climbs higher.
          </p>
        </div>
        <div className="ladder">
          {TIERS.map((t, i) => (
            <div key={t.key} className={`rung rung-w${TIERS.length - i}`}>
              <span className="rung-score num" style={{ color: t.ink }}>
                {tierRange(t)}
              </span>
              <span className="rung-body">
                <span className="rung-name" style={{ color: t.ink }}>
                  <Rank tier={t} />
                </span>
                <span className="rung-blurb">{t.blurb}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="band band-pad" style={{ paddingTop: 0 }}>
        <div className="cta-band">
          <h2 className="display" style={{ fontSize: "clamp(30px,3.6vw,44px)" }}>
            Find out where you actually stand.
          </h2>
          <p className="lede" style={{ color: "var(--on-dark-2)", maxWidth: 470 }}>
            Three free evaluations a month. No card, and no paywall in front of your number.
          </p>
          <Link href="/signup" className="btn btn-gold btn-xl">
            Score your essay free
            <Icon name="arrowRight" size={20} />
          </Link>
        </div>
      </section>

      <footer className="foot">
        <div className="foot-in">
          <span className="row g2">
            <span
              className="logo-mark"
              style={{ width: 28, height: 28, fontSize: 14, borderRadius: 9 }}
            >
              M
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-.02em", color: "var(--text)" }}>
              Margin
            </span>
          </span>
          <span>Privacy · Terms · Your essays are never used for training</span>
        </div>
      </footer>
    </div>
  );
}
