/**
 * Cuts text into clauses and runs the rules of a command text parser over
 * each: what DECtalk 4.63 does to the characters it is given before its
 * letter-to-sound stage reads them. A port of cm_text_getclause
 * (CMD/cm_text.c:294-1304) and of the character loop that feeds it
 * (CMD/cm_pars.c:1296-1510), for plain text; line numbers below are
 * cm_text.c's unless a file is named.
 *
 * The characters that are white space, that end a clause and that are
 * brackets or quotes, and the sizes, come from the table
 * (scripts/build-dectalk-text-parser.ts); the language, the two modes and the
 * two rule sections are the caller's.
 *
 * Left out:
 *   - what a command in the text does (`[:name ...]`): its characters are
 *     taken out of the text, read against the table's commands
 *     (src/text-parser/commands.ts) and handed to the caller, and the clause
 *     before it is finished unless the command only marks a place;
 *   - phonemic text typed in brackets (the phoneme mode is off, as it is when
 *     DECtalk starts, CMD/cm_util.c:139);
 *   - the e-mail and table reading modes, and index marks.
 */

import {
  type CommandSlots,
  newCommandSlots,
  optionIndex,
  type ReadCommand,
  readCommands,
} from "./commands";
import {
  createTextParser,
  type DictionaryState,
  type PassOptions,
  type TextParserTable,
} from "./interpreter";
import { type PhonemeAlphabets, type ReadPhonemes, readPhonemes } from "./phonemes";

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
   * The flag of each mode a mode command may turn on for the main pass, by
   * the mode's word: the rules of the main pass are run in `mainMode` and
   * the flags that are on (CMD/cm_text.c:989-1011, modeflag with
   * MODE_CITATION). A mode not named here leaves the main pass as it is.
   */
  modeFlags?: Readonly<Record<string, number>>;
  /**
   * Is this spelling in the dictionary: 0 no, 1 yes, 2 yes and marked as an
   * abbreviation (CMD/par_dict.c par_dict_find_word). Default: no.
   */
  dictionary?: (word: string) => DictionaryState;
  onHit?: PassOptions["onHit"];
  /**
   * Called with each bracket of commands taken out: its text (between `[:`
   * and `]`), how many clauses were finished before it, and the commands
   * read from it (empty when the table has no command table).
   */
  onCommand?: (command: string, clausesBefore: number, read: readonly ReadCommand[]) => void;
  /**
   * Called with each bracket of phonemic text taken out while the phoneme
   * mode is on: its text, how many clauses were finished before it, the
   * symbols read from it (phonemes.ts), and whether phonemes are spoken.
   */
  onPhonemes?: (body: string, clausesBefore: number, read: ReadPhonemes, speak: boolean) => void;
  /**
   * The numbers the commands' parameter slots hold when the text starts
   * (commands.ts): a parameter nobody types keeps its slot's number.
   */
  commandSlots?: CommandSlots;
}

/** A clause as the rules leave it. */
export interface Clause {
  /**
   * The characters handed on, with the table's marks around phonemic text:
   * the whole of the output, as the parser wrote it.
   */
  text: string;
  /** The clause before this one was handed on in part (roll_text, :1071). */
  rolled: boolean;
  /**
   * The character sent after the clause: the clause end that closed it, when
   * the rules' output does not already end with one (:1207-1227).
   */
  end: number | null;
  /**
   * Not a clause: characters handed on one by one, as they came, while the
   * punctuation mode was pass (CMD/cm_text.c:379-399). Nothing is taken from
   * them or added to them on the way.
   */
  passed?: true;
}

const toBytes = (text: string): number[] => [...text].map((char) => char.charCodeAt(0) & 0xff);
const fromBytes = (bytes: readonly number[]): string => String.fromCharCode(...bytes);
const at = (bytes: readonly number[], index: number): number => bytes[index] ?? 0;

/**
 * The punctuation mode in which the text stage does not read clauses at all
 * (CMD/C_US_CDE.H punct_options[], CMD/cm_text.c:379): each character goes
 * on to letter-to-sound as it comes.
 */
export const PUNCTUATION_PASS = "pass";
const TAB = 0x09;
const LINE_FEED = 0x0a;
const CARRIAGE_RETURN = 0x0d;
const XON = 0x11;
const SPACE = 0x20;
const HYPHEN = 0x2d;
const FULL_STOP = 0x2e;
const COLON = 0x3a;
const LEFT_BRACKET = 0x5b;
const RIGHT_BRACKET = 0x5d;
/** The value the C gives its character when a command is about to run (:459). */
const COMMAND_FOLLOWS = 0x0fff;

