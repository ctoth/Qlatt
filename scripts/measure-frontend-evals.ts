#!/usr/bin/env node

/**
 * measure-frontend-evals.ts
 * =========================
 * Which expressions the frontend evaluates most, and how that grows with the
 * length of the sentence. Used to find work that is quadratic in the number
 * of Segments (a rule that scans the utterance from every Segment).
 *
 * It runs textToKlattTrackDetailed on a short and a long sentence with
 * per-expression counting on (cel-expressions.ts getCelExpressionProfile) and
 * prints, for the expressions that cost most in the long one:
 *   count_s, count_l   evaluations in the short and the long sentence
 *   growth             count_l / count_s
 *   ms_l               time inside the expression in the long sentence
 *                      (includes expressions it evaluates itself)
 * against the growth of the track's length, of its Segment count and of all
 * evaluations. An expression whose growth is near the square of the Segment
 * growth is the quadratic one.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/measure-frontend-evals.ts [--frontend dectalk-english] [--top 25] \
 *     [--by count|ms] ["short sentence" "long sentence"]
 *
 * Do not run it with tsx (see measure-frontend-time.ts).
 */

import {
  getCelEvalCount,
  getCelExpressionProfile,
  resetCelCounters,
  setCelTimingEnabled,
} from "../src/declarative-frontend/cel-expressions";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const argv = process.argv.slice(2);
const flagNames = new Set(["frontend", "top", "by"]);
const flags = new Map<string, string>();
const positional: string[] = [];
for (let index = 0; index < argv.length; index += 1) {
  const arg = argv[index] as string;
  if (arg.startsWith("--") && flagNames.has(arg.slice(2))) {
    flags.set(arg.slice(2), argv[index + 1] ?? "");
    index += 1;
  } else {
    positional.push(arg);
  }
}
const frontendId = flags.get("frontend") ?? "dectalk-english";
const top = Number(flags.get("top") ?? "25");
const by = flags.get("by") === "count" ? "count" : "ms";
const shortText = positional[0] ?? "The quick brown fox.";
const longText =
  positional[1] ?? "The quick brown fox jumps over the lazy dog, and then it runs away.";

type Profile = {
  speechSec: number;
  events: number;
  evals: number;
  expressions: Map<string, { count: number; ms: number }>;
};

function profile(text: string): Profile {
  // Once to fill every cache, then once counted.
  textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  resetCelCounters();
  setCelTimingEnabled(true);
  const { track } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  setCelTimingEnabled(false);
  return {
    speechSec: track[track.length - 1]?.time ?? 0,
    events: track.length,
    evals: getCelEvalCount(),
    expressions: new Map(
      [...getCelExpressionProfile()].map(([expression, entry]) => [expression, { ...entry }]),
    ),
  };
}

const short = profile(shortText);
const long = profile(longText);
const ratio = (a: number, b: number): string => (b > 0 ? (a / b).toFixed(2) : "-");

console.log(`frontend ${frontendId}`);
console.log(`short: ${JSON.stringify(shortText)}`);
console.log(`long:  ${JSON.stringify(longText)}`);
console.log(
  `speech ${short.speechSec.toFixed(2)} s -> ${long.speechSec.toFixed(2)} s (x${ratio(long.speechSec, short.speechSec)}); ` +
    `evaluations ${short.evals} -> ${long.evals} (x${ratio(long.evals, short.evals)}); ` +
    `distinct expressions ${short.expressions.size} -> ${long.expressions.size}`,
);
console.log(`\ntop ${top} expressions of the long sentence by ${by}:`);
console.log(" count_s  count_l  growth     ms_l  expression");
const rows = [...long.expressions.entries()].sort((a, b) => b[1][by] - a[1][by]).slice(0, top);
for (const [expression, entry] of rows) {
  const before = short.expressions.get(expression)?.count ?? 0;
  const text = expression.replace(/\s+/g, " ");
  console.log(
    `${String(before).padStart(8)} ${String(entry.count).padStart(8)} ${ratio(entry.count, before).padStart(7)} ${entry.ms
      .toFixed(1)
      .padStart(8)}  ${text.length > 150 ? `${text.slice(0, 147)}...` : text}`,
  );
}
