import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../declarative-frontend/cel-expressions";
import { expandCelMacros, parseCelMacroBlock } from "../declarative-frontend/cel-macros";
import { isPlainObject, loadYamlDocumentSync } from "../yaml-loader";
import type { LexicalCategory } from "./lexical-stress-types";
import { loadPhonotacticsSync } from "./syllabify";

export const STRESS_OPERATIONS = [
  "consonant_extrametricality",
  "long_vowel_stressing",
  "rhyme_extrametricality",
  "english_stress_rule",
  "strong_retraction",
  "prestress_destressing",
  "sonorant_destressing",
  "arab_destressing",
  "poststress_destressing",
  "late_extrametricality",
] as const;
export type StressOperation = (typeof STRESS_OPERATIONS)[number];
export interface StressRule {
  id: string;
  operation: StressOperation;
  when: string;
  citations: string[];
  tag: string;
}
export interface StressPolicy {
  id: string;
  phonotacticsPath: string;
  longVowels: string[];
  shortFinalVowels: string[];
  sonorants: string[];
  defaultCategory: Exclude<LexicalCategory, "unknown">;
  assumptionCitation: string;
  cycle: StressRule[];
  word: StressRule[];
}
const variables = [
  "longVowel",
  "codaCount",
  "category",
  "adjectivalSuffix",
  "index",
  "count",
  "singleton",
  "open",
  "sonorantCoda",
  "initial",
  "precededBySingleton",
  "verbalSuffix",
];
function invalid(message: string): never {
  throw new Error(`E_STRESS_POLICY: ${message}`);
}
function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) {
    return invalid(`${label} must be an array of nonempty strings`);
  }
  return value;
}
/** Reuses #47 macro expansion and CEL validation; there is no stress expression interpreter. */
export function parseStressPolicy(raw: unknown): StressPolicy {
  if (!isPlainObject(raw)) return invalid("expected a mapping");
  if (raw.model !== "hayes-1982" || typeof raw.id !== "string" || !raw.id) {
    return invalid("expected a named hayes-1982 policy");
  }
  if (typeof raw.phonotactics_path !== "string" || !raw.phonotactics_path) {
    return invalid("phonotactics_path is required");
  }
  const category = raw.default_category;
  if (category !== "noun" && category !== "verb" && category !== "adjective") {
    return invalid("default_category must explicitly name an engineering assumption");
  }
  if (
    typeof raw.assumption_citation !== "string" ||
    !raw.assumption_citation.includes("engineering")
  ) {
    return invalid("assumption_citation must label engineering assumptions");
  }
  const macros = parseCelMacroBlock(raw.functions);
  const ids = new Set<string>();
  const rules = (value: unknown, phase: string): StressRule[] => {
    if (!Array.isArray(value) || !value.length) return invalid(`${phase} rules are required`);
    return value.map((entry) => {
      if (!isPlainObject(entry)) return invalid(`${phase} rule must be a mapping`);
      if (typeof entry.id !== "string" || !entry.id || ids.has(entry.id))
        return invalid("duplicate or missing rule id");
      ids.add(entry.id);
      if (!STRESS_OPERATIONS.some((operation) => operation === entry.operation))
        return invalid(`unknown operation in ${entry.id}`);
      if (typeof entry.when !== "string" || typeof entry.tag !== "string" || !entry.tag)
        return invalid(`missing condition/tag in ${entry.id}`);
      const when = expandCelMacros(entry.when, macros, entry.id);
      const error = validateExpressionSyntax(when, { variables });
      if (error) return invalid(`${entry.id}: ${error}`);
      const citations = [...strings(entry.citations, `${entry.id}.citations`)];
      if (!citations.length) return invalid(`${entry.id} has no citations`);
      for (const name of entry.when.match(/\b[A-Za-z_]\w*(?=\s*\()/g) ?? []) {
        citations.push(...(macros.get(name)?.citations ?? []));
      }
      const witness = {
        longVowel: false,
        codaCount: 0,
        category: "noun",
        adjectivalSuffix: false,
        index: 0,
        count: 3,
        singleton: true,
        open: true,
        sonorantCoda: false,
        initial: true,
        precededBySingleton: false,
        verbalSuffix: false,
      };
      try {
        if (typeof evaluateExpression(when, witness) !== "boolean")
          return invalid(`${entry.id}: condition must return bool`);
      } catch (error) {
        return invalid(`${entry.id}: ${String(error)}`);
      }
      return {
        id: entry.id,
        operation: entry.operation as StressOperation,
        when,
        citations: [...new Set(citations)],
        tag: entry.tag,
      };
    });
  };
  const cycle = rules(raw.cycle, "cycle");
  const word = rules(raw.word, "word");
  const cycleOperations = STRESS_OPERATIONS.slice(0, 5);
  if (
    cycle.length !== cycleOperations.length ||
    cycle.some((rule, index) => rule.operation !== cycleOperations[index])
  ) {
    return invalid(
      "cycle must order consonant exclusion, LVS, rhyme exclusion, ESR, and retraction (Hayes 1982, p. 244)",
    );
  }
  if (
    word.length !== STRESS_OPERATIONS.length - 5 ||
    word.some((rule, index) => rule.operation !== STRESS_OPERATIONS[index + 5])
  ) {
    return invalid(
      "word operations must follow the declared Hayes destressing and late-exclusion order",
    );
  }
  const longVowels = strings(raw.long_vowels, "long_vowels");
  const shortFinalVowels = strings(raw.short_final_vowels, "short_final_vowels");
  const sonorants = strings(raw.sonorants, "sonorants");
  const phonotactics = loadPhonotacticsSync(raw.phonotactics_path);
  if (
    !Array.isArray(phonotactics.vowels) ||
    !phonotactics.vowels.length ||
    !Array.isArray(phonotactics.legal_onsets) ||
    [...longVowels, ...shortFinalVowels].some((phone) => !phonotactics.vowels.includes(phone)) ||
    sonorants.some((phone) => phonotactics.vowels.includes(phone))
  ) {
    return invalid("E_STRESS_PHONOTACTICS: incompatible phonotactics or quantity classes");
  }
  return {
    id: raw.id,
    phonotacticsPath: raw.phonotactics_path,
    longVowels: [...longVowels],
    sonorants: [...sonorants],
    shortFinalVowels: [...shortFinalVowels],
    defaultCategory: category,
    assumptionCitation: raw.assumption_citation,
    cycle,
    word,
  };
}
const policies = new Map<string, StressPolicy>();
export function loadStressPolicy(path: string): StressPolicy {
  if (!path) return invalid("resolved stress policy path is required");
  const cached = policies.get(path);
  if (cached) return cached;
  let policy: StressPolicy;
  try {
    policy = parseStressPolicy(loadYamlDocumentSync<unknown>(path));
  } catch (error) {
    return invalid(`${path}: ${String(error)}`);
  }
  policies.set(path, policy);
  return policy;
}
