import type { KlattFrame, TranscriptionToken } from "../../src/tts-frontend-types";

type WithWordAndPhoneme = {
  word?: string | null;
  phoneme?: string | null;
};

function collectWordOccurrences<T extends WithWordAndPhoneme>(
  items: T[],
): Array<{ word: string; phonemes: string[] }> {
  const occurrences: Array<{ word: string; phonemes: string[] }> = [];
  let currentWord = "";
  let currentPhonemes: string[] = [];

  const flush = () => {
    if (!currentWord || currentPhonemes.length === 0) return;
    occurrences.push({ word: currentWord, phonemes: currentPhonemes });
    currentWord = "";
    currentPhonemes = [];
  };

  for (const item of items) {
    const word = typeof item.word === "string" ? item.word : "";
    const phoneme = typeof item.phoneme === "string" ? item.phoneme : "";
    if (!word || !phoneme || phoneme === "SIL") continue;

    if (word !== currentWord) {
      flush();
      currentWord = word;
      currentPhonemes = [];
    }

    if (currentPhonemes[currentPhonemes.length - 1] !== phoneme) {
      currentPhonemes.push(phoneme);
    }
  }

  flush();
  return occurrences;
}

export function getTranscriptionWordOccurrence(
  tokens: TranscriptionToken[],
  word: string,
  occurrence = 0,
): string[] {
  const occurrences = collectWordOccurrences(tokens);
  const matches = occurrences.filter((entry) => entry.word === word);
  return matches[occurrence]?.phonemes ?? [];
}

export function getTrackWordOccurrence(
  track: KlattFrame[],
  word: string,
  occurrence = 0,
): string[] {
  const occurrences = collectWordOccurrences(track);
  const matches = occurrences.filter((entry) => entry.word === word);
  return matches[occurrence]?.phonemes ?? [];
}

export function countPrimaryStressVowels(phonemes: string[]): number {
  return phonemes.filter((phoneme) => /1$/.test(phoneme)).length;
}
