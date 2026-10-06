#!/usr/bin/env node

/**
 * compare-structure-bits.ts
 * =========================
 * Layer A of the duration port, second half: for clauses whose allophone
 * sequence already equals DECtalk's, do the per-phone structure fields match?
 *
 *   stress   DECtalk struc & FSTRESS (03)  vs  Segment `stress` (absent = 0)
 *   winitc   DECtalk struc & FWINITC (04)  vs  Segment `word_initial_consonant`
 *
 * Clauses with a different allophone sequence are skipped and counted; fix
 * those with scripts/oracle/compare-allophones.ts first.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-structure-bits.ts [--verbose]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
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
const PORT_TO_DECTALK: Readonly<Record<string, string>> = { HH: "HX", NG: "NX", L: "LL" };

type Phone = { name: string; stress: number; winitc: boolean; syl: string; bound: string };

// FBOUNDARY (0740) values, ph_defs.h:249-262, in the port's rime_boundary terms.
const DECTALK_BOUNDARY = new Map<number, string>([
  [0, ""],
  [0o40, "syllable"],
  [0o100, "morpheme"],
  [0o140, "word"],
  [0o200, "pp"],
  [0o240, "vp"],
  [0o300, "relative"],
  [0o340, "comma"],
  [0o400, "period"],
  [0o440, "question"],
  [0o500, "exclaim"],
]);

// FTYPESYL (030): only a syllabic carries it (ph_sort2.c init_med_final).
const DECTALK_SYLLABLE = ["mono", "first", "medial", "final"];
// The port's syllable_type values, in DECtalk's terms.
const PORT_SYLLABLE: Readonly<Record<string, string>> = {
  only: "mono",
  first: "first",
  medial: "medial",
  final: "final",
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const verbose = process.argv.includes("--verbose");

function qlattClauses(text: string, transitionMs: number): Phone[][] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, transitionMs, {
    frontendId: "dectalk-english",
  });
  const clauses: Phone[][] = [[]];
  let previous: string | undefined;
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    if (phoneme === "SIL") {
      if (item.get("punctuationSymbol") != null && clauses[clauses.length - 1].length > 0) {
        clauses.push([]);
      }
      previous = undefined;
      continue;
    }
    if (previous && phoneme.startsWith(`${previous}_`)) continue;
    previous = phoneme;
    const stress = item.get("stress");
    const syllabic = item.get("type") === "vowel" || ["EL", "EM", "EN"].includes(phoneme);
    const position = String(item.get("syllable_type") ?? "");
    clauses[clauses.length - 1].push({
      name: PORT_TO_DECTALK[phoneme] ?? phoneme,
      stress: typeof stress === "number" ? stress : 0,
      winitc: item.get("word_initial_consonant") === true,
      syl: syllabic ? (PORT_SYLLABLE[position] ?? `?${position}`) : "mono",
      bound: String(item.get("rime_boundary") ?? ""),
    });
  }
  return clauses.filter((clause) => clause.length > 0);
}

const show = (phone: Phone): string =>
  `${phone.name}${phone.stress > 0 ? phone.stress : ""}${phone.winitc ? "^" : ""}` +
  (phone.syl === "mono" ? "" : `/${phone.syl}`) +
  (phone.bound === "" ? "" : `-${phone.bound}`);

let clausesCompared = 0;
let clausesSkipped = 0;
let clausesEqual = 0;
let phones = 0;
let stressEqual = 0;
let winitcEqual = 0;
let syllableEqual = 0;
let boundaryEqual = 0;
for (const file of ["dectalk-us-v1.json", "dectalk-us-heldout-v1.json"]) {
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
    entries: Record<
      string,
      { clauses: Array<Array<{ kind: string; ph?: number; struc: number }>> }
    >;
  };
  for (const entry of corpus.entries) {
    const dectalk: Phone[][] = fixture.entries[entry.id].clauses.map((clause) =>
      clause.flatMap((allophone) =>
        allophone.kind === "phone"
          ? [
              {
                name: US_NAMES[allophone.ph as number] ?? `#${allophone.ph}`,
                stress: allophone.struc & 0o3,
                winitc: (allophone.struc & 0o4) !== 0,
                syl: DECTALK_SYLLABLE[(allophone.struc & 0o30) >> 3],
                bound:
                  DECTALK_BOUNDARY.get(allophone.struc & 0o740) ??
                  `0${(allophone.struc & 0o740).toString(8)}`,
              },
            ]
          : [],
      ),
    );
    let qlatt: Phone[][];
    try {
      qlatt = qlattClauses(entry.text, corpus.defaults?.transitionMs ?? 30);
    } catch {
      clausesSkipped += dectalk.length;
      continue;
    }
    dectalk.forEach((theirs, index) => {
      const ours = qlatt[index] ?? [];
      const sameSequence =
        theirs.length === ours.length && theirs.every((phone, i) => phone.name === ours[i].name);
      if (!sameSequence) {
        clausesSkipped += 1;
        return;
      }
      clausesCompared += 1;
      let equal = true;
      theirs.forEach((phone, i) => {
        phones += 1;
        if (phone.stress === ours[i].stress) stressEqual += 1;
        else equal = false;
        if (phone.winitc === ours[i].winitc) winitcEqual += 1;
        else equal = false;
        if (phone.syl === ours[i].syl) syllableEqual += 1;
        else equal = false;
        if (phone.bound === ours[i].bound) boundaryEqual += 1;
        else equal = false;
      });
      if (equal) {
        clausesEqual += 1;
      } else if (verbose) {
        console.log(`${entry.id}[${index}]`);
        console.log(`  DECtalk: ${theirs.map(show).join(" ")}`);
        console.log(`  Qlatt:   ${ours.map(show).join(" ")}`);
      }
    });
  }
}
console.log(
  JSON.stringify({
    clausesCompared,
    clausesSkipped,
    clausesEqual,
    phones,
    stressEqual,
    winitcEqual,
    syllableEqual,
    boundaryEqual,
  }),
);
