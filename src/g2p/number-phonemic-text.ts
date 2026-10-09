/**
 * A whole number as phonemic text, for a frontend's text rules: the one piece
 * of a number-like word that a rule cannot put together from the generated
 * phone lists, because how a number is read depends on all of its digits
 * (DECtalk 4.63 LTS/l_us_pr1.c:497-749 ls_proc_do_number, :367-398
 * ls_proc_do_4_digits).
 *
 * The text is written in the characters of the frontend's phonemic text
 * (lts-table.json `phonemeCharacters`, DECtalk's usa_ascky_rev[]): for each
 * symbol the first printable character that stands for it, as
 * scripts/build-dectalk-lts-table.ts writes the generated lists of
 * number-phonemes.yaml. A word boundary inside the number is a space.
 */

import { ltsDocumentAt } from "./lts-document";
import { isLtsTableDocument } from "./table-lts-pronounce";
import { fourDigits, speakNumber, speakYear } from "./table-number";

/** How the digits are read. */
export const NUMBER_PHONEMIC_FORMS = ["cardinal", "ordinal", "year", "four_digits"] as const;
export type NumberPhonemicForm = (typeof NUMBER_PHONEMIC_FORMS)[number];

const characterMaps = new Map<string, ReadonlyMap<number, string>>();

/** The first printable character that stands for each symbol. */
function charactersOf(path: string, characters: readonly (number | null)[]) {
  const cached = characterMaps.get(path);
  if (cached) return cached;
  const map = new Map<number, string>();
  for (let code = 32; code < 127; code += 1) {
    const symbol = characters[code];
    if (symbol !== null && symbol !== undefined && !map.has(symbol)) {
      map.set(symbol, String.fromCharCode(code));
    }
  }
  characterMaps.set(path, map);
  return map;
}

/**
 * `digits` (decimal digits, or groups of three with commas for `cardinal` and
 * `ordinal`) read in `form` from the number phone lists of the table at
 * `ltsPath`:
 *
 *   cardinal     "23" twenty three, "100" one hundred
 *   ordinal      "23" twenty third (ls_proc_do_number with its ordinal flag)
 *   year         four digits in two halves, "1984" nineteen eighty four
 *   four_digits  as `year`, but "2000" two thousand (ls_proc_do_4_digits)
 *
 * Null when the table reads no such number: digits it does not take, or four
 * digits with a leading zero, which DECtalk spells.
 */
export function numberPhonemicText(
  digits: string,
  form: NumberPhonemicForm,
  ltsPath: string,
): string | null {
  const table = ltsDocumentAt(ltsPath);
  if (!isLtsTableDocument(table) || !table.numberPhones || !table.phonemeCharacters) {
    throw new Error(`E_NUMBER_PHONEMES: '${ltsPath}' has no number phone lists`);
  }
  const lists = table.numberPhones;
  const fourDigitText = /^[0-9]{4}$/.test(digits);
  const symbols =
    form === "cardinal"
      ? speakNumber(digits, lists)
      : form === "ordinal"
        ? speakNumber(digits, lists, { ordinal: true })
        : !fourDigitText
          ? null
          : form === "year"
            ? speakYear(digits, lists)
            : fourDigits(digits, lists);
  if (!symbols) return null;
  const characters = charactersOf(ltsPath, table.phonemeCharacters);
  return symbols
    .map((symbol) => {
      const char = characters.get(symbol);
      if (char === undefined) {
        throw new Error(`E_NUMBER_PHONEMES: no character for symbol ${symbol.toString()}`);
      }
      return char;
    })
    .join("");
}
