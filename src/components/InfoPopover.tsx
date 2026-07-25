"use client";

import { useEffect, useRef, useState } from "react";
import { TIERS, tierRange } from "@/lib/tier";
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex" }}>
      <button
        className="info-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="What the ranks mean"
        aria-expanded={open}
      >
        <Icon name="info" size={14} strokeWidth={2.4} />
      </button>
      {open ? (
        <div className="popover pop-in">
          <h4>What the ranks mean</h4>
          <div className="pop-list">
            {TIERS.map((t) => (
              <div key={t.key} className="pop-row">
                <b style={{ color: t.ink }}>{tierRange(t)}</b>
                <span>
                  <b style={{ color: t.ink }}>{t.name}.</b> {t.blurb}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
