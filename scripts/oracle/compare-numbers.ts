#!/usr/bin/env node

/**
 * compare-numbers.ts
 * ==================
 * Compares the number port (src/g2p/table-number.ts) with DECtalk's phoneme
 * log for every number of
 * test/fixtures/dectalk-oracle/dectalk-us-numbers-v1.phonemes.json
 * (scripts/oracle/export-number-fixture.ts) and prints each difference.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-numbers.ts [--limit N] [--fixture <file name>]
 *
 * --fixture names another fixture of test/fixtures/dectalk-oracle, e.g.
 * dectalk-us-number-tokens-v1.phonemes.json (money, times, decimals, plurals).
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  type NumberPhones,
  speakDigits,
  speakNumberToken,
  storeSyntacticMarkers,
} from "../../src/g2p/table-number";
import { numberLogTokens, numberSymbolTokens } from "./number-log";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const readJson = <T>(...parts: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), "utf8")) as T;
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : Number.POSITIVE_INFINITY;

const fixtureIndex = process.argv.indexOf("--fixture");
const fixtureName =
  fixtureIndex >= 0 ? process.argv[fixtureIndex + 1] : "dectalk-us-numbers-v1.phonemes.json";
const entries = Object.fromEntries(
  Object.entries(
    readJson<{ entries: Record<string, string | null> }>(
      "test",
      "fixtures",
      "dectalk-oracle",
      fixtureName,
    ).entries,
  ).filter((entry): entry is [string, string] => entry[1] !== null),
);
const lists = readJson<{ numberPhones: NumberPhones }>(
  "public",
  "rules",
  "frontends",
  "dectalk-english",
  "lts-table.json",
).numberPhones;

let equal = 0;
let shown = 0;
for (const [text, log] of Object.entries(entries)) {
  // The log is written by the phonetic stage, from the symbols as it stored them.
  // A word the text task reads whole (money, a time, a plural, a decimal), or digits.
  const symbols = speakNumberToken(text, lists) ?? speakDigits(text, lists);
  const mine =
    symbols === null
      ? "not a number"
      : numberSymbolTokens(storeSyntacticMarkers(symbols)).join(" ");
  const theirs = numberLogTokens(log).join(" ");
  if (mine === theirs) {
    equal += 1;
    continue;
  }
  if (shown < limit) {
    console.log(`${text}\n  DECtalk: ${theirs}\n  port:    ${mine}`);
    shown += 1;
  }
}
console.log(JSON.stringify({ numbers: Object.keys(entries).length, equal }));
