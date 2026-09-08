import type { Diagnostics } from "../diagnostics";
import { loadStressPolicy } from "../g2p/stress-policy";
import type { NormalizationConfig } from "../g2p/text-normalize";
import {
  cloneValue,
  isPlainObject,
  loadYamlDocumentSync,
  loadYamlSource,
  loadYamlSourceSync,
  parseYamlString,
} from "../yaml-loader";

export type InventorySpec = {
  base_params: Record<string, number>;
  normalization_aliases?: Readonly<Record<string, string>>;
  secondary_stress_fallback?: { target: 0 | 1; citations: string[] };
  phoneme_targets: Record<string, Record<string, unknown>>;
};

/**
 * Source parameters that force silence when a segment has no inventory target.
 * Klatt (1980) expresses the source amplitudes AV/AF/AH in dB with 0 dB = off,
 * and F0 = 0 disables the voicing source. AVS is driven to its floor; the
 * -70 dB value is an engineering estimate (effectively -inf), not a tabulated
 * Klatt constant.
 */
const SILENCE_PARAMS = Object.freeze({ AV: 0, AF: 0, AH: 0, AVS: -70, F0: 0 });

/**
 * Fallback segment duration (ms) used when a phoneme target declares no `dur`.
 * Klatt (1976) reports inherent segment durations well above this; 30 ms is a
 * short non-zero floor so a duration-less target still yields an audible frame.
 * engineering estimate — not a tabulated Klatt value.
 */
const DEFAULT_SEGMENT_DURATION_MS = 30;

/**
 * Resources loaded from a frontend.yaml spec.
 * Every path originates in the frontend spec — no hardcoded defaults.
 */
export type FrontendResources = {
  inventory: InventorySpec;
  inventoryPath: string;
  ltsPath: string;
  morphologyPath: string;
  stressPolicyPath: string;
  normalization: NormalizationConfig;
  /**
   * Optional per-frontend pronunciation dictionary path (JSON, flat
   * word -> "ARPABET ..." map). When set, this frontend does dictionary-first
   * lookup against this file instead of the global CMU default. Generic:
   * a path -> a map -> lookup. Frontends without it keep the global behavior.
   */
  dictionaryPath?: string;
};

const BUNDLED_INVENTORY_CACHE = new Map<string, InventorySpec>();
const FRONTEND_ASSET_CACHE = new Map<string, unknown>();

export function listBundledInventoryPaths(): string[] {
  return [...BUNDLED_INVENTORY_CACHE.keys()].sort();
}

function normalizeBaseParams(node: unknown): Record<string, number> {
  if (!isPlainObject(node)) {
    throw new Error("E_INVENTORY_SCHEMA: 'base_params' must be an object");
  }

  const output: Record<string, number> = {};
  for (const [key, value] of Object.entries(node)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`E_INVENTORY_SCHEMA: base_params.${key} must be a finite number`);
    }
    output[key] = value;
  }

  if (Object.keys(output).length === 0) {
    throw new Error("E_INVENTORY_SCHEMA: 'base_params' cannot be empty");
  }

  return output;
}

function normalizePhonemeTargets(node: unknown): Record<string, Record<string, unknown>> {
  if (!isPlainObject(node)) {
    throw new Error("E_INVENTORY_SCHEMA: 'phoneme_targets' must be an object");
  }

  const output: Record<string, Record<string, unknown>> = {};
  for (const [phoneme, target] of Object.entries(node)) {
    if (!isPlainObject(target)) {
      throw new Error(`E_INVENTORY_SCHEMA: phoneme_targets.${phoneme} must be an object`);
    }
    output[phoneme] = cloneValue(target) as Record<string, unknown>;
  }

  if (!Object.hasOwn(output, "SIL")) {
    throw new Error("E_INVENTORY_SCHEMA: phoneme_targets.SIL is required");
  }

  return output;
}

function normalizeNormalizationAliases(
  node: unknown,
  targets: Record<string, Record<string, unknown>>,
): Readonly<Record<string, string>> {
  if (node == null) return Object.freeze({});
  if (!isPlainObject(node)) {
    throw new Error("E_INVENTORY_SCHEMA: 'normalization_aliases' must map aliases to targets");
  }
  const aliases: Record<string, string> = {};
  for (const [alias, target] of Object.entries(node)) {
    if (alias.length === 0 || typeof target !== "string" || target.length === 0) {
      throw new Error(`E_INVENTORY_SCHEMA: normalization_aliases.${alias} must name a target`);
    }
    if (!targets[target] && !targets[`${target}0`] && !targets[`${target}1`]) {
      throw new Error(
        `E_INVENTORY_SCHEMA: normalization_aliases.${alias} references unknown target '${target}'`,
      );
    }
    aliases[alias] = target;
  }
  return Object.freeze(aliases);
}

