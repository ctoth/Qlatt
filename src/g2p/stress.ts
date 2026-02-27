/**
 * Hunnicutt cyclic stress assignment.
 *
 * Assigns primary stress (1) and unstressed (0) markers to vowel phonemes
 * based on syllable count and optional suffix-derived hints.
 *
 * Default rules (no hint):
 *   - 1 syllable:  stress it (primary)
 *   - 2 syllables: stress penult (first)
 *   - 3+ syllables: stress antepenult (third from end)
 *
 * Citation: Hunnicutt (1976), Phonological Rules for a Text-to-Speech System.
 *           Allen, Hunnicutt & Klatt (1987), From Text to Speech: The MITalk System.
 */

import { isVowel, syllabify } from './syllabify';

// ── Types ───────────────────────────────────────────────────────────────

export interface StressHint {
  stressType?: 'forcing' | 'non_affecting';
  stressTarget?: 'penult' | 'antepenult' | 'final';
}

// ── Stress Assignment ───────────────────────────────────────────────────

/**
 * Assign stress digits to vowel phonemes.
 *
 * @param phonemes - Array of ARPAbet phonemes (no stress digits).
 * @param hint - Optional suffix-derived stress placement hint.
 * @returns New array with stress digits appended to vowel phonemes.
 */
export function assignStress(phonemes: string[], hint?: StressHint): string[] {
  if (phonemes.length === 0) return [];

  const syllables = syllabify(phonemes);

  // Find which syllables contain vowels (stress targets)
  const vowelSyllableIndices: number[] = [];
  for (let si = 0; si < syllables.length; si++) {
    if (syllables[si].some(isVowel)) {
      vowelSyllableIndices.push(si);
    }
  }

  // No vowels: return unchanged
  if (vowelSyllableIndices.length === 0) {
    return phonemes.slice();
  }

  // Determine which syllable gets primary stress
  const numVowelSyllables = vowelSyllableIndices.length;
  let stressedSyllableIndex: number;

  if (hint?.stressType === 'forcing' && hint.stressTarget) {
    // Suffix-forced stress placement
    switch (hint.stressTarget) {
      case 'final':
        stressedSyllableIndex = vowelSyllableIndices[numVowelSyllables - 1];
        break;
      case 'penult':
        stressedSyllableIndex = vowelSyllableIndices[Math.max(0, numVowelSyllables - 2)];
        break;
      case 'antepenult':
        stressedSyllableIndex = vowelSyllableIndices[Math.max(0, numVowelSyllables - 3)];
        break;
    }
  } else {
    // Default stress rules
    if (numVowelSyllables === 1) {
      stressedSyllableIndex = vowelSyllableIndices[0];
    } else if (numVowelSyllables === 2) {
      // Stress penult (first vowel syllable)
      stressedSyllableIndex = vowelSyllableIndices[0];
    } else {
      // 3+ syllables: stress antepenult (third from end)
      stressedSyllableIndex = vowelSyllableIndices[numVowelSyllables - 3];
    }
  }

  // Build output with stress digits
  const result: string[] = [];
  for (let si = 0; si < syllables.length; si++) {
    for (const phoneme of syllables[si]) {
      if (isVowel(phoneme)) {
        result.push(phoneme + (si === stressedSyllableIndex ? '1' : '0'));
      } else {
        result.push(phoneme);
      }
    }
  }

  return result;
}
