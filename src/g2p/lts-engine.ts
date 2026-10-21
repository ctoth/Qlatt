/**
 * Elovitz Letter-to-Sound rule engine.
 *
 * Applies the 329 LTS rules from Elovitz, Johnson, McHugh & Shore (1976),
 * NRL Report 7948, to convert English words to phoneme sequences.
 *
 * Algorithm:
 *   1. Apply the resource's case mode and generated boundary markers
 *   2. Walk through the padded string character by character
 *   3. At each position, look up rules by the current letter
 *   4. For each rule (first match wins):
 *      a. Check if rule.letters matches at the current position
 *      b. Check left context (regex anchored at end of left substring)
 *      c. Check right context (regex anchored at start of right substring)
 *      d. If all match: emit phonemes, advance by rule.letters.length
 *   5. If no rule matches: skip the scalar and summarize dropped original input
 *   6. Filter prosodic markers; symbol normalization (AX/NX/WH) deferred to normalize rule phase
 *
 * Citation: Elovitz, Johnson, McHugh & Shore (1976). NRL Report 7948.
 */

import type { Diagnostics } from "../diagnostics";
import { isPlainObject } from "../yaml-loader";

// ── Types ──────────────────────────────────────────────────────────────

interface LtsRule {
  left: string;
  letters: string;
  right: string;
  phonemes: string[];
}

export interface LtsRulesData {
  input_policy: {
    case_mode: "upper" | "lower" | "preserve";
    boundary_marker: string;
    categories: Record<string, string>;
    fallback: string | null;
    filtered_markers: string[];
    citations: string[];
  };
  context_symbols: Record<string, string>;
  raw_regex?: boolean;
  rules_by_letter: Record<string, LtsRule[]>;
}

// ── Module-level state (lazy init) ─────────────────────────────────────

const rulesCache = new Map<
  LtsRulesData,
  { contexts: Map<string, RegExp>; categories: Map<string, string>; markers: Set<string> }
>();

/** Validate and prepare the selected YAML document without changing its identity. */
export function parseLtsRulesData(value: unknown): LtsRulesData {
  if (rulesCache.has(value as LtsRulesData)) return value as LtsRulesData;
  function fail(field: string): never {
    throw new Error(`E_LTS_POLICY: invalid ${field}`);
  }
  const strings = (entry: unknown): entry is string[] =>
    Array.isArray(entry) && entry.every((text) => typeof text === "string" && text.trim());
  if (!isPlainObject(value) || !isPlainObject(value.input_policy)) fail("input_policy");
  const policy = value.input_policy;
  if (!["upper", "lower", "preserve"].includes(policy.case_mode as string)) fail("case_mode");
  if (typeof policy.boundary_marker !== "string" || [...policy.boundary_marker].length !== 1)
    fail("boundary_marker");
  if (!isPlainObject(policy.categories)) fail("categories");
  if (policy.fallback !== null && (typeof policy.fallback !== "string" || !policy.fallback.trim()))
    fail("fallback");
  if (!strings(policy.filtered_markers)) fail("filtered_markers");
  if (!strings(policy.citations) || policy.citations.length === 0) fail("citations");
  const categories = new Map<string, string>();
  for (const [name, members] of Object.entries(policy.categories)) {
    if (!name.trim() || typeof members !== "string" || !members) fail("categories");
    for (const character of members) {
      if (categories.has(character)) fail(`overlapping categories for '${character}'`);
      categories.set(character, name);
    }
  }
  if (!isPlainObject(value.context_symbols) || !isPlainObject(value.rules_by_letter)) fail("rules");
  if (Object.values(value.context_symbols).some((entry) => typeof entry !== "string"))
    fail("context_symbols");
  if (value.raw_regex !== undefined && typeof value.raw_regex !== "boolean") fail("raw_regex");
  for (const [key, rules] of Object.entries(value.rules_by_letter)) {
    if (!key || !Array.isArray(rules)) fail("rules_by_letter");
    for (const rule of rules) {
      if (
        !isPlainObject(rule) ||
        typeof rule.left !== "string" ||
        typeof rule.right !== "string" ||
        typeof rule.letters !== "string" ||
        !rule.letters ||
        !strings(rule.phonemes)
      ) {
        fail(`rule in '${key}'`);
      }
    }
  }
  const data = value as unknown as LtsRulesData;
  rulesCache.set(data, {
    contexts: new Map(),
    categories,
    markers: new Set(data.input_policy.filtered_markers),
  });
  return data;
}

// ── Context pattern compilation ────────────────────────────────────────

/**
 * The resource's context_symbols map defines single-character symbols
 * that expand to regex fragments. A context pattern string is processed
 * character by character: if the character is a known symbol, substitute
 * its regex; otherwise treat it as a literal character.
 *
 * Characters absent from that map remain literal, including the configured boundary.
 */
