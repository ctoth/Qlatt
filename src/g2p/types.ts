import type { LexicalStressResult } from "./lexical-stress-types";

export type PronunciationSource = "dictionary" | "morphology" | "lts-rules" | "unknown";

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
  /**
   * The form classes as the frontend's phonetic rules receive them, where
   * that differs from what the lexicon holds (table-lts-pronounce.ts
   * receivedFormClassWord).
   */
  receivedFormClasses?: string[];
  /** The phrase the word starts, when the frontend's lexicon marks one. */
  phraseStart?: "vp" | "pp";
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
