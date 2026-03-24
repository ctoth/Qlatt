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
import { QLATT_ENGLISH_RULEPACK } from "./declarative-frontend/rule-pack";
import { pronounce } from "./g2p";
import type { DictLookup, PronunciationResult } from "./g2p/types";
import { runPhasesWithProvenance } from "./tts-frontend-provenance";
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
const LETTER_NAME_PRONUNCIATION_CITATION =
  "Allen et al. 1987 Ch.2-3 (symbol strings pronounced as LETTER-* morphs)";

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

export const LETTER_NAME_PHONEMES: Record<string, string[]> = {
  LETTER_A: ["EY1"],
  LETTER_B: ["B", "IY1"],
  LETTER_C: ["S", "IY1"],
  LETTER_D: ["D", "IY1"],
  LETTER_E: ["IY1"],
  LETTER_F: ["EH1", "F"],
  LETTER_G: ["JH", "IY1"],
  LETTER_H: ["EY1", "CH"],
  LETTER_I: ["AY1"],
  LETTER_J: ["JH", "EY1"],
  LETTER_K: ["K", "EY1"],
  LETTER_L: ["EH1", "L"],
  LETTER_M: ["EH1", "M"],
  LETTER_N: ["EH1", "N"],
  LETTER_O: ["OW1"],
  LETTER_P: ["P", "IY1"],
  LETTER_Q: ["K", "Y", "UW1"],
  LETTER_R: ["AA1", "R"],
  LETTER_S: ["EH1", "S"],
  LETTER_T: ["T", "IY1"],
  LETTER_U: ["Y", "UW1"],
  LETTER_V: ["V", "IY1"],
  LETTER_W: ["D", "AH1", "B", "AH0", "L", "Y", "UW0"],
  LETTER_X: ["EH1", "K", "S"],
  LETTER_Y: ["W", "AY1"],
  LETTER_Z: ["Z", "IY1"],
};

type OrderMark =
  | { kind: "START" }
  | { kind: "END" }
  | { kind: "FINITE"; rank: string };

type OrthographyToken = {
  id: string;
  stream: "orthography";
  word: string;
  tokenType: "word" | "punctuation";
  punctuationSymbol?: string | null;
  pronunciationKey?: string | null;
  sync_left: OrderMark;
  sync_right: OrderMark;
  status: 1;
};

