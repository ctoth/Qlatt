#!/usr/bin/env node

/**
 * sweep-gate-list.ts
 * ==================
 * The sweep gate's list: a subset of the sweep corpora whose say.exe WAVs are
 * checked in (test/fixtures/dectalk-sweep-gate) and which
 * test/dectalk-sweep-gate-*.test.ts assert sample for sample. The list is
 * test/oracle-corpora/dectalk-us-sweep-gate-v1.json, and it is what this
 * script computes; it is not edited by hand.
 *
 * The rule. For each corpus of GATE_RULES, from the entries that were
 * sample-exact in the recorded sweep run (test/fixtures/dectalk-sweep-gate/
 * sweep-record.json, written by sweep-table.ts --out):
 *
 *   by group     in every group of the corpus, the entry at place
 *                min(2, size - 1) and every `stride`th after it, so every
 *                kind of text is in the gate at least once;
 *   by sequence  the entry at place 2 of the whole list and every `stride`th
 *                after it. The rate and voice sweeps are text x rate and
 *                voice x text tables; their strides share no factor with
 *                either side, so the picks walk through the texts, the rates
 *                and the voices.
 *
 * A place whose entry was not exact in the record passes to the next entry
 * after it (in its group, or in the list) that was exact and is not already
 * picked; with none left the place is dropped. The strides come to about one
 * entry in ten: every fifth entry of the six corpora is some 14 MB of WAVs,
 * and the gate's stay under 8 MB (the test asserts it).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/sweep-gate-list.ts --check | --write
 *
 *   --check  exit 1 unless the checked-in list is what the rule gives
 *   --write  write the list
 *
 * After --write changes the list, export its WAVs (the say.exe builds as in
 * scripts/oracle/export-dectalk-vtm-fixture.ts's header) and remove the WAVs
 * of entries that left it:
 *   ... export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-sweep-gate-v1.json \
 *     --out-dir test/fixtures/dectalk-sweep-gate --wav-only
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readVoiceCorpus } from "./dectalk-voice-compare.ts";
import { type SweepRecord, sweepCorpusPath } from "./sweeps.ts";
import type { OracleCorpusDocument, OracleCorpusEntry } from "./types.ts";

export const SWEEP_GATE_CORPUS_ID = "dectalk-us-sweep-gate-v1";
export const SWEEP_GATE_FIXTURE_DIR = path.join("test", "fixtures", "dectalk-sweep-gate");
export const SWEEP_GATE_LIST_PATH = path.join(
  "test",
  "oracle-corpora",
  `${SWEEP_GATE_CORPUS_ID}.json`,
);
export const SWEEP_GATE_RECORD_PATH = path.join(SWEEP_GATE_FIXTURE_DIR, "sweep-record.json");

type GateRule = {
  corpusId: string;
  /** Prefix of the gate entry's id, which is also its WAV's name. */
  prefix: string;
  walk: "group" | "sequence";
  stride: number;
};

export const GATE_RULES: readonly GateRule[] = [
  // Single sentences of Paul's, fourteen kinds.
  { corpusId: "dectalk-us-sweep-v1", prefix: "v1", walk: "group", stride: 12 },
  { corpusId: "dectalk-us-sweep-b-v1", prefix: "b", walk: "group", stride: 10 },
  // Betty: the female F0 routine, nineteen kinds.
  { corpusId: "dectalk-us-betty-sweep-v1", prefix: "betty", walk: "group", stride: 9 },
  // Two to five sentences each: what carries over from clause to clause.
  { corpusId: "dectalk-us-paragraph-sweep-v1", prefix: "para", walk: "group", stride: 6 },
  // 40 texts x 3 rates, text-major: 11 shares no factor with 3 or 40.
  { corpusId: "dectalk-us-rate-sweep-v1", prefix: "rate", walk: "sequence", stride: 11 },
  // 7 voices x 30 texts, voice-major: 13 shares no factor with 7 or 30.
  { corpusId: "dectalk-us-voice-sweep-v1", prefix: "voice", walk: "sequence", stride: 13 },
];