function compileContextPattern(
  pattern: string,
  anchor: "left" | "right",
  symbols: Record<string, string>,
  cache: Map<string, RegExp>,
  rawRegex: boolean = false,
): RegExp {
  const cacheKey = `${anchor}:${rawRegex ? "R:" : ""}${pattern}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  let regex: string;
  if (rawRegex) {
    // Raw regex mode: expand context_symbols by string replacement,
    // but leave all other characters (including regex metacharacters) as-is.
    regex = pattern;
    for (const [sym, expansion] of Object.entries(symbols)) {
      regex = regex.split(sym).join(expansion);
    }
  } else {
    // Classic mode: process character-by-character, escaping non-symbol chars.
    regex = "";
    for (const ch of pattern) {
      if (ch in symbols) {
        regex += symbols[ch];
      } else {
        // Literal character — escape regex metacharacters
        regex += escapeRegex(ch);
      }
    }
  }

  // Left context: pattern must match at the END of the left substring
  // Right context: pattern must match at the START of the right substring
  const anchored = anchor === "left" ? `${regex}$` : `^${regex}`;
  const compiled = new RegExp(anchored);
  cache.set(cacheKey, compiled);
  return compiled;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Rule matching ──────────────────────────────────────────────────────

/**
 * Apply a single rule at the given UTF-16 position in transformed, padded input.
 * Returns the number of characters consumed, or 0 if the rule does not match.
 */
function tryRule(
  rule: LtsRule,
  input: string,
  pos: number,
  symbols: Record<string, string>,
  cache: Map<string, RegExp>,
  rawRegex: boolean = false,
): number {
  const { left, letters, right } = rule;

  // 1. Check if rule.letters matches at the current position
  if (input.substring(pos, pos + letters.length) !== letters) {
    return 0;
  }

  // 2. Check left context
  if (left.length > 0) {
    const leftStr = input.substring(0, pos);
    const leftRe = compileContextPattern(left, "left", symbols, cache, rawRegex);
    if (!leftRe.test(leftStr)) return 0;
  }

  // 3. Check right context
  if (right.length > 0) {
    const rightStr = input.substring(pos + letters.length);
    const rightRe = compileContextPattern(right, "right", symbols, cache, rawRegex);
    if (!rightRe.test(rightStr)) return 0;
  }

  return letters.length;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Apply Elovitz LTS rules to a word and return Qlatt ARPAbet phonemes.
 *
 * @param word - The original word presented to this engine, before its case conversion.
 * @returns Array of Qlatt ARPAbet phoneme strings (no stress digits).
 */
export function applyLtsRules(
  word: string,
  data: LtsRulesData,
  options: { diagnostics?: Diagnostics | null; frontendId?: string; resource?: string } = {},
): string[] {
  parseLtsRulesData(data);
  if (!word || word.length === 0) return [];
  const { contexts, categories, markers } = rulesCache.get(data)!;
  const policy = data.input_policy;
  const { context_symbols, rules_by_letter, raw_regex } = data;
  const rawRegex = raw_regex === true;

  // Engineering convention: locale-independent case conversion per Unicode scalar.
  // Each resulting UTF-16 unit retains its original scalar and UTF-16 offset.
  const origins: ({ character: string; position: number } | undefined)[] =
    Array(policy.boundary_marker.length).fill(undefined);
  let input = policy.boundary_marker;
  let position = 0;
  for (const character of word) {
    const transformed =
      policy.case_mode === "upper"
        ? character.toUpperCase()
        : policy.case_mode === "lower"
          ? character.toLowerCase()
          : character;
    input += transformed;
    origins.push(...Array(transformed.length).fill({ character, position }));
    position += character.length;
  }
  input += policy.boundary_marker;
  const dropped = new Map<number, { character: string; position: number; reason: string }>();
  const elovitzPhonemes: string[] = [];

  let pos = 0;
  while (pos < input.length) {
    const ch = String.fromCodePoint(input.codePointAt(pos)!);
    const category = Object.hasOwn(rules_by_letter, ch) ? ch : (categories.get(ch) ?? policy.fallback);
    const rules =
      category !== null && Object.hasOwn(rules_by_letter, category)
        ? rules_by_letter[category]
        : undefined;

    let matched = false;
    for (const rule of rules ?? []) {
      const consumed = tryRule(rule, input, pos, context_symbols, contexts, rawRegex);
      if (consumed > 0) {
        elovitzPhonemes.push(...rule.phonemes);
        pos += consumed;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const origin = origins[pos];
      if (origin) {
        dropped.set(origin.position, {
          ...origin,
          reason: rules ? "no-match" : "no-rule-category",
        });
      }
      pos += ch.length;
    }
  }

  // Filter prosodic markers (not real phonemes).
  // Symbol remapping (AX->AH, NX->NG, WH->W) is now handled by
  // the selected frontend's normalize rule phase.
  if (dropped.size) {
    options.diagnostics?.warn(
      "LTS input characters had no matching pronunciation rule",
      {
        word,
        frontend: options.frontendId,
        resource: options.resource,
        positionUnit: "UTF-16",
        affected: [...dropped.values()],
        citations: policy.citations,
      },
      "LTS_UNMATCHED_INPUT",
    );
  }
  return elovitzPhonemes.filter((p) => !markers.has(p));
}
