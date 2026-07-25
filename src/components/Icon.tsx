/**
 * Inline icon set. Stroked, 2px, rounded joins — one visual family across the
 * whole app, with no icon-font or runtime dependency.
 */

export type IconName =
  | "stack"
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
  | "chevronDown"
  | "spark"
  | "target"
  | "trophy"
  | "info"
  | "swords";

const PATHS: Record<IconName, React.ReactNode> = {
  stack: (
    <>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H15l5 5v8.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
      <path d="M14.5 4v5.5H20" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M15.2 8.8 13.6 13.6 8.8 15.2l1.6-4.8z" />
    </>
  ),
  crown: (
    <>
      <path d="M4 17.5 5.2 7.8l4 3.4L12 5.6l2.8 5.6 4-3.4L20 17.5z" />
      <path d="M4.6 20h14.8" />
    </>
  ),
  bolt: <path d="M13.4 3 5.6 13.4h5.3L10.2 21l8.2-10.6h-5.4z" />,
  pencil: (
    <>
      <path d="M4.5 19.5h4L20 8a2.5 2.5 0 0 0-3.5-3.5L5 16z" />
      <path d="M14.8 5.9 18.1 9.2" />
    </>
  ),
  chart: (
    <>
      <path d="M4.5 19.5h15" />
      <path d="M7.5 16V9.5M12 16V5.5M16.5 16v-4" />
    </>
  ),
  check: <path d="m5 12.6 4.6 4.4L19 6.8" />,
  cross: <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />,
  star: (
    <path d="m12 4 2.5 5.2 5.5.8-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.8z" />
  ),
  flag: (
    <>
      <path d="M6 21V4.5" />
      <path d="M6 5h11l-2.2 3.6L17 12.5H6z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3.2 2" />
    </>
  ),
  share: (
    <>
      <path d="M12 15.5V4.2" />
      <path d="m8.2 7.8 3.8-3.6 3.8 3.6" />
      <path d="M5.5 13.5v5a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.5 12h14" />
      <path d="m13 6.5 5.5 5.5-5.5 5.5" />
    </>
  ),
  arrowUp: (
    <>
      <path d="M12 19.5v-15" />
      <path d="m6 10.5 6-6 6 6" />
    </>
  ),
  chevronDown: <path d="m6.5 9.5 5.5 5.5 5.5-5.5" />,
  spark: (
    <>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9z" />
      <path d="M18.5 16.2 19.2 18l1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.5 4.5h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 6H5a2 2 0 0 0 2.5 3.5M16.5 6H19a2 2 0 0 1-2.5 3.5" />
      <path d="M12 14v3.5M8.5 20h7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2" />
      <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  swords: (
    <>
      <path d="M4 4h3l9.5 9.5-3 3L4 7z" />
      <path d="M20 4h-3l-4 4 3 3z" />
      <path d="m5.5 19.5 3-3M18.5 19.5l-3-3" />
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
