/**
 * DECtalk allophone sequences, from DECtalk's record and from this frontend,
 * in the same names, so the two can be compared.
 *
 * DECtalk's record is test/fixtures/dectalk-oracle/<corpus>.durations.json:
 * one list per clause of the allophones its duration routine timed, after its
 * allophone rules (ph_aloph.c). That is the level this frontend's Segments are
 * at; DECtalk's phoneme log (-lp) is written before those rules.
 */

import type { Utterance } from "../../src/declarative-frontend/hrg";

// DECtalk 4.63 INCLUDE/l_all_ph.h, `#define US_<NAME> <index>`.
export const US_ALLOPHONE_NAMES = [
  "SIL", "IY", "IH", "EY", "EH", "AE", "AA", "AY", "AW", "AH",
  "AO", "OW", "OY", "UH", "UW", "RR", "YU", "AX", "IX", "IR",
  "ER", "AR", "OR", "UR", "W", "Y", "R", "LL", "HX", "RX",
  "LX", "M", "N", "NX", "EL", "DZ", "EN", "F", "V", "TH",
  "DH", "S", "Z", "SH", "ZH", "P", "B", "T", "D", "K",
  "G", "DX", "TX", "Q", "CH", "JH", "DF", "TZ", "CZ",
]; // biome-ignore format: ten per row, as in the header

// This frontend's phone names that differ from DECtalk's.
const PORT_TO_DECTALK: Readonly<Record<string, string>> = {
  HH: "HX",
  NG: "NX",
  L: "LL",
  GS: "Q",
};

/** DECtalk's name for a Segment's phone: stress digit removed, port spelling undone. */
export function dectalkAllophoneName(phoneme: string): string {
  const bare = phoneme.replace(/[0-9]$/, "");
  return PORT_TO_DECTALK[bare] ?? bare;
}

/**
 * The frontend's allophones, one list per clause. A stop is counted once (its
 * release pieces are skipped), the dummy vowel after a final stop is not an
 * allophone of the duration routine, and a punctuation silence ends a clause.
 */
export function qlattAllophoneClauses(utterance: Utterance): string[][] {
  const clauses: string[][] = [[]];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    if (phoneme === "SIL") {
      if (item.get("punctuationSymbol") != null && clauses[clauses.length - 1].length > 0) {
        clauses.push([]);
      }
      continue;
    }
    const type = item.get("type");
    if (type === "stop_release" || type === "stop_aspiration") continue;
    clauses[clauses.length - 1].push(dectalkAllophoneName(phoneme));
  }
  return clauses.filter((clause) => clause.length > 0);
}

/** DECtalk's allophones for one fixture entry, one list per clause, silences left out. */
export function recordedAllophoneClauses(entry: {
  clauses: ReadonlyArray<ReadonlyArray<{ kind: string; ph?: number }>>;
}): string[][] {
  return entry.clauses.map((clause) =>
    clause.flatMap((allophone) =>
      allophone.kind === "phone"
        ? [US_ALLOPHONE_NAMES[allophone.ph as number] ?? `#${String(allophone.ph)}`]
        : [],
    ),
  );
}
