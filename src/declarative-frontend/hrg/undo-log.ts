/**
 * Compensating undo log for HRG transaction commits.
 *
 * `HrgTransaction.commit()` validates every staged operation in `prepare()`
 * before applying any of them, but the apply loop itself calls into the
 * Utterance, Relation, TemporalAxis, and ProvenanceCollector, each of which can
 * still throw. Without compensation an exception there leaves the operations
 * applied before it in place and the documented atomicity does not hold.
 *
 * While a commit is being applied every primitive mutation records its exact
 * inverse here; on failure the inverses run in reverse (LIFO) order, which
 * returns the graph, the temporal axis, and the provenance DAG to the
 * pre-commit state. This is the classic undo-log discipline of Gray & Reuter
 * 1993, *Transaction Processing: Concepts and Techniques* (log-based
 * recovery: undo walks the log backwards). Records issued outside a capture
 * window are ignored, so ordinary writes outside transactions do not retain
 * undo entries.
 */
export class UndoLog {
  private entries: Array<() => void> | null = null;

  /** True while a capture window is open. */
  get capturing(): boolean {
    return this.entries !== null;
  }

  /** Open a capture window. Windows do not nest: one commit at a time. */
  begin(): void {
    if (this.entries) throw new Error("E_HRG_UNDO_NESTED: an undo capture is already open");
    this.entries = [];
  }

  /** Record the inverse of a mutation that has just been applied. */
  record(undo: () => void): void {
    this.entries?.push(undo);
  }

  /** Close the window keeping every mutation. Returns the number recorded. */
  end(): number {
    const entries = this.take();
    return entries.length;
  }

  /**
   * Close the window and run every recorded inverse in reverse order.
   * Returns the number of mutations undone.
   */
  rollback(): number {
    const entries = this.take();
    for (let index = entries.length - 1; index >= 0; index -= 1) entries[index]();
    return entries.length;
  }

  private take(): Array<() => void> {
    if (!this.entries) throw new Error("E_HRG_UNDO_NOT_CAPTURING: no undo capture is open");
    const entries = this.entries;
    this.entries = null;
    return entries;
  }
}
