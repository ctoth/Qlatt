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

export function getTrackFramesForWordPhoneme(
  track: KlattFrame[],
  word: string,
  phoneme: string
): KlattFrame[] {
  return track.filter(
    (frame) => frame.word === word && frame.phoneme === phoneme
  );
}

export function averageTrackParam(
  frames: Array<{ params?: Record<string, number> }>,
  key: string
): number {
  if (frames.length === 0) return 0;
  return (
    frames.reduce((sum, frame) => sum + Number(frame.params?.[key] ?? 0), 0) / frames.length
  );
}

export function maxTrackParam(
  frames: Array<{ params?: Record<string, number> }>,
  key: string
): number {
  if (frames.length === 0) return 0;
  return Math.max(...frames.map((frame) => Number(frame.params?.[key] ?? 0)));
}
