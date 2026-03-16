import { isPlainObject, loadYamlDocumentSync } from "./yaml-loader";

export const DEFAULT_BREAK_POLICY_PATH = "/rules/phases/break-policy.yaml";

export interface LongPhraseBreakingPolicy {
  enabled: boolean;
  minimum_content_words: number;
  break_index: number;
  placement: "pre_midpoint_content_word_end";
}

export interface BreakPolicy {
  version: string;
  citations: string[];
  long_phrase_breaking: LongPhraseBreakingPolicy;
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
  const placement = expectNonEmptyString(
    longPhraseBreaking.placement,
    "long_phrase_breaking.placement",
  );
  if (placement !== "pre_midpoint_content_word_end") {
    throw new Error(`E_BREAK_POLICY_SCHEMA: unsupported placement '${placement}'`);
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
