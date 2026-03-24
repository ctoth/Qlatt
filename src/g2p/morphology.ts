/**
 * Morphological decomposition for G2P pipeline.
 * Strips known affixes and looks up root words in the CMU dictionary.
 *
 * Citation: Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5
 */

import type { DictLookup, PronunciationResult } from './types';
import type { StressHint } from './stress';
import { loadYamlDocumentSync } from '../yaml-loader';
import { loadPhonotacticsSync } from './syllabify';

// --- Affix data types ---

interface SuffixEntry {
  affix: string;
  pronunciation: string[] | 'contextual';
  stress_type?: 'forcing' | 'non_affecting';
  stress_target?: 'penult' | 'antepenult' | 'final';
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

const morphologyCache = new Map<string, MorphologyData>();

function getMorphologyData(path: string): MorphologyData {
  const cached = morphologyCache.get(path);
  if (cached) return cached;
  const data = loadYamlDocumentSync<MorphologyData>(path);
  morphologyCache.set(path, data);
  return data;
}

// --- Voicing classification for -ed and -s (loaded from phonotactics.yaml) ---

function getVoicingClasses() {
  const data = loadPhonotacticsSync();
  return {
    voicelessFinals: new Set(data.voicing_classes.voiceless_finals),
    tdFinals: new Set(data.voicing_classes.td_finals),
    sibilantFinals: new Set(data.voicing_classes.sibilant_finals),
    voicelessConsonants: new Set(data.voicing_classes.voiceless_consonants),
  };
}

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
  const vc = getVoicingClasses();
  if (vc.tdFinals.has(last)) return ['IH0', 'D'];
  if (vc.voicelessFinals.has(last)) return ['T'];
  return ['D'];
}

/**
 * Determine the pronunciation of -s suffix based on the root's last phoneme.
 * Citation: Allen, Hunnicutt & Klatt 1987 Ch.5
 */
function sPronunciation(rootPhonemes: string[]): string[] {
  const last = lastPhoneme(rootPhonemes);
  const vc = getVoicingClasses();
  if (vc.sibilantFinals.has(last)) return ['IH0', 'Z'];
  if (vc.voicelessConsonants.has(last)) return ['S'];
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

function resolveSuffixPhonemes(
  suffix: SuffixEntry,
  rootPhonemes: string[],
): string[] | null {
  if (suffix.pronunciation === 'contextual') {
    if (suffix.affix === 'ed') {
      return edPronunciation(rootPhonemes);
    }
    if (suffix.affix === 's') {
      return sPronunciation(rootPhonemes);
    }
    return null;
  }
  return suffix.pronunciation;
}

function trySuffixDecomposition(
  surfaceWord: string,
  suffixes: SuffixEntry[],
  dictLookup: DictLookup,
): { rootWord: string; phonemes: string[] } | null {
  for (const suffix of suffixes) {
    if (!surfaceWord.endsWith(suffix.affix)) continue;

    const root = surfaceWord.slice(0, surfaceWord.length - suffix.affix.length);
    if (root.length < suffix.min_root) continue;

    const lookup = tryRootLookup(root, suffix.try_silent_e ?? false, dictLookup);
    if (!lookup) continue;

    const suffixPhonemes = resolveSuffixPhonemes(suffix, lookup.phonemes);
    if (!suffixPhonemes) continue;

    return {
      rootWord: lookup.rootWord,
      phonemes: [...lookup.phonemes, ...suffixPhonemes],
    };
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
  morphologyPath: string = '/rules/frontends/qlatt-english/morphology.yaml',
): PronunciationResult | null {
  if (!word || word.length < 4) return null;

  const lowerWord = word.toLowerCase();
  const data = getMorphologyData(morphologyPath);

  // Try suffixes first (already ordered longest-first in YAML).
  const suffixOnly = trySuffixDecomposition(lowerWord, data.suffixes, dictLookup);
  if (suffixOnly) {
    return {
      phonemes: suffixOnly.phonemes,
      source: 'morphology',
      word: lowerWord,
      rootWord: suffixOnly.rootWord,
    };
  }

  // Try prefixes
  for (const prefix of data.prefixes) {
    if (!lowerWord.startsWith(prefix.affix)) continue;

    const remainder = lowerWord.slice(prefix.affix.length);
    if (remainder.length < prefix.min_remainder) continue;

    const remainderPhonemes = dictLookup(remainder);
    if (remainderPhonemes) {
      return {
        phonemes: [...prefix.pronunciation, ...remainderPhonemes],
        source: 'morphology',
        word: lowerWord,
        rootWord: remainder,
      };
    }

    // Compound morphology: prefix + (suffix decomposition of remainder)
    // Example: "unkindness" = "un" + "kind" + "ness".
    const suffixInRemainder = trySuffixDecomposition(remainder, data.suffixes, dictLookup);
    if (!suffixInRemainder) continue;

    return {
      phonemes: [...prefix.pronunciation, ...suffixInRemainder.phonemes],
      source: 'morphology',
      word: lowerWord,
      rootWord: suffixInRemainder.rootWord,
    };
  }

  return null;
}

/**
 * Return a suffix-derived stress hint for LTS fallback when available.
 *
 * Citation: Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5
 */
export function getStressHintForWord(word: string, morphologyPath: string = '/rules/frontends/qlatt-english/morphology.yaml'): StressHint | undefined {
  if (!word || word.length < 4) return undefined;

  const lowerWord = word.toLowerCase();
  const data = getMorphologyData(morphologyPath);

  for (const suffix of data.suffixes) {
    if (!lowerWord.endsWith(suffix.affix)) continue;

    const root = lowerWord.slice(0, lowerWord.length - suffix.affix.length);
    if (root.length < suffix.min_root) continue;

    if (suffix.stress_type === 'forcing' && suffix.stress_target) {
      return {
        stressType: 'forcing',
        stressTarget: suffix.stress_target,
      };
    }

    if (suffix.stress_type === 'non_affecting') {
      return { stressType: 'non_affecting' };
    }

    return undefined;
  }

  return undefined;
}
