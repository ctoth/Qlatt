/**
 * Cuts text into clauses and runs the rules of a command text parser over
 * each: what DECtalk 4.63 does to the characters it is given before its
 * letter-to-sound stage reads them. A port of cm_text_getclause
 * (CMD/cm_text.c:294-1304) and of the character loop that feeds it
 * (CMD/cm_pars.c:1296-1371), for plain text; line numbers below are
 * cm_text.c's unless a file is named.
 *
 * The characters that are white space, that end a clause and that are
 * brackets or quotes, and the sizes, come from the table
 * (scripts/build-dectalk-text-parser.ts); the language, the two modes and the
 * two rule sections are the caller's.
 *
 * Left out:
 *   - commands in the text (a `[` starts one, cm_pars.c:1353-1366): an error;
 *   - a clause longer than the table's `rollingStop`, which the C hands on in
 *     part (:599-602, :1247-1269): an error;
 *   - the e-mail and table reading modes, and index marks.
 */

import {
  createTextParser,
  type DictionaryState,
  type PassOptions,
  type TextParserTable,
} from "./interpreter";

export interface ClauseOptions {
  /** The language bit of the rules to run. */
  language: number;
  /** The rule section and the mode bit of the punctuation pass (:846-885). */
  punctuationSection: number;
  punctuationMode: number;
  /** The rule section and the mode bits of the main pass (:984-997). */
  mainSection: number;
  mainMode: number;
  /**
   * Is this spelling in the dictionary: 0 no, 1 yes, 2 yes and marked as an
   * abbreviation (CMD/par_dict.c par_dict_find_word). Default: no.
   */
  dictionary?: (word: string) => DictionaryState;
  onHit?: PassOptions["onHit"];
}

const toBytes = (text: string): number[] => [...text].map((char) => char.charCodeAt(0) & 0xff);
const fromBytes = (bytes: readonly number[]): string => String.fromCharCode(...bytes);
const at = (bytes: readonly number[], index: number): number => bytes[index] ?? 0;

const TAB = 0x09;
const LINE_FEED = 0x0a;
const CARRIAGE_RETURN = 0x0d;
const XON = 0x11;
const SPACE = 0x20;
const HYPHEN = 0x2d;
const FULL_STOP = 0x2e;
const LEFT_BRACKET = 0x5b;

/**
 * The clauses of `text`, each as the rules leave it: the characters handed to
 * the letter-to-sound stage, with the table's marks around phonemic text.
 * `text` is the whole character stream; a clause still open at its end is not
 * returned, as in the C, which waits for more.
 */