type OrthographyInputToken = {
  word: string;
  isPunctuation: boolean;
  symbol?: string;
  pronunciationKey?: string;
  parentDecisionId?: string;
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

function finiteOrder(rank: number): OrderMark {
  return { kind: "FINITE", rank: rank.toString(36).padStart(12, "0") };
}

function buildOrthographyTokens(words: string[]): OrthographyToken[] {
  return words
    .filter((word) => word.length > 0)
    .map((word, index, entries) => ({
      id: `orth_${index}`,
      stream: "orthography" as const,
      word,
      tokenType: isPunctuationToken(word) ? "punctuation" : "word",
      punctuationSymbol: isPunctuationToken(word) ? word : null,
      pronunciationKey: null,
      sync_left: index === 0 ? { kind: "START" as const } : finiteOrder(index - 1),
      sync_right: index === entries.length - 1 ? { kind: "END" as const } : finiteOrder(index),
      status: 1 as const,
    }));
}

function rewriteOrthographyTokens(
  words: string[],
  provenance: TranscriptionOptions["provenance"],
  specSource?: unknown,
): OrthographyInputToken[] {
  const orthographyTokens = buildOrthographyTokens(words);
  if (orthographyTokens.length === 0) return [];

  const tokenDecisionIds = new Map<string, string>();
  const rewritten = runPhasesWithProvenance(
    orthographyTokens,
    ["orthography"],
    () => ({}),
    provenance ?? null,
    tokenDecisionIds,
    undefined,
    specSource ?? QLATT_ENGLISH_RULEPACK,
  );

  return rewritten
    .filter(
      (token): token is OrthographyToken =>
        token?.stream === "orthography" && token?.status === 1,
    )
    .map((token) => ({
      word: token.word,
      isPunctuation: token.tokenType === "punctuation",
      symbol: token.punctuationSymbol ?? undefined,
      pronunciationKey:
        typeof token.pronunciationKey === "string" && token.pronunciationKey.length > 0
          ? token.pronunciationKey
          : undefined,
      parentDecisionId: tokenDecisionIds.get(token.id),
    }));
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
  const specSource = options.specSource ?? QLATT_ENGLISH_RULEPACK;

  // Resolve effective lookup tables from YAML config, falling back to hardcoded defaults.
  const effectiveSymbols: Record<string, string[]> =
    cfg?.diagnostic_symbols && Object.keys(cfg.diagnostic_symbols).length > 0
      ? cfg.diagnostic_symbols
      : DIAGNOSTIC_SYMBOL_PHONEMES;
  const effectiveLetterNames: Record<string, string[]> =
    cfg?.letter_names && Object.keys(cfg.letter_names).length > 0
      ? cfg.letter_names
      : LETTER_NAME_PHONEMES;
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

  const orthographyWords = rewriteOrthographyTokens(text.split(" "), provenance, specSource);
  const flatPhonemeList: TranscriptionToken[] = [];
  const hasDirectDictionaryEntry = (token: string): boolean =>
    typeof CMU_DICT_MAP[token.toLowerCase()] === "string";

  // Use effective lookup functions for symbol mode detection
  const nonPunctuation = orthographyWords.filter((w) => w.word.length > 0 && !w.isPunctuation);
  const useSymbolMode =
    nonPunctuation.length > 0 &&
    nonPunctuation.every((w) => !w.pronunciationKey && getEffectiveSymbol(w.word) !== null);

  for (let index = 0; index < orthographyWords.length;) {
    const inputToken = orthographyWords[index];
    const word = inputToken?.word ?? "";
    if (!word) {
      index += 1;
      continue; // Skip empty strings resulting from multiple spaces
    }

    if (inputToken.isPunctuation) {
      flatPhonemeList.push({
        phoneme: "SIL",
        stress: null,
        isPunctuation: true,
        symbol: inputToken.symbol ?? word,
        word: word, // Associate punctuation with itself as the 'word'
      });
      index += 1;
    } else {
      let sourceWord = word;
      let consumedWords = 1;
      let parentDecisionId = inputToken.parentDecisionId;

      // Recover CMUdict compounds after normalization splits tokens.
      // Citation anchor: CMUdict orthography includes hyphenated and apostrophe-linked compounds.
      const maxCompoundSpan = 4;
      for (let span = Math.min(maxCompoundSpan, orthographyWords.length - index); span >= 2; span -= 1) {
        const parts = orthographyWords.slice(index, index + span);
        if (
          parts.some(
            (part) => !part.word || part.isPunctuation || typeof part.pronunciationKey === "string",
          )
        ) {
          continue;
        }
        const partWords = parts.map((part) => part.word);
        if (partWords.every((part) => hasDirectDictionaryEntry(part))) continue;
        const candidates = [partWords.join("-"), partWords.join("'")];
        const match = candidates.find((candidate) => hasDirectDictionaryEntry(candidate));
        if (match) {
          sourceWord = match;
          consumedWords = span;
          break;
        }
      }

      const letterPronunciation =
        typeof inputToken.pronunciationKey === "string"
          ? effectiveLetterNames[inputToken.pronunciationKey] ?? null
          : null;
      const symbolPronunciation =
        letterPronunciation == null && useSymbolMode ? getEffectiveSymbol(sourceWord) : null;
      // Use the multi-layer G2P pipeline: dict -> morphology -> LTS + stress.
      const pronResult:
        | PronunciationResult
        | { phonemes: string[]; source: "letter-name"; word: string } =
        letterPronunciation != null
          ? {
              phonemes: [...letterPronunciation],
              source: "letter-name",
              word: sourceWord.toLowerCase(),
            }
          : symbolPronunciation == null
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
      if (letterPronunciation != null) {
        decisionType = "letter_name_pronunciation_selected";
        reason = `Used letter-name pronunciation for '${sourceWord}' via ${inputToken.pronunciationKey}`;
        citations = [LETTER_NAME_PRONUNCIATION_CITATION];
      } else if (symbolPronunciation != null) {
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
        parents:
          typeof parentDecisionId === "string" && parentDecisionId.length > 0
            ? [parentDecisionId]
            : undefined,
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
