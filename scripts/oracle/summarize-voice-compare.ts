#!/usr/bin/env node

/**
 * summarize-voice-compare.ts
 * ==========================
 * Reads a report written by scripts/oracle/compare-dectalk-voices.ts --out and
 * prints: how many entries are exact, per group; and the misses grouped by
 * symptom:
 *
 *   error         the render failed or was refused
 *   packet-count  the render has a different number of packets than say.exe
 *                 (sub-grouped by whether every shared sample is equal)
 *   samples       the same number of packets, some samples differ
 *
 * with, for each miss, the first differing packet (71 samples a packet).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/summarize-voice-compare.ts --report <report.json> \
 *     [--corpus <corpus.json>]   (for the group of each entry)
 */

import fs from "node:fs";
import path from "node:path";
import { FRAME_SAMPLES } from "../../src/dectalk-vtm-track.ts";
import { isExact, type VoiceResult } from "./dectalk-voice-compare.ts";
import type { OracleCorpusDocument } from "./types.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const reportFlag = flag("report");
if (!reportFlag) throw new Error("--report is required");
const report = JSON.parse(fs.readFileSync(path.resolve(reportFlag), "utf8")) as {
  corpus: string;
  results: VoiceResult[];
};
const corpusFlag = flag("corpus");
const groupOf = new Map<string, string>();
if (corpusFlag) {
  const corpus = JSON.parse(
    fs.readFileSync(path.resolve(corpusFlag), "utf8"),
  ) as OracleCorpusDocument;
  for (const entry of corpus.entries) groupOf.set(entry.id, entry.group);
}
const group = (result: VoiceResult): string => groupOf.get(result.id) ?? "(no group)";

type Symptom = "error" | "packet-count, shared samples equal" | "packet-count" | "samples";
function symptomOf(result: VoiceResult): Symptom {
  if (result.error) return "error";
  if (result.packetsRender !== result.packetsOracle) {
    return result.firstMismatch < 0 ? "packet-count, shared samples equal" : "packet-count";
  }
  return "samples";
}

const perGroup = new Map<string, { exact: number; total: number }>();
const misses = new Map<Symptom, VoiceResult[]>();
for (const result of report.results) {
  const tally = perGroup.get(group(result)) ?? { exact: 0, total: 0 };
  tally.total += 1;
  if (isExact(result)) tally.exact += 1;
  else {
    const symptom = symptomOf(result);
    misses.set(symptom, [...(misses.get(symptom) ?? []), result]);
  }
  perGroup.set(group(result), tally);
}

const exact = report.results.filter(isExact).length;
console.log(`${report.corpus}: ${exact} of ${report.results.length} exact`);
console.log("");
for (const [name, tally] of perGroup) {
  console.log(`  ${name.padEnd(20)} ${String(tally.exact).padStart(3)} of ${tally.total}`);
}
for (const [symptom, results] of misses) {
  console.log("");
  console.log(`${symptom}: ${results.length}`);
  for (const result of results) {
    const firstPacket =
      result.firstMismatch < 0 ? "-" : String(Math.floor(result.firstMismatch / FRAME_SAMPLES));
    const detail = result.error
      ? result.error
      : `packets ${result.packetsRender} vs ${result.packetsOracle} ` +
        `(${result.packetsRender - result.packetsOracle >= 0 ? "+" : ""}${result.packetsRender - result.packetsOracle}), ` +
        `equal packets ${result.packetsEqual}, first differing packet ${firstPacket}` +
        (result.problems.length > 0 ? `, ${result.problems.length} render problems` : "");
    console.log(`  ${result.id.padEnd(22)} ${detail}  | ${result.text}`);
  }
}
