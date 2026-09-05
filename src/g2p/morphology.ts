/**
 * Morphological decomposition for G2P pipeline.
 * Strips known affixes and looks up root words in the CMU dictionary.
 *
 * Citation: Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5
 */

import { loadYamlDocumentSync } from "../yaml-loader";
import type { StressHint } from "./stress";
import { loadPhonotacticsSync } from "./syllabify";
import type { DictLookup, PronunciationResult } from "./types";

// --- Affix data types ---

type ContextualConditionClass =
  | "voiceless_finals"
  | "td_finals"
  | "sibilant_finals"
  | "voiceless_consonants";

type ConditionClass = "always" | "default" | ContextualConditionClass;

interface AffixEntry {
  spelling: string;
  condition_class: ConditionClass;
  output_phonemes: string[];
  citations: string[];
}

interface SuffixEntry extends AffixEntry {
  stress_type?: "forcing" | "non_affecting";
  stress_target?: "penult" | "antepenult" | "final";
  min_root: number;
  try_silent_e?: boolean;
}

interface PrefixEntry extends AffixEntry {
  min_remainder: number;
}

interface CliticEntry {
  spelling: string;
  allomorph_spelling: string;
  citations: string[];
}

interface ConfiguredValue<T> {
  value: T;
  citations?: string[];
  estimate?: string;
}

