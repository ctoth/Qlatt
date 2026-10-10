/**
 * G2P pipeline orchestration.
 *
 * Wires together dictionary lookup, morphological decomposition, and
 * Elovitz LTS rules + the frontend's cited lexical stress policy into a single
 * pronounce() function.
 *
 * Layer priority:
 *   1. Dictionary lookup (highest accuracy)
 *   2. Configured clitic handling (dict base + shared suffix allomorph)
 *   3. Morphological decomposition (affix stripping + dict root)
 *   4. Elovitz LTS rules (fallback); both generated paths share lexical stress
 *
 * Citation: Allen, Hunnicutt & Klatt (1987), From Text to Speech: The MITalk System.
 * Citation: Elovitz, Johnson, McHugh & Shore (1976). NRL Report 7948.
 * Citation: Hunnicutt (1976), Phonological Rules for a Text-to-Speech System.
 * Citation: Hayes (1982), Extrametricality and English Stress, pp. 237–274.
 */

import {
  PHONEME_PARAMETERS_CLOSE,
  PHONEME_PARAMETERS_OPEN,
  PHONEME_SYMBOL_BASE,
  PHONEME_SYMBOL_LIMIT,
  PHONEMIC_CLASS_WORD_CLOSE,
  PHONEMIC_CLASS_WORD_OPEN,
} from "../text-parser/phonemes";
import { ltsDocumentAt } from "./lts-document";
import { applyLtsRules } from "./lts-engine";
import { decomposeClitic, decomposeWord, getStressHintForWord } from "./morphology";
import { stressPronunciation } from "./stress";
import { conjunctionRoles } from "./table-conjunctions";
import { type ClauseContext, chooseHomograph, loneWordContext } from "./table-homograph";
import {
  formClassNamesOf,
  isLtsTableDocument,
  type LtsTableDocument,
  pronounceWithLtsTableDetailed,
  receivedFormClassWord,
  startsVerbPhrase,
} from "./table-lts-pronounce";
import {
  NUMBER_COMMA,
  NUMBER_MBOUND,
  NUMBER_S1,
  NUMBER_S2,
  NUMBER_VPSTART,
  NUMBER_WBOUND,
  type NumberWord,
  numberWords,
  speakDigits,
  speakFraction,
  speakMoneyBeforeQuantity,
  speakNumberToken,
  speakPartDigits,
  speakQuantityAfterMoney,
  speakSignedNumber,
  storeSyntacticMarkers,
} from "./table-number";
import { stripSuffixes } from "./table-suffix";
import type { DictLookup, PronunciationResult } from "./types";

/** The control symbols numberWords carries (INCLUDE/l_com_ph.h). */
const WORD_SYMBOLS: ReadonlySet<number> = new Set([
  NUMBER_S1,
  NUMBER_S2,
  NUMBER_MBOUND,
  NUMBER_WBOUND,
  NUMBER_VPSTART,
  NUMBER_COMMA,
]);

// A letter-to-sound file is either a rule list (lts-engine.ts) or a compiled
// table with its own stress assignment (table-lts-pronounce.ts). The file's
// `format` says which; null records a rule list.
const ltsTables = new Map<string, LtsTableDocument | null>();

function ltsTableAt(path: string): LtsTableDocument | null {
  const cached = ltsTables.get(path);
  if (cached !== undefined) return cached;
  // A table is a JSON document; a rule list is YAML and its engine loads it.
  const document = path.endsWith(".json") ? ltsDocumentAt(path) : null;
  const table = isLtsTableDocument(document) ? document : null;
  ltsTables.set(path, table);
  return table;
}

/**
 * Pronounce a single word using the multi-layer G2P pipeline.
 *
 * @param word - A single English word (no surrounding spaces/punctuation).
 * @param dictLookup - Injected dictionary lookup function.
 * @returns PronunciationResult with phonemes, source layer, and metadata.
 */
