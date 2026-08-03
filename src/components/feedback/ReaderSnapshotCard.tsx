import type { ReaderSnapshot } from "@/lib/evaluation/types";

/** The first written feedback a user sees — an editorial note, not a
 *  rubric. Reads like a colleague describing their honest first
 *  impression of the draft. */
export function ReaderSnapshotCard({ snapshot }: { snapshot: ReaderSnapshot }) {
  return (
    <section className="card card-pad stack g4" aria-labelledby="reader-snapshot-heading">
      <h2 id="reader-snapshot-heading" className="h2">
        How your essay currently lands
      </h2>
      <p className="lede">{snapshot.currentImpression}</p>
      <div className="stack g3">
        <div className="well">
          <span className="label">Most memorable</span>
          <p className="copy" style={{ marginTop: 6 }}>
            {snapshot.memorableElement || "Margin didn't isolate a single standout line — nothing here felt out of place."}
          </p>
        </div>
        <div className="well">
          <span className="label">The reader still wants to understand</span>
          <p className="copy" style={{ marginTop: 6 }}>{snapshot.missingDimension}</p>
        </div>
      </div>
    </section>
  );
}
