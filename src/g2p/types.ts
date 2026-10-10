import type { LexicalStressResult } from "./lexical-stress-types";

export type PronunciationSource =
  | "dictionary"
  | "morphology"
  | "lts-rules"
  | "number"
  | "phonemic"
  | "spelling"
  | "position"
  | "number-abbreviation"
  | "hyphenated"
  | "mode-character"
  | "unknown";

/** One spoken word of a token that is spoken as several (a number in digits). */
export interface PronunciationPart {
  phonemes: string[];
  /** The phrase this word starts. */
  phraseStart?: "vp";
  /** A pause (a comma's) stands before this word. */
  pauseBefore?: boolean;
  /** Indices of the phones after which a morpheme boundary stands. */
  morphemeAfter?: number[];
  /** Indices of the phones the lexicon exempts from allophone rules. */
  rulesBlockedAt?: number[];
  /** The numbers written after a phone in phonemic text, by the phone's index. */
  numbersAt?: { at: number; numbers: number[] }[];
}

export interface PronunciationResult {
  phonemes: string[];
  source: PronunciationSource;
  word: string;
  rootWord?: string; // if morphology found a root
  lexicalStress?: LexicalStressResult;
  morphology?: MorphologyCycle[];
  /**
   * The word's form classes (part-of-speech names such as "verb", "func"),
   * when the frontend's lexicon records them; empty for a word it does not
   * know. Absent when the frontend has no form class data.
   */
  formClasses?: string[];
  /** The same classes as one word of bits, for the next word's context. */
  formClassWord?: number;
  /**
   * The word's part in a conjunction of several words, when the frontend's
   * table lists such (table-conjunctions.ts).
   */
  conjunctionRole?: "first" | "rest";
  /**
   * The word was read ahead by the routine that spoke the word before it
   * ("am" after a number, "million" after a dollar amount): it is no word of
   * its own to what counts words as they are spoken.
   */
  readAhead?: boolean;
  /** A pause (a comma's) stands after the word, though no mark is written. */
  pauseAfter?: boolean;
  /**
   * Phonemic text a rule composed for one written word, which named the
   * word (src/text-parser/phonemes.ts PHONEMIC_CLASS_WORD_OPEN): a word of
   * letter-to-sound's own, with that word's class or with none.
   */
  forWrittenWord?: boolean;
  /**
   * The mode of the text whose table named the word (source
   * "mode-character"): a one-character word spoken by the name it has while
   * that mode is on.
   */
  mode?: string;
  /**
   * The form classes as the frontend's phonetic rules receive them, where
   * that differs from what the lexicon holds (table-lts-pronounce.ts
   * receivedFormClassWord).
   */
  receivedFormClasses?: string[];
  /** The phrase the word starts, when the frontend's lexicon marks one. */
  phraseStart?: "vp" | "pp";
  /**
   * Indices into `phonemes` of the phones the lexicon exempts from the
   * frontend's allophone rules.
   */
  rulesBlockedAt?: number[];
  /**
   * Indices into `phonemes` of the phones after which the lexicon marks a
   * morpheme boundary or the joint of a compound.
   */
  boundaryAfterAt?: number[];
  /**
   * The words the token is spoken as, when it is more than one; `phonemes`
   * is then all of them in order.
   */
  parts?: PronunciationPart[];
  /**
   * A phrase start that stands after the token's last word: the word that
   * follows starts that phrase (a clock time that ends in ":00").
   */
  phraseStartAfter?: "vp";
  /**
   * Phonemic text that ends in a word boundary: a word like any other, with
   * a boundary after it. Phonemic text without one has none after it.
   */
  wordBoundaryAfter?: boolean;
}

/** Boundaries are phone offsets in the final pronunciation, end exclusive. */
export interface MorphologyCycle {
  spelling: string;
  start: number;
  end: number;
  affixStart?: number;
  kind: "root" | "prefix" | "suffix";
  stressType?: "forcing" | "non_affecting";
  stressTarget?: "penult" | "antepenult" | "final";
  citations: string[];
}

// Function type for dictionary lookup (injected dependency)
export type DictLookup = (word: string) => string[] | null;