export function pronounce(
  word: string,
  dictLookup: DictLookup,
  options: {
    ltsPath: string;
    morphologyPath: string;
    stressPolicyPath: string;
    /** The word's place among its neighbours; a word alone when absent. */
    context?: ClauseContext;
  },
): PronunciationResult {
  if (!word || word.trim().length === 0) {
    return { phonemes: [], source: "lts-rules", word: word || "" };
  }

  const lowerWord = word.toLowerCase();

  const table = options.ltsPath ? ltsTableAt(options.ltsPath) : null;
  const context = options.context ?? loneWordContext();
  // A table that records form classes gives every word a list, empty for a
  // word it does not know. A fixed class wins over the dictionary's
  // (DECtalk 4.63 LTS/ls_task.c:1062-1078), and a class set by a suffix rule
  // stays (LTS/ls_dict.c:749-750).
  // The mini dictionary's words ("to", "and", "for") are found only as
  // written: with an apostrophe on it that is stripped afterwards ("'and
  // shut the door") the word is the main dictionary's, with that entry's
  // class and no phrase start (LTS/ls_task.c:686-697, the mini dictionary
  // is searched before the punctuation is stripped; 1900-1917). Measured on
  // say.exe: "He left, 'and shut the door.'" has AE N D with no phrase
  // start before it, "He left and shut the door." has one.
  const specialClass = context.edgeStripped
    ? undefined
    : table?.specialWordFormClasses?.[lowerWord];
  const classed = (
    mask: number,
  ): { formClasses?: string[]; formClassWord?: number; receivedFormClasses?: string[] } => {
    if (!table?.formClassNames) return {};
    const fixed = context.classLookup ? undefined : specialClass;
    const word = fixed ?? mask;
    return {
      formClasses: formClassNamesOf(word, table),
      formClassWord: word,
      receivedFormClasses: formClassNamesOf(receivedFormClassWord(word), table),
    };
  };
  // A dictionary word, or the root of a suffixed one, as it is spoken here:
  // of a word with two entries, the one its neighbours select
  // (table-homograph.ts). `classSoFar` is the suffix's class for a root.
  const entryOf = (entry: string, classSoFar: number) => {
    const choice = table ? chooseHomograph(table, entry, classSoFar, context) : null;
    const other = choice?.secondary ? table?.homographs?.[entry] : undefined;
    return {
      other,
      bySuffixRule: choice?.bySuffixRule === true,
      isHomograph: choice !== null,
      formClass: other ? other.formClass : (table?.wordFormClasses?.[entry] ?? 0),
      rulesBlockedAt: other ? other.rulesBlockedAt : table?.wordRuleBlocks?.[entry],
      boundaryAfter: other ? other.boundaryAfter : table?.wordBoundaries?.[entry],
    };
  };
  // The phrase a word starts is read from the dictionary entry that was
  // reached, a suffixed word's root included; the fixed-class words come from
  // DECtalk's mini dictionary and never reach it.
  const phrased = (entryClass: number | null): { phraseStart?: "vp" | "pp" } => {
    const fixed = context.edgeStripped ? undefined : table?.specialWordPhraseStarts?.[lowerWord];
    if (fixed) return { phraseStart: fixed };
    return table?.wordFormClasses &&
      entryClass !== null &&
      specialClass === undefined &&
      startsVerbPhrase(entryClass, table)
      ? { phraseStart: "vp" }
      : {};
  };
  // The dictionary's `~`, `*` and `#` marks, of the entry that was reached: a
  // suffixed word keeps its root's phones in front, so the indices hold.
  const marked = (entry: {
    rulesBlockedAt?: readonly number[];
    boundaryAfter?: readonly number[];
  }): { rulesBlockedAt?: number[]; boundaryAfterAt?: number[] } => ({
    ...(entry.rulesBlockedAt && entry.rulesBlockedAt.length > 0
      ? { rulesBlockedAt: [...entry.rulesBlockedAt] }
      : {}),
    ...(entry.boundaryAfter && entry.boundaryAfter.length > 0
      ? { boundaryAfterAt: [...entry.boundaryAfter] }
      : {}),
  });

  // Phonemic text, between the table's two marks, is spoken as its symbols
  // with no lookup (DECtalk 4.63 CMD/cm_text.c:1118-1144 sends each character
  // on as the phoneme INCLUDE/usa_phon.tab's usa_ascky_rev[] gives it). The
  // characters keep their case. Left out: a character that stands for no
  // symbol, silence, and the control symbols the number speaker's word
  // builder does not carry (table-number.ts numberWords); all passed over.
  const [phonemicOpen, phonemicClose] = table?.phonemicMarks ?? [];
  if (
    table?.phonemeCharacters &&
    phonemicOpen !== undefined &&
    phonemicClose !== undefined &&
    word.length >= 2 &&
    word.charCodeAt(0) === phonemicOpen &&
    word.charCodeAt(word.length - 1) === phonemicClose
  ) {
    const characters = table.phonemeCharacters;
    // Phonemic text a bracket in the text gave (src/text-parser/phonemes.ts)
    // holds each symbol by its code, and after a symbol the numbers written
    // on it, which stay with a phone (a mark's are passed over).
    const symbols: number[] = [];
    const phoneNumbers: number[][] = [];
    // Text a rule composed for a written word may name that word first: the
    // text then has the word's form class, as this lexicon gives it
    // (src/text-parser/phonemes.ts PHONEMIC_CLASS_WORD_OPEN).
    const between = word.slice(1, -1);
    const classWordEnd = between.startsWith(PHONEMIC_CLASS_WORD_OPEN)
      ? between.indexOf(PHONEMIC_CLASS_WORD_CLOSE)
      : -1;
    const classWord = classWordEnd < 0 ? "" : between.slice(1, classWordEnd);
    const inner = between.slice(classWordEnd + 1);
    // The marks alone, with no word between them: text for a written word
    // that has no class.
    const forWrittenWord = classWordEnd >= 0;
    const classOfWord = (): {
      formClasses?: string[];
      formClassWord?: number;
      receivedFormClasses?: string[];
      forWrittenWord?: boolean;
    } => {
      if (!forWrittenWord) return {};
      // The look-up before any word is spoken takes the word as it stands
      // between white space, a mark written on it included, and finds
      // nothing; only one period at its end is taken off for a second try
      // (DECtalk 4.63 LTS/ls_task.c:5066-5113). Outside such text the
      // word's own reading sets the class afterwards. Measured on say.exe in
      // the spelling mode, the classes the phonetic stage receives: "Can
      // go, went." has 0 for "go,"; "Can go. Went." has go's class.
      const markOnWord =
        context.markAfter !== undefined && context.markAfter !== "." && !context.markSent;
      if (classWord === "" || markOnWord) {
        return {
          forWrittenWord: true,
          ...(table?.formClassNames ? { formClasses: [], formClassWord: 0 } : {}),
        };
      }
      const looked = pronounce(classWord, dictLookup, {
        ...options,
        context: { ...context, classLookup: true },
      });
      return {
        forWrittenWord: true,
        ...("formClasses" in looked && looked.formClasses
          ? { formClasses: [...looked.formClasses] }
          : {}),
        ...("formClassWord" in looked && looked.formClassWord !== undefined
          ? { formClassWord: looked.formClassWord }
          : {}),
        ...("receivedFormClasses" in looked && looked.receivedFormClasses
          ? { receivedFormClasses: [...looked.receivedFormClasses] }
          : {}),
      };
    };
    for (let at = 0; at < inner.length; at += 1) {
      const code = inner.charCodeAt(at);
      const symbol =
        code >= PHONEME_SYMBOL_BASE && code < PHONEME_SYMBOL_LIMIT
          ? code - PHONEME_SYMBOL_BASE
          : (characters[code] ?? null);
      let numbers: number[] = [];
      if (inner[at + 1] === PHONEME_PARAMETERS_OPEN) {
        const close = inner.indexOf(PHONEME_PARAMETERS_CLOSE, at + 2);
        const end = close < 0 ? inner.length : close;
        numbers = inner
          .slice(at + 2, end)
          .split(",")
          .map(Number);
        at = end;
      }
      // Phone codes start at 1. 0 is silence: a phone like the others where a
      // bracket wrote it ("[m'uw_<300>n]"; PH/ph_sort.c:1331-1333 makes every
      // symbol below MAX_PHONES a phone), and passed over in text a rule
      // composed.
      const fromBracket = code >= PHONEME_SYMBOL_BASE && code < PHONEME_SYMBOL_LIMIT;
      const isPhone =
        symbol !== null && (symbol > 0 || fromBracket) && symbol < table.phonemeSymbols.length;
      if (isPhone) phoneNumbers.push(numbers);
      if (symbol !== null && (isPhone || WORD_SYMBOLS.has(symbol))) symbols.push(symbol);
    }
    const parts = numberWords(symbols, table, phoneNumbers);
    // The mark the text ends in, as the phonetic stage stores it: a word
    // boundary (text a rule composed for a word letter-to-sound would have
    // read, which sends one after each word), or a verb-phrase start, which
    // is then the next word's. The text parser's own phonemic text ends in
    // neither.
    const lastMark = storeSyntacticMarkers(symbols).at(-1);
    return {
      phonemes: parts.flatMap((part) => part.phonemes),
      source: "phonemic",
      word,
      parts,
      ...classOfWord(),
      ...(lastMark === NUMBER_WBOUND || lastMark === NUMBER_VPSTART
        ? { wordBoundaryAfter: true }
        : {}),
      ...(lastMark === NUMBER_VPSTART ? { phraseStartAfter: "vp" as const } : {}),
    };
  }

  const nounClass = (): { formClasses?: string[]; formClassWord?: number } =>
    table?.formClassNames
      ? { formClasses: ["noun"], formClassWord: 2 ** table.formClassNames.indexOf("noun") }
      : {};

  // The name a character has in a mode of the text that is on where the word
  // stands (the table's `modeCharacterNames`, phonemic text), as one word;
  // null when no such mode names it. DECtalk's math mode: ls_math_do_math
  // looks the character up in math_table[] only while the mode is on
  // (DECtalk 4.63 LTS/ls_math.c:82-104).
  const modeName = (char: string): { mode: string; name: NumberWord } | null => {
    const characters = table?.phonemeCharacters;
    if (!table || !characters) return null;
    for (const mode of context.modes ?? []) {
      const text = table.modeCharacterNames?.[mode]?.[char];
      if (text === undefined) continue;
      const symbols = [...text]
        .map((character) => characters[character.charCodeAt(0)] ?? null)
        .filter(
          (symbol): symbol is number =>
            symbol !== null &&
            ((symbol > 0 && symbol < table.phonemeSymbols.length) || WORD_SYMBOLS.has(symbol)),
        );
      const name = numberWords(symbols, table)[0];
      if (name) return { mode, name };
    }
    return null;
  };
  // A word of one character that a mode names is spoken by that name: the
  // test stands after the spelling mode's and the mini dictionary's and
  // ahead of the dictionary search (DECtalk 4.63 LTS/ls_task.c:687-697 the
  // order, 1949-1957 ls_task_math_mode: the word, less the marks at its
  // ends, is one character). The word's class is the one the look-up before
  // any word is spoken found for it, the dictionary's (:5066-5113), but the
  // phonetic stage receives none on the name's phones: the name is sent
  // without the routine that sends a class ahead of a word's first phone
  // (LTS/ls_math.c:128-144), and the class goes out with the word boundary
  // after it.
  // Measured on say.exe with the math mode on
  // (test/oracle-corpora/dectalk-us-mode-math-v1.json): "3 - 2" is "three
  // minus two" and "4 * 5" "four multiplied by five"; with the mode off
  // "dash" and "asterisk", the dictionary's words. Classes as the phonetics
  // receives them, from an instrumented build, for "4 * 5 = 20": `adj` at
  // the first symbol of "four", `character` at the word boundary after
  // "multiplied by" (symbol 18), `adj` at the first symbol of "five" (19).
  const modeWord = word.length === 1 ? modeName(word) : null;
  if (modeWord) {
    return {
      phonemes: [...modeWord.name.phonemes],
      source: "mode-character",
      word: lowerWord,
      mode: modeWord.mode,
      ...(modeWord.name.morphemeAfter && modeWord.name.morphemeAfter.length > 0
        ? { boundaryAfterAt: [...modeWord.name.morphemeAfter] }
        : {}),
      ...(dictLookup(lowerWord)
        ? { ...classed(entryOf(lowerWord, 0).formClass), receivedFormClasses: [] }
        : {}),
    };
  }

  // A word with a question or exclamation mark written on it, ahead of the
  // mark that ends the clause ("What?!" is the word "What?" and the mark
  // "!"): the word is spelled, each letter a word, and the mark is spoken by
  // its name (DECtalk 4.63 LTS/ls_task.c:4118-4150, a character that is not
  // a letter, a digit, a hyphen, a slash or an apostrophe sends the word to
  // the spelling routine; LTS/ls_spel.c:158-170, the names). Measured on
  // say.exe: "What?!" is D AH B EL Y UW, EY CH, EY, T IY, K W EH S CH AX N,
  // M AA R K and an exclamation's clause end; the class is `noun`.
  // A comma there is named the same way ("What,!" has K AA M AX), and so are
  // two periods ("on..." is the word "on.." and the period that ends the
  // clause: OW, EH N, P IY R IY AX D, P IY R IY AX D).
  const withMarks = /^([a-z]+)([?!]+|,|\.\.)$/.exec(lowerWord);
  if (table?.letterPhones && table.characterNames && withMarks) {
    const letterPhones = table.letterPhones;
    const characterNames = table.characterNames;
    const parts = [
      ...[...(withMarks[1] as string)].map((letter) => ({
        phonemes: [...(letterPhones[letter] ?? [])],
      })),
      ...[...(withMarks[2] as string)].flatMap((mark) =>
        (characterNames[mark] ?? []).map((word) => ({ phonemes: [...word] })),
      ),
    ];
    return {
      phonemes: parts.flatMap((part) => part.phonemes),
      source: "spelling",
      word: lowerWord,
      parts,
      ...nounClass(),
    };
  }

  // A word with an underscore in it is spelled, each character a word: a
  // letter by its name, a digit from the number lists, the underscore by its
  // name (DECtalk 4.63 LTS/ls_task.c:4118-4150 as above; LTS/ls_spel.c:151-170,
  // a digit from punits[], any other character from the typing table).
  // Measured on say.exe: "tom_west42" is T IY, OW, EH M, AH N D RR S K OW R,
  // D AH B EL Y UW, IY, EH S, T IY, F OR, T UW, with no pause among them.
  // A word the dictionary holds is the dictionary's (the search comes first,
  // LTS/ls_task.c:697): "_" alone is the entry `'^ndR#sk`or`, with its
  // compound joint, and "Type _ now." is measured so.
  // Digits with an apostrophe between them are spelled the same way: the
  // part-number test sends a word with a digit and an apostrophe to the
  // spelling routine (LTS/ls_task.c:4128-4158). Measured on say.exe: "5'10"
  // is F AY V, AX P AA S T R AX F IY, W AH N, Z IY R OW.
  if (
    table?.letterPhones &&
    table.characterNames &&
    table.numberPhones &&
    // The same for a plus sign between letters or digits (the local part of
    // an address, which the text parser leaves whole: "ann+news" is EY, EH N,
    // EH N, P L AH S, EH N, IY, D AH B EL Y UW, EH S) and for digits with a
    // colon that are no time ("10:1" is W AH N, Z IY R OW, K OW L AX N,
    // W AH N): neither character is one the part-number test lets through.
    (/^[a-z0-9_]*_[a-z0-9_]*$/.test(lowerWord) ||
      /^[0-9]+'[0-9]+$/.test(lowerWord) ||
      /^[a-z0-9_]+(?:\+[a-z0-9_]+)+$/.test(lowerWord) ||
      /^[0-9]+(?::[0-9])+$/.test(lowerWord) ||
      // And for a word with any other sign the part-number test does not
      // let through, which reaches letter-to-sound when the text parser
      // hands the text on as written (the punctuation mode pass): a letter
      // or a digit and one of @ & = # $ * + %, with periods among them. A
      // number that ends in a percent sign is the number routine's, not
      // this (LTS/ls_task.c:4001-4060). Measured on say.exe: "a@b" is EY,
      // AE T, B IY; "C++" S IY, P L AH S, P L AH S; "AT&T" EY, T IY,
      // AE N D, T IY; "a=b" EY, IY K W EL Z, B IY; "#42" N AH M B RR, S AY N,
      // F OR, T UW; "15$" W AH N, F AY V, D AA L RR; "bob@example.com" is
      // spelled whole, its period by name.
      (/[@&=#$*+%]/.test(lowerWord) &&
        /^[a-z0-9@&=#$*+%.]+$/.test(lowerWord) &&
        /[a-z0-9]/.test(lowerWord) &&
        !/^[0-9.,]+%$/.test(lowerWord) &&
        // Nor a sum of money or a signed number, which the money and sign
        // routines read first (LTS/ls_task.c:3181-3476, LTS/l_us_pr1.c:80-110).
        !/^[$+][0-9.]/.test(lowerWord))) &&
    !dictLookup(lowerWord)
  ) {
    const letterPhones = table.letterPhones;
    const characterNames = table.characterNames;
    const units = table.numberPhones.units;
    const parts = [...lowerWord].flatMap((char) =>
      /[0-9]/.test(char)
        ? numberWords(units[Number(char)] as readonly number[], table)
        : /[a-z]/.test(char)
          ? [{ phonemes: [...(letterPhones[char] ?? [])] }]
          : (characterNames[char] ?? []).map((word) => ({ phonemes: [...word] })),
    );
    if (parts.length > 0 && parts.every((part) => part.phonemes.length > 0)) {
      return {
        phonemes: parts.flatMap((part) => part.phonemes),
        source: "spelling",
        word: lowerWord,
        parts,
        ...nounClass(),
      };
    }
  }

  // "am" and "pm" right after a number or a clock time are spelled, in any
  // case of their letters (DECtalk 4.63 LTS/ls_task.c:3626-3640 after a
  // time, 3828-3843 after a plain number; LTS/l_us_pr1.c:1150-1162
  // ls_proc_is_am_pm). Measured on say.exe: "9 am", "9.5 AM", "1,000 am" and
  // "9:30 am" have EY, EH M; "9th am", "$9 am" and "I am" have the word.
  // The letters are sent inside the number's own word, so they have its
  // class: `adj` after a plain number, none after a time.
  if (
    table?.letterPhones &&
    (context.afterNumber === "plain" || context.afterNumber === "time") &&
    /^[ap]m$/.test(lowerWord)
  ) {
    const letterPhones = table.letterPhones;
    const parts = [...lowerWord].map((letter) => ({
      phonemes: [...(letterPhones[letter] ?? [])],
    }));
    return {
      phonemes: parts.flatMap((part) => part.phonemes),
      source: "spelling",
      word: lowerWord,
      parts,
      // The number or time routine read this word ahead (:3626-3640, :3828-3843).
      readAhead: true,
      ...(table.formClassNames && context.afterNumber === "plain"
        ? { formClasses: ["adj"], formClassWord: 2 ** table.formClassNames.indexOf("adj") }
        : {}),
    };
  }

  // A table with number phone lists speaks an all-digit word itself, ahead of
  // any lookup, as several words; the whole number has the one form class
  // `adj` (DECtalk 4.63 LTS/ls_task.c:3776-3806).
  // The same for a number-like word the text task reads whole: a dollar
  // amount, a clock time, a plural number, a number with separators or
  // fraction digits (LTS/ls_task.c:3181, 3622, 3747; speakNumberToken). Only
  // the plain-number rule sets the class (:3776-3782), which a word with a
  // dollar sign, a colon or a plural ending does not reach.
  // A sign written on the number is spoken first ("-7" is "minus seven";
  // speakSignedNumber) and changes nothing of the class.
  if (table?.numberPhones && /^(?:[$0-9.]|[-+][$0-9.])/.test(lowerWord)) {
    const digitsOnly = /^[0-9]+$/.test(lowerWord);
    const signed = /^[-+]/.test(lowerWord);
    // A dollar amount before a word that takes "dollars" behind it ("$2
    // million") is only its number here; that word speaks the rest
    // (LTS/ls_task.c:3227-3290).
    const symbols = digitsOnly
      ? speakDigits(lowerWord, table.numberPhones)
      : signed
        ? speakSignedNumber(lowerWord, table.numberPhones)
        : lowerWord.startsWith("$") && context.quantityAfter
          ? speakMoneyBeforeQuantity(lowerWord.slice(1), table.numberPhones)
          : speakNumberToken(lowerWord, table.numberPhones);
    const plainNumber = digitsOnly || /^[-+]?[0-9,.]+$/.test(lowerWord);
    if (symbols) {
      const parts = numberWords(symbols, table);
      return {
        phonemes: parts.flatMap((part) => part.phonemes),
        source: "number",
        word: lowerWord,
        parts,
        ...(table.formClassNames && plainNumber
          ? { formClasses: ["adj"], formClassWord: 2 ** table.formClassNames.indexOf("adj") }
          : {}),
        // A time that ends in ":00" ends in its verb-phrase start
        // (LTS/l_us_pr1.c:1197-1199): the mark is the next word's.
        ...(symbols.at(-1) === NUMBER_VPSTART ? { phraseStartAfter: "vp" as const } : {}),
      };
    }
  }

  // The word after a dollar amount, when it is one of the words that take
  // "dollars" behind them: its phones from the table of those words, then
  // "dollars", whatever the amount (DECtalk 4.63 LTS/ls_task.c:3234-3290 the
  // lookahead and what is sent, LTS/l_us_con.c:539 nwdtab). Measured on
  // say.exe: "$2 million" is "two million dollars", "$1 million" "one million
  // dollars", "$2 millions" "two dollars millions".
  const afterMoney =
    table?.numberPhones && context.moneyBefore
      ? speakQuantityAfterMoney(lowerWord, table.numberPhones)
      : null;
  if (table && afterMoney) {
    const parts = numberWords(afterMoney, table);
    return {
      phonemes: parts.flatMap((part) => part.phonemes),
      source: "number",
      word: lowerWord,
      parts,
      // The money routine read this word ahead (LTS/ls_task.c:3234-3242).
      readAhead: true,
    };
  }

  // A unit's abbreviation, written with its period, one or two words after a
  // number: read from the table of such units before the dictionary, the
  // singular when the number is singular and the plural otherwise (DECtalk
  // 4.63 LTS/ls_task.c:3772 the number arms the lookup, 634 each word counts
  // it down, 2125-2152 the lookup and the choice of form). The number routine
  // calls a number singular only when it is the one digit 1
  // (LTS/l_us_pr1.c ls_proc_do_number, "Watch for 1"); measured on say.exe,
  // "1 lb." is pound and "5", "21", "01", "1,000", "1.0" and "1.5" are pounds.
  // Only a word whose period is the last thing written on it is looked up so
  // (:2102-2116, the next item is the period or the word ends in it): with
  // another mark after the period the word goes on to the dictionary, and
  // "5 lb., not more" is "pound", the dictionary's entry "lb.".
  const unit =
    context.numberBefore !== undefined &&
    lowerWord.endsWith(".") &&
    (context.markAfter === undefined || context.markAfter === ".")
      ? table?.numberAbbreviations?.[lowerWord.slice(0, -1)]
      : undefined;
  if (table && unit) {
    const parts = numberWords(context.numberBefore === "1" ? unit.singular : unit.plural, table);
    return {
      phonemes: parts.flatMap((part) => part.phonemes),
      source: "number-abbreviation",
      word: lowerWord,
      parts,
    };
  }

  // A word the table speaks by where it stands: one form apart from
  // punctuation, with its own class, and another against a punctuation mark
  // ("a box." and "box a."; DECtalk 4.63 LTS/ls_task.c:2647-2673).
  const placed = table?.wordsByPunctuation?.[lowerWord];
  // Right after a plain number or an ordinal the word is neither form: it is
  // spelled, the letter's name with the class `noun` (:2655-2657: the article
  // only while the count a number starts stands at 0 or 1, and it stands at
  // 2 for the word after the number). Measured on say.exe: "Seat 23 A",
  // "Take 2 a day" and "2nd a day" have EY; "2 of a kind", "$2 a day" and
  // "9:30 a day" have the article. The count is set for any word that begins
  // with a digit and reaches the plain-number routine (:3768-3773), a part
  // number among them: "80-120 a night" and "$80- a night" have EY.
  if (
    placed &&
    table?.letterPhones?.[lowerWord] &&
    (context.afterNumber === "plain" ||
      context.afterNumber === "ordinal" ||
      context.afterNumber === "part")
  ) {
    return {
      phonemes: [...table.letterPhones[lowerWord]],
      source: "spelling",
      word: lowerWord,
      ...nounClass(),
    };
  }
  if (placed && !context.atPunctuation) {
    return {
      phonemes: [...placed.apart.phonemes],
      source: "position",
      word: lowerWord,
      ...classed(placed.apart.formClass),
    };
  }

  // A word the dictionary holds twice, capitalised and in lower case ("New"
  // n`uw and "new" n'uw): a word written with a capital first letter and a
  // lower-case second one finds the capitalised entry, any other writing the
  // lower-case one (DECtalk 4.63 LTS/ls_dict.c:641-718; "NEW" is not
  // "capitalized" by the test at :665). A suffixed word's root is searched
  // the same way: "Misses" has the phones of "Miss".
  const capitalisedEntry = (candidate: string) =>
    context.capitalised ? table?.capitalisedEntries?.[candidate] : undefined;
  const lookupAsWritten: DictLookup = (candidate) => {
    const capitalised = capitalisedEntry(candidate);
    return capitalised ? [...capitalised.phonemes] : dictLookup(candidate);
  };

  // 1. Try direct dictionary lookup
  const dictResult = dictLookup(lowerWord);
  const capitalised = placed ? undefined : capitalisedEntry(lowerWord);
  if (dictResult && capitalised) {
    return {
      phonemes: [...capitalised.phonemes],
      source: "dictionary",
      word: lowerWord,
      ...classed(capitalised.formClass),
      ...phrased(capitalised.formClass),
      ...marked(capitalised),
    };
  }
  if (dictResult) {
    const entry = entryOf(lowerWord, 0);
    // An entry with a word boundary in it is several words ("#" is "number
    // sign", "!" "exclamation point"): the boundary is one of the entry's
    // symbols and goes to the phonemic stage with the phones (DECtalk 4.63
    // dapi/src/dic/Dic_us.txt, a space in the phoneme field).
    const breaks = placed || entry.other ? undefined : table?.wordBreaks?.[lowerWord];
    if (breaks && breaks.length > 0) {
      const bounds = [...breaks.map((index) => index + 1), dictResult.length];
      const parts = bounds.map((end, at) => {
        const start = at === 0 ? 0 : (bounds[at - 1] as number);
        const morphemeAfter = (entry.boundaryAfter ?? [])
          .filter((index) => index >= start && index < end)
          .map((index) => index - start);
        // The entry's "~" marks (the phones no rule may change) go with the
        // word they stand in: "}" is `r'Yt br'e~s`, and the S keeps its mark.
        const rulesBlockedAt = (entry.rulesBlockedAt ?? [])
          .filter((index) => index >= start && index < end)
          .map((index) => index - start);
        return {
          phonemes: dictResult.slice(start, end),
          ...(morphemeAfter.length > 0 ? { morphemeAfter } : {}),
          ...(rulesBlockedAt.length > 0 ? { rulesBlockedAt } : {}),
        };
      });
      return {
        phonemes: [...dictResult],
        source: "dictionary",
        word: lowerWord,
        parts,
        ...classed(entry.formClass),
        ...phrased(entry.formClass),
      };
    }
    return {
      phonemes: placed
        ? [...placed.against.phonemes]
        : entry.other
          ? [...entry.other.phonemes]
          : dictResult,
      // The phones of a placed word are the table's, not the entry's.
      source: placed ? "position" : "dictionary",
      word: lowerWord,
      ...classed(entry.formClass),
      ...phrased(entry.formClass),
      ...marked(entry),
    };
  }

  // A word of digits, letters, hyphens and slashes that has a digit and a
  // hyphen or slash, and that the dictionary does not have ("1/2" it has).
  // A fraction by DECtalk's test is spoken as one (LTS/ls_task.c:3688,
  // speakFraction). Any other is a part number (LTS/ls_task.c:4118-4180,
  // LTS/l_us_pr1.c:161-255): each hyphen and slash by its name, each run of
  // digits as a number of two, three or four digits or digit by digit, each
  // run of letters as the dictionary's word when it has three letters or
  // more and the dictionary has it, and letter by letter otherwise; every
  // piece a word. Measured on say.exe: "10-15" is "ten dash fifteen",
  // "1990-1998" "nineteen ninety dash nineteen ninety eight", "1/1000" "one
  // slash one thousand", "B-52" "b dash fifty two". A slash makes a word a
  // part number as a digit does (:4138-4141): "/usr/bin" is "slash u s r
  // slash b i n".
  if (
    table?.numberPhones &&
    /^[a-z0-9/-]+$/.test(lowerWord) &&
    (lowerWord.includes("/") || (/[0-9]/.test(lowerWord) && lowerWord.includes("-")))
  ) {
    const lists = table.numberPhones;
    const fraction = speakFraction(lowerWord, lists);
    type Piece = NonNullable<PronunciationResult["parts"]>[number];
    const pieces = (): Piece[] | null => {
      const parts: Piece[] = [];
      let pause = false;
      const add = (...words: Piece[]): void => {
        for (const word of words) {
          parts.push(pause ? { ...word, pauseBefore: true } : word);
          pause = false;
        }
      };
      // The spelling routine speaks a digit from the number phone lists and
      // any other character by its name in the typing table
      // (LTS/ls_spel.c:158-170).
      // In a mode that names the character it speaks that name instead: the
      // routine tries the mode's table for each character first
      // (LTS/ls_spel.c:117). Measured on say.exe with the math mode on:
      // "3-2" is "three minus two", "1990-1998" "nineteen ninety minus
      // nineteen ninety eight", "/5" "divided by five".
      const named = (char: string): Piece | null => {
        const inMode = modeName(char);
        if (inMode) return inMode.name;
        if (/^[0-9]$/.test(char)) {
          return numberWords(lists.units[Number(char)] as readonly number[], table)[0] ?? null;
        }
        const name = table.letterPhones?.[char] ?? table.characterNames?.[char]?.[0];
        return name ? { phonemes: [...name] } : null;
      };
      for (const [at, run] of (lowerWord.match(/[0-9]+|[a-z]+|[/-]/g) ?? []).entries()) {
        if (/^[0-9]/.test(run)) {
          const spoken = speakPartDigits(run, lists);
          if (spoken) {
            add(...numberWords(spoken, table));
            continue;
          }
        } else if (/^[a-z]/.test(run) && run.length >= 3) {
          // The dictionary lookup, suffixes included ("cats-12" has "cats").
          const entry = dictLookup(run);
          if (entry) {
            const reached = entryOf(run, 0);
            if (at === 0) firstRunClass = reached.formClass;
            add({ phonemes: [...(reached.other?.phonemes ?? entry)] });
            continue;
          }
          const { suffixIndex, suffixTable } = table;
          const suffixed =
            suffixIndex && suffixTable
              ? stripSuffixes(run, dictLookup, { ...table, suffixIndex, suffixTable })
              : null;
          if (suffixed?.phonemes) {
            if (at === 0) firstRunClass = suffixed.formClass;
            add({ phonemes: [...suffixed.phonemes] });
            continue;
          }
        }
        const letters = [...run].map(named);
        if (letters.some((letter) => letter === null)) return null;
        add(...(letters as Piece[]));
        // A run of four letters or more is spelled slowly, with a pause
        // after it (LTS/ls_spel.c:224-256, LTS/l_us_pr1.c:241-246). When
        // the run ends the word the pause falls after the word: "12-zorb
        // now" has a comma before "now" on say.exe.
        if (/^[a-z]{4,}$/.test(run)) pause = true;
      }
      pauseAfter = pause;
      return parts;
    };
    let pauseAfter = false;
    // The class of a part number is its first run's, when that run is a
    // word the dictionary lookup finds: a word's class is sent once, ahead
    // of its first phone (LTS/ls_util.c:808-818), and the part-number
    // routine looks a run of three letters or more up before it speaks it
    // (LTS/l_us_pr1.c:210-214). A first run of digits, of letters that are
    // spelled, or a slash leaves the word with no class. Classes as the
    // phonetics receives them, from an instrumented build:
    // "Documents/2024/taxes" 80020400 (that of "Documents"), "walks-10"
    // 00020400, "music/2024" 00000400, "ab/2024/taxes" and "10-taxes" 0.
    let firstRunClass: number | null = null;
    const parts = fraction ? numberWords(fraction, table) : pieces();
    if (parts && parts.length > 0) {
      return {
        phonemes: parts.flatMap((part) => part.phonemes),
        source: "number",
        word: lowerWord,
        parts,
        ...(pauseAfter ? { pauseAfter: true } : {}),
        ...(firstRunClass === null ? {} : classed(firstRunClass)),
      };
    }
  }

  // A one-letter word that is in no dictionary is spelled: it is spoken as
  // the letter's name, with the form class `noun` (DECtalk 4.63
  // LTS/ls_task.c:2760-2775 for the letter, 1493-1509 for the class,
  // LTS/ls_spel.c ls_spel_spell for the name).
  const letterName = lowerWord.length === 1 ? table?.letterPhones?.[lowerWord] : undefined;
  if (letterName) {
    return {
      phonemes: [...letterName],
      source: "spelling",
      word: lowerWord,
      ...(table?.formClassNames
        ? { formClasses: ["noun"], formClassWord: 2 ** table.formClassNames.indexOf("noun") }
        : {}),
    };
  }

  // A frontend whose letter-to-sound file is a compiled table follows that
  // table's own order: suffix stripping against the dictionary, then the
  // rules. The stress comes from the dictionary root or from the table's
  // passes; neither the shared morphology nor the stress policy runs.
  if (table) {
    const { suffixIndex, suffixTable } = table;
    const strip = (lookup: DictLookup) =>
      suffixIndex && suffixTable
        ? stripSuffixes(lowerWord, lookup, { ...table, suffixIndex, suffixTable })
        : { phonemes: null, formClass: 0, root: null };
    let stripped = strip(lookupAsWritten);
    if (stripped.phonemes && stripped.root !== null) {
      const root = stripped.root;
      const rootCapitalised = capitalisedEntry(root);
      const entry = rootCapitalised
        ? {
            other: undefined,
            bySuffixRule: false,
            isHomograph: false,
            formClass: rootCapitalised.formClass,
            rulesBlockedAt: rootCapitalised.rulesBlockedAt,
            boundaryAfter: rootCapitalised.boundaryAfter,
          }
        : entryOf(root, stripped.formClass);
      // The root's other entry: the same search, with that entry's phones.
      const other = entry.other;
      if (other) {
        stripped = strip((candidate) =>
          candidate === root ? [...other.phonemes] : lookupAsWritten(candidate),
        );
      }
      // The suffix's class stays on the word and a homograph root adds its
      // mark; a rule that read the suffix's class gives the word the chosen
      // entry's class instead (LTS/ls_dict.c:749-755, ls_homo.c:529-538).
      const homographBit = 2 ** (table.formClassNames ?? []).indexOf("homograph");
      const wordClass = entry.bySuffixRule
        ? entry.formClass
        : entry.isHomograph && Math.floor(stripped.formClass / homographBit) % 2 === 0
          ? stripped.formClass + homographBit
          : stripped.formClass;
      return {
        phonemes: stripped.phonemes ?? [],
        source: "morphology",
        word: lowerWord,
        rootWord: root,
        ...classed(wordClass),
        ...phrased(entry.formClass),
        ...marked(entry),
      };
    }
    // A word of letters with no vowel among them is spelled, each letter a
    // word; a "y" that is not the first letter counts as a vowel (DECtalk
    // 4.63 LTS/ls_task.c ls_task_process_word, lines 4255-4290 for the letter
    // classes and 4401-4405 "Spell if no vowels"). Measured on say.exe:
    // "nth", "psst", "tv", "tvs", "brr" are spelled; "xyz" and "zyx" are not.
    const letterPhones = table.letterPhones;
    if (
      letterPhones &&
      /^[a-z]{2,}$/.test(lowerWord) &&
      !/[aeiou]/.test(lowerWord) &&
      !lowerWord.slice(1).includes("y")
    ) {
      const parts = [...lowerWord].map((letter) => ({
        phonemes: [...(letterPhones[letter] ?? [])],
      }));
      return {
        phonemes: parts.flatMap((part) => part.phonemes),
        source: "spelling",
        word: lowerWord,
        parts,
        // No class of its own: what the suffix search left, as for a word
        // the rules speak.
        ...classed(stripped.formClass),
      };
    }
    // A word of letters with hyphens in it is read in the chunks between
    // them (DECtalk 4.63 LTS/ls_task.c:4208-4435 ls_task_process_word). Each
    // chunk is looked up, suffixes included; one the dictionary lacks goes to
    // the rules when it has a vowel and more than one letter, and is spelled
    // otherwise. The compound mark follows the first chunk when the
    // dictionary has it (:4330) and any chunk the rules read (:4374); nothing
    // at all follows a later chunk the dictionary has, or a spelled one. The
    // letters of a spelled chunk are words of their own, but the first joins
    // what stands before it and the last what follows. A chunk whose entry
    // starts a verb phrase starts it here too. Measured on say.exe:
    // "mother-in-law" is M AH DH RR, mark, IH N L AO; "zorb-blat" Z AO R B,
    // mark, B L AE T; "re-read" R IY, mark, verb-phrase start, R IY D;
    // "tv-set" T IY, word boundary, V IY S EH T; "f-a-r" EH F EY AA R.
    // Several hyphens in a row are not read here (:4374 sends a comma there,
    // but DECtalk's parser has rewritten such a word before this point).
    const readChunk = (
      chunk: string,
    ): {
      kind: "dictionary" | "rules" | "spelled";
      /** The chunk's phones; of a spelled chunk, those of its first letter. */
      phonemes: string[];
      /** The further letters of a spelled chunk, each a word. */
      letters?: string[][];
      boundaryAfter: readonly number[];
      formClass: number | null;
      startsVerbPhrase: boolean;
    } => {
      // The one letter "a" is never found here (LTS/ls_dict.c:444).
      const direct = chunk === "a" ? null : dictLookup(chunk);
      if (direct) {
        const entry = entryOf(chunk, 0);
        return {
          kind: "dictionary",
          phonemes: entry.other ? [...entry.other.phonemes] : direct,
          boundaryAfter: entry.boundaryAfter ?? [],
          formClass: entry.formClass,
          startsVerbPhrase: startsVerbPhrase(entry.formClass, table),
        };
      }
      const suffixed =
        chunk.length > 1 && suffixIndex && suffixTable
          ? stripSuffixes(chunk, dictLookup, { ...table, suffixIndex, suffixTable })
          : null;
      if (suffixed?.phonemes && suffixed.root !== null) {
        const entry = entryOf(suffixed.root, suffixed.formClass);
        return {
          kind: "dictionary",
          phonemes: suffixed.phonemes,
          boundaryAfter: entry.boundaryAfter ?? [],
          formClass: suffixed.formClass,
          startsVerbPhrase: startsVerbPhrase(entry.formClass, table),
        };
      }
      if (chunk.length > 1 && (/[aeiou]/.test(chunk) || chunk.slice(1).includes("y"))) {
        const byRules = pronounceWithLtsTableDetailed(chunk, table);
        return {
          kind: "rules",
          phonemes: byRules.phonemes,
          boundaryAfter: byRules.boundaryAfter,
          formClass: null,
          startsVerbPhrase: false,
        };
      }
      const names = [...chunk].map((letter) => [...(letterPhones?.[letter] ?? [])]);
      return {
        kind: "spelled",
        phonemes: names[0] ?? [],
        letters: names.slice(1),
        boundaryAfter: [],
        formClass: null,
        startsVerbPhrase: false,
      };
    };
    // A hyphen written at the word's end counts as one with more to follow:
    // the mark stands after the word's last phone ("Red- green." is R EH D,
    // the mark, a word boundary, G R IY N on say.exe).
    if (/^[a-z]+(?:-[a-z]+)*-?$/.test(lowerWord) && lowerWord.includes("-")) {
      const trailing = lowerWord.endsWith("-");
      const chunks = (trailing ? lowerWord.slice(0, -1) : lowerWord).split("-");
      type Piece = NonNullable<PronunciationResult["parts"]>[number];
      const parts: Piece[] = [{ phonemes: [] }];
      const boundaries: number[][] = [[]];
      let firstClass: number | null = null;
      let firstPhrase: "vp" | undefined;
      for (const [at, chunk] of chunks.entries()) {
        const read = readChunk(chunk);
        if (at === 0) {
          firstClass = read.formClass;
          firstPhrase = read.startsVerbPhrase ? "vp" : undefined;
        } else if (read.startsVerbPhrase) {
          parts.push({ phonemes: [], phraseStart: "vp" });
          boundaries.push([]);
        }
        const part = parts.at(-1) as Piece;
        const marks = boundaries.at(-1) as number[];
        for (const index of read.boundaryAfter) marks.push(part.phonemes.length + index);
        part.phonemes.push(...read.phonemes);
        for (const letter of read.letters ?? []) {
          parts.push({ phonemes: [...letter] });
          boundaries.push([]);
        }
        const joint = read.kind === "dictionary" ? at === 0 : read.kind === "rules";
        if (joint && (at < chunks.length - 1 || trailing) && part.phonemes.length > 0) {
          marks.push(part.phonemes.length - 1);
        }
      }
      const spoken = parts
        .map((part, index) => ({
          ...part,
          ...((boundaries[index] as number[]).length > 0
            ? { morphemeAfter: [...new Set(boundaries[index] as number[])] }
            : {}),
        }))
        .filter((part) => part.phonemes.length > 0);
      return {
        phonemes: spoken.flatMap((part) => part.phonemes),
        source: "hyphenated",
        word: lowerWord,
        ...(spoken.length > 1
          ? { parts: spoken }
          : spoken[0]?.morphemeAfter
            ? { boundaryAfterAt: [...spoken[0].morphemeAfter] }
            : {}),
        ...classed(firstClass ?? 0),
        ...(firstPhrase ? { phraseStart: firstPhrase } : {}),
      };
    }
    const byRules = pronounceWithLtsTableDetailed(lowerWord, table);
    return {
      phonemes: byRules.phonemes,
      source: "lts-rules",
      word: lowerWord,
      ...classed(stripped.formClass),
      // The rules' own morpheme marks ("lighthouse": L AY T, mark, HH AW S).
      ...(byRules.boundaryAfter.length > 0 ? { boundaryAfterAt: byRules.boundaryAfter } : {}),
    };
  }

  // 2. Apply configured clitics using their shared suffix allomorph rules
  const cliticResult = decomposeClitic(lowerWord, dictLookup, options.morphologyPath);
  if (cliticResult) {
    return cliticResult;
  }

  // 3. Try morphological decomposition (affix stripping + dict root)
  let generated = decomposeWord(lowerWord, dictLookup, options.morphologyPath);
  if (!generated) {
    if (!options.ltsPath) {
      throw new Error(
        `E_LTS_PATH_MISSING: word '${word}' not in dictionary and no ltsPath configured`,
      );
    }
    generated = {
      phonemes: applyLtsRules(lowerWord, options.ltsPath),
      source: "lts-rules",
      word: lowerWord,
    };
  }
  // Both generated sources reach the same lexical stage before inventory materialization.
  const stressHint = getStressHintForWord(lowerWord, options.morphologyPath);
  const lexicalStress = stressPronunciation(generated.phonemes, {
    policyPath: options.stressPolicyPath,
    wordId: lowerWord,
    hint: stressHint,
    morphology: generated.morphology,
  });
  return { ...generated, phonemes: lexicalStress.phonemes, lexicalStress };
}

/**
 * Pronounce the words that stand between two punctuation marks, each in the
 * context of the others.
 *
 * The words are read twice, as DECtalk 4.63 reads them (LTS/ls_task.c
 * :383-401): the first reading finds each word's classes, the second speaks
 * the words. A word with two dictionary entries is chosen by the classes of
 * the words before it, and the first word also by whether a verb follows
 * (table-homograph.ts).
 */
export function pronounceClause(
  words: readonly string[],
  dictLookup: DictLookup,
  options: {
    ltsPath: string;
    morphologyPath: string;
    stressPolicyPath: string;
    /**
     * False when the mark that ends the run is not in the text (a text's end
     * closed as a sentence): the last word then does not stand against
     * punctuation. DECtalk's "a" is [x] at an unpunctuated text end and ['e]
     * before a written period (LTS/ls_task.c:2647-2673).
     */
    atWrittenPunctuation?: boolean;
    /**
     * For each word, whether the stretch of words that is read at once ends
     * after it though no punctuation mark follows (the written word ends in
     * one of the frontend's stretch-end characters).
     */
    stretchEnds?: readonly boolean[];
    /**
     * For each word, what was written when a text rule composed the word
     * anew (a clock time written out as phonemic text): the words beside it
     * know it by that.
     */
    written?: readonly (string | undefined)[];
    /**
     * For each word, whether it was written with a capital first letter and
     * a lower-case second one (ClauseContext.capitalised).
     */
    writtenCapitalised?: readonly boolean[];
    /**
     * For each word, whether an apostrophe was stripped from an end of what
     * was written before this lookup (ClauseContext.edgeStripped).
     */
    edgeStripped?: readonly boolean[];
    /** The mark that ends the run, as written. */
    endMark?: string;
    /** That mark was sent by a text rule: it is not written in the text. */
    endMarkSent?: boolean;
    /** For each word, the modes of the text that are on where it stands. */
    modes?: readonly (readonly string[] | undefined)[];
  },
): PronunciationResult[] {
  const table = options.ltsPath ? ltsTableAt(options.ltsPath) : null;
  // Without words of two entries no word depends on another.
  if (!table?.homographs) return words.map((word) => pronounce(word, dictLookup, options));
  const verbBit = table?.formClassNames ? table.formClassNames.indexOf("verb") : -1;
  const isVerb = (classWord: number): boolean =>
    verbBit >= 0 && Math.floor(classWord / 2 ** verbBit) % 2 === 1;
  // A word that begins with a digit is a number for the two words after it
  // (LTS/ls_task.c:3772 and 634).
  // What its neighbours know a word by: the word, or what was written when a
  // text rule composed the word anew.
  const seen = words.map((word, index) => options.written?.[index] ?? word);
  const numberBefore = (index: number): string | undefined =>
    [seen[index - 1], seen[index - 2]].find((word) => word !== undefined && /^[0-9]/.test(word));
  const quantityWords = table.numberPhones?.quantityWords ?? {};
  const quantityAt = (index: number): boolean =>
    seen[index] !== undefined && Object.hasOwn(quantityWords, seen[index].toLowerCase());
  const isAmount = (word: string | undefined): boolean =>
    word !== undefined && /^\$(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)?(?:\.[0-9]+)?$/.test(word);
  // A plain number (digits, with separators or fraction digits) or a clock
  // time: the two kinds of word after which "am" and "pm" are spelled.
  // A part number whose first character is a digit ("80-120", "80-") counts
  // too for the word "a" after it: the plain-number routine sets the count
  // for any word that begins with a digit, before it finds that the word is
  // no number and leaves it to the part-number reader (LTS/ls_task.c:3768-3773,
  // then :807). Money, a date and a fraction are taken by the routines before
  // it and never reach it (:780-789).
  const isDigitFirstPartNumber = (word: string): boolean =>
    /^[0-9][a-z0-9/-]*$/i.test(word) &&
    /[/-]/.test(word) &&
    !/^[0-9]{1,2}-(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:-[0-9]{2}(?:[0-9]{2})?)?$/i.test(
      word,
    ) &&
    !(table.numberPhones && speakFraction(word.toLowerCase(), table.numberPhones));
  const numberKind = (
    word: string | undefined,
  ): "plain" | "time" | "ordinal" | "part" | undefined =>
    word === undefined
      ? undefined
      : /^(?:[0-9]+|[0-9]{1,3}(?:,[0-9]{3})+)(?:\.[0-9]+)?$/.test(word)
        ? "plain"
        : /^[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?$/.test(word)
          ? "time"
          : /^[0-9]+(?:st|nd|rd|th)$/i.test(word)
            ? "ordinal"
            : isDigitFirstPartNumber(word)
              ? "part"
              : undefined;
  const read = (laterVerbAt: ((index: number) => boolean) | null): PronunciationResult[] => {
    const before: number[] = [];
    return words.map((word, index) => {
      const number = numberBefore(index);
      const result = pronounce(word, dictLookup, {
        ...options,
        context: {
          before,
          laterVerb: laterVerbAt ? laterVerbAt(index) : null,
          atPunctuation: index === words.length - 1 && options.atWrittenPunctuation !== false,
          ...(number === undefined ? {} : { numberBefore: number }),
          ...(options.writtenCapitalised?.[index] ? { capitalised: true } : {}),
          ...(options.edgeStripped?.[index] ? { edgeStripped: true } : {}),
          ...(options.modes?.[index] ? { modes: options.modes[index] } : {}),
          ...(index === words.length - 1 && options.endMark !== undefined
            ? { markAfter: options.endMark, ...(options.endMarkSent ? { markSent: true } : {}) }
            : {}),
          // A dollar amount and one of the words that take "dollars" behind
          // them, side by side (LTS/ls_task.c:3234-3242).
          ...(quantityAt(index + 1) && isAmount(seen[index]) ? { quantityAfter: true } : {}),
          ...(quantityAt(index) && isAmount(seen[index - 1]) ? { moneyBefore: true } : {}),
          ...(numberKind(seen[index - 1]) ? { afterNumber: numberKind(seen[index - 1]) } : {}),
        },
      });
      before.push(result.formClassWord ?? 0);
      // The words are read a stretch at a time (LTS/ls_task.c:362-390: the
      // text is handed on, and its classes start anew, at a space after a
      // clause character; an apostrophe or a period written on a word is
      // one). "We stayed at my parents' house.": "house" is the first word of
      // its stretch and has no word before it to choose its entry by.
      if (options.stretchEnds?.[index]) before.length = 0;
      return result;
    });
  };
  // Where the stretch of the word at `index` ends (the index after its last word).
  const stretchEnd = (index: number): number => {
    const end = (options.stretchEnds ?? []).findIndex((ends, at) => at >= index && ends);
    return end < 0 ? words.length : end + 1;
  };
  const firstClasses = read(null).map((result) => result.formClassWord ?? 0);
  const spoken = read((index) => firstClasses.slice(index + 1, stretchEnd(index)).some(isVerb));
  // The conjunctions of several words among them (table-conjunctions.ts). A
  // word with a written mark on it is no part of one.
  if (!table.conjunctionSequences) return spoken;
  const roles = conjunctionRoles(
    words,
    table.conjunctionSequences,
    options.atWrittenPunctuation !== false,
  );
  return spoken.map((result, index) =>
    roles[index] ? { ...result, conjunctionRole: roles[index] } : result,
  );
}
