/**
 * Text-to-phoneme transcription module.
 *
 * Converts normalized text into a flat array of TranscriptionTokens,
 * each carrying an ARPABET phoneme, stress marker, and source word.
 *
 * Handles:
 * - CMU dictionary lookup via the G2P pipeline
 * - Diagnostic symbol mode (e.g. "/b/" -> ["B"])
 * - Punctuation tokens (., , ? etc.) -> SIL markers
 * - Provenance tracking for pronunciation decisions
 */

import {
  DEFAULT_CMU_DICTIONARY_PATH,
  preloadCmuDictionaryFromPath,
} from "./cmu-dictionary-loader";
import { pronounce } from "./g2p";
import type { DictLookup, PronunciationResult } from "./g2p/types";
import type { TranscriptionToken, TranscriptionOptions } from "./tts-frontend-types";

// ---------------------------------------------------------------------------
// Citation constants for provenance tracking
// ---------------------------------------------------------------------------

const CMU_DICTIONARY_CITATION = "CMU Pronouncing Dictionary";
const FALLBACK_PRONUNCIATION_CITATION =
  "G2P pipeline: Elovitz LTS (NRL 7948) + Hunnicutt stress (Allen, Hunnicutt & Klatt 1987)";
const MORPHOLOGY_PRONUNCIATION_CITATION =
  "G2P pipeline: morphological decomposition (Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5)";
const SYMBOL_PRONUNCIATION_CITATION =
  "Diagnostic symbol mode: direct ARPABET symbol-to-phoneme mapping for explicit segment-list utterances";

// ---------------------------------------------------------------------------
// Default constants — overridden by YAML transcription config when available
// ---------------------------------------------------------------------------

export const PUNCTUATION_TOKENS = new Set([",", ".", "?", "!", ";", ":"]);

export const DIAGNOSTIC_SYMBOL_PHONEMES: Record<string, string[]> = {
  b: ["B"],
  ch: ["CH"],
  d: ["D"],
  dh: ["DH"],
  f: ["F"],
  g: ["G"],
  hh: ["HH"],
  jh: ["JH"],
  k: ["K"],
  l: ["L"],
  m: ["M"],
  n: ["N"],
  ng: ["NG"],
  p: ["P"],
  r: ["R"],
  s: ["S"],
  sh: ["SH"],
  t: ["T"],
  th: ["TH"],
  v: ["V"],
  w: ["W"],
  y: ["Y"],
  z: ["Z"],
  zh: ["ZH"],
};

// ---------------------------------------------------------------------------
// CMU dictionary (top-level await, loaded once at module init)
// ---------------------------------------------------------------------------

const CMU_DICT_MAP: Record<string, string | undefined> = await preloadCmuDictionaryFromPath(
  DEFAULT_CMU_DICTIONARY_PATH
);

/**
 * Adapter: wrap the CMU_DICT_MAP (string values) as a DictLookup (string[] | null).
 * Also handles alternate pronunciation entries like "read(1)".
 */
