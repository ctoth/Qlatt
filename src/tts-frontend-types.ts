import type { Utterance } from "./declarative-frontend/hrg";
import type { CompiledRulepack } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";

/** One phoneme selected by transcription before inventory materialization. */
export interface TranscriptionToken {
  phoneme: string;
  stress: number | null;
  word: string;
  isPunctuation?: boolean;
  symbol?: string;
  duration?: number;
  _pronDecisionId?: string;
  sourceTokenId: string;
}

export type TranscriptionConfig = {
  diagnostic_symbols?: Record<string, string[]>;
  letter_names?: Record<string, string[]>;
  punctuation_tokens?: string[];
};

export type TranscriptionOptions = {
  provenance?: ProvenanceCollector | null;
  transcriptionConfig?: TranscriptionConfig;
  ltsPath?: string;
  morphologyPath?: string;
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