/**
 * The clauses of `text`. `text` is the whole character stream; a clause still
 * open at its end is not returned, as in the C, which waits for more.
 */
export function readClauses(
  table: TextParserTable,
  text: string,
  options: ClauseOptions,
): Clause[] {
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

  const clauses: Clause[] = [];
  /** punct_mode as a rule mode: the one the text starts in, until a command changes it. */
  let punctuationMode = options.punctuationMode;
  /** The flags of the modes a mode command has turned on (options.modeFlags). */
  let modeFlagsOn = 0;
  /** clausebuf: the clause being gathered. */
  let buffer: number[] = [];
  /** Where the last word of the buffer starts (prevword). */
  let lastWord = 0;
  /** The character being read, and the one before it as it was left. */
  let parseChar = 0;
  let lastChar = 0;
  let lastQuote = 0;
  let rolled = false;
  /** punct_mode is pass: the characters are handed on as they come. */
  let pass = false;
  /** The characters handed on so since the last clause or bracket. */
  let passed: number[] = [];
  const flushPassed = (): void => {
    if (passed.length === 0) return;
    clauses.push({ text: fromBytes(passed), rolled: false, end: null, passed: true });
    passed = [];
  };

  /** cm_text_getclause: take `parseChar` into the clause; finish the clause when it ends. */
  const take = (): void => {
    // 0 more characters wanted, 1 the clause is whole, 2 it is handed on in part.
    let done: 0 | 1 | 2 = 0;
    // :358-370: a tab ends the clause unless white space came before it.
    if (parseChar === TAB) {
      parseChar = !isSpace(lastChar) || lastQuote !== 0 ? config.clauseEnd : SPACE;
    }
    // :379-399: in the mode pass the character goes on at once, a space for
    // a NUL, an XON or the place of a command, and nothing below is done:
    // no clause is gathered and no rule is run.
    if (pass) {
      if (parseChar === 0 || parseChar === XON || parseChar === COMMAND_FOLLOWS) parseChar = SPACE;
      passed.push(parseChar);
      return;
    }
    // :403-410: an empty line ends the clause.
    if (
      (lastChar === LINE_FEED && (parseChar === LINE_FEED || parseChar === CARRIAGE_RETURN)) ||
      (lastChar === CARRIAGE_RETURN && parseChar === CARRIAGE_RETURN)
    ) {
      done = 1;
      parseChar = config.clauseEnd;
    }
    // :413-452: brackets and quotes arrive as spaces.
    if ((types[parseChar] & config.quoteType) !== 0 && punctuationMode === config.quoteMode) {
      lastQuote = parseChar;
      if (!config.keptQuotes.includes(parseChar)) parseChar = SPACE;
    } else {
      lastQuote = 0;
    }
    if (parseChar === 0 || parseChar === XON) parseChar = SPACE;
    // :459-477: a command follows, or the clause end has come.
    if (parseChar === COMMAND_FOLLOWS) {
      done = 1;
      parseChar = SPACE;
    } else if (parseChar === config.clauseEnd) {
      done = 1;
    }
    buffer.push(parseChar);
    const count = buffer.length;
    // :499-520: white space after a clause mark ends the clause, unless the
    // mark is a full stop and the word with it is in the dictionary.
    if (
      spaceOrPhonesOff(at(buffer, count - 1)) &&
      (marks[at(buffer, count - 2)] & config.clauseMark) !== 0
    ) {
      done = 1;
      if (
        parseChar !== config.clauseEnd &&
        at(buffer, count - 2) === FULL_STOP &&
        spaceOrPhonesOff(parseChar) &&
        lookup(wordAt(buffer, lastWord, true), false) !== 0
      ) {
        done = 0;
      }
    }
    // :588-592
    if (spaceOrPhonesOff(at(buffer, count - 2)) && !spaceOrPhonesOff(at(buffer, count - 1))) {
      lastWord = count - 1;
    }
    // :597-603: a clause that has grown too long is handed on in part.
    if (done === 0 && count > config.rollingStop) done = 2;
    if (done === 0) return;

    let output: number[];
    /** clausebuf once the passes have run: what the rules read last. */
    let read = buffer;
    let consumed = 0;
    if (count < config.minimumLength && punctuationMode !== config.wholeMode) {
      // :636-641: a short clause goes by the rules.
      output = buffer;
    } else {
      const punctuated = parser.rewrite(buffer, lookups(buffer), {
        language: options.language,
        mode: punctuationMode,
        section: options.punctuationSection,
        onHit: options.onHit,
      }).output;
      // :922: copied back as a string, so up to its first NUL.
      const end = punctuated.indexOf(0);
      read = end < 0 ? punctuated : punctuated.slice(0, end);
      const main = parser.rewrite(read, lookups(read), {
        language: options.language,
        mode: options.mainMode | modeFlagsOn,
        section: options.mainSection,
        partial: done === 2,
        onHit: options.onHit,
      });
      output = main.output;
      consumed = main.consumed;
    }
    clauses.push({
      text: fromBytes(output),
      rolled,
      // :1207-1208, as written: the test reads clausebuf at the output's length.
      end:
        (parseChar === config.clauseEnd || parseChar === TAB) &&
        at(read, output.length - 1) !== config.clauseEnd
          ? parseChar
          : null,
    });
    if (done === 2) {
      // :1247-1269: what the rules did not read stays for the next clause.
      buffer = read.slice(consumed);
      lastWord -= consumed;
      rolled = true;
    } else {
      // :1272-1284
      buffer = [];
      lastWord = 0;
      rolled = false;
    }
  };

  // The character loop (CMD/cm_pars.c:1296-1510) with its states for a
  // bracket: a command, or a bracket that is only text.
  const slots = options.commandSlots ?? newCommandSlots();
  // How a bracket that is no command is read: as text while the phoneme
  // mode is off, which it is when DECtalk starts, with phonemes spoken once
  // it is on (CMD/cm_util.c:139: PHONEME_OFF | PHONEME_SPEAK, the arpabet).
  const phonemeMode = { off: true, speak: true, ascky: false };
  const alphabets = table.commandTable?.phonemes;
  let state: "normal" | "bracket" | "command" | "phoneme" = "normal";
  let command: number[] = [];
  let whiteSpaceRun = 0;
  for (const byte of toBytes(text)) {
    lastChar = parseChar;
    parseChar = byte;
    // cm_pars.c:1333-1343: a long run of white space ends the clause.
    if (isSpace(parseChar) && isSpace(lastChar)) {
      whiteSpaceRun += 1;
      if (whiteSpaceRun > config.whiteSpaceRun) {
        parseChar = config.clauseEnd;
        whiteSpaceRun = 0;
      }
    } else {
      whiteSpaceRun = 0;
    }
    if (state === "normal") {
      // cm_pars.c:1351-1371
      if (parseChar === LEFT_BRACKET) state = "bracket";
      else take();
    } else if (state === "bracket") {
      // cm_pars.c:1379-1472
      if (parseChar === COLON) {
        state = "command";
        command = [];
      } else if (parseChar === RIGHT_BRACKET) {
        state = "normal";
      } else if (parseChar === LEFT_BRACKET) {
        take();
      } else if (
        parseChar === TAB ||
        parseChar === SPACE ||
        parseChar === CARRIAGE_RETURN ||
        parseChar === LINE_FEED
      ) {
        // White space after a bracket is dropped.
      } else if (alphabets && !phonemeMode.off) {
        // The phoneme mode is on: the bracket holds phonemic text, and the
        // clause before it is finished as before a command (:1410-1420).
        const held = parseChar;
        parseChar = COMMAND_FOLLOWS;
        take();
        parseChar = held;
        command = [parseChar];
        state = "phoneme";
      } else {
        // Not a command: the bracket was text, and so is this character.
        const held = parseChar;
        parseChar = LEFT_BRACKET;
        take();
        parseChar = held;
        take();
        state = "normal";
      }
    } else if (state === "phoneme") {
      if (parseChar === RIGHT_BRACKET) {
        const body = fromBytes(command);
        flushPassed();
        options.onPhonemes?.(
          body,
          clauses.length,
          readPhonemes(alphabets as PhonemeAlphabets, body, phonemeMode.ascky),
          phonemeMode.speak,
        );
        state = "normal";
      } else {
        command.push(parseChar);
      }
    } else if (parseChar === RIGHT_BRACKET) {
      // CMD/cm_cmd.c:160-304: a command has the clause before it finished,
      // unless it only marks a place in the text. (The C does so while it
      // matches the name; no text is taken in between.)
      // The command that marks a place is known as the C knows it, by the
      // row of the command table its name leaves (:168, :288); a name that
      // leaves none, or several, finishes the clause too (:183, :240).
      const body = fromBytes(command);
      const read = table.commandTable ? readCommands(table.commandTable, body, slots) : [];
      const first = read[0];
      const marksPlace = table.commandTable
        ? first?.kind === "command" && config.markingCommands.includes(first.row.name)
        : config.markingCommands.some((prefix) => body.trim().toLowerCase().startsWith(prefix));
      if (!marksPlace) {
        const held = parseChar;
        parseChar = COMMAND_FOLLOWS;
        take();
        parseChar = held;
      }
      // The phoneme command sets how brackets are read from here on
      // (CMD/cm_copt.c:221-280), word by word, up to a word that is no
      // option.
      const modeWords = table.commandTable?.options.phoneme_modes ?? [];
      for (const one of read) {
        if (one.kind !== "command" || one.row.routine !== "cm_cmd_phoneme") continue;
        for (const word of one.words) {
          if (word === undefined) continue;
          const option = modeWords[optionIndex(modeWords, word)];
          if (option === undefined) break;
          if (option === "asky") phonemeMode.ascky = true;
          else if (option === "arpabet") phonemeMode.ascky = false;
          else if (option === "speak") phonemeMode.speak = true;
          else if (option === "silent") phonemeMode.speak = false;
          else if (option === "off") phonemeMode.off = true;
          else if (option === "on") phonemeMode.off = false;
        }
      }
      // The punctuation command sets the mode the clause reader and the
      // punctuation rules run in from here on (CMD/cm_copt.c:1249-1276: the
      // routine only stores it, so the clause being gathered is not ended
      // and is read in the new mode when it ends). In the mode "pass" the
      // characters go on without this reader (CMD/cm_text.c:379) until
      // another mode is set; the rules' mode is then that one.
      const punctuationWords = table.commandTable?.options.punct_options ?? [];
      // What was handed on before the bracket stands before it.
      flushPassed();
      for (const one of read) {
        if (one.kind !== "command" || one.row.routine !== "cm_cmd_punct") continue;
        const index = optionIndex(punctuationWords, one.words[0]);
        if (index < 0) continue;
        pass = punctuationWords[index] === PUNCTUATION_PASS;
        if (!pass) punctuationMode = 1 << index;
      }
      // The mode command turns a mode's flag on or off, or leaves it alone
      // standing (CMD/cm_copt.c:2148-2250; LTS/ls_util.c:1197-1205): a mode
      // word, then on, off or set. The clause before it has been finished in
      // the modes as they were; the main pass of what follows runs in the
      // new ones. A command the routine refuses changes nothing.
      const modeOptions = table.commandTable?.options.mode_options ?? [];
      const modeActions = ["on", "off", "set"];
      for (const one of read) {
        if (one.kind !== "command" || one.row.routine !== "cm_cmd_mode") continue;
        const typed = one.words.filter((word) => word !== undefined);
        const mode = modeOptions[optionIndex(modeOptions, typed[0])];
        const action = modeOptions[optionIndex(modeOptions, typed[1])];
        if (typed.length !== 2 || mode === undefined || action === undefined) continue;
        if (modeActions.includes(mode) || !modeActions.includes(action)) continue;
        const flag = options.modeFlags?.[mode] ?? 0;
        if (action === "set") modeFlagsOn = flag;
        else if (action === "on") modeFlagsOn |= flag;
        else modeFlagsOn &= ~flag;
      }
      options.onCommand?.(body, clauses.length, read);
      state = "normal";
    } else {
      command.push(parseChar);
    }
  }
  // Nothing of them is held back for more text, as an open clause is.
  flushPassed();
  return clauses;
}

/**
 * The characters the clauses put on the way to letter-to-sound (:1047-1227):
 * each clause without the white space it starts with and without index
 * marks, a space first after a clause handed on in part, and its clause end.
 */
export function clauseStream(table: TextParserTable, clauses: readonly Clause[]): string {
  return clauseTexts(table, clauses).join("");
}

/** The same characters, clause by clause. */
export function clauseTexts(table: TextParserTable, clauses: readonly Clause[]): string[] {
  const config = table.clauses;
  const isSpace = (char: string): boolean =>
    (config.marks[char.charCodeAt(0)] & config.spaceMark) !== 0;
  return clauses.map((clause) => {
    if (clause.passed) return clause.text;
    let start = 0;
    while (start < clause.text.length && isSpace(clause.text[start])) start += 1;
    const body = [...clause.text.slice(start)]
      .filter((char) => char.charCodeAt(0) !== config.indexMark)
      .join("");
    return (
      (clause.rolled ? " " : "") +
      body +
      (clause.end === null ? "" : String.fromCharCode(clause.end))
    );
  });
}
