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

import { DEFAULT_CMU_DICTIONARY_PATH, preloadCmuDictionaryFromPath } from "./cmu-dictionary-loader";
import type { HrgSchema } from "./declarative-frontend/hrg";
import { Utterance } from "./declarative-frontend/hrg";
import { runGraphRuleEngine } from "./declarative-frontend/hrg/rule-engine";
import { loadFrontendResources, parseInventorySymbol } from "./declarative-frontend/inventory";
import { type CompiledRulepack, QLATT_ENGLISH_RULEPACK } from "./declarative-frontend/rule-pack";
import type { SourceTranscriptionInput } from "./declarative-frontend/source-recognition";
import { pronounce, pronounceClause } from "./g2p";
import type { DictLookup, PronunciationResult } from "./g2p/types";
import {
  LEXICON_SOURCE_KEYS,
  type LexiconSource,
  type LexiconSourceKey,
  type TranscriptionConfig,
  type TranscriptionOptions,
  type TranscriptionToken,
} from "./tts-frontend-types";

// ---------------------------------------------------------------------------
// Citation constants for provenance tracking
// ---------------------------------------------------------------------------

// The shared English lexicon: what a frontend that declares no
// `transcription.sources` entry for a source uses. There is no shared spelling
// source; a frontend whose lexicon spells letters declares its own.
const SHARED_LEXICON_SOURCES: Partial<Record<LexiconSourceKey, LexiconSource>> = {
  dictionary: { name: "CMU dictionary", citation: "CMU Pronouncing Dictionary" },
  "lts-rules": {
    name: "Elovitz LTS + configured lexical stress",
    citation:
      "G2P pipeline: Elovitz LTS (NRL 7948); Hayes (1982), pp. 237–274 (configured lexical stress)",
  },
  morphology: {
    name: "Morphological decomposition",
    citation:
      "G2P pipeline: morphological decomposition (Hunnicutt 1976; Allen, Hunnicutt & Klatt 1987 Ch.4-5)",
  },
};
const SYMBOL_PRONUNCIATION_CITATION =
  "Diagnostic symbol mode: direct ARPABET symbol-to-phoneme mapping for explicit segment-list utterances";
const LETTER_NAME_PRONUNCIATION_CITATION =
  "Allen et al. 1987 Ch.2-3 (symbol strings pronounced as LETTER-* morphs)";
const NUMBER_PRONUNCIATION_CITATION =
  "DECtalk 4.63 LTS/l_us_pr1.c (ls_proc_do_number, ls_proc_do_4_digits) with the phone lists of LTS/l_us_con.c";

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
  /** False when the frontend turns phoneme-symbol input off. */
  symbolInput: boolean;
  /** False when the frontend's dictionary is searched by the written word only. */
  elidedApostropheLookup: boolean;
  /** What each pronunciation source is, for the decision record of a word. */
  sources: Partial<Record<LexiconSourceKey, LexiconSource>>;
  letterNames: Record<string, string[]>;
  punctuationTokens: Set<string>;
};

// ---------------------------------------------------------------------------
// CMU dictionary (top-level await, loaded once at module init)
// ---------------------------------------------------------------------------

