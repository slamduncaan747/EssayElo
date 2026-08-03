"use client";

export function ContinuousProgressBar({
  progress,
  determinate,
  onDark = false,
}: {
  progress: number;
  determinate: boolean;
  onDark?: boolean;
}) {
  return (
    <div
      className={`meter meter-sm ${onDark ? "meter-dark" : ""} ${!determinate ? "meter-indeterminate" : ""}`}
      role="progressbar"
      aria-valuenow={determinate ? Math.round(progress) : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Evaluation progress"
    >
      {determinate ? (
        <div className="meter-fill" style={{ left: 0, width: `${Math.max(2, progress)}%` }} />
      ) : null}
    </div>
  );
}
