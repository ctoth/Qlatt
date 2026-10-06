#!/usr/bin/env node

/**
 * compare-allophones.ts
 * =====================
 * Layer A of the duration port: does the dectalk-english frontend hand its
 * duration rules the same allophone stream DECtalk 4.63 hands p_us_tim.c?
 *
 * For every clause of every corpus entry it lines up
 *   DECtalk: the allophones recorded in
 *            test/fixtures/dectalk-oracle/<corpus>.durations.json
 *   Qlatt:   the active Segment items, split into clauses at punctuation
 *            silences, with stop pieces (X, X_REL, X_ASP) merged and the dummy
 *            vowel silence after a final stop dropped (DECtalk adds that after
 *            timing)
 * and reports sequence mismatches. Names are compared in DECtalk's spelling;
 * PORT_TO_DECTALK lists the port's different spellings of the same phone.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-allophones.ts [--verbose] [--corpus <corpusId>]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import { selectedCorpusFiles } from "./allophones";
import type { OracleCorpusDocument } from "./types";

// DECtalk 4.63 INCLUDE/l_all_ph.h, `#define US_<NAME> <index>`.
const US_NAMES = [
  "SIL", "IY", "IH", "EY", "EH", "AE", "AA", "AY", "AW", "AH",
  "AO", "OW", "OY", "UH", "UW", "RR", "YU", "AX", "IX", "IR",
  "ER", "AR", "OR", "UR", "W", "Y", "R", "LL", "HX", "RX",
  "LX", "M", "N", "NX", "EL", "DZ", "EN", "F", "V", "TH",
  "DH", "S", "Z", "SH", "ZH", "P", "B", "T", "D", "K",
  "G", "DX", "TX", "Q", "CH", "JH", "DF", "TZ", "CZ",
]; // biome-ignore format: ten per row, as in the header

// The port's spelling of a DECtalk phone where it differs.
const PORT_TO_DECTALK: Readonly<Record<string, string>> = { HH: "HX", NG: "NX", L: "LL" };

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const verbose = process.argv.includes("--verbose");

type Clause = string[];

function qlattClauses(text: string, transitionMs: number): Clause[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, transitionMs, {
    frontendId: "dectalk-english",
  });
  const clauses: Clause[] = [[]];
  let previous: string | undefined;
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    if (phoneme === "SIL") {
      // A punctuation silence ends the clause; a dummy-vowel silence does not.
      if (item.get("punctuationSymbol") != null && clauses[clauses.length - 1].length > 0) {
        clauses.push([]);
      }
      previous = undefined;
      continue;
    }
    if (previous && phoneme.startsWith(`${previous}_`)) continue;
    previous = phoneme;
    clauses[clauses.length - 1].push(PORT_TO_DECTALK[phoneme] ?? phoneme);
  }
  return clauses.filter((clause) => clause.length > 0);
}

let clausesTotal = 0;
let clausesEqual = 0;
let errors = 0;
const substitutions = new Map<string, number>();
for (const file of selectedCorpusFiles(process.argv)) {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", file), "utf8"),
  ) as OracleCorpusDocument;
  const fixturePath = path.join(
    repoRoot,
    "test",
    "fixtures",
    "dectalk-oracle",
    `${corpus.corpusId}.durations.json`,
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
    entries: Record<string, { clauses: Array<Array<{ kind: string; ph?: number }>> }>;
  };
  for (const entry of corpus.entries) {
    const dectalk = fixture.entries[entry.id].clauses.map((clause) =>
      clause.flatMap((allophone) =>
        allophone.kind === "phone" ? [US_NAMES[allophone.ph as number] ?? `#${allophone.ph}`] : [],
      ),
    );
    let qlatt: Clause[];
    try {
      qlatt = qlattClauses(entry.text, corpus.defaults?.transitionMs ?? 30);
    } catch (error) {
      errors += 1;
      console.log(`${entry.id}\tERROR\t${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const count = Math.max(dectalk.length, qlatt.length);
    for (let index = 0; index < count; index += 1) {
      clausesTotal += 1;
      const theirs = dectalk[index] ?? [];
      const ours = qlatt[index] ?? [];
      if (theirs.join(" ") === ours.join(" ")) {
        clausesEqual += 1;
        continue;
      }
      if (theirs.length === ours.length) {
        theirs.forEach((name, position) => {
          if (name === ours[position]) return;
          const key = `${ours[position]}->${name}`;
          substitutions.set(key, (substitutions.get(key) ?? 0) + 1);
        });
      }
      if (verbose) {
        console.log(`${entry.id}[${index}]`);
        console.log(`  DECtalk: ${theirs.join(" ")}`);
        console.log(`  Qlatt:   ${ours.join(" ")}`);
      }
    }
  }
}
const ranked = [...substitutions].sort((a, b) => b[1] - a[1]);
console.log(
  JSON.stringify({
    clausesTotal,
    clausesEqual,
    errors,
    sameLengthSubstitutions: Object.fromEntries(ranked),
  }),
);
