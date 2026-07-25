/**
 * Inline icon set. One family, 24px grid, 2px rounded strokes, drawn to stay
 * legible down to 13px. No icon font, no runtime dependency.
 */

export type IconName =
  | "essays"
  | "plus"
  | "compass"
  | "crown"
  | "bolt"
  | "pencil"
  | "chart"
  | "check"
  | "cross"
  | "star"
  | "flag"
  | "clock"
  | "share"
  | "lock"
  | "arrowRight"
  | "arrowUp"
  | "chevron"
  | "spark"
  | "target"
  | "trophy"
  | "info"
  | "versus";

const PATHS: Record<IconName, React.ReactNode> = {
  // A stack of pages — the essay library.
  essays: (
    <>
      <rect x="7" y="3.5" width="13" height="14" rx="2.5" />
      <path d="M16.5 20.5h-9A3.5 3.5 0 0 1 4 17V7" />
      <path d="M10.5 8h6M10.5 11.5h6M10.5 15h3.5" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  // Compass rose — "how it works".
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.6 8.4 13.7 13.7 8.4 15.6l1.9-5.3z" />
    </>
  ),
  crown: (
    <>
      <path d="M4 17.2 5.3 7.6l4.1 3.6L12 5.4l2.6 5.8 4.1-3.6L20 17.2z" />
      <path d="M4.9 20.2h14.2" />
    </>
  ),
  bolt: <path d="M13.2 2.8 5.4 13.2h5.2L10.8 21.2l7.8-10.4h-5.2z" />,
  pencil: (
    <>
      <path d="M4.5 19.5h4L20 8a2.47 2.47 0 0 0-3.5-3.5L5 16z" />
      <path d="M14.9 6 18 9.1" />
    </>
  ),
  chart: (
    <>
      <path d="M4.5 19.5h15" />
      <path d="M7.6 16.5V11M12 16.5V5.5M16.4 16.5v-3.5" />
    </>
  ),
  check: <path d="m5.2 12.4 4.4 4.4 9.2-9.6" />,
  cross: <path d="M6.8 6.8 17.2 17.2M17.2 6.8 6.8 17.2" />,
  star: (
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8z" />
  ),
  flag: (
    <>
      <path d="M6 21.2V4" />
      <path d="M6 5h11.4l-2.3 3.7 2.3 3.7H6z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.3 2" />
    </>
  ),
  share: (
    <>
      <path d="M12 15.2V3.8" />
      <path d="m8.3 7.4 3.7-3.6 3.7 3.6" />
      <path d="M5.6 13v5.6a1.8 1.8 0 0 0 1.8 1.8h9.2a1.8 1.8 0 0 0 1.8-1.8V13" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10.4" width="14.4" height="9.8" rx="2.6" />
      <path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.4 12h14.4" />
      <path d="m13.2 6.4 5.6 5.6-5.6 5.6" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19.6V5.2" />
      <path d="m6.4 10.8 5.6-5.6 5.6 5.6" />
    </>
  ),
  chevron: <path d="m6.6 9.4 5.4 5.2 5.4-5.2" />,
  spark: (
    <>
      <path d="M11 3.4 12.6 8l4.6 1.6L12.6 11.2 11 15.8 9.4 11.2 4.8 9.6 9.4 8z" />
      <path d="M18 15.2l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.6 4.4h8.8v4.8a4.4 4.4 0 0 1-8.8 0z" />
      <path d="M7.6 6H5.2a2.2 2.2 0 0 0 2.6 3.8M16.4 6h2.4a2.2 2.2 0 0 1-2.6 3.8" />
      <path d="M12 13.6v3.6M8.4 20.2h7.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11.2v5" />
      <circle cx="12" cy="8.1" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // Two sides closing on a centre line — a head-to-head matchup.
  versus: (
    <>
      <path d="M3.4 6.6 8.2 12l-4.8 5.4" />
      <path d="M20.6 6.6 15.8 12l4.8 5.4" />
      <path d="M12 3.6v16.8" />
    </>
  ),
};

export default function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