const cmuDictLookup: DictLookup = (word: string): string[] | null => {
  const lowerWord = word.toLowerCase();
  const candidates: string[] = [lowerWord];

  // Handle elided spellings where the dictionary key keeps leading apostrophe
  // (e.g., "'cuse") but normalized input token may not ("cuse").
  if (!lowerWord.startsWith("'")) candidates.push(`'${lowerWord}`);
  // Handle converse elision: input may omit or include trailing apostrophe.
  if (!lowerWord.endsWith("'")) candidates.push(`${lowerWord}'`);
  if (lowerWord.endsWith("'") && lowerWord.length > 1) candidates.push(lowerWord.slice(0, -1));
  // Normalization strips trailing punctuation tokens; recover abbreviations like "cr.".
  if (!lowerWord.endsWith(".")) candidates.push(`${lowerWord}.`);

  for (const candidate of candidates) {
    const entry = CMU_DICT_MAP[candidate];
    if (entry) return entry.split(" ");
  }

  // Handle alternate pronunciations like "read(1)" -> "read"
  if (word.includes("(")) {
    const base = CMU_DICT_MAP[word.replace(/\(\d+\)$/, "")];
    if (base) return base.split(" ");
  }
  return null;
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function isPunctuationToken(word: string): boolean {
  return PUNCTUATION_TOKENS.has(word);
}

export function getDiagnosticSymbolPronunciation(word: string): string[] | null {
  const normalized = word.toLowerCase().replace(/^\/+|\/+$/g, "");
  const phones = DIAGNOSTIC_SYMBOL_PHONEMES[normalized];
  return Array.isArray(phones) && phones.length > 0 ? [...phones] : null;
}

export function shouldUseDiagnosticSymbolMode(words: string[]): boolean {
  const nonPunctuation = words.filter((word) => word.length > 0 && !isPunctuationToken(word));
  return (
    nonPunctuation.length > 0 &&
    nonPunctuation.every((word) => getDiagnosticSymbolPronunciation(word) !== null)
  );
}

// ---------------------------------------------------------------------------
// Main transcription function
// ---------------------------------------------------------------------------

/**
 * Transcribe normalized text into a flat array of phoneme tokens.
 *
 * Each word is looked up through the G2P pipeline (CMU dict -> morphology ->
 * Elovitz LTS), and punctuation marks are converted to SIL pause tokens.
 * Diagnostic symbol mode (e.g. "/b/") bypasses G2P and maps directly to
 * ARPABET symbols.
 *
 * @param text - Normalized text (output of normalizeText())
 * @param options - Optional provenance collector for decision tracking
 * @returns Flat array of TranscriptionToken objects
 */
export function transcribeText(text: string, options: TranscriptionOptions = {}): TranscriptionToken[] {
  const provenance = options.provenance ?? null;
  const cfg = options.transcriptionConfig;
  const effectiveDictLookup = options.dictLookup ?? cmuDictLookup;
  const ltsPath = options.ltsPath;
  const morphologyPath = options.morphologyPath;

  // Resolve effective lookup tables from YAML config, falling back to hardcoded defaults.
  const effectiveSymbols: Record<string, string[]> =
    cfg?.diagnostic_symbols && Object.keys(cfg.diagnostic_symbols).length > 0
      ? cfg.diagnostic_symbols
      : DIAGNOSTIC_SYMBOL_PHONEMES;
  const effectivePunctuation: Set<string> =
    cfg?.punctuation_tokens && cfg.punctuation_tokens.length > 0
      ? new Set(cfg.punctuation_tokens)
      : PUNCTUATION_TOKENS;

  const isEffectivePunctuation = (word: string): boolean => effectivePunctuation.has(word);
  const getEffectiveSymbol = (word: string): string[] | null => {
    const normalized = word.toLowerCase().replace(/^\/+|\/+$/g, "");
    const phones = effectiveSymbols[normalized];
    return Array.isArray(phones) && phones.length > 0 ? [...phones] : null;
  };

  const words = text.split(" ");
  const flatPhonemeList: TranscriptionToken[] = [];
  const hasDirectDictionaryEntry = (token: string): boolean =>
    typeof CMU_DICT_MAP[token.toLowerCase()] === "string";

  // Use effective lookup functions for symbol mode detection
  const nonPunctuation = words.filter((w) => w.length > 0 && !isEffectivePunctuation(w));
  const useSymbolMode =
    nonPunctuation.length > 0 &&
    nonPunctuation.every((w) => getEffectiveSymbol(w) !== null);

  for (let index = 0; index < words.length;) {
    const word = words[index];
    if (!word) {
      index += 1;
      continue; // Skip empty strings resulting from multiple spaces
    }

    if (isEffectivePunctuation(word)) {
      flatPhonemeList.push({
        phoneme: "SIL",
        stress: null,
        isPunctuation: true,
        symbol: word,
        word: word, // Associate punctuation with itself as the 'word'
      });
      index += 1;
    } else {
      let sourceWord = word;
      let consumedWords = 1;

      // Recover CMUdict compounds after normalization splits tokens.
      // Citation anchor: CMUdict orthography includes hyphenated and apostrophe-linked compounds.
      const maxCompoundSpan = 4;
      for (let span = Math.min(maxCompoundSpan, words.length - index); span >= 2; span -= 1) {
        const parts = words.slice(index, index + span);
        if (parts.some((part) => !part || isEffectivePunctuation(part))) continue;
        if (parts.every((part) => hasDirectDictionaryEntry(part))) continue;
        const candidates = [parts.join("-"), parts.join("'")];
        const match = candidates.find((candidate) => hasDirectDictionaryEntry(candidate));
        if (match) {
          sourceWord = match;
          consumedWords = span;
          break;
        }
      }

      const symbolPronunciation = useSymbolMode ? getEffectiveSymbol(sourceWord) : null;
      // Use the multi-layer G2P pipeline: dict -> morphology -> LTS + stress.
      const pronResult: PronunciationResult =
        symbolPronunciation == null
          ? pronounce(sourceWord, effectiveDictLookup, { ltsPath, morphologyPath })
          : {
              phonemes: symbolPronunciation,
              source: "unknown",
              word: sourceWord.toLowerCase(),
            };

      // Select provenance citation based on which layer handled the word
      let decisionType: string;
      let reason: string;
      let citations: string[];
      if (symbolPronunciation != null) {
        decisionType = "symbol_pronunciation_selected";
        reason = `Used diagnostic symbol pronunciation for '${sourceWord}'`;
        citations = [SYMBOL_PRONUNCIATION_CITATION];
      } else if (pronResult.source === 'dictionary') {
        decisionType = "dictionary_pronunciation_selected";
        reason = `Used CMU dictionary pronunciation for '${sourceWord}'`;
        citations = [CMU_DICTIONARY_CITATION];
      } else if (pronResult.source === 'morphology') {
        decisionType = "morphology_pronunciation_selected";
        reason = `Morphological decomposition for '${sourceWord}' (root: ${pronResult.rootWord ?? '?'})`;
        citations = [MORPHOLOGY_PRONUNCIATION_CITATION];
      } else {
        decisionType = "fallback_pronunciation_selected";
        reason = `Word '${sourceWord}' not in dictionary; used Elovitz LTS + Hunnicutt stress`;
        citations = [FALLBACK_PRONUNCIATION_CITATION];
        console.warn(
          `[TTS Frontend] Word "${sourceWord}" not found in dictionary. Using G2P pipeline (${pronResult.source}).`
        );
      }

      const pronunciationDecision = provenance?.add({
        stage: "transcribe",
        type: decisionType,
        subject: `word:${sourceWord}`,
        reason,
        citations,
      });

      if (pronResult.phonemes.length > 0) {
        for (const phoneWithStress of pronResult.phonemes) {
          const match = phoneWithStress.match(/^([A-Z]+)(\d)?$/);
          if (match) {
            flatPhonemeList.push({
              phoneme: match[1],
              stress: match[2] ? parseInt(match[2]) : null,
              word: sourceWord,
              _pronDecisionId: pronunciationDecision?.id,
            });
          } else if (phoneWithStress === "SIL") {
            flatPhonemeList.push({
              phoneme: "SIL",
              stress: null,
              word: sourceWord,
              _pronDecisionId: pronunciationDecision?.id,
            });
          }
        }
      } else {
        console.warn(`[TTS Frontend] Word "${sourceWord}" produced no phonemes. Representing as SIL.`);
        flatPhonemeList.push({
          phoneme: "SIL",
          stress: null,
          duration: 50,
          word: sourceWord,
          _pronDecisionId: pronunciationDecision?.id,
        });
      }
      index += consumedWords;
    }
  }
  return flatPhonemeList; // Return the flat list of phoneme objects
}