function normalizeSecondaryFallback(raw: unknown): InventorySpec["secondary_stress_fallback"] {
  if (raw === undefined) return undefined;
  if (
    !isPlainObject(raw) ||
    (raw.target !== 0 && raw.target !== 1) ||
    !Array.isArray(raw.citations) ||
    !raw.citations.length ||
    raw.citations.some((citation) => typeof citation !== "string" || !citation.trim())
  ) {
    throw new Error(
      "E_INVENTORY_SCHEMA: secondary_stress_fallback requires target 0/1 and citations",
    );
  }
  return { target: raw.target, citations: [...raw.citations] };
}

function parseInventorySpec(source: string): InventorySpec {
  const raw = parseYamlString(source, "inventory spec");
  if (!isPlainObject(raw)) {
    throw new Error("E_INVENTORY_SCHEMA: inventory spec must be a YAML object document");
  }

  const phonemeTargets = normalizePhonemeTargets(raw.phoneme_targets);
  return {
    base_params: normalizeBaseParams(raw.base_params),
    normalization_aliases: normalizeNormalizationAliases(raw.normalization_aliases, phonemeTargets),
    secondary_stress_fallback: normalizeSecondaryFallback(raw.secondary_stress_fallback),
    phoneme_targets: phonemeTargets,
  };
}

export function loadInventorySpecFromPath(specPath: string): InventorySpec {
  const cached = BUNDLED_INVENTORY_CACHE.get(specPath);
  if (cached) return cached;

  let source = "";
  try {
    source = loadYamlSourceSync(specPath);
  } catch {
    const known = listBundledInventoryPaths();
    throw new Error(
      `E_INVENTORY_PATH_UNKNOWN: '${specPath}' could not be loaded` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : ""),
    );
  }

  const spec = parseInventorySpec(source);
  BUNDLED_INVENTORY_CACHE.set(specPath, spec);
  return spec;
}

export async function preloadInventorySpecFromPath(specPath: string): Promise<InventorySpec> {
  const cached = BUNDLED_INVENTORY_CACHE.get(specPath);
  if (cached) return cached;

  let source = "";
  try {
    source = await loadYamlSource(specPath);
  } catch {
    const known = listBundledInventoryPaths();
    throw new Error(
      `E_INVENTORY_PATH_UNKNOWN: '${specPath}' could not be loaded` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : ""),
    );
  }

  const spec = parseInventorySpec(source);
  BUNDLED_INVENTORY_CACHE.set(specPath, spec);
  return spec;
}

// --- Rule Functions ---
export type InventoryParameterFallback = {
  parameter: string;
  supplied: unknown;
  applied: number;
  selectedKey?: string;
  segment?: string;
  token?: string;
};

export type InventorySelection = {
  inputPhone: string;
  stress: number | null;
  lookupKey: string;
  selectedKey: string;
  secondaryStressFallback: boolean;
};

export function reportInventoryParameterFallbacks(
  diagnostics: Diagnostics | null | undefined,
  affected: InventoryParameterFallback[],
): void {
  if (affected.length)
    diagnostics?.warn(
      "Invalid supplied inventory parameters replaced with declared base defaults",
      { count: affected.length, affected },
      "INVENTORY_PARAMETER_FALLBACK",
    );
}

export function fillDefaultParams(
  target: Record<string, unknown> | null | undefined,
  baseParams: Record<string, number>,
  options: {
    diagnostics?: Diagnostics | null;
    onInvalidParameter?: (fallback: InventoryParameterFallback) => void;
  } = {},
): Record<string, number> {
  const effectiveBase = baseParams;
  const filled: Record<string, number> = { ...effectiveBase };
  const affected: InventoryParameterFallback[] = [];

  if (target) {
    // Override defaults with valid numeric values from the target.
    for (const [key, value] of Object.entries(target)) {
      if (!Object.hasOwn(effectiveBase, key)) continue;
      if (typeof value === "number" && Number.isFinite(value)) {
        filled[key] = value;
      } else {
        const fallback = { parameter: key, supplied: value, applied: filled[key] };
        if (options.onInvalidParameter) options.onInvalidParameter(fallback);
        else affected.push(fallback);
      }
    }
  } else {
    // If no target provided, ensure output is silent.
    filled.AV = SILENCE_PARAMS.AV;
    filled.AF = SILENCE_PARAMS.AF;
    filled.AH = SILENCE_PARAMS.AH;
    filled.AVS = SILENCE_PARAMS.AVS;
    filled.F0 = SILENCE_PARAMS.F0;
  }

  reportInventoryParameterFallbacks(options.diagnostics, affected);
  return filled;
}

