import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { ScoreRing, TierBadge } from "@/components/Score";
import { TIERS, tierCeiling } from "@/lib/tier";

const STEPS: { n: string; icon: IconName; h: string; p: string }[] = [
  {
    n: "1",
    icon: "pencil",
    h: "Paste your essay",
    p: "Formatting stripped, word count checked, prompt detected. Under a minute to a score.",
  },
  {
    n: "2",
    icon: "swords",
    h: "It plays matchups",
    p: "Your essay goes head-to-head against a calibrated pool — the same way chess ratings are earned.",
  },
  {
    n: "3",
    icon: "target",
    h: "Fix what matters",
    p: "Plus reviews every line: what's carrying your essay, what's dragging it, and the fixes worth points.",
  },
];

export default function Landing() {
  return (
    <div className="land">
      <nav className="land-nav">
        <Link href="/" className="logo" style={{ margin: 0, padding: 0 }}>
          <div className="logo-mark">M</div>
          <span className="logo-name">Margin</span>
        </Link>
        <div className="links">
          <Link href="/how-scoring-works">How scoring works</Link>
          <Link href="/upgrade">Pricing</Link>
          <Link href="/login" style={{ color: "var(--text)" }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Score your essay
          </Link>
        </div>
      </nav>

      <section className="land-section hero">
        <div className="stack" style={{ gap: 22 }}>
          <span className="eyebrow">
            <Icon name="spark" size={13} />
            For students aiming at the T20
          </span>
          <h1 className="display">
            Your essay has a score.
            <br />
            <span style={{ color: "var(--brand)" }}>Most people never learn it.</span>
          </h1>
          <p className="lede" style={{ maxWidth: 470 }}>
            Margin evaluates your college essay against thousands of others and returns a
            score out of 100 — deliberately stringent, the way admissions actually reads.
          </p>
          <div className="row" style={{ gap: 14, flexWrap: "wrap" }}>
            <Link href="/signup" className="btn btn-primary btn-lg">
              Score your essay free
              <Icon name="arrowRight" size={19} />
            </Link>
            <span className="small">3 free evaluations · no card</span>
          </div>
          <div className="hero-stats">
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

        {/* Score card mock */}
        <div className="card-dark" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="spread">
            <span className="label">Essay review</span>
            <span className="chip chip-onDark">Free</span>
          </div>
          <div className="stack" style={{ alignItems: "center", gap: 13 }}>
            <ScoreRing value={58} display="54–63" label="out of 100" size={162} onDark />
            <TierBadge tier={TIERS[2]} onDark />
          </div>
          <div className="bars bars-dark" style={{ height: 56 }}>
            {[88, 56, 72, 30, 64].map((h, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  height: `${h}%`,
                  background: h < 40 ? "var(--red)" : h < 65 ? "var(--brand)" : "var(--gold)",
                }}
              />
            ))}
          </div>
          <div className="note-fix">
            <b>Biggest detractor</b>
            &ldquo;¶4 fades at the close — the cliché is doing the damage.&rdquo;
          </div>
        </div>
      </section>

      <section className="land-section how-grid">
        {STEPS.map((s) => (
          <div key={s.n} className="how-card">
            <span className="how-num">
              <Icon name={s.icon} size={19} />
            </span>
            <span className="h2">{s.h}</span>
            <span className="copy" style={{ color: "var(--muted)" }}>
              {s.p}
            </span>
          </div>
        ))}
      </section>

      <section className="land-section" style={{ paddingBottom: 64 }}>
        <div className="stack" style={{ gap: 8, marginBottom: 20 }}>
          <span className="label">The ladder</span>
          <h2 className="h1">Six ranks. Almost nobody reaches the top.</h2>
          <p className="lede">
            45 is a genuinely well-written essay. That is the honest middle of a strong
            applicant pool — and we keep it that way on purpose.
          </p>
        </div>
        <div className="ladder">
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
      </section>

      <section className="land-section" style={{ paddingBottom: 70 }}>
        <div
          className="card-dark"
          style={{
            padding: "38px 34px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            textAlign: "center",
          }}
        >
          <h2 className="h1" style={{ color: "var(--on-dark)" }}>
            Find out where you actually stand.
          </h2>
          <p className="lede" style={{ color: "var(--on-dark-2)", maxWidth: 460 }}>
            Three free evaluations a month. No card, no upsell wall before you see a number.
          </p>
          <Link href="/signup" className="btn btn-gold btn-lg">
            Score your essay free
            <Icon name="arrowRight" size={19} />
          </Link>
        </div>
      </section>

      <footer className="land-foot">
        <div className="land-foot-inner">
          <span className="logo" style={{ margin: 0, padding: 0, gap: 8 }}>
            <div className="logo-mark" style={{ width: 26, height: 26, fontSize: 13, borderRadius: 9 }}>
              M
            </div>
            <span className="logo-name" style={{ fontSize: 16 }}>
              Margin
            </span>
          </span>
          <span>Privacy · Terms · Your essays are never used for training</span>
        </div>
      </footer>
    </div>
  );
}
