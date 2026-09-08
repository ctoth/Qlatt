import type { LexicalStressResult } from "./lexical-stress-types";

export type PronunciationSource = "dictionary" | "morphology" | "lts-rules" | "unknown";

export interface PronunciationResult {
  phonemes: string[];
  source: PronunciationSource;
  word: string;
  rootWord?: string; // if morphology found a root
  lexicalStress?: LexicalStressResult;
  morphology?: MorphologyCycle[];
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
