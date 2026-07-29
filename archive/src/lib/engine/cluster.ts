/**
 * Theme clustering for harvested match reasoning.
 *
 * The product's claim is that volume converts observation into diagnosis: a
 * pattern in 3 of 10 readings is suggestive, the same pattern in 8 of 25 is a
 * finding. That only holds if repeated observations are actually *recognised*
 * as repeats. Independent readings never phrase a reason identically, so exact
 * deduplication collapses nothing and every reason looks like a one-off.
 *
 * This groups reasons that say the same thing in different words, counts them,
 * and weights them by how decisive the match was — so the feedback can lead
 * with what readers kept coming back to, and say how many said it.
 */

/** Words that carry no topical signal; dropped before comparison. */
const STOP = new Set([
  "a", "an", "the", "and", "or", "but", "if", "of", "to", "in", "on", "at",
  "by", "for", "with", "from", "as", "is", "it", "its", "this", "that",
  "these", "those", "was", "were", "be", "been", "being", "are", "am", "has",
  "have", "had", "do", "does", "did", "not", "no", "than", "then", "so",
  "which", "who", "whom", "what", "how", "why", "when", "where", "more",
  "most", "less", "very", "much", "some", "any", "all", "both", "each",
  "other", "into", "over", "under", "about", "essay", "essays", "writer",
  "reader", "readers", "one", "two", "their", "there", "they", "them",
  "his", "her", "hers", "he", "she", "you", "your", "yours", "we", "our",
  "my", "mine", "me", "i", "us", "can", "could", "would", "should", "will",
  "may", "might", "must", "only", "just", "also", "still", "while", "does",
]);

/** Crude suffix stripping — enough to fold plurals and tenses together. */
function stem(w: string): string {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

/** The content-word signature a comparison is made on. */
export function signature(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map(stem);
  return new Set(words);
}

/** Jaccard overlap of two signatures, 0–1. */
export function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / (a.size + b.size - shared);
}

export interface ThemeInput {
  text: string;
  /** Relative importance of the reading this came from (decisive > narrow). */
  weight?: number;
}

export interface Theme {
  /** The clearest phrasing among the readings that made this point. */
  text: string;
  /** How many readings made it. */
  count: number;
  /** Every phrasing, most representative first — useful for prompts. */
  variants: string[];
  /** Summed weight, used for ranking. */
  weight: number;
}

/**
 * Two reasons are the same theme above this overlap.
 *
 * Deliberately conservative. Matching is lexical, so it groups rewordings but
 * cannot see pure synonym pairs ("takes apart" / "dismantles") — those stay
 * separate. That is the failure mode to prefer: an under-merged theme reports
 * a lower count and simply isn't presented as a pattern, whereas a loose
 * threshold would merge distinct points and manufacture agreement that the
 * readings never reached.
 */
const THRESHOLD = 0.34;

/**
 * Group near-duplicate reasons, count them, and rank by weight then count.
 *
 * Single-linkage: a reason joins the group containing its single closest
 * match. Comparing against a merged group signature instead would dilute the
 * score as the group grows — the union's vocabulary expands, Jaccard falls,
 * and the sixth phrasing of a point fails to join the five before it.
 *
 * O(n²) on the number of reasons, which is nothing at 25 matches, and stable
 * given a stable input order.
 */
export function clusterThemes(inputs: ThemeInput[]): Theme[] {
  const items = inputs
    .map((i) => ({ text: i.text.trim(), weight: i.weight ?? 1, sig: signature(i.text) }))
    .filter((i) => i.text.length > 0);

  const groups: { members: typeof items }[] = [];

  for (const item of items) {
    let best: (typeof groups)[number] | null = null;
    let bestScore = THRESHOLD;
    for (const g of groups) {
      // Closest single member, not the group's merged vocabulary.
      const s = Math.max(...g.members.map((m) => similarity(item.sig, m.sig)));
      if (s >= bestScore) {
        best = g;
        bestScore = s;
      }
    }
    if (best) best.members.push(item);
    else groups.push({ members: [item] });
  }

  return groups
    .map((g) => {
      // Representative = the member most similar to the others (medoid);
      // ties break toward the shorter, more quotable phrasing.
      const ranked = [...g.members]
        .map((m) => {
          const affinity = g.members.reduce(
            (sum, other) => sum + (other === m ? 0 : similarity(m.sig, other.sig)),
            0
          );
          return { m, affinity };
        })
        .sort((x, y) => y.affinity - x.affinity || x.m.text.length - y.m.text.length);

      return {
        text: ranked[0].m.text,
        count: g.members.length,
        variants: ranked.map((r) => r.m.text),
        weight: g.members.reduce((sum, m) => sum + m.weight, 0),
      };
    })
    .sort((a, b) => b.weight - a.weight || b.count - a.count);
}

/** How much a verdict's reasoning counts, by how decisive the call was. */
export function marginWeight(margin: string | null | undefined): number {
  return margin === "decisive" ? 1.6 : margin === "narrow" ? 0.6 : 1;
}

/**
 * "6 of 13 readings" — the phrasing that turns a claim into evidence.
 * Returns null for a single mention, which is an observation, not a pattern.
 */
export function evidenceLabel(count: number, total: number): string | null {
  if (count < 2 || total < 2) return null;
  return `${count} of ${total} readings`;
}