interface MorphologyData {
  suffixes: SuffixEntry[];
  prefixes: PrefixEntry[];
  clitics: CliticEntry[];
  heuristics: {
    minimum_word_length: ConfiguredValue<number>;
    consonant_undoubling_minimum_root_length: ConfiguredValue<number>;
    silent_e_letter: ConfiguredValue<string>;
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

// --- Condition classes for contextual allomorphs (loaded from phonotactics.yaml) ---

function getVoicingClasses(): Record<ContextualConditionClass, Set<string>> {
  const data = loadPhonotacticsSync();
  return {
    voiceless_finals: new Set(data.voicing_classes.voiceless_finals),
    td_finals: new Set(data.voicing_classes.td_finals),
    sibilant_finals: new Set(data.voicing_classes.sibilant_finals),
    voiceless_consonants: new Set(data.voicing_classes.voiceless_consonants),
  };
}

/**
 * Get the last phoneme from a pronunciation array, stripping stress digits.
 */
function lastPhoneme(phonemes: string[]): string {
  if (phonemes.length === 0) return "";
  return phonemes[phonemes.length - 1].replace(/\d$/, "");
}

function resolveAffixPhonemes(
  entries: AffixEntry[],
  spelling: string,
  rootPhonemes: string[],
): string[] | null {
  const last = lastPhoneme(rootPhonemes);
  const conditionClasses = getVoicingClasses();
  let fallback: string[] | null = null;

  for (const entry of entries) {
    if (entry.spelling !== spelling) continue;
    if (entry.condition_class === "always") return entry.output_phonemes;
    if (entry.condition_class === "default") {
      fallback = entry.output_phonemes;
      continue;
    }
    if (conditionClasses[entry.condition_class].has(last)) {
      return entry.output_phonemes;
    }
  }

  return fallback;
}

/**
 * Try to find a root word in the dictionary after stripping a suffix.
 * Handles doubled consonants and silent-e restoration.
 */
function tryRootLookup(
  root: string,
  trySilentE: boolean,
  dictLookup: DictLookup,
  heuristics: MorphologyData["heuristics"],
): { rootWord: string; phonemes: string[] } | null {
  // Direct lookup
  const direct = dictLookup(root);
  if (direct) return { rootWord: root, phonemes: direct };

  // Try undoubled consonant: "plann" -> "plan"
  if (
    root.length >= heuristics.consonant_undoubling_minimum_root_length.value &&
    root[root.length - 1] === root[root.length - 2]
  ) {
    const undoubled = root.slice(0, -1);
    const result = dictLookup(undoubled);
    if (result) return { rootWord: undoubled, phonemes: result };
  }

  // Try restoring silent e: "hop" -> "hope", "lov" -> "love"
  if (trySilentE) {
    const withE = root + heuristics.silent_e_letter.value;
    const result = dictLookup(withE);
    if (result) return { rootWord: withE, phonemes: result };
  }

  return null;
}

function trySuffixDecomposition(
  surfaceWord: string,
  data: MorphologyData,
  dictLookup: DictLookup,
): { rootWord: string; phonemes: string[] } | null {
  const seenSpellings = new Set<string>();

  for (const suffix of data.suffixes) {
    if (seenSpellings.has(suffix.spelling)) continue;
    seenSpellings.add(suffix.spelling);
    if (!surfaceWord.endsWith(suffix.spelling)) continue;

    const root = surfaceWord.slice(0, surfaceWord.length - suffix.spelling.length);
    if (root.length < suffix.min_root) continue;

    const lookup = tryRootLookup(root, suffix.try_silent_e ?? false, dictLookup, data.heuristics);
    if (!lookup) continue;

    const suffixPhonemes = resolveAffixPhonemes(data.suffixes, suffix.spelling, lookup.phonemes);
    if (!suffixPhonemes) continue;

    return {
      rootWord: lookup.rootWord,
      phonemes: [...lookup.phonemes, ...suffixPhonemes],
    };
  }

  return null;
}

/** Apply a configured clitic using the referenced suffix allomorph rules. */
export function decomposeClitic(
  word: string,
  dictLookup: DictLookup,
  morphologyPath: string = "/rules/frontends/qlatt-english/morphology.yaml",
): PronunciationResult | null {
  if (!word) return null;

  const lowerWord = word.toLowerCase();
  const data = getMorphologyData(morphologyPath);
  for (const clitic of data.clitics) {
    if (!lowerWord.endsWith(clitic.spelling)) continue;

    const base = lowerWord.slice(0, -clitic.spelling.length);
    const basePhonemes = dictLookup(base);
    if (!basePhonemes) continue;

    const cliticPhonemes = resolveAffixPhonemes(
      data.suffixes,
      clitic.allomorph_spelling,
      basePhonemes,
    );
    if (!cliticPhonemes) continue;

    return {
      phonemes: [...basePhonemes, ...cliticPhonemes],
      source: "dictionary",
      word: lowerWord,
      rootWord: base,
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
  morphologyPath: string = "/rules/frontends/qlatt-english/morphology.yaml",
): PronunciationResult | null {
  if (!word) return null;

  const lowerWord = word.toLowerCase();
  const data = getMorphologyData(morphologyPath);
  if (word.length < data.heuristics.minimum_word_length.value) return null;

  // Try suffixes first (already ordered longest-first in YAML).
  const suffixOnly = trySuffixDecomposition(lowerWord, data, dictLookup);
  if (suffixOnly) {
    return {
      phonemes: suffixOnly.phonemes,
      source: "morphology",
      word: lowerWord,
      rootWord: suffixOnly.rootWord,
    };
  }

  // Try prefixes
  for (const prefix of data.prefixes) {
    if (!lowerWord.startsWith(prefix.spelling)) continue;

    const remainder = lowerWord.slice(prefix.spelling.length);
    if (remainder.length < prefix.min_remainder) continue;

    const remainderPhonemes = dictLookup(remainder);
    if (remainderPhonemes) {
      return {
        phonemes: [...prefix.output_phonemes, ...remainderPhonemes],
        source: "morphology",
        word: lowerWord,
        rootWord: remainder,
      };
    }

    // Compound morphology: prefix + (suffix decomposition of remainder)
    // Example: "unkindness" = "un" + "kind" + "ness".
    const suffixInRemainder = trySuffixDecomposition(remainder, data, dictLookup);
    if (!suffixInRemainder) continue;

    return {
      phonemes: [...prefix.output_phonemes, ...suffixInRemainder.phonemes],
      source: "morphology",
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
export function getStressHintForWord(
  word: string,
  morphologyPath: string = "/rules/frontends/qlatt-english/morphology.yaml",
): StressHint | undefined {
  if (!word) return undefined;

  const lowerWord = word.toLowerCase();
  const data = getMorphologyData(morphologyPath);
  if (word.length < data.heuristics.minimum_word_length.value) return undefined;

  for (const suffix of data.suffixes) {
    if (!lowerWord.endsWith(suffix.spelling)) continue;

    const root = lowerWord.slice(0, lowerWord.length - suffix.spelling.length);
    if (root.length < suffix.min_root) continue;

    if (suffix.stress_type === "forcing" && suffix.stress_target) {
      return {
        stressType: "forcing",
        stressTarget: suffix.stress_target,
      };
    }

    if (suffix.stress_type === "non_affecting") {
      return { stressType: "non_affecting" };
    }

    return undefined;
  }

  return undefined;
}
