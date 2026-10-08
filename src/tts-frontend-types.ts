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
  /** The phrase the word starts, when the frontend's lexicon marks one. */
  phraseStart?: "vp" | "pp";
  /** A morpheme boundary stands after this phone, inside its word. */
  morphemeBoundaryAfter?: boolean;
  /** The lexicon exempts this phone from the frontend's allophone rules. */
  rulesBlocked?: boolean;
  isPunctuation?: boolean;
  symbol?: string;
  duration?: number;
  _pronDecisionId?: string;
  sourceTokenId: string;
}

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
   * in front ("cuse" finds "'cuse"). On unless a frontend says false.
   */
  elided_apostrophe_lookup?: boolean;
  letter_names?: Record<string, string[]>;
  punctuation_tokens?: string[];
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