export function materializePhonemeTarget(
  phoneme: unknown,
  options: {
    stress?: number | null;
    inventorySpec: InventorySpec;
    diagnostics?: Diagnostics | null;
    onSelection?: (selection: InventorySelection) => void;
    onInvalidParameter?: (fallback: InventoryParameterFallback) => void;
  },
) {
  const effectiveTargets = options.inventorySpec.phoneme_targets;
  const effectiveBase = options.inventorySpec.base_params;
  if (typeof phoneme !== "string" || phoneme.length === 0) {
    throw new Error(`E_INVENTORY_PHONEME_UNKNOWN: '${String(phoneme)}'`);
  }
  const lookupKey = options.inventorySpec.normalization_aliases?.[phoneme] ?? phoneme;

  // Aliases borrow a declared target's acoustics without renaming the normalized
  // phoneme. This preserves rule-visible identity while making fallback explicit.
  let resolvedKey = phoneme;
  let selectedKey = lookupKey;
  let secondaryStressFallback = false;
  let target: Record<string, unknown> | undefined;

  if (options && "stress" in options) {
    // Determine whether the base phoneme is a vowel by probing stressed variants
    // (vowels only exist in inventory as e.g. AH1/AH0, never bare AH).
    const probeTarget =
      effectiveTargets[lookupKey + "2"] ||
      effectiveTargets[lookupKey + "1"] ||
      effectiveTargets[lookupKey + "0"] ||
      effectiveTargets[lookupKey];
    const isVowel = (probeTarget as Record<string, unknown> | undefined)?.type === "vowel";

    if (isVowel) {
      const stressMarker = options.stress === 2 ? "2" : options.stress === 1 ? "1" : "0";
      const fallbackMarker = stressMarker === "1" ? "0" : "1";
      target = effectiveTargets[lookupKey + stressMarker] as Record<string, unknown> | undefined;
      if (target) {
        selectedKey = lookupKey + stressMarker;
        resolvedKey = phoneme === lookupKey ? lookupKey + stressMarker : phoneme;
      } else if (options.stress === 2) {
        const fallback = normalizeSecondaryFallback(
          options.inventorySpec.secondary_stress_fallback,
        );
        if (!fallback)
          throw new Error(`E_STRESS_TARGET: ${lookupKey}2 requires a cited realization policy`);
        target = effectiveTargets[lookupKey + fallback.target];
        selectedKey = lookupKey + fallback.target;
        secondaryStressFallback = true;
        if (!target)
          throw new Error(
            `E_STRESS_TARGET: declared target ${lookupKey}${fallback.target} is absent`,
          );
        resolvedKey = phoneme === lookupKey ? lookupKey + fallback.target : phoneme;
      } else {
        target = effectiveTargets[lookupKey + fallbackMarker] as
          | Record<string, unknown>
          | undefined;
        if (target) {
          selectedKey = lookupKey + fallbackMarker;
          resolvedKey = phoneme === lookupKey ? lookupKey + fallbackMarker : phoneme;
        }
      }
    } else {
      // Consonant: try with suffixes then bare key (matches original frontend logic)
      selectedKey =
        [lookupKey + "1", lookupKey + "0", lookupKey].find((key) => effectiveTargets[key]) ??
        lookupKey;
      target = effectiveTargets[selectedKey];
    }
  } else {
    // No options: direct lookup (backward-compatible path)
    target = effectiveTargets[lookupKey] as Record<string, unknown> | undefined;
  }

  if (!target) {
    throw new Error(`E_INVENTORY_PHONEME_UNKNOWN: '${phoneme}'`);
  }

  const targetDuration = typeof target.dur === "number" ? target.dur : undefined;

  // Use the effective base params for filling defaults.
  const affected: InventoryParameterFallback[] = [];
  const filledParams = fillDefaultParams(target, effectiveBase, {
    onInvalidParameter: (fallback) => {
      const contextual = { ...fallback, selectedKey };
      if (options.onInvalidParameter) options.onInvalidParameter(contextual);
      else affected.push(contextual);
    },
  });
  reportInventoryParameterFallbacks(options.diagnostics, affected);
  options.onSelection?.({
    inputPhone: phoneme,
    stress: options.stress ?? null,
    lookupKey,
    selectedKey,
    secondaryStressFallback,
  });

  const payload: {
    phoneme: string;
    params: Record<string, number>;
    duration: number;
    inherentDuration: number | undefined;
    [key: string]: unknown;
  } = {
    phoneme: resolvedKey,
    params: filledParams,
    duration: targetDuration || DEFAULT_SEGMENT_DURATION_MS,
    inherentDuration: targetDuration,
  };

  for (const [entryKey, value] of Object.entries(target)) {
    if (entryKey === "dur") continue;
    if (entryKey === "SW") {
      payload.inventorySW = value;
      continue;
    }
    if (entryKey === "type" && typeof value === "string") {
      payload.type = value;
      continue;
    }
    if (typeof value === "boolean") {
      payload[entryKey] = value;
    } else if (typeof value === "number" && !Object.hasOwn(effectiveBase, entryKey)) {
      payload[entryKey] = value;
    } else if (
      (Array.isArray(value) || isPlainObject(value)) &&
      !Object.hasOwn(effectiveBase, entryKey)
    ) {
      payload[entryKey] = cloneValue(value);
    }
  }

  return payload;
}

