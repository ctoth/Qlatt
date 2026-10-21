#!/usr/bin/env node

/**
 * compare-table-lts.ts
 * ====================
 * Runs the table letter-to-sound interpreter and DECtalk's adjustment passes
 * (src/g2p/table-lts.ts, src/g2p/table-lts-adjust.ts) on every word of the
 * letter-to-sound oracle and compares the result with DECtalk's phoneme log,
 * in phonemes and in stress.
 *
 * This checks the transcription of DECtalk's letter-to-sound code on its own,
 * before the frontend uses it. scripts/oracle/compare-lts.ts measures what
 * the frontend actually produces.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-table-lts.ts --table <lts-table.json> [--verbose] [--word <w>]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyLtsRules, type LtsTable } from "../../src/g2p/table-lts.ts";
import { adjustLts, type LtsAdjustTables } from "../../src/g2p/table-lts-adjust.ts";
import {
  type LoggedPhone,
  parsePhonemeLog,
  US_ALLOPHONE_NAMES,
  US_VOWEL_NAMES,
} from "./allophones.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const verbose = argv.includes("--verbose");
const onlyWord = flag("word");
const tablePath = flag("table");
if (!tablePath) throw new Error("--table <file> is required");
const table = JSON.parse(fs.readFileSync(tablePath, "utf8")) as LtsTable & LtsAdjustTables;

const fixture = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", "dectalk-us-lts-v1.phonemes.json"),
    "utf8",
  ),
) as { entries: Record<string, string> };

function pronounce(word: string): LoggedPhone[] {
  const phones: LoggedPhone[] = [];
  let pending = 0;
  for (const symbol of adjustLts(applyLtsRules(word, table), table)) {
    if (symbol.kind !== "phone") continue;
    const name = US_ALLOPHONE_NAMES[symbol.phone] ?? `#${symbol.phone.toString()}`;
    // DECtalk writes the stress mark before the phone it sends; the log shows
    // it on the next vowel.
    if (symbol.stress !== 0) pending = symbol.stress;
    const vowel = US_VOWEL_NAMES.has(name);
    phones.push({ name, stress: vowel ? pending : null });
    if (vowel) pending = 0;
  }
  return phones;
}

const show = (phones: readonly LoggedPhone[]): string =>
  phones.map((phone) => `${phone.name}${phone.stress ?? ""}`).join(" ");

let words = 0;
let phonemesEqual = 0;
let stressEqual = 0;
let threw = 0;
const substitutions = new Map<string, number>();
for (const [word, log] of Object.entries(fixture.entries)) {
  if (onlyWord && word !== onlyWord) continue;
  words += 1;
  const theirs = parsePhonemeLog(log);
  let ours: LoggedPhone[];
  try {
    ours = pronounce(word);
  } catch (error) {
    threw += 1;
    if (verbose) console.log(`${word}\tthrew ${String(error).split("\n")[0]}`);
    continue;
  }
  const samePhonemes =
    theirs.length === ours.length && theirs.every((phone, i) => phone.name === ours[i].name);
  if (samePhonemes) {
    phonemesEqual += 1;
    if (theirs.every((phone, i) => phone.stress === ours[i].stress)) stressEqual += 1;
    else if (verbose) console.log(`${word}\tstress\t${show(theirs)}\t|\t${show(ours)}`);
    continue;
  }
  if (theirs.length === ours.length) {
    theirs.forEach((phone, i) => {
      if (phone.name === ours[i].name) return;
      const key = `${ours[i].name}->${phone.name}`;
      substitutions.set(key, (substitutions.get(key) ?? 0) + 1);
    });
  }
  if (verbose) console.log(`${word}\tphonemes\t${show(theirs)}\t|\t${show(ours)}`);
}
console.log(
  JSON.stringify({
    words,
    phonemesEqual,
    phonemesAndStressEqual: stressEqual,
    threw,
    topSubstitutions: Object.fromEntries(
      [...substitutions].sort((a, b) => b[1] - a[1]).slice(0, 20),
    ),
  }),
);
