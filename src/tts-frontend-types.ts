import type { Utterance } from "./declarative-frontend/hrg";
import type { CompiledRulepack } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";

/** One phoneme selected by transcription before inventory materialization. */
export interface TranscriptionToken {
  phoneme: string;
  stress: number | null;
  word: string;
  /** The word's form classes, when the frontend's lexicon records them. */
  formClasses?: readonly string[];
  /** The classes as the text stage has them, before they are handed on. */
  textFormClasses?: readonly string[];
  /** A later word of one written word (a number spoken as several words). */
  continuesWrittenWord?: boolean;
  /**
   * The word's part in a conjunction of several words, when the frontend's
   * lexicon finds such ("as soon as"): its first word, or a later one.
   */
  conjunctionRole?: "first" | "rest";
  /**
   * The written word was read ahead by the routine that spoke the word
   * before it, and is no word of its own where words are counted as spoken.
   */
  readAhead?: boolean;
  /**
   * The written word ends in a character that ends a stretch of words for
   * the frontend, though no punctuation token follows (an abbreviation's
   * period).
   */
  endsWordStretch?: boolean;
  /**
   * The marks the frontend names (`written_word_marks`) that the written
   * word has at its start or its end: an opening quotation mark, say.
   */
  writtenMarks?: string[];
  /** A punctuation token that is not in the text: a text rule supplied it. */
  supplied?: boolean;
  /**
   * A punctuation token a text rule sent itself: no routine read the mark
   * as the delimiter of the word before it (an initial's two periods).
   */
  sentMark?: boolean;
  /** The phrase the word starts, when the frontend's lexicon marks one. */
  phraseStart?: "vp" | "pp";
  /**
   * No word boundary stands before this word's phrase start: phonemic text,
   * which has no boundary after it, is the word before.
   */
  phraseStartUnbounded?: boolean;
  /** A morpheme boundary stands after this phone, inside its word. */
  morphemeBoundaryAfter?: boolean;
  /** The lexicon exempts this phone from the frontend's allophone rules. */
  rulesBlocked?: boolean;
  isPunctuation?: boolean;
  symbol?: string;
  duration?: number;
  _pronDecisionId?: string;
  /**
   * Inside transcription only: the phone is in the last word of phonemic
   * text, which has no word boundary after it (transcribe-text.ts
   * joinPhonemicText removes the mark).
   */
  _joinsNextWord?: boolean;
  /**
   * Inside transcription only: the token's reading ends in this phrase
   * start, which is the next word's (transcribe-text.ts
   * startPhraseAtNextWord removes the mark).
   */
  _phraseStartAfter?: "vp" | "pp";
  sourceTokenId: string;
}

export const LEXICON_SOURCE_KEYS = [
  "dictionary",
  "morphology",
  "lts-rules",
  "spelling",
  "position",
  "number-abbreviation",
  "hyphenated",
] as const;
export type LexiconSourceKey = (typeof LEXICON_SOURCE_KEYS)[number];
export type LexiconSource = { name: string; citation: string };

export type TranscriptionConfig = {
  diagnostic_symbols?: Record<string, string[]>;
  /**
   * Whether a text made only of `diagnostic_symbols` is spoken as those
   * phonemes. On unless a frontend says false: a frontend that ports a system
   * with no such input turns it off, so "B." is the letter and not /b/.
   */
  diagnostic_symbol_input?: boolean;
  /**
   * Whether a word the dictionary lacks is also looked up with an apostrophe
   * added in front or at its end ("cuse" finds "'cuse"), or with a period
   * added ("cr" finds "cr."). On unless a frontend says false; such a
   * frontend looks a word up as written and, on a miss, without the
   * apostrophes at its ends, and its text rules keep an abbreviation's period.
   */
  elided_apostrophe_lookup?: boolean;
  /**
   * What the frontend's lexicon is, per pronunciation source, for the decision
   * record of a word: `name` goes into the record's reason and `citation` is
   * its citation. A frontend with its own dictionary or letter-to-sound file
   * declares these; an undeclared source is the shared English default.
   */
  sources?: Partial<Record<LexiconSourceKey, LexiconSource>>;
  letter_names?: Record<string, string[]>;
  punctuation_tokens?: string[];
  /**
   * Characters that end a stretch of words when a written word ends in one,
   * for a frontend that counts a word's place among the words up to such a
   * character and not only up to a punctuation token. None when absent.
   */
  word_stretch_end_characters?: string;
  /**
   * Two lengths of text gathered since a stretch of words last ended: past
   * the first a stretch ends at the next white space, past the second at
   * once. None when absent.
   */
  word_stretch_length_limits?: number[];
  /**
   * Characters at the start (`open`) or the end (`close`) of a written word,
   * each with the name its Word is given for it (`written_marks`). A written
   * word is what stands between two white spaces in the text the frontend
   * reads. None when absent.
   */
  written_word_marks?: { open?: Record<string, string>; close?: Record<string, string> };
};

export type TranscriptionOptions = {
  diagnostics?: import("./diagnostics").Diagnostics | null;
  provenance?: ProvenanceCollector | null;
  transcriptionConfig?: TranscriptionConfig;
  ltsPath?: string;
  morphologyPath?: string;
  stressPolicyPath?: string;
  dictLookup?: (word: string) => string[] | null;
  dictionaryMap?: Record<string, string | undefined>;
  utterance?: Utterance;
  compiledSpec?: CompiledRulepack;
  /** The rule engine's option for the orthography phase; recorded unless false. */
  captureTooling?: boolean;
};

/** A final timestamped backend parameter frame emitted by HRG lowering. */
export interface KlattFrame {
  time: number;
  phoneme?: string;
  word?: string;
  segmentId?: string;
  provenance?: Record<string, string>;
  params: Record<string, number>;
  [key: string]: unknown;
}