export function readClauses(
  table: TextParserTable,
  text: string,
  options: ClauseOptions,
): string[] {
  const config = table.clauses;
  const marks = config.marks;
  const types = table.characterTypes;
  const parser = createTextParser(table);
  const isSpace = (char: number): boolean => (marks[char] & config.spaceMark) !== 0;
  const isBreak = (char: number): boolean =>
    (marks[char] & (config.spaceMark | config.clauseMark)) !== 0;
  const spaceOrPhonesOff = (char: number): boolean => isSpace(char) || char === config.phonesOff;

  /** cm_text_get_word (:225-268): the word at `start`, with its full stop when `whole`. */
  const wordAt = (buffer: readonly number[], start: number, whole: boolean): number[] => {
    const word: number[] = [];
    let i = start;
    while (isSpace(at(buffer, i))) i += 1;
    const goesOn = (): boolean => {
      const char = at(buffer, i);
      if (whole) return (!isSpace(char) && char !== 0) || char === HYPHEN;
      const next = at(buffer, i + 1);
      return (
        (!isBreak(char) && char !== 0) ||
        char === HYPHEN ||
        char === FULL_STOP ||
        ((marks[char] & config.punctuationMark) !== 0 && next !== 0 && !isBreak(next))
      );
    };
    while (goesOn()) {
      if (at(buffer, i) !== config.phonesOff) word.push(at(buffer, i));
      i += 1;
    }
    return word;
  };

  /**
   * par_dict_lookup (CMD/par_dict.c:162-325): with `dotted`, a word that ends
   * in a full stop and is found only without it counts as an abbreviation.
   */
  const lookup = (word: readonly number[], dotted: boolean): DictionaryState => {
    if (word.length === 0 || !options.dictionary) return 0;
    const found = options.dictionary(fromBytes(word));
    if (found !== 0) return found;
    if (dotted && word[word.length - 1] === FULL_STOP && word.length > 1) {
      if (options.dictionary(fromBytes(word.slice(0, -1))) !== 0) return 2;
    }
    return 0;
  };

  /** The dictionary state of each word, at the place it starts (:758-843, :956-969). */
  const lookups = (buffer: readonly number[]): number[] => {
    const hits = buffer.map(() => 0);
    for (let i = 0; i < buffer.length; i += 1) {
      if (buffer[i] === config.phonesOff) continue;
      if ((i === 0 || spaceOrPhonesOff(buffer[i - 1])) && !isSpace(buffer[i])) {
        const word = wordAt(buffer, i, false);
        hits[i] = lookup(word, true);
        i += word.length;
      }
    }
    return hits;
  };

  const clauses: string[] = [];
  let buffer: number[] = [];
  /** Where the last word of the buffer starts (prevword). */
  let lastWord = 0;
  let lastChar = 0;
  let lastQuote = 0;
  let whiteSpaceRun = 0;

  for (const byte of toBytes(text)) {
    let char = byte;
    // cm_pars.c:1333-1343: a long run of white space ends the clause.
    if (isSpace(char) && isSpace(lastChar)) {
      whiteSpaceRun += 1;
      if (whiteSpaceRun > config.whiteSpaceRun) {
        char = config.clauseEnd;
        whiteSpaceRun = 0;
      }
    } else {
      whiteSpaceRun = 0;
    }
    if (char === LEFT_BRACKET) {
      throw new Error("E_TEXT_PARSER: a command in the text ('[') is not ported");
    }
    let done = false;
    // :358-370: a tab ends the clause unless white space came before it.
    if (char === TAB) char = !isSpace(lastChar) || lastQuote !== 0 ? config.clauseEnd : SPACE;
    // :403-410: an empty line ends the clause.
    if (
      (lastChar === LINE_FEED && (char === LINE_FEED || char === CARRIAGE_RETURN)) ||
      (lastChar === CARRIAGE_RETURN && char === CARRIAGE_RETURN)
    ) {
      done = true;
      char = config.clauseEnd;
    }
    // :413-452: brackets and quotes arrive as spaces.
    if ((types[char] & config.quoteType) !== 0 && options.punctuationMode === config.quoteMode) {
      lastQuote = char;
      if (!config.keptQuotes.includes(char)) char = SPACE;
    } else {
      lastQuote = 0;
    }
    if (char === 0 || char === XON) char = SPACE;
    if (char === config.clauseEnd) done = true;
    buffer.push(char);
    const count = buffer.length;
    // :499-520: white space after a clause mark ends the clause, unless the
    // mark is a full stop and the word with it is in the dictionary.
    if (
      spaceOrPhonesOff(at(buffer, count - 1)) &&
      (marks[at(buffer, count - 2)] & config.clauseMark) !== 0
    ) {
      done = true;
      if (
        char !== config.clauseEnd &&
        at(buffer, count - 2) === FULL_STOP &&
        spaceOrPhonesOff(char) &&
        lookup(wordAt(buffer, lastWord, true), false) !== 0
      ) {
        done = false;
      }
    }
    // :588-592
    if (spaceOrPhonesOff(at(buffer, count - 2)) && !spaceOrPhonesOff(at(buffer, count - 1))) {
      lastWord = count - 1;
    }
    lastChar = char;
    if (!done) {
      if (count > config.rollingStop) {
        throw new Error(
          `E_TEXT_PARSER: a clause longer than ${config.rollingStop} characters is not ported`,
        );
      }
      continue;
    }

    let output: number[];
    if (count < config.minimumLength && options.punctuationMode !== config.wholeMode) {
      // :636-641: a short clause goes by the rules.
      output = buffer;
    } else {
      const punctuated = parser.rewrite(buffer, lookups(buffer), {
        language: options.language,
        mode: options.punctuationMode,
        section: options.punctuationSection,
        onHit: options.onHit,
      });
      // :922: copied as a string, so up to its first NUL.
      const end = punctuated.indexOf(0);
      const clause = end < 0 ? punctuated : punctuated.slice(0, end);
      output = parser.rewrite(clause, lookups(clause), {
        language: options.language,
        mode: options.mainMode,
        section: options.mainSection,
        onHit: options.onHit,
      });
    }
    clauses.push(fromBytes(output));
    // :1272-1284
    buffer = [];
    lastWord = 0;
  }
  return clauses;
}
