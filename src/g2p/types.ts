export type PronunciationSource = 'dictionary' | 'morphology' | 'lts-rules' | 'unknown';

export interface PronunciationResult {
  phonemes: string[];
  source: PronunciationSource;
  word: string;
  rootWord?: string;  // if morphology found a root
}

// Function type for dictionary lookup (injected dependency)
export type DictLookup = (word: string) => string[] | null;
