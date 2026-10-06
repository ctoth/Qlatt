/**
 * Pronounce a word with a letter-to-sound table: the right-to-left rule
 * interpreter (table-lts.ts) followed by the adjustment passes
 * (table-lts-adjust.ts), written out in the frontend's phone symbols with a
 * stress digit on each vowel.
 *
 * The table file is data produced by scripts/build-dectalk-lts-table.ts from
 * DECtalk 4.63's source tree.
 */

import { applyLtsRules, type LtsTable } from "./table-lts";
import { adjustLts, type LtsAdjustTables } from "./table-lts-adjust";

export interface LtsTableDocument extends LtsTable, LtsAdjustTables {
  format: "lts-table";
  /** The frontend's symbols for each phoneme code; usually one. */
  phonemeSymbols: readonly (readonly string[])[];
  /** Phoneme codes that carry a stress digit. */
  stressBearing: readonly number[];
  /** Suffix stripping rules (table-suffix.ts); absent when the table has none. */
  suffixIndex?: readonly number[];
  suffixTable?: readonly number[];
}

export function isLtsTableDocument(value: unknown): value is LtsTableDocument {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { format?: unknown }).format === "lts-table" &&
    Array.isArray((value as { words?: unknown }).words) &&
    Array.isArray((value as { bytes?: unknown }).bytes)
  );
}

/**
 * The word's phones with stress digits (0 unstressed, 1 primary, 2 secondary).
 * DECtalk marks the stress before the first phone of a syllable that is not a
 * consonant; the digit goes on the next stress-bearing phone.
 */
export function pronounceWithLtsTable(word: string, table: LtsTableDocument): string[] {
  const stressBearing = new Set(table.stressBearing);
  const phonemes: string[] = [];
  let pending = 0;
  for (const symbol of adjustLts(applyLtsRules(word, table), table)) {
    if (symbol.kind !== "phone") continue;
    if (symbol.stress !== 0) pending = symbol.stress;
    const symbols = table.phonemeSymbols[symbol.phone];
    if (!symbols) {
      throw new Error(
        `E_LTS_TABLE_PHONEME: code ${symbol.phone.toString()} has no symbol (word '${word}')`,
      );
    }
    if (!stressBearing.has(symbol.phone)) {
      phonemes.push(...symbols);
      continue;
    }
    phonemes.push(...symbols.slice(0, -1), `${symbols[symbols.length - 1]}${pending.toString()}`);
    pending = 0;
  }
  return phonemes;
}