const CMU_DICT_MAP: Record<string, string | undefined> = await preloadCmuDictionaryFromPath(
  DEFAULT_CMU_DICTIONARY_PATH,
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
function makeDictLookup(
  map: Record<string, string | undefined>,
  elidedApostrophe = true,
): DictLookup {
  return (word: string): string[] | null => {
    const lowerWord = word.toLowerCase();
    const candidates: string[] = [lowerWord];

    // Handle elided spellings where the dictionary key keeps leading apostrophe
    // (e.g., "'cuse") but normalized input token may not ("cuse"). A frontend
    // turns this off with `transcription.elided_apostrophe_lookup: false`.
    if (elidedApostrophe && !lowerWord.startsWith("'")) candidates.push(`'${lowerWord}`);
    // Handle converse elision: input may omit or include trailing apostrophe.
    if (elidedApostrophe) {
      if (!lowerWord.endsWith("'")) candidates.push(`${lowerWord}'`);
      if (lowerWord.endsWith("'") && lowerWord.length > 1) candidates.push(lowerWord.slice(0, -1));
    }
    // Normalization strips trailing punctuation tokens; recover abbreviations like "cr.".
    // Not for a frontend that looks words up as written: its text rules keep
    // the period on an abbreviation, and "sat" must not find "sat.".
    if (elidedApostrophe && !lowerWord.endsWith(".")) candidates.push(`${lowerWord}.`);

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
    nonPunctuation.every(
      (word) => getDiagnosticSymbolPronunciationWithTables(word, tables) !== null,
    )
  );
}

function requireStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      `E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.${path} must be a non-empty string array`,
    );
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
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length === 0
  ) {
    throw new Error(
      `E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.${path} must be a non-empty map`,
    );
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

/** The frontend's declared lexicon sources over the shared English ones. */
function requireLexiconSources(
  declared: TranscriptionConfig["sources"],
): Partial<Record<LexiconSourceKey, LexiconSource>> {
  if (declared === undefined) return SHARED_LEXICON_SOURCES;
  if (!declared || typeof declared !== "object" || Array.isArray(declared)) {
    throw new Error("E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.sources must be a map");
  }
  const sources = { ...SHARED_LEXICON_SOURCES };
  for (const [key, value] of Object.entries(declared)) {
    if (!(LEXICON_SOURCE_KEYS as readonly string[]).includes(key)) {
      throw new Error(
        `E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.sources.${key} is not a lexicon source (${LEXICON_SOURCE_KEYS.join(", ")})`,
      );
    }
    const name = (value as LexiconSource | undefined)?.name;
    const citation = (value as LexiconSource | undefined)?.citation;
    if (
      typeof name !== "string" ||
      name.length === 0 ||
      typeof citation !== "string" ||
      citation.length === 0
    ) {
      throw new Error(
        `E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.sources.${key} needs a name and a citation`,
      );
    }
    sources[key as LexiconSourceKey] = { name, citation };
  }
  return sources;
}

function requireTranscriptionTables(
  config: TranscriptionConfig | undefined,
): RequiredTranscriptionTables {
  if (!config || typeof config !== "object") {
    throw new Error("E_TRANSCRIPTION_CONFIG_REQUIRED: transcription config is required");
  }
  const symbolInput = config.diagnostic_symbol_input;
  if (symbolInput !== undefined && typeof symbolInput !== "boolean") {
    throw new Error(
      "E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.diagnostic_symbol_input must be true or false",
    );
  }
  const elidedApostropheLookup = config.elided_apostrophe_lookup;
  if (elidedApostropheLookup !== undefined && typeof elidedApostropheLookup !== "boolean") {
    throw new Error(
      "E_TRANSCRIPTION_CONFIG_REQUIRED: transcription.elided_apostrophe_lookup must be true or false",
    );
  }
  return {
    symbolInput: symbolInput !== false,
    elidedApostropheLookup: elidedApostropheLookup !== false,
    sources: requireLexiconSources(config.sources),
    diagnosticSymbols: requirePronunciationMap(config.diagnostic_symbols, "diagnostic_symbols"),
    letterNames: requirePronunciationMap(config.letter_names, "letter_names"),
    punctuationTokens: new Set(requireStringArray(config.punctuation_tokens, "punctuation_tokens")),
  };
}

function getDefaultTranscriptionTables(): RequiredTranscriptionTables {
  return requireTranscriptionTables(getSpecTranscriptionConfig(QLATT_ENGLISH_RULEPACK));
}

function isPunctuationTokenWithTables(word: string, tables: RequiredTranscriptionTables): boolean {
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
  words: readonly (string | SourceTranscriptionInput)[],
  provenance: TranscriptionOptions["provenance"],
  tables: RequiredTranscriptionTables,
  compiledSpec: CompiledRulepack,
  existingUtterance?: Utterance,
): OrthographyInputToken[] {
  const entries = words.filter(
    (entry) => (typeof entry === "string" ? entry : entry.word).length > 0,
  );
  if (entries.length === 0) return [];
  const utterance = existingUtterance ?? new Utterance(TOKEN_SCHEMA, provenance ?? undefined);
  const beginInput = () =>
    utterance.beginTransaction({
      ruleId: "transcription_tokenize",
      phase: "transcribe",
      tag: "orthography",
      reason: "Tokenized normalized text into canonical Token Items",
      citations: ["Allen et al. 1987 Ch.2-3"],
    });
  const sharedInput = typeof entries[0] === "string" ? beginInput() : null;
  entries.forEach((entry, index) => {
    const input = sharedInput ?? beginInput();
    const word = typeof entry === "string" ? entry : entry.word;
    const punctuation = isPunctuationTokenWithTables(word, tables);
    const token = input.createItem("token", `token_${index.toString()}`);
    if (typeof entry !== "string") {
      input.read(entry.source, "normalizedText");
      input.set(token, "sourceNormalizationId", entry.source.id);
      input.associate("source_normalization", token, entry.source);
    }
    input.set(token, "word", word);
    input.set(token, "tokenType", punctuation ? "punctuation" : "word");
    input.set(token, "punctuationSymbol", punctuation ? word : null);
    input.set(token, "pronunciationKey", null);
    input.set(token, "active", true);
    input.append("Token", token);
    if (!sharedInput) input.commit();
  });
  sharedInput?.commit();
  runGraphRuleEngine(utterance, compiledSpec, { phases: ["orthography"] });

  return utterance
    .relation("Token")
    .listItems()
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
        parentDecisionId:
          token.latestWrite("pronunciationKey")?.decisionId ??
          token.latestWrite("word")?.decisionId,
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
 * @param text - Normalized text or words owned by normalization Items in options.utterance
 * @param options - Optional provenance collector for decision tracking
 * @returns Flat array of TranscriptionToken objects
 */
export function transcribeText(
  text: string | readonly SourceTranscriptionInput[],
  options: TranscriptionOptions = {},
): TranscriptionToken[] {
  const provenance = options.provenance ?? options.utterance?.provenance ?? null;
  // Resolve the backing dictionary map for this call: a per-frontend map (from
  // `dictionary_path`) when supplied, else the global CMU default. Both the
  // lookup and compound-recovery probe must read the SAME map so a frontend's
  // dictionary fully replaces the default (no global-map leak in compound
  // recovery). An explicit `dictLookup` override still wins for the lookup
  // (used e.g. for diagnostic injection in tests).
  const effectiveDictMap = options.dictionaryMap ?? CMU_DICT_MAP;
  const compiledSpec = options.compiledSpec ?? QLATT_ENGLISH_RULEPACK;
  const resources = loadFrontendResources(compiledSpec);
  const ltsPath = options.ltsPath ?? resources.ltsPath;
  const morphologyPath = options.morphologyPath ?? resources.morphologyPath;
  const stressPolicyPath = options.stressPolicyPath ?? resources.stressPolicyPath;
  const cfg = options.transcriptionConfig ?? getSpecTranscriptionConfig(compiledSpec);
  const transcriptionTables = requireTranscriptionTables(cfg);
  const effectiveDictLookup =
    options.dictLookup ??
    (options.dictionaryMap || !transcriptionTables.elidedApostropheLookup
      ? makeDictLookup(effectiveDictMap, transcriptionTables.elidedApostropheLookup)
      : cmuDictLookup);

  // A frontend with its own dictionary or letter-to-sound file says what they
  // are: the shared names would put a source it did not use into the record.
  const sharedResources = loadFrontendResources(QLATT_ENGLISH_RULEPACK);
  const undeclared = [
    ...(resources.dictionaryPath !== sharedResources.dictionaryPath ? ["dictionary"] : []),
    ...(resources.ltsPath !== sharedResources.ltsPath ? ["lts-rules", "morphology"] : []),
  ].filter((key) => options.compiledSpec && cfg?.sources?.[key as LexiconSourceKey] === undefined);
  if (undeclared.length > 0) {
    throw new Error(
      `E_TRANSCRIPTION_CONFIG_REQUIRED: the frontend has its own lexicon files and must declare transcription.sources.${undeclared.join(", transcription.sources.")}`,
    );
  }
  const lexiconSource = (key: LexiconSourceKey): LexiconSource => {
    const used = transcriptionTables.sources[key];
    if (!used) {
      throw new Error(
        `E_TRANSCRIPTION_CONFIG_REQUIRED: a word was pronounced by '${key}' but transcription.sources.${key} is not declared`,
      );
    }
    return used;
  };
  const _isEffectivePunctuation = (word: string): boolean =>
    isPunctuationTokenWithTables(word, transcriptionTables);
  const getEffectiveSymbol = (word: string): string[] | null => {
    return getDiagnosticSymbolPronunciationWithTables(word, transcriptionTables);
  };

  const writtenWords = rewriteOrthographyTokens(
    typeof text === "string" ? text.split(" ") : text,
    provenance,
    transcriptionTables,
    compiledSpec,
    options.utterance,
  );
  // A frontend that searches its dictionary by the written word looks a word
  // up with its apostrophes first and, on a miss, without the ones at its
  // ends ("'em" is the dictionary's word, "'hello'" is "hello"; DECtalk 4.63
  // LTS/ls_task.c:2161 lookup as written, 2244-2325 strip, 2477-2478 lookup
  // again).
  const orthographyWords = transcriptionTables.elidedApostropheLookup
    ? writtenWords
    : writtenWords.map((token) => {
        if (token.isPunctuation || !/^'|'$/.test(token.word)) return token;
        if (effectiveDictLookup(token.word)) return token;
        const stripped = token.word.replace(/^'+|'+$/g, "");
        return stripped.length > 0 ? { ...token, word: stripped } : token;
      });
  const flatPhonemeList: TranscriptionToken[] = [];
  const dictionaryMisses: { word: string; token: string; applied: string }[] = [];
  const emptyPronunciations: { word: string; token: string; applied: string; duration: number }[] =
    [];
  const hasDirectDictionaryEntry = (token: string): boolean =>
    typeof effectiveDictMap[token.toLowerCase()] === "string";

  // Use effective lookup functions for symbol mode detection
  const nonPunctuation = orthographyWords.filter((w) => w.word.length > 0 && !w.isPunctuation);
  const useSymbolMode =
    transcriptionTables.symbolInput &&
    nonPunctuation.length > 0 &&
    nonPunctuation.every((w) => !w.pronunciationKey && getEffectiveSymbol(w.word) !== null);

  // The words between two punctuation marks are pronounced in each other's
  // context (a frontend's lexicon may choose between a word's entries by its
  // neighbours). A word spoken by its letter name or as a symbol takes no
  // part.
  const inClause = new Map<number, PronunciationResult>();
  if (!useSymbolMode) {
    const pronounceRun = (run: readonly number[]): void => {
      const results = pronounceClause(
        run.map((position) => orthographyWords[position].word),
        effectiveDictLookup,
        { ltsPath, morphologyPath, stressPolicyPath },
      );
      run.forEach((position, order) => {
        inClause.set(position, results[order]);
      });
    };
    let run: number[] = [];
    orthographyWords.forEach((token, position) => {
      if (token.isPunctuation) {
        if (run.length > 0) pronounceRun(run);
        run = [];
      } else if (token.word && typeof token.pronunciationKey !== "string") {
        run.push(position);
      }
    });
    if (run.length > 0) pronounceRun(run);
  }

  for (let index = 0; index < orthographyWords.length; ) {
    const inputToken = orthographyWords[index];
    const word = inputToken?.word ?? "";
    if (!word) {
      index += 1;
      continue; // Skip empty strings resulting from multiple spaces
    }

    if (inputToken.isPunctuation) {
      flatPhonemeList.push({
        phoneme: resources.inventory.silence_symbol,
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
      const parentDecisionId = inputToken.parentDecisionId;

      // Recover CMUdict compounds after normalization splits tokens.
      // Citation anchor: CMUdict orthography includes hyphenated and apostrophe-linked compounds.
      const maxCompoundSpan = 4;
      for (
        let span = Math.min(maxCompoundSpan, orthographyWords.length - index);
        span >= 2;
        span -= 1
      ) {
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
          ? (transcriptionTables.letterNames[inputToken.pronunciationKey] ?? null)
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
            ? ((consumedWords === 1 ? inClause.get(index) : undefined) ??
              pronounce(sourceWord, effectiveDictLookup, {
                ltsPath,
                morphologyPath,
                stressPolicyPath,
              }))
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
        // A frontend that declares its spelling source names the letters from
        // it; the shared letter names are the default.
        const declared = cfg?.sources?.spelling;
        reason = declared
          ? `Used ${declared.name} for '${sourceWord}' via ${inputToken.pronunciationKey ?? ""}`
          : `Used letter-name pronunciation for '${sourceWord}' via ${inputToken.pronunciationKey}`;
        citations = [declared ? declared.citation : LETTER_NAME_PRONUNCIATION_CITATION];
      } else if (symbolPronunciation != null) {
        decisionType = "symbol_pronunciation_selected";
        reason = `Used diagnostic symbol pronunciation for '${sourceWord}'`;
        citations = [SYMBOL_PRONUNCIATION_CITATION];
      } else if (pronResult.source === "number") {
        decisionType = "number_pronunciation_selected";
        reason = `Spoke the digits '${sourceWord}' as ${(pronResult.parts ?? []).length.toString()} words from the frontend's number phone lists`;
        citations = [NUMBER_PRONUNCIATION_CITATION];
      } else if (pronResult.source === "dictionary") {
        const used = lexiconSource("dictionary");
        decisionType = "dictionary_pronunciation_selected";
        reason = `Used ${used.name} pronunciation for '${sourceWord}'`;
        citations = [used.citation];
      } else if (pronResult.source === "morphology") {
        const used = lexiconSource("morphology");
        decisionType = "morphology_pronunciation_selected";
        reason = `${used.name} for '${sourceWord}' (root: ${pronResult.rootWord ?? "?"})`;
        citations = [used.citation];
      } else if (pronResult.source === "spelling") {
        const used = lexiconSource("spelling");
        decisionType = "spelling_pronunciation_selected";
        reason = `Word '${sourceWord}' ${pronResult.word.length === 1 ? "is one letter" : "has no vowel"} and is not in the dictionary; used ${used.name}`;
        citations = [used.citation];
      } else if (pronResult.source === "position") {
        const used = lexiconSource("position");
        decisionType = "position_pronunciation_selected";
        reason = `Word '${sourceWord}' is spoken by where it stands; used ${used.name}`;
        citations = [used.citation];
      } else {
        const used = lexiconSource("lts-rules");
        decisionType = "fallback_pronunciation_selected";
        reason = `Word '${sourceWord}' not in dictionary; used ${used.name}`;
        citations = [used.citation];
        dictionaryMisses.push({
          word: sourceWord,
          token: inputToken.tokenId,
          applied: pronResult.source,
        });
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

      let stressDecisionId = pronunciationDecision?.id;
      if ("lexicalStress" in pronResult && pronResult.lexicalStress) {
        const decisionIds = new Map<string, string>();
        for (const step of pronResult.lexicalStress.decisions) {
          const parents = step.parents
            .map((id) => decisionIds.get(id))
            .filter((id): id is string => id !== undefined);
          if (pronunciationDecision) parents.push(pronunciationDecision.id);
          const decision = provenance?.add({
            stage: "transcribe",
            type: step.tag,
            subject: `${inputToken.tokenId}:stress:${step.domain}`,
            reason: `${step.rule}: ${step.reason}; feet=${JSON.stringify(step.feet)}; excluded=${JSON.stringify(step.excludedOwners ?? step.excluded)}`,
            citations: step.citations,
            parents: [...new Set(parents)],
          });
          if (decision) {
            decisionIds.set(step.id, decision.id);
            stressDecisionId = decision.id;
          }
          if (step.tag === "stress_input_fallback")
            options.diagnostics?.info(
              step.reason,
              { token: inputToken.tokenId, rule: step.rule },
              "STRESS_INPUT_ASSUMPTION",
            );
        }
      }

      // A token spoken as several words (a number in digits) gives each word
      // its own identity, so that each becomes a Word: `<token>:<n>` and
      // `<digits>#<n>`. A pause between two of them is a comma's silence.
      const spokenParts: Array<{
        phonemes: readonly string[];
        tokenId: string;
        word: string;
        phraseStart?: "vp" | "pp";
        pauseBefore?: boolean;
        morphemeAfter?: readonly number[];
      }> =
        "parts" in pronResult && pronResult.parts && pronResult.parts.length > 0
          ? pronResult.parts.map((part, partIndex) => ({
              phonemes: part.phonemes,
              tokenId: `${inputToken.tokenId}:${partIndex.toString()}`,
              word: `${sourceWord}#${(partIndex + 1).toString()}`,
              ...(part.phraseStart ? { phraseStart: part.phraseStart } : {}),
              ...(part.pauseBefore ? { pauseBefore: true } : {}),
              ...(part.morphemeAfter ? { morphemeAfter: part.morphemeAfter } : {}),
            }))
          : [
              {
                phonemes: pronResult.phonemes,
                tokenId: inputToken.tokenId,
                word: sourceWord,
                ...("phraseStart" in pronResult && pronResult.phraseStart
                  ? { phraseStart: pronResult.phraseStart }
                  : {}),
              },
            ];
      if (pronResult.phonemes.length > 0) {
        const spokenPhones = spokenParts.flatMap((part) =>
          part.phonemes.map((phoneWithStress, phoneIndex) => ({
            part,
            phoneIndex,
            phoneWithStress,
          })),
        );
        for (const { part, phoneIndex, phoneWithStress } of spokenPhones) {
          if (phoneIndex === 0 && part.pauseBefore) {
            flatPhonemeList.push({
              phoneme: resources.inventory.silence_symbol,
              stress: null,
              sourceTokenId: `${part.tokenId}:pause`,
              continuesWrittenWord: true,
              isPunctuation: true,
              symbol: ",",
              word: ",",
              _pronDecisionId: stressDecisionId,
            });
          }
          const match = parseInventorySymbol(phoneWithStress, resources.inventory);
          if (match) {
            flatPhonemeList.push({
              phoneme: match.phoneme,
              stress: match.stress,
              sourceTokenId: part.tokenId,
              word: part.word,
              // The rules that read a word's classes are the phonetic stage's.
              ...("formClasses" in pronResult && pronResult.formClasses
                ? {
                    formClasses: pronResult.receivedFormClasses ?? pronResult.formClasses,
                    textFormClasses: pronResult.formClasses,
                  }
                : {}),
              ...(part !== spokenParts[0] ? { continuesWrittenWord: true } : {}),
              ...(part.phraseStart ? { phraseStart: part.phraseStart } : {}),
              ...(part.morphemeAfter?.includes(phoneIndex) ? { morphemeBoundaryAfter: true } : {}),
              // Indices of a one-word result are indices into its phones.
              ...(spokenParts.length === 1 &&
              "rulesBlockedAt" in pronResult &&
              pronResult.rulesBlockedAt?.includes(phoneIndex)
                ? { rulesBlocked: true }
                : {}),
              ...(spokenParts.length === 1 &&
              "boundaryAfterAt" in pronResult &&
              pronResult.boundaryAfterAt?.includes(phoneIndex)
                ? { morphemeBoundaryAfter: true }
                : {}),
              _pronDecisionId: stressDecisionId,
            });
          } else {
            options.diagnostics?.warn(
              "Pronunciation symbol rejected by inventory grammar",
              { symbol: phoneWithStress, token: inputToken.tokenId },
              "PHONEME_SYMBOL_REJECTED",
            );
            provenance?.add({
              stage: "transcribe",
              type: "phoneme_symbol_rejected",
              subject: inputToken.tokenId,
              reason: `Rejected '${phoneWithStress}' against inventory symbol_grammar '${resources.inventory.symbol_grammar}'`,
              citations: [resources.inventoryPath],
              parents: stressDecisionId ? [stressDecisionId] : [],
            });
          }
        }
      } else {
        emptyPronunciations.push({
          word: sourceWord,
          token: inputToken.tokenId,
          applied: resources.inventory.silence_symbol,
          duration: 50,
        });
        flatPhonemeList.push({
          phoneme: resources.inventory.silence_symbol,
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
  if (dictionaryMisses.length)
    options.diagnostics?.info(
      "Dictionary misses handled by the configured G2P pipeline",
      { count: dictionaryMisses.length, affected: dictionaryMisses },
      "G2P_DICTIONARY_FALLBACK",
    );
  if (emptyPronunciations.length)
    options.diagnostics?.warn(
      "Empty pronunciations represented as silence",
      { count: emptyPronunciations.length, affected: emptyPronunciations },
      "EMPTY_PRONUNCIATION_SILENCE",
    );
  return flatPhonemeList; // Return the flat list of phoneme objects
}
