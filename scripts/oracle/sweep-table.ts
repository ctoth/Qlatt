#!/usr/bin/env node

/**
 * sweep-table.ts
 * ==============
 * The whole sweep measurement in one command: every sweep corpus
 * (scripts/oracle/sweeps.ts) rendered from text the way the page does it and
 * compared sample for sample with the stock say.exe's WAVs, one line per
 * corpus: exact, total, and the ids that are not exact.
 *
 * The WAVs are not checked in. Export them once per corpus with
 * scripts/oracle/export-dectalk-vtm-fixture.ts:
 *   ... export-dectalk-vtm-fixture.ts --corpus test/oracle-corpora/<id>.json \
 *       --out-dir <root>/<id> --wav-only
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/sweep-table.ts --fixture-root <root> \
 *     [--dir <corpusId>=<dir>]... [--corpus <corpusId>]... [--out <record.json>] [--verbose]
 *
 *   --fixture-root  a corpus's WAVs are in <root>/<corpusId>
 *   --dir           another directory for one corpus (may be repeated)
 *   --corpus        run only this corpus (may be repeated)
 *   --out           write the record sweep-gate-list.ts reads (the misses per corpus)
 *   --verbose       one line per entry that is not exact
 *
 * A corpus whose list or WAV directory is absent is reported as such and
 * skipped. Exit code 0 whatever the result: this measures, it does not gate.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareVoiceEntry, isExact, readVoiceCorpus } from "./dectalk-voice-compare.ts";
import { SWEEP_CORPUS_IDS, type SweepRecord, sweepCorpusPath } from "./sweeps.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flags = (name: string): string[] =>
  argv.flatMap((arg, index) => (arg === `--${name}` ? [argv[index + 1] ?? ""] : []));
const fixtureRoot = flags("fixture-root")[0];
const directories = new Map(
  flags("dir").map((pair) => {
    const at = pair.indexOf("=");
    if (at <= 0) throw new Error(`--dir wants <corpusId>=<dir>, got '${pair}'`);
    return [pair.slice(0, at), path.resolve(pair.slice(at + 1))] as const;
  }),
);
if (!fixtureRoot && directories.size === 0) {
  throw new Error("--fixture-root <root> or --dir <corpusId>=<dir> is required");
}
const only = flags("corpus");
for (const id of only) {
  if (!SWEEP_CORPUS_IDS.includes(id)) throw new Error(`E_SWEEP_UNKNOWN: '${id}'`);
}
const verbose = argv.includes("--verbose");

const record: SweepRecord = {
  schemaVersion: "v1",
  commit: execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  corpora: {},
};
const rows: string[][] = [["corpus", "exact", "total", "misses"]];
for (const corpusId of SWEEP_CORPUS_IDS) {
  if (only.length > 0 && !only.includes(corpusId)) continue;
  const corpusPath = sweepCorpusPath(repoRoot, corpusId);
  const fixtureDir =
    directories.get(corpusId) ?? (fixtureRoot ? path.resolve(fixtureRoot, corpusId) : undefined);
  if (!fs.existsSync(corpusPath)) {
    rows.push([corpusId, "-", "-", "no corpus list in this tree"]);
    continue;
  }
  if (!fixtureDir || !fs.existsSync(fixtureDir)) {
    rows.push([corpusId, "-", "-", `no WAV directory (${fixtureDir ?? "none given"})`]);
    continue;
  }
  const corpus = readVoiceCorpus(corpusPath);
  const misses: string[] = [];
  for (const entry of corpus.entries) {
    let line: string;
    try {
      const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
      if (isExact(result)) continue;
      line =
        `${corpusId} ${result.id}: rendered ${result.packetsRender} packets, ` +
        `say.exe ${result.packetsOracle}, equal ${result.packetsEqual}, ` +
        `first differing sample ${result.firstMismatch}` +
        (result.error ? ` (${result.error})` : "");
    } catch (error) {
      // A trap in a kernel is a miss, and must not end the run.
      line = `${corpusId} ${entry.id}: ${error instanceof Error ? error.message : String(error)}`;
    }
    misses.push(entry.id);
    if (verbose) console.log(line);
  }
  const total = corpus.entries.length;
  record.corpora[corpusId] = { total, exact: total - misses.length, misses };
  rows.push([corpusId, String(total - misses.length), String(total), misses.join(" ")]);
}

const widths = [0, 1, 2].map((column) =>
  Math.max(...rows.map((row) => (row[column] ?? "").length)),
);
for (const row of rows) {
  console.log(
    `${(row[0] ?? "").padEnd(widths[0] ?? 0)}  ${(row[1] ?? "").padStart(widths[1] ?? 0)}  ` +
      `${(row[2] ?? "").padStart(widths[2] ?? 0)}  ${row[3] ?? ""}`,
  );
}
const ran = Object.values(record.corpora);
console.log(
  `${ran.reduce((sum, corpus) => sum + corpus.exact, 0)} of ` +
    `${ran.reduce((sum, corpus) => sum + corpus.total, 0)} exact, tree ${record.commit.slice(0, 8)}`,
);

const out = flags("out")[0];
if (out) fs.writeFileSync(path.resolve(out), `${JSON.stringify(record, null, 2)}\n`);
