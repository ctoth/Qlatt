/**
 * The per-phone structure word and duration of a clause, from DECtalk's
 * record and from this frontend, in the same terms.
 *
 * DECtalk's record is test/fixtures/dectalk-oracle/<corpus>.durations.json
 * (scripts/oracle/export-duration-fixture.ts): for each allophone its code,
 * its structure word `struc` as the duration routine saw it, and the final
 * frame count. The fields of `struc` (PH/ph_defs.h):
 *
 *   stress  FSTRESS 03          Segment `stress` (absent = 0)
 *   winitc  FWINITC 04          Segment `word_initial_consonant`
 *   syl     FTYPESYL 030        Segment `syllable_type`
 *   bound   FBOUNDARY 0740      Segment `rime_boundary`
 *   hat     FHAT_BEGINS 01000, FHAT_ENDS 02000   `hat_begins`, `hat_ends`
 */

import type { Utterance } from "../../src/declarative-frontend/hrg";
import { dectalkAllophoneName, US_ALLOPHONE_NAMES } from "./allophones";

export type StructurePhone = {
  name: string;
  stress: number;
  winitc: boolean;
  syl: string;
  bound: string;
  /** "<" where the hat pattern rises, ">" where it falls. */
  hat: string;
  /** The allophone's duration in 6.4 ms frames. */
  frames: number;
};

export type RecordedAllophone = { kind: string; ph?: number; struc: number; frames: number };

// FBOUNDARY values, ph_defs.h:249-262, in the port's rime_boundary terms.
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

// FTYPESYL: only a syllabic carries it (ph_sort2.c init_med_final).
const DECTALK_SYLLABLE = ["mono", "first", "medial", "final"];
// The port's syllable_type values, in DECtalk's terms.
const PORT_SYLLABLE: Readonly<Record<string, string>> = {
  only: "mono",
  first: "first",
  medial: "medial",
  final: "final",
};

const hatOf = (begins: boolean, ends: boolean): string => `${begins ? "<" : ""}${ends ? ">" : ""}`;

/** DECtalk's phones of each clause of one fixture entry. */
export function recordedStructureClauses(
  clauses: readonly (readonly RecordedAllophone[])[],
): StructurePhone[][] {
  return clauses.map((clause) =>
    clause.flatMap((allophone) =>
      allophone.kind === "phone" || allophone.kind === "fixed"
        ? [
            {
              name: US_ALLOPHONE_NAMES[allophone.ph as number] ?? `#${String(allophone.ph)}`,
              stress: allophone.struc & 0o3,
              winitc: (allophone.struc & 0o4) !== 0,
              syl: DECTALK_SYLLABLE[(allophone.struc & 0o30) >> 3],
              bound:
                DECTALK_BOUNDARY.get(allophone.struc & 0o740) ??
                `0${(allophone.struc & 0o740).toString(8)}`,
              hat: hatOf((allophone.struc & 0o1000) !== 0, (allophone.struc & 0o2000) !== 0),
              frames: allophone.frames,
            },
          ]
        : [],
    ),
  );
}

/** This frontend's phones of each clause, one per DECtalk allophone. */
export function qlattStructureClauses(utterance: Utterance): StructurePhone[][] {
  const clauses: StructurePhone[][] = [[]];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    if (phoneme === "SIL") {
      // A punctuation silence ends the clause; a dummy-vowel silence does not.
      if (item.get("punctuationSymbol") != null && clauses[clauses.length - 1].length > 0) {
        clauses.push([]);
      }
      continue;
    }
    // A stop is one allophone: its closure carries the frames.
    const type = item.get("type");
    if (type === "stop_release" || type === "stop_aspiration") continue;
    const stress = item.get("stress");
    const syllabic = type === "vowel" || ["EL", "EM", "EN"].includes(phoneme);
    const position = String(item.get("syllable_type") ?? "");
    clauses[clauses.length - 1].push({
      name: dectalkAllophoneName(phoneme),
      stress: typeof stress === "number" ? stress : 0,
      winitc: item.get("word_initial_consonant") === true,
      syl: syllabic ? (PORT_SYLLABLE[position] ?? `?${position}`) : "mono",
      bound: String(item.get("rime_boundary") ?? ""),
      hat: hatOf(item.get("hat_begins") === true, item.get("hat_ends") === true),
      frames: Number(item.get("timing_frames")),
    });
  }
  return clauses.filter((clause) => clause.length > 0);
}

/** `K1^ EY1/first-word<>:17`: name, stress, word-initial, syllable type, boundary, hat, frames. */
export const showStructurePhone = (phone: StructurePhone): string =>
  `${phone.name}${phone.stress > 0 ? phone.stress.toString() : ""}${phone.winitc ? "^" : ""}` +
  (phone.syl === "mono" ? "" : `/${phone.syl}`) +
  (phone.bound === "" ? "" : `-${phone.bound}`) +
  phone.hat +
  `:${phone.frames.toString()}`;
