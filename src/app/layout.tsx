import type { Metadata } from "next";
import { IBM_Plex_Mono, Newsreader, Nunito } from "next/font/google";
import "./globals.css";

/** Nunito carries the interface (rounded, heavy); Newsreader is reserved for
 *  the essay itself; Plex Mono only for diagnostics. */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
});
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Margin — your essay has a score",
  description:
    "Margin evaluates your college essay against a carefully ranked reference field — deliberately stringent, so a strong score actually means something.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The font variables must land on <html>: globals.css derives --sans/--serif
  // from them inside :root, and a custom property only sees others declared in
  // its own scope. On <body> they resolve to nothing and every font falls back.
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${newsreader.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
