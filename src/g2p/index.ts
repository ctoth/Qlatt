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

import { ltsDocumentAt } from "./lts-document";
import { applyLtsRules } from "./lts-engine";
import { decomposeClitic, decomposeWord, getStressHintForWord } from "./morphology";
import { stressPronunciation } from "./stress";
import { type ClauseContext, chooseHomograph, loneWordContext } from "./table-homograph";
import {
  formClassNamesOf,
  isLtsTableDocument,
  type LtsTableDocument,
  pronounceWithLtsTable,
  receivedFormClassWord,
  startsVerbPhrase,
} from "./table-lts-pronounce";
import { numberWords, speakDigits, speakNumberToken } from "./table-number";
import { stripSuffixes } from "./table-suffix";
import type { DictLookup, PronunciationResult } from "./types";

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
  const classed = (
    mask: number,
  ): { formClasses?: string[]; formClassWord?: number; receivedFormClasses?: string[] } => {
    if (!table?.formClassNames) return {};
    const word = table.specialWordFormClasses?.[lowerWord] ?? mask;
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
    const fixed = table?.specialWordPhraseStarts?.[lowerWord];
    if (fixed) return { phraseStart: fixed };
    return table?.wordFormClasses &&
      entryClass !== null &&
      table.specialWordFormClasses?.[lowerWord] === undefined &&
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

  // A table with number phone lists speaks an all-digit word itself, ahead of
  // any lookup, as several words; the whole number has the one form class
  // `adj` (DECtalk 4.63 LTS/ls_task.c:3776-3806).
  // The same for a number-like word the text task reads whole: a dollar
  // amount, a clock time, a plural number, a number with separators or
  // fraction digits (LTS/ls_task.c:3181, 3622, 3747; speakNumberToken). Only
  // the plain-number rule sets the class (:3776-3782), which a word with a
  // dollar sign, a colon or a plural ending does not reach.
  if (table?.numberPhones && /^[$0-9.]/.test(lowerWord)) {
    const digitsOnly = /^[0-9]+$/.test(lowerWord);
    const symbols = digitsOnly
      ? speakDigits(lowerWord, table.numberPhones)
      : speakNumberToken(lowerWord, table.numberPhones);
    const plainNumber = digitsOnly || /^[0-9,.]+$/.test(lowerWord);
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
      };
    }
  }

  // A word the table speaks by where it stands: one form apart from
  // punctuation, with its own class, and another against a punctuation mark
  // ("a box." and "box a."; DECtalk 4.63 LTS/ls_task.c:2647-2673).
  const placed = table?.wordsByPunctuation?.[lowerWord];
  if (placed && !context.atPunctuation) {
    return {
      phonemes: [...placed.apart.phonemes],
      source: "position",
      word: lowerWord,
      ...classed(placed.apart.formClass),
    };
  }

  // 1. Try direct dictionary lookup
  const dictResult = dictLookup(lowerWord);
  if (dictResult) {
    const entry = entryOf(lowerWord, 0);
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
    let stripped = strip(dictLookup);
    if (stripped.phonemes && stripped.root !== null) {
      const root = stripped.root;
      const entry = entryOf(root, stripped.formClass);
      // The root's other entry: the same search, with that entry's phones.
      const other = entry.other;
      if (other) {
        stripped = strip((candidate) =>
          candidate === root ? [...other.phonemes] : dictLookup(candidate),
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
    return {
      phonemes: pronounceWithLtsTable(lowerWord, table),
      source: "lts-rules",
      word: lowerWord,
      ...classed(stripped.formClass),
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
  options: { ltsPath: string; morphologyPath: string; stressPolicyPath: string },
): PronunciationResult[] {
  const table = options.ltsPath ? ltsTableAt(options.ltsPath) : null;
  // Without words of two entries no word depends on another.
  if (!table?.homographs) return words.map((word) => pronounce(word, dictLookup, options));
  const verbBit = table?.formClassNames ? table.formClassNames.indexOf("verb") : -1;
  const isVerb = (classWord: number): boolean =>
    verbBit >= 0 && Math.floor(classWord / 2 ** verbBit) % 2 === 1;
  const read = (laterVerbAt: ((index: number) => boolean) | null): PronunciationResult[] => {
    const before: number[] = [];
    return words.map((word, index) => {
      const result = pronounce(word, dictLookup, {
        ...options,
        context: {
          before,
          laterVerb: laterVerbAt ? laterVerbAt(index) : null,
          atPunctuation: index === words.length - 1,
        },
      });
      before.push(result.formClassWord ?? 0);
      return result;
    });
  };
  const firstClasses = read(null).map((result) => result.formClassWord ?? 0);
  return read((index) => firstClasses.slice(index + 1).some(isVerb));
}
