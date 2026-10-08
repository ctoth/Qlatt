/**
 * sweeps.ts
 * =========
 * The DECtalk sweep corpora: lists of texts written before any export and
 * compared with the stock say.exe's audio sample for sample
 * (scripts/oracle/dectalk-voice-compare.ts). They are measurements, not gates:
 * their WAVs are not checked in. scripts/oracle/sweep-table.ts runs them all;
 * scripts/oracle/sweep-gate-list.ts picks the checked-in gate subset.
 */

import path from "node:path";

/** Every sweep corpus, by corpus id, in the order the table prints them. */
export const SWEEP_CORPUS_IDS: readonly string[] = [
  "dectalk-us-sweep-v1",
  "dectalk-us-sweep-b-v1",
  "dectalk-us-betty-sweep-v1",
  "dectalk-us-paragraph-sweep-v1",
  "dectalk-us-rate-sweep-v1",
  "dectalk-us-voice-sweep-v1",
  "dectalk-us-messy-sweep-v1",
  "dectalk-us-long-clause-sweep-v1",
];

export function sweepCorpusPath(repoRoot: string, corpusId: string): string {
  return path.join(repoRoot, "test", "oracle-corpora", `${corpusId}.json`);
}

/** What sweep-table.ts records of one run: which entries were not sample-exact. */
export type SweepRecord = {
  schemaVersion: "v1";
  /** `git rev-parse HEAD` of the tree the run rendered. */
  commit: string;
  corpora: Record<string, { total: number; exact: number; misses: string[] }>;
};
