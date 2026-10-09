/**
 * DECtalk's phoneme log for a number and the number port's symbols, as the
 * same tokens, so the two can be compared.
 *
 * The log (`say.exe -lp`) prints each symbol as two characters: a phone name
 * (one-letter names padded with a space), `' ` primary stress, two spaces for
 * a word boundary, `) ` a verb-phrase start, `, ` a pause, `. ` the end.
 *
 * Tokens: a phone's DECtalk name in upper case, `'` and a backtick for stress
 * marks, `_` word boundary, `)` verb-phrase start, `,` pause. Marks inside a
 * word (morpheme and syllable boundaries) are left out on both sides, and so
 * are boundaries at either end.
 */

import {
  NUMBER_COMMA,
  NUMBER_S1,
  NUMBER_S2,
  NUMBER_VPSTART,
  NUMBER_WBOUND,
} from "../../src/g2p/table-number";
import { normalizeText } from "../../src/tts-frontend";
import { US_ALLOPHONE_NAMES } from "./allophones";

const CONTROL: ReadonlyMap<number, string> = new Map([
  [NUMBER_S1, "'"],
  [NUMBER_S2, "`"],
  [NUMBER_WBOUND, "_"],
  [NUMBER_VPSTART, ")"],
  [NUMBER_COMMA, ","],
]);
const LOG_CONTROL: ReadonlyMap<string, string> = new Map([
  ["'", "'"],
  ["`", "`"],
  ["", "_"],
  [")", ")"],
  [",", ","],
]);
const LOG_IGNORED = new Set(["*", "-", "#", "."]);

function trimBoundaries(tokens: string[]): string[] {
  let start = 0;
  let end = tokens.length;
  while (start < end && tokens[start] === "_") start += 1;
  while (end > start && tokens[end - 1] === "_") end -= 1;
  return tokens.slice(start, end);
}

/** The tokens of one log, line breaks already removed. */
export function numberLogTokens(log: string): string[] {
  const tokens: string[] = [];
  for (let i = 0; i < log.length; i += 2) {
    const symbol = log.slice(i, i + 2).trim();
    if (LOG_IGNORED.has(symbol)) continue;
    tokens.push(LOG_CONTROL.get(symbol) ?? (symbol === "yx" ? "Y" : symbol.toUpperCase()));
  }
  return trimBoundaries(tokens);
}

/** The tokens of a symbol list from src/g2p/table-number.ts. */
export function numberSymbolTokens(symbols: readonly number[]): string[] {
  const tokens: string[] = [];
  for (const symbol of symbols) {
    const control = CONTROL.get(symbol);
    if (control) tokens.push(control);
    else if (symbol < US_ALLOPHONE_NAMES.length) tokens.push(US_ALLOPHONE_NAMES[symbol]);
  }
  return trimBoundaries(tokens);
}

/**
 * A text that the dectalk-english text rules write out as one word of
 * phonemic text (a clock time, a date word: the lexical rules tn_clock_time
 * and tn_date_text), as the symbols its characters stand for; null for any
 * other text. `phonemeCharacters` is the table's list of the symbol each
 * character stands for (lts-table.json).
 */
export function composedNumberSymbols(
  text: string,
  phonemeCharacters: readonly (number | null)[],
): number[] | null {
  // The text stage closes a text with no mark at its end as a sentence.
  const written = normalizeText(text, "dectalk-english").replace(/ \.$/, "");
  if (!/^\x81[^\x81\x82]+\x82$/.test(written)) return null;
  return [...written.slice(1, -1)].map((char) => {
    const symbol = phonemeCharacters[char.charCodeAt(0)];
    if (symbol === null || symbol === undefined) {
      throw new Error(`no symbol for '${char}' in the phonemic text of '${text}'`);
    }
    return symbol;
  });
}
