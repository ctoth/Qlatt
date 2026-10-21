#!/usr/bin/env node

/**
 * compare-dectalk-voices.ts
 * =========================
 * For every entry of a voice corpus: text to samples the way the page does it,
 * compared sample for sample with the WAV the stock say.exe wrote for the same
 * text, voice and rate (scripts/oracle/dectalk-voice-compare.ts). Reports;
 * test/dectalk-voices-exact.test.ts asserts the same comparison on the
 * checked-in fixtures.
 *
 * The WAVs come from scripts/oracle/export-dectalk-vtm-fixture.ts:
 *   ... export-dectalk-vtm-fixture.ts --corpus <corpus.json> --out-dir <dir> [--wav-only]
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-dectalk-voices.ts --fixture-dir <dir> \
 *     [--corpus test/oracle-corpora/dectalk-us-voices-v1.json] [--out report.json]
 *
 * Exit code 0 whatever the result: this measures, it does not gate.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
  type VoiceResult,
} from "./dectalk-voice-compare.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};

const fixtureDirFlag = flag("fixture-dir");
if (!fixtureDirFlag) throw new Error("--fixture-dir is required");
const fixtureDir = path.resolve(fixtureDirFlag);
const corpus = readVoiceCorpus(
  path.resolve(
    flag("corpus") ?? path.join(repoRoot, "test", "oracle-corpora", "dectalk-us-voices-v1.json"),
  ),
);

const results: VoiceResult[] = [];
for (const entry of corpus.entries) {
  const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
  results.push(result);
  console.log(
    `${result.id.padEnd(18)} ${result.voice.padEnd(7)} ${String(result.rate).padStart(3)} ` +
      `samples ${String(result.samplesEqual).padStart(6)}/${String(result.samplesOracle).padEnd(6)} ` +
      `packets ${String(result.packetsEqual).padStart(4)}/${String(result.packetsOracle).padEnd(4)} ` +
      `rendered ${String(result.packetsRender).padEnd(4)} ` +
      `first ${String(result.firstMismatch).padStart(6)} maxdiff ${String(result.maxAbsDifference).padStart(5)} ` +
      (isExact(result) ? "EXACT" : (result.error ?? "differs")) +
      (result.problems.length > 0 ? ` (${result.problems.length} render problems)` : ""),
  );
}
const exact = results.filter(isExact).length;
console.log(`${exact} of ${results.length} exact`);

const outFlag = flag("out");
if (outFlag) {
  fs.writeFileSync(
    path.resolve(outFlag),
    `${JSON.stringify({ corpus: corpus.corpusId, fixtureDir, results }, null, 2)}\n`,
  );
}
