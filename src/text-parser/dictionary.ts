/**
 * The dictionary question a command text parser asks about a word: is this
 * spelling an entry, and is it an abbreviation. A port of the comparison of
 * DECtalk 4.63's CMD/par_dict.c (par_dict_dlook, :508-569): a lower-case
 * letter of an entry matches either case, a capital matches a capital only,
 * and an entry that ends in a full stop is an abbreviation.
 *
 * Not ported: the order in which the C's search meets two entries that
 * differ in case only (five words of the US dictionary); here any of them
 * that matches counts.
 */

import type { DictionaryState, TextParserTable } from "./interpreter";

const HIT = 1;
const ABBREVIATION = 2;

/** par_dict_dlook's character test (:537-542). */
function spells(entry: string, word: string): boolean {
  if (entry.length !== word.length) return false;
  for (let i = 0; i < entry.length; i += 1) {
    if (word[i] === entry[i]) continue;
    const lower = entry[i] !== entry[i].toUpperCase();
    if (!(lower && word[i] === entry[i].toUpperCase())) return false;
  }
  return true;
}

/**
 * The lookup for a parser's clause reader. `hasWord` answers whether the
 * dictionary has a word, given in lower case; the table says which words
 * have a capital in their spelling.
 */
export function dictionaryLookup(
  table: TextParserTable,
  hasWord: (lowerCaseWord: string) => boolean,
): (word: string) => DictionaryState {
  return (word) => {
    const key = word.toLowerCase();
    if (!hasWord(key)) return 0;
    const entries = table.capitalSpellings[key] ?? [key];
    if (!entries.some((entry) => spells(entry, word))) return 0;
    return word.endsWith(".") ? ABBREVIATION : HIT;
  };
}
