/**
 * Morphological decomposition for G2P pipeline.
 * Strips known affixes and looks up root words in the CMU dictionary.
 *
 * Citation: Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5
 */

import type { DictLookup, PronunciationResult } from './types';
import { loadYamlDocumentSync } from '../yaml-loader';

// --- Affix data types ---

interface SuffixEntry {
  affix: string;
  pronunciation: string[] | 'contextual';
  min_root: number;
  try_silent_e?: boolean;
}

interface PrefixEntry {
  affix: string;
  pronunciation: string[];
  min_remainder: number;
}

interface MorphologyData {
  suffixes: SuffixEntry[];
  prefixes: PrefixEntry[];
  ed_pronunciation: {
    voiceless_finals: string[];
  };
}

// --- Load affix tables from YAML ---

let morphologyData: MorphologyData | null = null;

function getMorphologyData(): MorphologyData {
  if (morphologyData) return morphologyData;
  morphologyData = loadYamlDocumentSync<MorphologyData>('/rules/morphology.yaml');
  return morphologyData;
}

// --- Voicing classification for -ed and -s ---

// Phonemes where -ed is pronounced as T (voiceless finals)
const VOICELESS_FINALS = new Set(['CH', 'F', 'K', 'P', 'S', 'SH', 'TH']);
// Phonemes where -ed is pronounced as IH0 D (after t/d)
const TD_FINALS = new Set(['T', 'D']);
// Sibilants where -s is pronounced as IH0 Z
const SIBILANT_FINALS = new Set(['S', 'Z', 'SH', 'ZH', 'CH', 'JH']);
// Voiceless consonants where -s is pronounced as S
const VOICELESS_CONSONANTS = new Set(['CH', 'F', 'K', 'P', 'T', 'TH']);

/**
 * Get the last phoneme from a pronunciation array, stripping stress digits.
 */
function lastPhoneme(phonemes: string[]): string {
  if (phonemes.length === 0) return '';
  return phonemes[phonemes.length - 1].replace(/\d$/, '');
}

/**
 * Determine the pronunciation of -ed suffix based on the root's last phoneme.
 * Citation: Allen, Hunnicutt & Klatt 1987 Ch.5
 */
function edPronunciation(rootPhonemes: string[]): string[] {
  const last = lastPhoneme(rootPhonemes);
  if (TD_FINALS.has(last)) return ['IH0', 'D'];
  if (VOICELESS_FINALS.has(last)) return ['T'];
  return ['D'];
}

/**
 * Determine the pronunciation of -s suffix based on the root's last phoneme.
 * Citation: Allen, Hunnicutt & Klatt 1987 Ch.5
 */
function sPronunciation(rootPhonemes: string[]): string[] {
  const last = lastPhoneme(rootPhonemes);
  if (SIBILANT_FINALS.has(last)) return ['IH0', 'Z'];
  if (VOICELESS_CONSONANTS.has(last)) return ['S'];
  return ['Z'];
}

/**
 * Try to find a root word in the dictionary after stripping a suffix.
 * Handles doubled consonants and silent-e restoration.
 */
function tryRootLookup(
  root: string,
  trySilentE: boolean,
  dictLookup: DictLookup,
): { rootWord: string; phonemes: string[] } | null {
  // Direct lookup
  const direct = dictLookup(root);
  if (direct) return { rootWord: root, phonemes: direct };

  // Try undoubled consonant: "plann" -> "plan"
  if (root.length >= 4 && root[root.length - 1] === root[root.length - 2]) {
    const undoubled = root.slice(0, -1);
    const result = dictLookup(undoubled);
    if (result) return { rootWord: undoubled, phonemes: result };
  }

  // Try restoring silent e: "hop" -> "hope", "lov" -> "love"
  if (trySilentE) {
    const withE = root + 'e';
    const result = dictLookup(withE);
    if (result) return { rootWord: withE, phonemes: result };
  }

  return null;
}

/**
 * Attempt morphological decomposition of a word.
 * Returns a PronunciationResult if successful, null otherwise.
 *
 * Citation: Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5
 */
export function decomposeWord(
  word: string,
  dictLookup: DictLookup,
): PronunciationResult | null {
  if (!word || word.length < 4) return null;

  const lowerWord = word.toLowerCase();
  const data = getMorphologyData();

  // Try suffixes (already ordered longest-first in YAML)
  for (const suffix of data.suffixes) {
    if (!lowerWord.endsWith(suffix.affix)) continue;

    const root = lowerWord.slice(0, lowerWord.length - suffix.affix.length);
    if (root.length < suffix.min_root) continue;

    const lookup = tryRootLookup(root, suffix.try_silent_e ?? false, dictLookup);
    if (!lookup) continue;

    // Determine suffix pronunciation
    let suffixPhonemes: string[];
    if (suffix.pronunciation === 'contextual') {
      if (suffix.affix === 'ed') {
        suffixPhonemes = edPronunciation(lookup.phonemes);
      } else if (suffix.affix === 's') {
        suffixPhonemes = sPronunciation(lookup.phonemes);
      } else {
        continue; // Unknown contextual suffix
      }
    } else {
      suffixPhonemes = suffix.pronunciation;
    }

    return {
      phonemes: [...lookup.phonemes, ...suffixPhonemes],
      source: 'morphology',
      word: lowerWord,
      rootWord: lookup.rootWord,
    };
  }

  // Try prefixes
  for (const prefix of data.prefixes) {
    if (!lowerWord.startsWith(prefix.affix)) continue;

    const remainder = lowerWord.slice(prefix.affix.length);
    if (remainder.length < prefix.min_remainder) continue;

    const remainderPhonemes = dictLookup(remainder);
    if (!remainderPhonemes) continue;

    return {
      phonemes: [...prefix.pronunciation, ...remainderPhonemes],
      source: 'morphology',
      word: lowerWord,
      rootWord: remainder,
    };
  }

  return null;
}
