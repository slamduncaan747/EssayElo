import Link from "next/link";
import Icon from "@/components/Icon";
import { ScoreRing } from "@/components/Score";
import { DimensionRadar } from "@/components/evaluation/DimensionRadar";
import TopNav from "@/components/TopNav";

export default function Landing() {
  return (
    <div
      className="land"
      style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}
    >
      <TopNav />

      <section
        className="band hero"
        style={{ flex: 1, display: "flex", alignItems: "center", paddingTop: 0, paddingBottom: 0 }}
      >
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
            Margin evaluates your essay against a carefully ranked reference field —
            deliberately stringent, so a strong score actually means something.
          </p>
          <div className="row wrap g4">
            <Link href="/dashboard" className="btn btn-primary btn-xl">
              Score your essay free
              <Icon name="arrowRight" size={20} />
            </Link>
            <span className="small">3 free evaluations · no card</span>
          </div>
        </div>

        <div className="device">
          <div className="device-main">
            <div className="spread">
              <span className="label">Essay review</span>
              <span className="chip chip-onDark">Free</span>
            </div>

            <div className="stack g4" style={{ alignItems: "center" }}>
              <ScoreRing value={58} display="54–63" label="MARGIN SCORE" size={140} onDark />
            </div>

            <div className="stack g2" style={{ alignItems: "center" }}>
              <span className="label">Dimension profile</span>
              <DimensionRadar
                dimensions={{
                  distinctiveness: 68,
                  specificity: 74,
                  reflection: 31,
                  voice: 79,
                  structure: 52,
                  prose_control: 83,
                  memorability: 58,
                }}
                size={170}
                onDark
              />
            </div>
          </div>
        </div>
      </section>

      <footer className="foot" style={{ flex: "none" }}>
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
