/**
 * Syllabification using the Maximum Onset Principle.
 *
 * Splits a phoneme sequence into syllables by maximizing the onset
 * (initial consonant cluster) of each syllable, constrained by legal
 * English onset clusters.
 *
 * Citation: Kahn (1976), Syllable-Based Generalizations in English Phonology.
 *           Selkirk (1982), The Syllable.
 */

import { loadYamlDocumentSync } from "../yaml-loader";

// ── Phonotactics data from YAML ─────────────────────────────────────────

interface PhonotacticsData {
  vowels: string[];
  legal_onsets: string[];
  voicing_classes: {
    voiceless_finals: string[];
    td_finals: string[];
    sibilant_finals: string[];
    voiceless_consonants: string[];
  };
}

const phonotacticsCache = new Map<string, PhonotacticsData>();

export function loadPhonotacticsSync(
  path: string = "/rules/frontends/qlatt-english/phonotactics.yaml",
): PhonotacticsData {
  const cached = phonotacticsCache.get(path);
  if (cached) return cached;
  const data = loadYamlDocumentSync<PhonotacticsData>(path);
  phonotacticsCache.set(path, data);
  return data;
}

// ── Vowel set ───────────────────────────────────────────────────────────

/** Returns true if the phoneme is a vowel (can bear stress). */
export function isVowel(phoneme: string): boolean {
  const data = loadPhonotacticsSync();
  return new Set(data.vowels).has(phoneme);
}

// ── Legal English onsets ────────────────────────────────────────────────

/**
 * Check whether a sequence of consonant phonemes forms a legal onset.
 * A single consonant is always legal. An empty onset is always legal.
 */
function isLegalOnset(consonants: string[]): boolean {
  if (consonants.length <= 1) return true;
  const data = loadPhonotacticsSync();
  const key = consonants.join("");
  return new Set(data.legal_onsets).has(key);
}

// ── Syllabification ─────────────────────────────────────────────────────

/**
 * Syllabify a phoneme sequence using the Maximum Onset Principle.
 *
 * @param phonemes - Array of ARPAbet phonemes (no stress digits).
 * @returns Array of syllables, each syllable an array of phonemes.
 */
export function syllabify(phonemes: string[]): string[][] {
  if (phonemes.length === 0) return [];

  // Find vowel positions
  const vowelPositions: number[] = [];
  for (let i = 0; i < phonemes.length; i++) {
    if (isVowel(phonemes[i])) {
      vowelPositions.push(i);
    }
  }

  // No vowels: return entire sequence as one degenerate syllable
  if (vowelPositions.length === 0) {
    return [phonemes.slice()];
  }

  // One vowel: everything is one syllable
  if (vowelPositions.length === 1) {
    return [phonemes.slice()];
  }

  // Multiple vowels: split at consonant boundaries between vowels.
  // For each pair of adjacent vowels, determine where to split the
  // intervocalic consonants.
  const syllables: string[][] = [];

  // splitPoints[i] = index in phonemes where syllable i+1 begins
  const splitPoints: number[] = [];

  for (let vi = 0; vi < vowelPositions.length - 1; vi++) {
    const vEnd = vowelPositions[vi]; // position of vowel i
    const vNext = vowelPositions[vi + 1]; // position of vowel i+1

    // Consonants between the two vowels: phonemes[vEnd+1 .. vNext-1]
    const consonantStart = vEnd + 1;
    const consonantEnd = vNext; // exclusive
    const numConsonants = consonantEnd - consonantStart;

    if (numConsonants === 0) {
      // Adjacent vowels: split right before the next vowel
      splitPoints.push(vNext);
    } else {
      // Try maximum onset: assign as many consonants as possible to
      // the next syllable's onset, constrained by legal onsets.
      // Start with all consonants as onset; if illegal, move leftmost
      // consonant to coda and try again.
      let onsetStart = consonantStart;
      while (onsetStart < consonantEnd) {
        const candidateOnset = phonemes.slice(onsetStart, consonantEnd);
        if (isLegalOnset(candidateOnset)) {
          break;
        }
        onsetStart++;
      }
      splitPoints.push(onsetStart);
    }
  }

  // Build syllable arrays from split points
  let start = 0;
  for (const sp of splitPoints) {
    syllables.push(phonemes.slice(start, sp));
    start = sp;
  }
  syllables.push(phonemes.slice(start));

  return syllables;
}