// ---------------------------------------------------------------------------
// FrontendResources loader
// ---------------------------------------------------------------------------

/**
 * Load inventory and resource paths from a parsed frontend.yaml spec.
 * Every resource path originates in the spec — no hardcoded defaults.
 */
export function loadFrontendResources(spec: unknown): FrontendResources {
  if (!isPlainObject(spec)) {
    throw new Error("E_FRONTEND_SPEC: frontend spec must be an object");
  }
  const inventoryPath = spec.inventory_path;
  if (typeof inventoryPath !== "string" || inventoryPath.length === 0) {
    throw new Error("E_FRONTEND_SPEC: inventory_path is required");
  }
  const requireAsset = (value: unknown, name: string): string => {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error(`E_FRONTEND_CONFIG: ${name} is required`);
    }
    try {
      if (!FRONTEND_ASSET_CACHE.has(value)) {
        FRONTEND_ASSET_CACHE.set(value, loadYamlDocumentSync(value));
      }
    } catch (cause) {
      throw new Error(`E_FRONTEND_CONFIG: ${name} could not load '${value}'`, { cause });
    }
    return value;
  };
  const ltsPath = requireAsset(spec.lts_path, "lts_path");
  const morphologyPath = requireAsset(spec.morphology_path, "morphology_path");
  const morphology = FRONTEND_ASSET_CACHE.get(morphologyPath);
  requireAsset(
    isPlainObject(morphology) ? morphology.phonotactics_path : undefined,
    "morphology.phonotactics_path",
  );
  const stressPolicyPath = requireAsset(spec.stress_policy_path, "stress_policy_path");
  const stress = FRONTEND_ASSET_CACHE.get(stressPolicyPath);
  requireAsset(
    isPlainObject(stress) ? stress.phonotactics_path : undefined,
    "stress_policy.phonotactics_path",
  );
  loadStressPolicy(stressPolicyPath);
  const normalization = isPlainObject(spec.normalization) ? spec.normalization : {};
  const tablesPath = requireAsset(normalization.tables_path, "normalization.tables_path");
  const pipelinePath = requireAsset(normalization.pipeline_path, "normalization.pipeline_path");
  const punctuationTokens = isPlainObject(spec.transcription)
    ? spec.transcription.punctuation_tokens
    : undefined;
  if (
    !Array.isArray(punctuationTokens) ||
    !punctuationTokens.length ||
    !punctuationTokens.every(
      (token): token is string => typeof token === "string" && token.length > 0,
    )
  ) {
    throw new Error("E_FRONTEND_CONFIG: transcription.punctuation_tokens is required");
  }
  return {
    inventory: loadInventorySpecFromPath(inventoryPath),
    inventoryPath,
    ltsPath,
    morphologyPath,
    stressPolicyPath,
    normalization: { tablesPath, pipelinePath, punctuationTokens },
    dictionaryPath: typeof spec.dictionary_path === "string" ? spec.dictionary_path : undefined,
  };
}
