/**
 * Pronounce a word with a letter-to-sound table: the right-to-left rule
 * interpreter (table-lts.ts) followed by the adjustment passes
 * (table-lts-adjust.ts), written out in the frontend's phone symbols with a
 * stress digit on each vowel.
 *
 * The table file is data produced by scripts/build-dectalk-lts-table.ts from
 * DECtalk 4.63's source tree.
 */

import type { HomographEntry } from "./table-homograph";
import { applyLtsRules, type LtsTable } from "./table-lts";
import { adjustLts, type LtsAdjustTables } from "./table-lts-adjust";
import type { NumberPhones } from "./table-number";

export interface LtsTableDocument extends LtsTable, LtsAdjustTables {
  format: "lts-table";
  /** The frontend's symbols for each phoneme code; usually one. */
  phonemeSymbols: readonly (readonly string[])[];
  /** Phoneme codes that carry a stress digit. */
  stressBearing: readonly number[];
  /** Suffix stripping rules (table-suffix.ts); absent when the table has none. */
  suffixIndex?: readonly number[];
  suffixTable?: readonly number[];
  /** The name of each bit of a form class word, bit 0 first; null for an unused bit. */
  formClassNames?: readonly (string | null)[];
  /** Each dictionary word's form class word. */
  wordFormClasses?: Readonly<Record<string, number>>;
  /**
   * For a dictionary word, the indices of the phones whose allophone rules
   * are blocked (the dictionary's `~` before the phone).
   */
  wordRuleBlocks?: Readonly<Record<string, readonly number[]>>;
  /**
   * For a dictionary word, the indices of the phones after which a morpheme
   * boundary or a compound's joint stands (the dictionary's `*` and `#`).
   */
  wordBoundaries?: Readonly<Record<string, readonly number[]>>;
  /** The secondary entry of each word with two entries (table-homograph.ts). */
  homographs?: Readonly<Record<string, HomographEntry>>;
  /** The rules that choose between a word's two entries, in order. */
  homographRules?: readonly (readonly number[])[];
  /** Words whose form class is fixed whatever the dictionary says. */
  specialWordFormClasses?: Readonly<Record<string, number>>;
  /** The phrase each of those words starts. */
  specialWordPhraseStarts?: Readonly<Record<string, "pp">>;
  /**
   * Words spoken one way apart from punctuation and another way against a
   * punctuation mark (the article "a"). `apart` has its own form class word;
   * `against` keeps the dictionary's.
   */
  wordsByPunctuation?: Readonly<
    Record<
      string,
      {
        apart: { phonemes: readonly string[]; formClass: number };
        against: { phonemes: readonly string[] };
      }
    >
  >;
  /**
   * The name of each letter: what a one-letter word that is in no dictionary
   * is spoken as (it is spelled).
   */
  letterPhones?: Readonly<Record<string, readonly string[]>>;
  /**
   * The name of each mark that is spoken when it stands inside a spelled
   * word ("question mark"), as the words of the name.
   */
  characterNames?: Readonly<Record<string, readonly (readonly string[])[]>>;
  /**
   * The words of the compiled dictionary, in its order and with their case,
   * for the search that depends on both (table-dictionary-search.ts).
   */
  dictionaryWords?: readonly string[];
  /**
   * The unit abbreviations read after a number, each with the symbols of its
   * singular and of its plural (phone codes and stress marks, as the number
   * phone lists).
   */
  numberAbbreviations?: Readonly<
    Record<string, { singular: readonly number[]; plural: readonly number[] }>
  >;
  /** The phone lists numbers are spoken from (table-number.ts). */
  numberPhones?: NumberPhones;
  /**
   * Phonemic text: the symbol each character stands for, by character code
   * (a phone code of `phonemeSymbols`, or a control symbol as in the number
   * phone lists; null for none), and the two characters that stand around
   * such text in a word.
   */
  phonemeCharacters?: readonly (number | null)[];
  phonemicMarks?: readonly number[];
}

/** The names of the bits set in a form class word, lowest bit first. */
export function formClassNamesOf(mask: number, table: LtsTableDocument): string[] {
  const names: string[] = [];
  (table.formClassNames ?? []).forEach((name, bit) => {
    if (name !== null && Math.floor(mask / 2 ** bit) % 2 === 1) names.push(name);
  });
  return names;
}

/**
 * A form class word as DECtalk's phonetic stage receives it. The text stage
 * sends the word as two 16-bit halves; the phonetic stage reads them into a
 * `short` buffer and adds them, `(buf[1] << 16) + buf[2]`
 * (PH/ph_task.c:219, 600), so a low half with bit 15 set is added as a
 * negative number and the high half arrives one less. Bit 15 is FC_THAT:
 * "that", "what" and "which" lose `func` and gain `verb` among others, and
 * count as verbs in the helper-verb rule.
 */
export function receivedFormClassWord(mask: number): number {
  const low = mask % 0x10000;
  const high = Math.floor(mask / 0x10000);
  return low < 0x8000 ? mask : ((high + 0xffff) % 0x10000) * 0x10000 + low;
}

/**
 * Whether a dictionary entry with this form class word starts a verb phrase:
 * DECtalk sends VPSTART ahead of an entry whose class is exactly `verb`, or
 * holds both `verb` and `character` (LTS/ls_dict.c:777-778, with VPHRASE =
 * FC_VERB|FC_CHARACTER from LTS/ls_defs.h:710).
 */
export function startsVerbPhrase(mask: number, table: LtsTableDocument): boolean {
  const names = formClassNamesOf(mask, table);
  return (
    (names.length === 1 && names[0] === "verb") ||
    (names.includes("verb") && names.includes("character"))
  );
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
  return pronounceWithLtsTableDetailed(word, table).phonemes;
}

/**
 * The same, with the indices of the phones a morpheme boundary or a
 * compound's joint stands after: the rules mark them (the `*` and `#` flags of
 * LTS/ls_adju.c, sent as MBOUND and HYPHEN), and the phonemic stage reads
 * them as it reads the dictionary's ("lighthouse" is L AY T, boundary, HH AW S).
 */
export function pronounceWithLtsTableDetailed(
  word: string,
  table: LtsTableDocument,
): { phonemes: string[]; boundaryAfter: number[] } {
  const stressBearing = new Set(table.stressBearing);
  const phonemes: string[] = [];
  const boundaryAfter: number[] = [];
  let pending = 0;
  for (const symbol of adjustLts(applyLtsRules(word, table), table)) {
    if (symbol.kind === "morpheme_boundary" || symbol.kind === "compound_boundary") {
      if (phonemes.length > 0 && boundaryAfter.at(-1) !== phonemes.length - 1) {
        boundaryAfter.push(phonemes.length - 1);
      }
      continue;
    }
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
  return { phonemes, boundaryAfter };
}
