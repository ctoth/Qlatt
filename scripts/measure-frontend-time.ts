#!/usr/bin/env node

/**
 * measure-frontend-time.ts
 * ========================
 * How long the text frontend takes per second of speech it produces, and how
 * much of that is CEL evaluation. Used to check that a rule or engine change
 * does not slow the frontend down (it also runs live, in the NVDA driver).
 *
 * For each sentence: one warm-up call, then `--repeat` timed calls of
 * textToKlattTrackDetailed. Reports per sentence and in total:
 *   speech_s      duration of the produced track
 *   frontend_ms   median wall-clock time of one call
 *   ms_per_s      frontend_ms / speech_s
 *   cel_evals     CEL evaluations in one call
 *   cel_ms        time inside CEL evaluation in one call (measured in a
 *                 separate call, because timing each evaluation adds overhead)
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/measure-frontend-time.ts [--frontend dectalk-english] [--repeat 5] \
 *     [--json <file>] ["sentence" ...]
 *
 * Without sentences it uses SENTENCES below.
 *
 * Do not time or profile with `tsx`: it wraps every closure in a `__name()`
 * call (esbuild keepNames), which made this script report 2110 ms per second
 * of speech for a tree that measures 733 with the loader above, and shows in
 * a profile as a native call taking a quarter of the time.
 */

import fs from "node:fs";
import {
  getCelEvalCount,
  getCelEvalTimeMs,
  resetCelCounters,
  setCelTimingEnabled,
} from "../src/declarative-frontend/cel-expressions";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

/** Phrases of test/oracle-corpora/dectalk-us-v1.json and one longer sentence. */
const SENTENCES = [
  "cat.",
  "hello world.",
  "these shoes are in a safe zone.",
  "How are you today?",
  "The quick brown fox jumps over the lazy dog, and then it runs away.",
];

const argv = process.argv.slice(2);
const flagValue = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const flagNames = new Set(["frontend", "repeat", "json"]);
const positional: string[] = [];
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index] as string;
  if (arg.startsWith("--") && flagNames.has(arg.slice(2))) {
    index += 1;
    continue;
  }
  positional.push(arg);
}
const frontendId = flagValue("frontend") ?? "dectalk-english";
const repeat = Number(flagValue("repeat") ?? "5");
const sentences = positional.length > 0 ? positional : SENTENCES;

const run = (text: string) => textToKlattTrackDetailed(text, undefined, 30, { frontendId }).track;

const median = (values: number[]): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
};

type Row = {
  text: string;
  speech_s: number;
  frontend_ms: number;
  ms_per_s: number;
  cel_evals: number;
  cel_ms: number;
};

const rows: Row[] = [];
for (const text of sentences) {
  const warm = run(text);
  const speechSec = warm[warm.length - 1]?.time ?? 0;

  const times: number[] = [];
  for (let index = 0; index < repeat; index += 1) {
    const start = performance.now();
    run(text);
    times.push(performance.now() - start);
  }

  resetCelCounters();
  setCelTimingEnabled(true);
  run(text);
  setCelTimingEnabled(false);
  const celEvals = getCelEvalCount();
  const celMs = getCelEvalTimeMs();

  const frontendMs = median(times);
  rows.push({
    text,
    speech_s: speechSec,
    frontend_ms: frontendMs,
    ms_per_s: speechSec > 0 ? frontendMs / speechSec : Number.NaN,
    cel_evals: celEvals,
    cel_ms: celMs,
  });
}

const totalSpeech = rows.reduce((sum, row) => sum + row.speech_s, 0);
const totalMs = rows.reduce((sum, row) => sum + row.frontend_ms, 0);
const totalEvals = rows.reduce((sum, row) => sum + row.cel_evals, 0);
const totalCelMs = rows.reduce((sum, row) => sum + row.cel_ms, 0);

console.log(`frontend ${frontendId}, median of ${repeat} calls per sentence`);
console.log("speech_s  frontend_ms  ms_per_s  cel_evals  cel_ms  text");
for (const row of rows) {
  console.log(
    `${row.speech_s.toFixed(2).padStart(8)}  ${row.frontend_ms.toFixed(1).padStart(11)}  ${row.ms_per_s
      .toFixed(1)
      .padStart(
        8,
      )}  ${String(row.cel_evals).padStart(9)}  ${row.cel_ms.toFixed(1).padStart(6)}  ${row.text}`,
  );
}
console.log(
  `${totalSpeech.toFixed(2).padStart(8)}  ${totalMs.toFixed(1).padStart(11)}  ${(
    totalMs / totalSpeech
  )
    .toFixed(1)
    .padStart(8)}  ${String(totalEvals).padStart(9)}  ${totalCelMs.toFixed(1).padStart(6)}  TOTAL`,
);

const jsonPath = flagValue("json");
if (jsonPath) {
  fs.writeFileSync(
    jsonPath,
    `${JSON.stringify({ frontendId, repeat, rows, totalSpeech, totalMs, totalEvals, totalCelMs }, null, 2)}\n`,
  );
}
