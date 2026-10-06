#!/usr/bin/env node

/**
 * compare-duration-features.ts
 * ============================
 * Print, per allophone, DECtalk's duration-rule inputs next to what the
 * dectalk-english frontend holds for the same Segment, for one corpus entry.
 *
 * DECtalk side (test/fixtures/dectalk-oracle/<corpus>.durations.json), decoded
 * with ph_defs.h:219-250:
 *   stress   = struc & FSTRESS (03): 0 none, 1 primary, 2 secondary, 3 emphasis
 *   winitc   = struc & FWINITC (04): word-initial consonant
 *   typesyl  = struc & FTYPESYL (030): 000 mono, 010 first, 020 medial, 030 final
 *   boundary = struc & FBOUNDARY (0740): 0100 morpheme, 0140 word, 0200 PP,
 *              0240 VP, 0300 relative clause, 0340 comma, 0400 period, 0440 question
 *   fea      = phoneme feature word (us_featb), printed in octal
 *
 * Qlatt side: the active Segment items, stop pieces merged as in
 * compare-durations.ts, with the features the duration rules read.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-duration-features.ts --id g2p-cake \
 *     [--corpus test/oracle-corpora/dectalk-us-v1.json]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import type { OracleCorpusDocument } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const id = flag("id");
if (!id) throw new Error("Usage: compare-duration-features --id <phraseId> [--corpus <file>]");
const corpusPath = path.resolve(
  flag("corpus") ?? path.join(repoRoot, "test", "oracle-corpora", "dectalk-us-v1.json"),
);
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as OracleCorpusDocument;
const entry = corpus.entries.find((candidate) => candidate.id === id);
if (!entry) throw new Error(`Unknown phrase id '${id}'`);
const fixture = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", `${corpus.corpusId}.durations.json`),
    "utf8",
  ),
) as {
  entries: Record<string, { clauses: Array<Array<Record<string, unknown>>> }>;
};

const SYLLABLE = ["mono", "first", "medial", "final"];
const BOUNDARY = new Map<number, string>([
  [0, "-"],
  [0o40, "syll"],
  [0o100, "morph"],
  [0o140, "word"],
  [0o200, "pp"],
  [0o240, "vp"],
  [0o300, "rel"],
  [0o340, "comma"],
  [0o400, "period"],
  [0o440, "quest"],
]);
const DECTALK_COLUMNS = [
  "n",
  "ph",
  "stress",
  "winitc",
  "syl",
  "boundary",
  "fea(oct)",
  "inh",
  "min",
  "prcnt",
  "deldur",
  "minEnd",
  "frames",
];
const QLATT_COLUMNS = [
  "phoneme",
  "type",
  "stress",
  "word",
  "sylPos",
  "boundary",
  "next_boundary",
  "inhMs",
  "minMs",
  "frames",
];

console.log(`# ${entry.id}: "${entry.text}"`);
console.log("## DECtalk");
console.log(DECTALK_COLUMNS.join("\t"));
// Clauses are timed separately; allophone numbers restart in each.
for (const allophone of fixture.entries[id].clauses.flat()) {
  const struc = Number(allophone.struc);
  if (allophone.kind === "silence") {
    const boundary = BOUNDARY.get(struc & 0o740) ?? `0${(struc & 0o740).toString(8)}`;
    console.log(`-\tSIL\t\t\t\t${boundary}\t\t\t\t\t\t\t${allophone.frames}`);
    continue;
  }
  const after = (allophone.after as Record<string, Record<string, number>>)["24"] ?? {};
  console.log(
    [
      allophone.n,
      allophone.ph,
      struc & 0o3,
      struc & 0o4 ? "yes" : "",
      SYLLABLE[(struc & 0o30) >> 3],
      BOUNDARY.get(struc & 0o740) ?? `0${(struc & 0o740).toString(8)}`,
      Number(allophone.fea).toString(8),
      allophone.durinh,
      allophone.durmin,
      after.prcnt,
      after.deldur,
      after.durmin,
      allophone.frames,
    ].join("\t"),
  );
}

console.log("## Qlatt");
console.log(QLATT_COLUMNS.join("\t"));
const { utterance } = textToKlattTrackDetailed(
  entry.text,
  undefined,
  corpus.defaults?.transitionMs ?? 30,
  { frontendId: "dectalk-english" },
);
for (const item of utterance.relation("Segment").listItems()) {
  if (item.get("active") === false) continue;
  const show = (key: string): string => {
    const value = item.get(key);
    return value == null ? "" : String(value);
  };
  console.log(
    [
      show("phoneme"),
      show("type"),
      show("stress"),
      show("word"),
      show("syllable_position_in_word"),
      show("boundary"),
      show("next_boundary"),
      show("inherentDuration"),
      show("minimumDuration"),
      (Number(item.get("duration")) / 6.4).toFixed(2),
    ].join("\t"),
  );
}
