"use client";

import { useState } from "react";
import type { EvaluationView } from "@/lib/types";
import EvaluatingView from "./EvaluatingView";
import ReviewView from "./ReviewView";

/** Shows the evaluating animation once, right after creation, then the review. */
export default function EssayResult({
  title,
  version,
  content,
  view,
  plan,
  fresh,
}: {
  title: string;
  version: number;
  content: string;
  view: EvaluationView;
  plan: "free" | "plus";
  fresh: boolean;
}) {
  const [revealed, setRevealed] = useState(!fresh);

  if (!revealed) {
    return (
      <EvaluatingView
        title={title}
        version={version}
        content={content}
        onDone={() => setRevealed(true)}
      />
    );
  }

  return (
    <ReviewView
      title={title}
      version={version}
      content={content}
      view={view}
      plan={plan}
    />
  );
}
