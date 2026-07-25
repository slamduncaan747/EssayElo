"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, tierCeiling } from "@/lib/tier";
import Icon from "./Icon";

/** The ⓘ popover: the rank ladder. No contextualizing copy on the number
 *  itself — the meaning lives here (design 6a decision). */
export default function InfoPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", alignSelf: "center" }}>
      <button
        className="info-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="What scores mean"
        aria-expanded={open}
      >
        <Icon name="info" size={14} strokeWidth={2.4} />
      </button>
      {open ? (
        <div className="popover pop-in">
          <h4>What the ranks mean</h4>
          <div className="tier-list">
            {TIERS.map((t) => {
              const ceil = tierCeiling(t);
              return (
                <div key={t.key} className="tier-list-row">
                  <b style={{ color: t.ink }}>
                    {t.key === "standout" ? "80+" : `${t.min}–${ceil - 1}`}
                  </b>
                  <span>
                    <b style={{ color: t.ink }}>{t.name}.</b> {t.blurb}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
