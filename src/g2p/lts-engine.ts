/**
 * Elovitz Letter-to-Sound rule engine.
 *
 * Applies the 329 LTS rules from Elovitz, Johnson, McHugh & Shore (1976),
 * NRL Report 7948, to convert English words to phoneme sequences.
 *
 * Algorithm:
 *   1. Pad input with spaces: " " + WORD + " "
 *   2. Walk through the padded string character by character
 *   3. At each position, look up rules by the current letter
 *   4. For each rule (first match wins):
 *      a. Check if rule.letters matches at the current position
 *      b. Check left context (regex anchored at end of left substring)
 *      c. Check right context (regex anchored at start of right substring)
 *      d. If all match: emit phonemes, advance by rule.letters.length
 *   5. If no rule matches: skip the character
 *   6. Filter prosodic markers; symbol normalization (AX/NX/WH) deferred to normalize rule phase
 *
 * Citation: Elovitz, Johnson, McHugh & Shore (1976). NRL Report 7948.
 */

import { loadYamlDocumentSync } from '../yaml-loader';

// ── Types ──────────────────────────────────────────────────────────────

interface LtsRule {
  left: string;
  letters: string;
  right: string;
  phonemes: string[];
}

interface LtsRulesData {
  context_symbols: Record<string, string>;
  raw_regex?: boolean;
  rules_by_letter: Record<string, LtsRule[]>;
}

export const DEFAULT_LTS_RULES_PATH = "/rules/lts-rules.yaml";

// ── Module-level state (lazy init) ─────────────────────────────────────

const rulesCache = new Map<string, { data: LtsRulesData; contextCache: Map<string, RegExp> }>();

// Legacy aliases for the default path entry (used by compileContextPattern).
let rulesData: LtsRulesData | null = null;
let compiledContextCache: Map<string, RegExp> | null = null;

function loadRules(rulesPath?: string): { data: LtsRulesData; contextCache: Map<string, RegExp> } {
  const effectivePath = rulesPath ?? DEFAULT_LTS_RULES_PATH;
  const cached = rulesCache.get(effectivePath);
  if (cached) return cached;

  const data = loadYamlDocumentSync<LtsRulesData>(effectivePath);
  const contextCache = new Map<string, RegExp>();
  const entry = { data, contextCache };
  rulesCache.set(effectivePath, entry);

  // Keep legacy module-level aliases in sync for the default path.
  if (effectivePath === DEFAULT_LTS_RULES_PATH) {
    rulesData = data;
    compiledContextCache = contextCache;
  }

  return entry;
}

// ── Context pattern compilation ────────────────────────────────────────

/**
 * The context_symbols map from the JSON defines single-character symbols
 * that expand to regex fragments. A context pattern string is processed
 * character by character: if the character is a known symbol, substitute
 * its regex; otherwise treat it as a literal character.
 *
 * Special case: space ' ' is a literal space (word boundary in the
 * padded input).
 */
function compileContextPattern(
  pattern: string,
  anchor: 'left' | 'right',
  symbols: Record<string, string>,
  cache: Map<string, RegExp>,
  rawRegex: boolean = false,
): RegExp {
  const cacheKey = `${anchor}:${rawRegex ? 'R:' : ''}${pattern}`;
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
    regex = '';
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
  const anchored = anchor === 'left' ? `${regex}$` : `^${regex}`;
  const compiled = new RegExp(anchored);
  cache.set(cacheKey, compiled);
  return compiled;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Rule matching ──────────────────────────────────────────────────────

/**
 * Determine which rule category to use for a given character.
 * Letters A-Z use their letter; digits 0-9 use "NUMBER";
 * everything else (space, punctuation) uses "PUNCT".
 */
function getCategoryForChar(ch: string): string {
  if (ch >= 'A' && ch <= 'Z') return ch;
  if (ch >= '0' && ch <= '9') return 'NUMBER';
  return 'PUNCT';
}

/**
 * Apply a single rule at the given position in the (uppercased, padded) input.
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
    const leftRe = compileContextPattern(left, 'left', symbols, cache, rawRegex);
    if (!leftRe.test(leftStr)) return 0;
  }

  // 3. Check right context
  if (right.length > 0) {
    const rightStr = input.substring(pos + letters.length);
    const rightRe = compileContextPattern(right, 'right', symbols, cache, rawRegex);
    if (!rightRe.test(rightStr)) return 0;
  }

  return letters.length;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Apply Elovitz LTS rules to a word and return Qlatt ARPAbet phonemes.
 *
 * @param word - A single English word (no surrounding spaces).
 *               Case-insensitive.
 * @returns Array of Qlatt ARPAbet phoneme strings (no stress digits).
 */
export function applyLtsRules(word: string, rulesPath?: string): string[] {
  if (!word || word.length === 0) return [];

  const loaded = loadRules(rulesPath);
  const { context_symbols, rules_by_letter, raw_regex } = loaded.data;
  const rawRegex = raw_regex === true;

  // Pad with spaces (word boundary markers)
  const input = ' ' + word.toUpperCase() + ' ';
  const elovitzPhonemes: string[] = [];

  let pos = 0;
  while (pos < input.length) {
    const ch = input[pos];
    const category = getCategoryForChar(ch);
    const rules = rules_by_letter[category];

    if (!rules) {
      // No rules for this character — skip
      pos++;
      continue;
    }

    let matched = false;
    for (const rule of rules) {
      const consumed = tryRule(rule, input, pos, context_symbols, loaded.contextCache, rawRegex);
      if (consumed > 0) {
        elovitzPhonemes.push(...rule.phonemes);
        pos += consumed;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No rule matched — skip this character
      pos++;
    }
  }

  // Filter prosodic markers (not real phonemes).
  // Symbol remapping (AX->AH, NX->NG, WH->W) is now handled by
  // the normalize rule phase in public/rules/frontends/qlatt-english/phases/normalize.yaml.
  const PROSODIC_MARKERS = new Set(['< >', '<,>', '<.>', '<?>', '<->']);
  return elovitzPhonemes.filter(p => !PROSODIC_MARKERS.has(p));
}
