import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_BREAK_POLICY_PATH = "/rules/frontends/qlatt-english/policy/break-policy.yaml";

export interface LongPhraseBreakingPolicy {
  enabled: boolean;
  minimum_content_words: number;
  break_index: number;
  placement: "pre_midpoint_content_word_end";
}

export interface PunctuationBreakCategory {
  symbols?: string[];
  break_index: number;
}

export interface PunctuationBreakIndices {
  citations: string[];
  terminal: PunctuationBreakCategory;
  clause: PunctuationBreakCategory;
  word_boundary: PunctuationBreakCategory;
  default: PunctuationBreakCategory;
}

export interface BreakPolicy {
  version: string;
  citations: string[];
  long_phrase_breaking: LongPhraseBreakingPolicy;
  punctuation_break_indices: PunctuationBreakIndices;
}

export interface LongPhraseBreakDecision {
  contentWordCount: number;
  breakTokenIndex: number | null;
  breakIndex: number;
}

let breakPolicyCache: BreakPolicy | null = null;

function expectNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`E_BREAK_POLICY_SCHEMA: '${label}' must be a non-empty string`);
  }
  return value;
}

function expectBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`E_BREAK_POLICY_SCHEMA: '${label}' must be a boolean`);
  }
  return value;
}

function expectFiniteNumber(value: unknown, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`E_BREAK_POLICY_SCHEMA: '${label}' must be a finite number`);
  }
  return Number(value);
}

function expectStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`E_BREAK_POLICY_SCHEMA: '${label}' must be an array`);
  }
  return value.map((entry, index) => expectNonEmptyString(entry, `${label}[${index}]`));
}

function parseBreakPolicyDocument(value: unknown): BreakPolicy {
  if (!isPlainObject(value)) {
    throw new Error("E_BREAK_POLICY_SCHEMA: top-level document must be an object");
  }
  if (!isPlainObject(value.long_phrase_breaking)) {
    throw new Error("E_BREAK_POLICY_SCHEMA: 'long_phrase_breaking' must be an object");
  }

  const longPhraseBreaking = value.long_phrase_breaking;

  // Parse punctuation_break_indices section
  if (!isPlainObject(value.punctuation_break_indices)) {
    throw new Error("E_BREAK_POLICY_SCHEMA: 'punctuation_break_indices' must be an object");
  }
  const pbi = value.punctuation_break_indices;

  function parsePunctuationCategory(
    obj: unknown,
    label: string,
    requireSymbols: boolean,
  ): PunctuationBreakCategory {
    if (!isPlainObject(obj)) {
      throw new Error(`E_BREAK_POLICY_SCHEMA: '${label}' must be an object`);
    }
    const result: PunctuationBreakCategory = {
      break_index: expectFiniteNumber(obj.break_index, `${label}.break_index`),
    };
    if (requireSymbols) {
      result.symbols = expectStringArray(obj.symbols, `${label}.symbols`);
    }
    return result;
  }

  return {
    version: expectNonEmptyString(value.version, "version"),
    citations: expectStringArray(value.citations ?? [], "citations"),
    long_phrase_breaking: {
      enabled: expectBoolean(longPhraseBreaking.enabled, "long_phrase_breaking.enabled"),
      minimum_content_words: expectFiniteNumber(
        longPhraseBreaking.minimum_content_words,
        "long_phrase_breaking.minimum_content_words",
      ),
      break_index: expectFiniteNumber(
        longPhraseBreaking.break_index,
        "long_phrase_breaking.break_index",
      ),
      placement: "pre_midpoint_content_word_end",
    },
    punctuation_break_indices: {
      citations: expectStringArray(pbi.citations ?? [], "punctuation_break_indices.citations"),
      terminal: parsePunctuationCategory(pbi.terminal, "punctuation_break_indices.terminal", true),
      clause: parsePunctuationCategory(pbi.clause, "punctuation_break_indices.clause", true),
      word_boundary: parsePunctuationCategory(pbi.word_boundary, "punctuation_break_indices.word_boundary", false),
      default: parsePunctuationCategory(pbi.default, "punctuation_break_indices.default", false),
    },
  };
}

export function loadBreakPolicySync(specPath: string = DEFAULT_BREAK_POLICY_PATH): BreakPolicy {
  if (specPath === DEFAULT_BREAK_POLICY_PATH && breakPolicyCache) {
    return breakPolicyCache;
  }

  const policy = parseBreakPolicyDocument(loadYamlDocumentSync(specPath));
  if (specPath === DEFAULT_BREAK_POLICY_PATH) {
    breakPolicyCache = policy;
  }
  return policy;
}

/**
 * Resolve a punctuation symbol to its ToBI break index.
 *
 * Looks through the terminal and clause categories for a symbol match,
 * then falls back to the default break index (0).
 *
 * Citation: Silverman et al. 1992 (ToBI break index tier)
 */
export function resolvePunctuationBreakIndex(
  policy: BreakPolicy,
  punctuationSymbol: string | null | undefined,
): number {
  if (punctuationSymbol == null) {
    return policy.punctuation_break_indices.default.break_index;
  }

  const pbi = policy.punctuation_break_indices;

  if (pbi.terminal.symbols?.includes(punctuationSymbol)) {
    return pbi.terminal.break_index;
  }
  if (pbi.clause.symbols?.includes(punctuationSymbol)) {
    return pbi.clause.break_index;
  }

  return pbi.default.break_index;
}

export function resolveLongPhraseBreak(
  policy: BreakPolicy,
  contentWordEnds: number[],
): LongPhraseBreakDecision {
  const contentWordCount = contentWordEnds.length;
  const { enabled, minimum_content_words, break_index } = policy.long_phrase_breaking;

  if (!enabled || contentWordCount < minimum_content_words) {
    return {
      contentWordCount,
      breakTokenIndex: null,
      breakIndex: break_index,
    };
  }

  const midpoint = Math.floor(contentWordCount / 2);
  const breakTokenIndex = contentWordEnds[midpoint - 1] ?? null;
  return {
    contentWordCount,
    breakTokenIndex,
    breakIndex: break_index,
  };
}
