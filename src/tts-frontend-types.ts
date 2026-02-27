import type { ProvenanceCollector } from "./provenance";

/**
 * A single token produced by the transcription stage.
 *
 * Each token represents one phoneme (with optional stress) extracted from
 * the input text, or a punctuation-generated silence marker.
 */
export interface TranscriptionToken {
  /** ARPABET phoneme symbol (e.g. "HH", "AH", "L", "OW", "SIL") */
  phoneme: string;
  /** Lexical stress: 0 = unstressed, 1 = primary, 2 = secondary, null = N/A */
  stress: number | null;
  /** The source word this phoneme was produced from */
  word: string;
  /** True if this token was generated from a punctuation mark */
  isPunctuation?: boolean;
  /** The original punctuation symbol (e.g. ".", ",", "?") */
  symbol?: string;
  /** Duration hint in ms (only set for empty-word SIL fallback) */
  duration?: number;
  /** Provenance decision ID linking back to the pronunciation decision */
  _pronDecisionId?: string;
}

/** YAML-sourced transcription configuration. */
export type TranscriptionConfig = {
  diagnostic_symbols?: Record<string, string[]>;
  punctuation_tokens?: string[];
};

export type TranscriptionOptions = {
  provenance?: ProvenanceCollector | null;
  /** Transcription config from YAML (overrides hardcoded defaults). */
  transcriptionConfig?: TranscriptionConfig;
};
