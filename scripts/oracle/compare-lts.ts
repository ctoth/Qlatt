#!/usr/bin/env node

/**
 * compare-lts.ts
 * ==============
 * Compares the dectalk-english frontend's pronunciation of words that are not
 * in DECtalk's dictionary with DECtalk's own (its letter-to-sound rules and
 * stress assignment), word by word.
 *
 * DECtalk's side: test/fixtures/dectalk-oracle/dectalk-us-lts-v1.phonemes.json
 * (scripts/oracle/export-lts-fixture.ts), its phoneme log per word. The log is
 * a run of two- or one-letter phoneme symbols with `'` (primary) or a backtick
 * (secondary) before a stressed vowel; `*`, `#` and `-` are morpheme, compound
 * and syllable marks and are skipped.
 *
 * The frontend's side: the Segments as first created from the transcription,
 * before any allophone rule (the phoneme log is at that level too).
 *
 * Reports how many words match in phonemes, how many also match in stress,
 * and the most frequent single-phoneme differences among words of equal
 * length.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-lts.ts [--verbose] [--word <word>]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import {
  dectalkAllophoneName,
  type LoggedPhone as Phone,
  parsePhonemeLog as parseLog,
  US_VOWEL_NAMES as VOWELS,
} from "./allophones.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const verbose = argv.includes("--verbose");
const onlyWord = argv.includes("--word") ? argv[argv.indexOf("--word") + 1] : undefined;

function frontendPhones(word: string): Phone[] {
  const { utterance } = textToKlattTrackDetailed(`${word},`, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const phones: Phone[] = [];
  for (const item of utterance.relation("Segment").listItems()) {
    // A Segment created by a rule has the rule's name in its id.
    if (item.id.includes(":")) continue;
    const phoneme = item.writes("phoneme")[0]?.value;
    if (typeof phoneme !== "string" || phoneme === "SIL") continue;
    const name = dectalkAllophoneName(phoneme);
    const stress = item.writes("stress")[0]?.value;
    phones.push({
      name,
      stress: VOWELS.has(name) ? (typeof stress === "number" ? stress : 0) : null,
    });
  }
  return phones;
}

const show = (phones: readonly Phone[]): string =>
  phones.map((phone) => `${phone.name}${phone.stress ?? ""}`).join(" ");

const fixture = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", "dectalk-us-lts-v1.phonemes.json"),
    "utf8",
  ),
) as { entries: Record<string, string> };

let words = 0;
let phonemesEqual = 0;
let stressEqual = 0;
let threw = 0;
let sameLength = 0;
const substitutions = new Map<string, number>();
for (const [word, log] of Object.entries(fixture.entries)) {
  if (onlyWord && word !== onlyWord) continue;
  words += 1;
  const theirs = parseLog(log);
  let ours: Phone[];
  try {
    ours = frontendPhones(word);
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
    sameLength += 1;
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
    differentButSameLength: sameLength,
    topSubstitutions: Object.fromEntries(
      [...substitutions].sort((a, b) => b[1] - a[1]).slice(0, 25),
    ),
  }),
);
