"use client";

import { useEffect, useRef, useState } from "react";

/** The ⓘ popover: what scores mean. No contextualizing copy on the number
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
      <button className="info-btn" onClick={() => setOpen((v) => !v)} aria-label="What scores mean">
        i
      </button>
      {open ? (
        <div className="popover">
          <h4>What scores mean</h4>
          <table>
            <tbody>
              <tr>
                <td>80+</td>
                <td>Standout. Moves the application. 0.4% of essays.</td>
              </tr>
              <tr>
                <td>60–80</td>
                <td>Begins to help — the reader remembers a detail.</td>
              </tr>
              <tr>
                <td>45</td>
                <td>A genuinely well-written essay. Most sit here.</td>
              </tr>
              <tr>
                <td>20–45</td>
                <td>Competent, clean, forgettable.</td>
              </tr>
              <tr>
                <td>&lt;20</td>
                <td>Actively hurts the application. Rare.</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
