"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Presentation buffer for the live score.
 *
 * Raw snapshots can arrive as fast as the transport delivers them, but the
 * spec is explicit: no more than one visible update every 1-1.5s, each
 * animated over ~600-800ms with an ease-out curve, and updates that land
 * close together should coalesce into one visible step rather than
 * twitching through every intermediate value.
 */
export function useScoreBuffer(rawScore: number | null, isFinal: boolean) {
  const [displayed, setDisplayed] = useState<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const lastCommitAt = useRef(0);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deltaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevRaw = useRef<number | null>(null);

  useEffect(() => {
    if (rawScore == null) return;
    if (prevRaw.current === rawScore) return;
    prevRaw.current = rawScore;

    const commit = () => {
      lastCommitAt.current = Date.now();
      setDisplayed((prevDisplayed) => {
        if (prevDisplayed != null) {
          const d = Math.round((rawScore - prevDisplayed) * 10) / 10;
          if (Math.abs(d) >= (isFinal ? 0.3 : 1)) {
            setDelta(d);
            if (deltaTimer.current) clearTimeout(deltaTimer.current);
            deltaTimer.current = setTimeout(() => setDelta(null), 2200);
          }
        }
        return rawScore;
      });
    };

    if (isFinal) {
      // The final result is authoritative — show it immediately, no buffering.
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      commit();
      return;
    }

    const since = Date.now() - lastCommitAt.current;
    const minGap = 1200;
    if (since >= minGap) {
      commit();
    } else {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(commit, minGap - since);
    }

    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawScore, isFinal]);

  useEffect(
    () => () => {
      if (deltaTimer.current) clearTimeout(deltaTimer.current);
    },
    []
  );

  return { displayed, delta };
}
