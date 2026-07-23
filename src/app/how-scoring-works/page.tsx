import Link from "next/link";

export const metadata = { title: "How scoring works — Margin" };

const SECTIONS = [
  {
    h: "The score is a percentile, not a grade.",
    p: "Your number answers one question: what fraction of applicant essays does this outrank? It comes from head-to-head comparisons against a calibrated pool of real and reference essays — the same way chess ratings work. Nobody hand-waves a 7/10.",
  },
  {
    h: "It is deliberately stringent.",
    p: "A genuinely well-written, sincere, polished essay scores around 45. That is not an insult — it is the honest middle of a strong applicant pool. Polish gets you to 45. Only revealing a person few others could reveal climbs higher. 80+ is near-nonexistent, and we keep it that way on purpose.",
  },
  {
    h: "What actually moves the number.",
    p: "Each comparison asks one question: which essay leaves the reader knowing a more specific, less producible person? Not which is better written, more moving, or about a weightier topic. A mundane topic revealing a rare person beats a profound topic revealing a familiar one.",
  },
  {
    h: "Prose is measured separately.",
    p: "Writing quality never moves your score — it is measured on its own channel and reported as a flag: 'prose is carrying it' (reads better than it is) or 'substance ahead of prose' (rare material, undersold telling). That tells you where to spend your remaining effort.",
  },
  {
    h: "Free shows a band. Plus shows the number.",
    p: "After 10 matchups we can place your band honestly; showing a decimal would be false precision. Plus runs 25 matchups — tight enough to justify the exact score — and surfaces all the evidence: every note, every fix, every reason your essay won or lost a matchup.",
  },
  {
    h: "Every score is uncertain, and we say so.",
    p: "When independent readings disagree about your essay, your band gets wider and we tell you. A precise-looking number that doesn't correspond to anything real is worse than no number at all.",
  },
];

export default function HowScoringWorks() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <nav className="land-nav">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div className="logo-mark" style={{ width: 26, height: 26, fontSize: 15 }}>M</div>
          <span style={{ font: "italic 600 19px var(--serif)" }}>Margin</span>
        </Link>
        <div className="links">
          <Link href="/upgrade">Pricing</Link>
          <Link href="/login" style={{ color: "var(--ink)" }}>Log in</Link>
          <Link href="/signup" className="btn btn-dark" style={{ padding: "9px 18px" }}>
            Score your essay
          </Link>
        </div>
      </nav>

      <main style={{ maxWidth: 660, margin: "0 auto", padding: "40px 24px 80px" }}>
        <span style={{ font: "500 11px var(--mono)", letterSpacing: ".14em", color: "var(--accent)" }}>
          HOW SCORING WORKS
        </span>
        <h1 style={{ margin: "10px 0 8px", font: "500 40px/1.15 var(--serif)" }}>
          A number that <span style={{ fontStyle: "italic" }}>means</span> something.
        </h1>

        <div
          className="card"
          style={{ margin: "26px 0", padding: "18px 22px", background: "var(--paper)", display: "flex", flexDirection: "column", gap: 6 }}
        >
          {[
            ["80+", "Standout. Moves the application. 0.4% of essays."],
            ["60–80", "Begins to help — the reader remembers a detail."],
            ["45", "A genuinely well-written essay. Most essays sit here."],
            ["20–45", "Competent, clean, forgettable."],
            ["<20", "Actively hurts the application. Rare."],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 14, font: "400 13.5px/1.6 var(--sans)", color: "var(--body)" }}>
              <b style={{ font: "600 13px var(--mono)", color: "var(--accent)", minWidth: 52 }}>{k}</b>
              <span>{v}</span>
            </div>
          ))}
        </div>

        {SECTIONS.map((s) => (
          <section key={s.h} style={{ margin: "26px 0" }}>
            <h2 style={{ margin: "0 0 6px", font: "600 19px var(--serif)" }}>{s.h}</h2>
            <p style={{ margin: 0, font: "400 14.5px/1.7 var(--sans)", color: "#5a5346" }}>{s.p}</p>
          </section>
        ))}

        <div style={{ marginTop: 40, display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/signup" className="btn btn-accent" style={{ padding: "13px 26px", fontSize: 14 }}>
            Score your essay free
          </Link>
          <span style={{ font: "400 12px var(--sans)", color: "var(--faint)" }}>
            3 free evaluations · no card
          </span>
        </div>
      </main>
    </div>
  );
}
