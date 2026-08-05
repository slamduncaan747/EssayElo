import { DIMENSION_LABELS } from "@/lib/evaluation/copy";
import type { StrengthCard as StrengthCardT } from "@/lib/evaluation/types";
import Icon from "../Icon";

function StrengthCard({ strength }: { strength: StrengthCardT }) {
  const label = DIMENSION_LABELS[strength.category as keyof typeof DIMENSION_LABELS] ?? strength.category;
  return (
    <div className="card card-pad stack g3 strength-card">
      <div className="row g2">
        <span className="strength-mark">
          <Icon name="check" size={13} strokeWidth={3} />
        </span>
        <span className="chip chip-green">{label}</span>
      </div>
      <span className="h3">{strength.title}</span>
      <p className="copy">{strength.explanation}</p>
      <blockquote className="dimension-excerpt">&ldquo;{strength.excerpt}&rdquo;</blockquote>
      <p className="small">{strength.whyItMatters}</p>
      <div className="callout callout-green">{strength.protectNote}</div>
    </div>
  );
}

/** Exactly two — the spec is deliberate about not overwhelming the writer
 *  with a full list of everything that works. */
export function StrengthCards({ strengths }: { strengths: StrengthCardT[] }) {
  if (strengths.length === 0) return null;
  return (
    <section className="stack g3" aria-labelledby="strengths-heading">
      <h2 id="strengths-heading" className="h2">
        What is already working
      </h2>
      <div className="strength-grid">
        {strengths.slice(0, 2).map((s, i) => (
          <StrengthCard key={i} strength={s} />
        ))}
      </div>
    </section>
  );
}
