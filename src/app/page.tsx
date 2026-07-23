import Link from "next/link";

/** Landing page — design 11a. */
export default function Landing() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <nav className="land-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="logo-mark" style={{ width: 26, height: 26, fontSize: 15 }}>
            M
          </div>
          <span style={{ font: "italic 600 19px var(--serif)" }}>Margin</span>
        </div>
        <div className="links">
          <Link href="/how-scoring-works">How scoring works</Link>
          <Link href="/upgrade">Pricing</Link>
          <Link href="/login" style={{ color: "var(--ink)" }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-dark" style={{ padding: "9px 18px" }}>
            Score your essay
          </Link>
        </div>
      </nav>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 460px",
          gap: 48,
          padding: "52px 56px 60px",
          alignItems: "center",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              font: "500 11px var(--mono)",
              letterSpacing: ".14em",
              color: "var(--accent)",
            }}
          >
            FOR STUDENTS AIMING AT THE T20
          </span>
          <h1
            style={{
              margin: 0,
              font: "500 52px/1.1 var(--serif)",
              letterSpacing: "-.015em",
            }}
          >
            Your essay has a score.
            <br />
            <span style={{ fontStyle: "italic" }}>Most people never learn it.</span>
          </h1>
          <p
            style={{
              margin: 0,
              font: "400 15.5px/1.65 var(--sans)",
              color: "#6e6759",
              maxWidth: 440,
            }}
          >
            Margin evaluates your college essay against thousands of others and
            returns a score out of 100 — deliberately stringent, the way
            admissions actually reads.
          </p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/signup" className="btn btn-accent" style={{ padding: "13px 26px", fontSize: 14 }}>
              Score your essay free
            </Link>
            <span style={{ font: "400 12px var(--sans)", color: "var(--faint)" }}>
              3 free evaluations · no card
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 26,
              paddingTop: 8,
              font: "400 12px var(--sans)",
              color: "var(--muted)",
            }}
          >
            <span>
              <strong style={{ font: "600 16px var(--serif)", color: "var(--ink)" }}>
                48,000+
              </strong>
              <br />
              essays scored
            </span>
            <span>
              <strong style={{ font: "600 16px var(--serif)", color: "var(--ink)" }}>
                44.2
              </strong>
              <br />
              average score
            </span>
            <span>
              <strong style={{ font: "600 16px var(--serif)", color: "var(--ink)" }}>
                0.4%
              </strong>
              <br />
              ever score 80+
            </span>
          </div>
        </div>

        {/* Score card mock */}
        <div
          style={{
            background: "var(--ink)",
            color: "var(--cream)",
            borderRadius: 16,
            padding: "28px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "0 24px 60px rgba(40,30,15,.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="mono-label" style={{ color: "rgba(245,241,233,.45)" }}>
              ESSAY REVIEW
            </span>
            <span className="pill-free">Free</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ font: "600 58px/1 var(--serif)", color: "var(--gold)" }}>
              54–63
            </span>
            <div className="track" style={{ width: "100%" }}>
              <div className="track-fill" style={{ left: "54%", width: "9%" }} />
            </div>
          </div>
          <div className="arc-bars" style={{ height: 40, padding: "7px 9px", gap: 4 }}>
            <div className="arc-bar" style={{ height: "88%", background: "var(--gold)" }} />
            <div className="arc-bar" style={{ height: "56%", background: "rgba(201,162,90,.7)" }} />
            <div className="arc-bar" style={{ height: "72%", background: "var(--gold)" }} />
            <div className="arc-bar" style={{ height: "30%", background: "var(--red)" }} />
          </div>
          <span style={{ font: "400 12px/1.55 var(--sans)", color: "rgba(245,241,233,.6)" }}>
            &ldquo;¶4 fades at the close — the cliché is doing the damage.&rdquo;
          </span>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          borderTop: "1px solid var(--border)",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {[
          {
            n: "01",
            h: "Paste your essay",
            p: "Formatting stripped, word count checked, prompt detected. Under a minute to a score.",
          },
          {
            n: "02",
            h: "Get a stringent score",
            p: "Out of 100, calibrated hard: 45 is a solid essay. No inflation, no participation trophies.",
          },
          {
            n: "03",
            h: "Fix what matters",
            p: "Premium reviews every line — what's carrying your essay, what's dragging it, and the fixes worth points.",
          },
        ].map((s, i) => (
          <div
            key={s.n}
            style={{
              padding: "34px 40px",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span style={{ font: "600 13px var(--mono)", color: "var(--accent)" }}>{s.n}</span>
            <span style={{ font: "600 16px var(--serif)" }}>{s.h}</span>
            <span style={{ font: "400 12.5px/1.6 var(--sans)", color: "var(--muted)" }}>
              {s.p}
            </span>
          </div>
        ))}
      </section>

      <footer
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 56px",
          borderTop: "1px solid var(--border)",
          font: "400 12px var(--sans)",
          color: "var(--faint)",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <span style={{ font: "italic 600 14px var(--serif)", color: "var(--ink)" }}>Margin</span>
        <span>Privacy · Terms · Your essays are never used for training</span>
      </footer>
    </div>
  );
}
