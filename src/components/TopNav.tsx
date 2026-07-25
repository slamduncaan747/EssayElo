import Link from "next/link";

/** Marketing-site nav: sticky, blurred, shared by every public page. */
export default function TopNav() {
  return (
    <nav className="topnav">
      <div className="topnav-in">
        <Link href="/" className="logo" style={{ margin: 0, padding: 0 }}>
          <span className="logo-mark">M</span>
          <span className="logo-name">Margin</span>
        </Link>
        <div className="topnav-links">
          <Link href="/how-scoring-works">How scoring works</Link>
          <Link href="/upgrade">Pricing</Link>
          <Link href="/login" style={{ color: "var(--text)" }}>
            Log in
          </Link>
          <Link href="/signup" className="btn btn-primary btn-sm">
            Score your essay
          </Link>
        </div>
      </div>
    </nav>
  );
}