function pickPlaces(
  entries: readonly OracleCorpusEntry[],
  stride: number,
  exact: (entry: OracleCorpusEntry) => boolean,
  picked: Set<string>,
): void {
  for (let place = Math.min(2, entries.length - 1); place < entries.length; place += stride) {
    const entry = entries.slice(place).find((later) => exact(later) && !picked.has(later.id));
    if (entry) picked.add(entry.id);
  }
}

/** The gate list the rule gives for these corpora and this record. */
export function sweepGateList(repoRoot: string, record: SweepRecord): OracleCorpusDocument {
  const entries: OracleCorpusEntry[] = [];
  for (const rule of GATE_RULES) {
    const corpus = readVoiceCorpus(sweepCorpusPath(repoRoot, rule.corpusId));
    const recorded = record.corpora[rule.corpusId];
    if (!recorded) throw new Error(`E_SWEEP_GATE_RECORD: no run of ${rule.corpusId} in the record`);
    if (recorded.total !== corpus.entries.length) {
      throw new Error(
        `E_SWEEP_GATE_RECORD: ${rule.corpusId} has ${corpus.entries.length} entries, ` +
          `the record ran ${recorded.total}`,
      );
    }
    const misses = new Set(recorded.misses);
    const exact = (entry: OracleCorpusEntry) => !misses.has(entry.id);
    const picked = new Set<string>();
    if (rule.walk === "sequence") {
      pickPlaces(corpus.entries, rule.stride, exact, picked);
    } else {
      const groups = new Map<string, OracleCorpusEntry[]>();
      for (const entry of corpus.entries) {
        groups.set(entry.group, [...(groups.get(entry.group) ?? []), entry]);
      }
      for (const group of groups.values()) pickPlaces(group, rule.stride, exact, picked);
    }
    for (const entry of corpus.entries) {
      if (!picked.has(entry.id)) continue;
      entries.push({
        id: `${rule.prefix}--${entry.id}`,
        voiceId: entry.voiceId ?? corpus.defaults?.voiceId ?? "paul",
        rate: entry.rate ?? corpus.defaults?.rate ?? 180,
        text: entry.text,
        group: `${rule.corpusId}:${entry.group}`,
      });
    }
  }
  return {
    schemaVersion: "v1",
    corpusId: SWEEP_GATE_CORPUS_ID,
    // Every entry names its own voice and rate; the exporter wants defaults too.
    defaults: {
      voiceId: "paul",
      rate: 180,
      sampleRate: 11025,
      frontendId: "dectalk-english",
      transitionMs: 30,
    },
    entries,
  };
}

export function readSweepRecord(repoRoot: string): SweepRecord {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, SWEEP_GATE_RECORD_PATH), "utf8"),
  ) as SweepRecord;
}

export function sweepGateListText(list: OracleCorpusDocument): string {
  const { entries, ...head } = list;
  const lines = entries.map((entry) => `    ${JSON.stringify(entry)}`);
  return `${JSON.stringify(head, null, 2).replace(/\n\}$/u, "")},\n  "entries": [\n${lines.join(",\n")}\n  ]\n}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
  const argv = process.argv.slice(2);
  const text = sweepGateListText(sweepGateList(repoRoot, readSweepRecord(repoRoot)));
  const listPath = path.join(repoRoot, SWEEP_GATE_LIST_PATH);
  if (argv.includes("--write")) {
    fs.writeFileSync(listPath, text);
    console.log(`wrote ${SWEEP_GATE_LIST_PATH}`);
  } else if (argv.includes("--check")) {
    const current = fs.existsSync(listPath) ? fs.readFileSync(listPath, "utf8") : "";
    if (current.replace(/\r\n/gu, "\n") !== text) {
      console.error(`${SWEEP_GATE_LIST_PATH} is not what the rule gives; run with --write`);
      process.exit(1);
    }
    console.log(`${SWEEP_GATE_LIST_PATH} is what the rule gives`);
  } else {
    throw new Error("--check or --write is required");
  }
}
