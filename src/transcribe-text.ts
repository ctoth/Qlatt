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
import { QLATT_ENGLISH_RULEPACK, type CompiledRulepack } from "./declarative-frontend/rule-pack";
import { runGraphRuleEngine } from "./declarative-frontend/hrg/rule-engine";
import { Utterance } from "./declarative-frontend/hrg";
import type { HrgSchema } from "./declarative-frontend/hrg";
import { pronounce } from "./g2p";
import type { DictLookup, PronunciationResult } from "./g2p/types";
import type { TranscriptionConfig, TranscriptionToken, TranscriptionOptions } from "./tts-frontend-types";

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

const TOKEN_SCHEMA = {
  itemTypes: {
    token: {
      features: {
        word: { kind: "string" },
        tokenType: { kind: "string", values: ["word", "punctuation"] },
        punctuationSymbol: {
          kind: "union",
          variants: [{ kind: "string" }, { kind: "null" }],
        },
        pronunciationKey: {
          kind: "union",
          variants: [{ kind: "string" }, { kind: "null" }],
        },
        active: { kind: "boolean" },
      },
    },
  },
  relations: { Token: { kind: "list", itemTypes: ["token"] } },
} as const satisfies HrgSchema;

type OrthographyInputToken = {
  tokenId: string;
  word: string;
  isPunctuation: boolean;
  symbol?: string;
  pronunciationKey?: string;
  parentDecisionId?: string;
};

type RequiredTranscriptionTables = {
  diagnosticSymbols: Record<string, string[]>;
  letterNames: Record<string, string[]>;
  punctuationTokens: Set<string>;
};

// ---------------------------------------------------------------------------
// CMU dictionary (top-level await, loaded once at module init)
// ---------------------------------------------------------------------------

const CMU_DICT_MAP: Record<string, string | undefined> = await preloadCmuDictionaryFromPath(
  DEFAULT_CMU_DICTIONARY_PATH
);

/**
 * Build a dictionary lookup adapter over a flat word -> "ARPABET ..." map.
 *
 * Generic: the same elision/apostrophe/trailing-`.`/alternate-pronunciation
 * candidate logic applies to ANY dictionary map (the global CMU default or a
 * per-frontend dictionary loaded from `dictionary_path`). No per-frontend
 * branches — only the backing map differs.
 *
 * Also handles alternate pronunciation entries like "read(1)".
 */
function makeDictLookup(map: Record<string, string | undefined>): DictLookup {
  return (word: string): string[] | null => {
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
      const entry = map[candidate];
      if (entry) return entry.split(" ");
    }

    // Handle alternate pronunciations like "read(1)" -> "read"
    if (word.includes("(")) {
      const base = map[word.replace(/\(\d+\)$/, "")];
      if (base) return base.split(" ");
    }
    return null;
  };
}

/**
 * Adapter over the global CMU map. Used by frontends that declare no
 * per-frontend `dictionary_path`.
 */
const cmuDictLookup: DictLookup = makeDictLookup(CMU_DICT_MAP);

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function isPunctuationToken(word: string): boolean {
  return isPunctuationTokenWithTables(word, getDefaultTranscriptionTables());
}

export function getDiagnosticSymbolPronunciation(word: string): string[] | null {
  return getDiagnosticSymbolPronunciationWithTables(word, getDefaultTranscriptionTables());
}

export function shouldUseDiagnosticSymbolMode(words: string[]): boolean {
  const tables = getDefaultTranscriptionTables();
  const nonPunctuation = words.filter(
    (word) => word.length > 0 && !isPunctuationTokenWithTables(word, tables),
  );
  return (
    nonPunctuation.length > 0 &&
    nonPunctuation.every((word) => getDiagnosticSymbolPronunciationWithTables(word, tables) !== null)
  );
}

function requireStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.${path} must be a non-empty string array`);
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.length === 0) {
      throw new Error(
        `E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.${path}[${index}] must be a non-empty string`,
      );
    }
    return entry;
  });
}

function requirePronunciationMap(value: unknown, path: string): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length === 0) {
    throw new Error(`E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.${path} must be a non-empty map`);
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      requireStringArray(entry, `${path}.${key}`),
    ]),
  );
}

function getSpecTranscriptionConfig(specSource: unknown): TranscriptionConfig | undefined {
  return (specSource as { transcription?: TranscriptionConfig })?.transcription;
}

function requireTranscriptionTables(config: TranscriptionConfig | undefined): RequiredTranscriptionTables {
  if (!config || typeof config !== "object") {
    throw new Error("E_TRANSCRIPTION_CONFIG_REQUIRED: transcription config is required");
  }
  return {
    diagnosticSymbols: requirePronunciationMap(config.diagnostic_symbols, "diagnostic_symbols"),
    letterNames: requirePronunciationMap(config.letter_names, "letter_names"),
    punctuationTokens: new Set(requireStringArray(config.punctuation_tokens, "punctuation_tokens")),
  };
}

function getDefaultTranscriptionTables(): RequiredTranscriptionTables {
  return requireTranscriptionTables(getSpecTranscriptionConfig(QLATT_ENGLISH_RULEPACK));
}

function isPunctuationTokenWithTables(
  word: string,
  tables: RequiredTranscriptionTables,
): boolean {
  return tables.punctuationTokens.has(word);
}

function getDiagnosticSymbolPronunciationWithTables(
  word: string,
  tables: RequiredTranscriptionTables,
): string[] | null {
  const normalized = word.toLowerCase().replace(/^\/+|\/+$/g, "");
  const phones = tables.diagnosticSymbols[normalized];
  return Array.isArray(phones) && phones.length > 0 ? [...phones] : null;
}

function rewriteOrthographyTokens(
  words: string[],
  provenance: TranscriptionOptions["provenance"],
  tables: RequiredTranscriptionTables,
  compiledSpec: CompiledRulepack,
  existingUtterance?: Utterance,
): OrthographyInputToken[] {
  const entries = words.filter((word) => word.length > 0);
  if (entries.length === 0) return [];
  const utterance = existingUtterance ?? new Utterance(TOKEN_SCHEMA, provenance ?? undefined);
  const input = utterance.beginTransaction({
    ruleId: "transcription_tokenize",
    phase: "transcribe",
    tag: "orthography",
    reason: "Tokenized normalized text into canonical Token Items",
    citations: ["Allen et al. 1987 Ch.2-3"],
  });
  entries.forEach((word, index) => {
    const punctuation = isPunctuationTokenWithTables(word, tables);
    const token = input.createItem("token", `token_${index.toString()}`);
    input.set(token, "word", word);
    input.set(token, "tokenType", punctuation ? "punctuation" : "word");
    input.set(token, "punctuationSymbol", punctuation ? word : null);
    input.set(token, "pronunciationKey", null);
    input.set(token, "active", true);
    input.append("Token", token);
  });
  input.commit();
  runGraphRuleEngine(utterance, compiledSpec, { phases: ["orthography"] });

  return utterance.relation("Token").listItems()
    .filter((token) => token.get("active") !== false)
    .map((token) => {
      const word = token.get("word");
      const tokenType = token.get("tokenType");
      const punctuationSymbol = token.get("punctuationSymbol");
      const pronunciationKey = token.get("pronunciationKey");
      if (typeof word !== "string" || (tokenType !== "word" && tokenType !== "punctuation")) {
        throw new Error(`E_TRANSCRIPTION_TOKEN_REQUIRED: Token '${token.id}' is incomplete`);
      }
      return {
        tokenId: token.id,
        word,
        isPunctuation: tokenType === "punctuation",
        ...(typeof punctuationSymbol === "string" ? { symbol: punctuationSymbol } : {}),
        ...(typeof pronunciationKey === "string" && pronunciationKey.length > 0
          ? { pronunciationKey }
          : {}),
        parentDecisionId: token.latestWrite("pronunciationKey")?.decisionId
          ?? token.latestWrite("word")?.decisionId,
      };
    });
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
  // Resolve the backing dictionary map for this call: a per-frontend map (from
  // `dictionary_path`) when supplied, else the global CMU default. Both the
  // lookup and compound-recovery probe must read the SAME map so a frontend's
  // dictionary fully replaces the default (no global-map leak in compound
  // recovery). An explicit `dictLookup` override still wins for the lookup
  // (used e.g. for diagnostic injection in tests).
  const effectiveDictMap = options.dictionaryMap ?? CMU_DICT_MAP;
  const effectiveDictLookup =
    options.dictLookup ??
    (options.dictionaryMap ? makeDictLookup(options.dictionaryMap) : cmuDictLookup);
  const ltsPath = options.ltsPath;
  const morphologyPath = options.morphologyPath;
  const compiledSpec = options.compiledSpec ?? QLATT_ENGLISH_RULEPACK;
  const cfg = options.transcriptionConfig ?? getSpecTranscriptionConfig(compiledSpec);
  const transcriptionTables = requireTranscriptionTables(cfg);

  const isEffectivePunctuation = (word: string): boolean =>
    isPunctuationTokenWithTables(word, transcriptionTables);
  const getEffectiveSymbol = (word: string): string[] | null => {
    return getDiagnosticSymbolPronunciationWithTables(word, transcriptionTables);
  };

  const orthographyWords = rewriteOrthographyTokens(
    text.split(" "),
    provenance,
    transcriptionTables,
    compiledSpec,
    options.utterance,
  );
  const flatPhonemeList: TranscriptionToken[] = [];
  const hasDirectDictionaryEntry = (token: string): boolean =>
    typeof effectiveDictMap[token.toLowerCase()] === "string";

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
        sourceTokenId: inputToken.tokenId,
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
          ? transcriptionTables.letterNames[inputToken.pronunciationKey] ?? null
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
              sourceTokenId: inputToken.tokenId,
              word: sourceWord,
              _pronDecisionId: pronunciationDecision?.id,
            });
          } else if (phoneWithStress === "SIL") {
            flatPhonemeList.push({
              phoneme: "SIL",
              stress: null,
              sourceTokenId: inputToken.tokenId,
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
          sourceTokenId: inputToken.tokenId,
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
