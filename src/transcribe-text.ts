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
// Constants
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
  const entry = CMU_DICT_MAP[word.toLowerCase()];
  if (entry) return entry.split(" ");
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
  const words = text.split(" ");
  const flatPhonemeList: TranscriptionToken[] = [];
  const useSymbolMode = shouldUseDiagnosticSymbolMode(words);

  for (const word of words) {
    if (!word) continue; // Skip empty strings resulting from multiple spaces

    if (isPunctuationToken(word)) {
      flatPhonemeList.push({
        phoneme: "SIL",
        stress: null,
        isPunctuation: true,
        symbol: word,
        word: word, // Associate punctuation with itself as the 'word'
      });
    } else {
      const symbolPronunciation = useSymbolMode ? getDiagnosticSymbolPronunciation(word) : null;
      // Use the multi-layer G2P pipeline: dict -> morphology -> LTS + stress.
      const pronResult: PronunciationResult =
        symbolPronunciation == null
          ? pronounce(word, cmuDictLookup)
          : {
              phonemes: symbolPronunciation,
              source: "unknown",
              word: word.toLowerCase(),
            };

      // Select provenance citation based on which layer handled the word
      let decisionType: string;
      let reason: string;
      let citations: string[];
      if (symbolPronunciation != null) {
        decisionType = "symbol_pronunciation_selected";
        reason = `Used diagnostic symbol pronunciation for '${word}'`;
        citations = [SYMBOL_PRONUNCIATION_CITATION];
      } else if (pronResult.source === 'dictionary') {
        decisionType = "dictionary_pronunciation_selected";
        reason = `Used CMU dictionary pronunciation for '${word}'`;
        citations = [CMU_DICTIONARY_CITATION];
      } else if (pronResult.source === 'morphology') {
        decisionType = "morphology_pronunciation_selected";
        reason = `Morphological decomposition for '${word}' (root: ${pronResult.rootWord ?? '?'})`;
        citations = [MORPHOLOGY_PRONUNCIATION_CITATION];
      } else {
        decisionType = "fallback_pronunciation_selected";
        reason = `Word '${word}' not in dictionary; used Elovitz LTS + Hunnicutt stress`;
        citations = [FALLBACK_PRONUNCIATION_CITATION];
        console.warn(
          `[TTS Frontend] Word "${word}" not found in dictionary. Using G2P pipeline (${pronResult.source}).`
        );
      }

      const pronunciationDecision = provenance?.add({
        stage: "transcribe",
        type: decisionType,
        subject: `word:${word}`,
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
              word: word,
              _pronDecisionId: pronunciationDecision?.id,
            });
          } else if (phoneWithStress === "SIL") {
            flatPhonemeList.push({
              phoneme: "SIL",
              stress: null,
              word: word,
              _pronDecisionId: pronunciationDecision?.id,
            });
          }
        }
      } else {
        console.warn(`[TTS Frontend] Word "${word}" produced no phonemes. Representing as SIL.`);
        flatPhonemeList.push({
          phoneme: "SIL",
          stress: null,
          duration: 50,
          word: word,
          _pronDecisionId: pronunciationDecision?.id,
        });
      }
    }
  }
  return flatPhonemeList; // Return the flat list of phoneme objects
}
