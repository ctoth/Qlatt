import type { Diagnostics } from "../diagnostics";
import { loadStressPolicy } from "../g2p/stress-policy";
import type { AreaFunctionDerivation } from "../provenance";
import {
  cloneValue,
  isPlainObject,
  loadYamlDocumentSync,
  loadYamlSource,
  loadYamlSourceSync,
  parseYamlString,
} from "../yaml-loader";
import { parseRecognitionConfig } from "./recognition-config";

export type InventorySpec = {
  silence_symbol: string;
  nucleus_types: readonly string[];
  symbol_grammar: string;
  stress_markers: Readonly<Record<number, string>>;
  default_duration_ms: number;
  citations?: readonly string[];
  base_params: Record<string, number>;
  normalization_aliases?: Readonly<Record<string, string>>;
  secondary_stress_fallback?: { target: 0 | 1; citations: string[] };
  phoneme_targets: Record<string, Record<string, unknown>>;
};

/** Decode the selected inventory's suffix convention, then validate its alphabet. */
export function parseInventorySymbol(
  symbol: string,
  inventory: InventorySpec,
): { phoneme: string; stress: number | null } | null {
  if (symbol === inventory.silence_symbol) return { phoneme: symbol, stress: null };
  const grammar = new RegExp(`^(?:${inventory.symbol_grammar})$`, "u");
  for (const [stress, marker] of Object.entries(inventory.stress_markers).sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    if (!symbol.endsWith(marker)) continue;
    const phoneme = symbol.slice(0, -marker.length);
    if (grammar.test(phoneme)) return { phoneme, stress: Number(stress) };
  }
  return grammar.test(symbol) ? { phoneme: symbol, stress: null } : null;
}

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
    if (Object.hasOwn(target, "duration_model")) validateDurationModel(target.duration_model);
    readAreaFunctionDerivation(target);
    output[phoneme] = cloneValue(target) as Record<string, unknown>;
  }

  return output;
}

function validateDurationModel(model: unknown): void {
  if (
    !isPlainObject(model) ||
    typeof model.minimum_ms !== "number" ||
    !Number.isFinite(model.minimum_ms) ||
    model.minimum_ms < 0 ||
    typeof model.inherent_ms !== "number" ||
    !Number.isFinite(model.inherent_ms) ||
    model.inherent_ms <= 0 ||
    model.minimum_ms > model.inherent_ms ||
    typeof model.unstressed_scale !== "number" ||
    !Number.isFinite(model.unstressed_scale) ||
    model.unstressed_scale < 0 ||
    model.unstressed_scale > 1 ||
    typeof model.source !== "string" ||
    !model.source.trim() ||
    !Array.isArray(model.citations) ||
    model.citations.length === 0 ||
    model.citations.some((c) => typeof c !== "string" || !c.trim())
  ) {
    throw new Error(
      "E_INVENTORY_DURATION: duration_model requires 0 <= minimum_ms <= inherent_ms, positive inherent_ms, unstressed_scale in [0,1], source and citations",
    );
  }
}

// Expand explicitly mapped source rows onto targets once at inventory loading.
// No phone-name heuristics: aliases/stress fallback then select ordinary targets.
function applyDurationModels(raw: unknown, targets: Record<string, Record<string, unknown>>): void {
  if (raw === undefined) return;
  if (!isPlainObject(raw) || !isPlainObject(raw.rows) || !Array.isArray(raw.citations)) {
    throw new Error("E_INVENTORY_DURATION: duration_models requires rows and citations");
  }
  const assigned = new Set<string>();
  for (const [source, row] of Object.entries(raw.rows)) {
    if (!isPlainObject(row) || !Array.isArray(row.targets) || row.targets.length === 0) {
      throw new Error(`E_INVENTORY_DURATION: row ${source} requires targets`);
    }
    if (Object.hasOwn(row, "citations") && !Array.isArray(row.citations)) {
      throw new Error(`E_INVENTORY_DURATION: row ${source} citations must be an array`);
    }
    const model = {
      source,
      minimum_ms: row.minimum_ms,
      inherent_ms: row.inherent_ms,
      unstressed_scale: raw.unstressed_scale,
      citations: [...raw.citations, ...(Array.isArray(row.citations) ? row.citations : [])],
    };
    validateDurationModel(model);
    for (const name of row.targets) {
      if (
        typeof name !== "string" ||
        !Object.hasOwn(targets, name) ||
        assigned.has(name) ||
        Object.hasOwn(targets[name], "duration_model")
      ) {
        throw new Error(`E_INVENTORY_DURATION: unknown or duplicate target ${String(name)}`);
      }
      assigned.add(name);
      targets[name].duration_model = cloneValue(model);
    }
  }
  for (const name of Object.keys(targets)) {
    if (!assigned.has(name)) throw new Error(`E_INVENTORY_DURATION: no duration model for ${name}`);
  }
}

function normalizeNormalizationAliases(
  node: unknown,
  targets: Record<string, Record<string, unknown>>,
  markers: Readonly<Record<number, string>>,
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
    if (!targets[target] && !Object.values(markers).some((marker) => targets[target + marker])) {
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

export function parseInventorySpec(source: string): InventorySpec {
  const raw = parseYamlString(source, "inventory spec");
  if (!isPlainObject(raw)) {
    throw new Error("E_INVENTORY_SCHEMA: inventory spec must be a YAML object document");
  }

  const phonemeTargets = normalizePhonemeTargets(raw.phoneme_targets);
  if (
    typeof raw.silence_symbol !== "string" ||
    !raw.silence_symbol.trim() ||
    !phonemeTargets[raw.silence_symbol]
  )
    throw new Error("E_INVENTORY_SCHEMA: silence_symbol must name a declared target");
  if (
    !Array.isArray(raw.nucleus_types) ||
    !raw.nucleus_types.length ||
    raw.nucleus_types.some((t) => typeof t !== "string" || !t.trim())
  )
    throw new Error("E_INVENTORY_SCHEMA: nucleus_types must contain non-empty type names");
  if (typeof raw.symbol_grammar !== "string" || !raw.symbol_grammar.trim())
    throw new Error("E_INVENTORY_SCHEMA: symbol_grammar is required");
  try {
    new RegExp(`^(?:${raw.symbol_grammar})$`, "u");
  } catch {
    throw new Error(
      "E_INVENTORY_SCHEMA: symbol_grammar must be a valid Unicode regular expression",
    );
  }
  const rawMarkers = raw.stress_markers;
  if (
    !isPlainObject(rawMarkers) ||
    Object.keys(rawMarkers).length !== 3 ||
    ![0, 1, 2].every(
      (stress) => typeof rawMarkers[stress] === "string" && String(rawMarkers[stress]).length > 0,
    ) ||
    new Set(Object.values(rawMarkers)).size !== 3
  )
    throw new Error(
      "E_INVENTORY_SCHEMA: stress_markers requires distinct non-empty suffixes for 0, 1, 2",
    );
  const markers = raw.stress_markers as Record<number, string>;
  if (
    typeof raw.default_duration_ms !== "number" ||
    !Number.isFinite(raw.default_duration_ms) ||
    raw.default_duration_ms <= 0
  )
    throw new Error("E_INVENTORY_SCHEMA: default_duration_ms must be positive and finite");
  const silence = phonemeTargets[raw.silence_symbol];
  if (typeof silence.dur !== "number" || !Number.isFinite(silence.dur) || silence.dur <= 0)
    throw new Error("E_INVENTORY_SCHEMA: silence target requires a positive finite dur");
  const citations = raw.citations ?? [];
  if (
    !Array.isArray(citations) ||
    citations.some((entry) => typeof entry !== "string" || !entry.trim())
  ) {
    throw new Error("E_INVENTORY_SCHEMA: citations must be non-empty strings");
  }
  applyDurationModels(raw.duration_models, phonemeTargets);
  return {
    silence_symbol: raw.silence_symbol,
    nucleus_types: [...raw.nucleus_types] as string[],
    symbol_grammar: raw.symbol_grammar,
    stress_markers: { ...markers },
    default_duration_ms: raw.default_duration_ms,
    citations: [...citations],
    base_params: normalizeBaseParams(raw.base_params),
    normalization_aliases: normalizeNormalizationAliases(
      raw.normalization_aliases,
      phonemeTargets,
      markers,
    ),
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

/** Metadata only: runtime consumes precomputed Hz and never runs the tube model. */
function readAreaFunctionDerivation(
  target: Record<string, unknown>,
): AreaFunctionDerivation | undefined {
  if (target.derived_from === undefined && target.area_function === undefined) return undefined;
  const geometry = target.area_function;
  const speaker = isPlainObject(geometry) ? geometry.speaker : undefined;
  if (
    target.derived_from !== "area_function" ||
    !isPlainObject(geometry) ||
    typeof geometry.source !== "string" ||
    !geometry.source.trim() ||
    typeof geometry.model !== "string" ||
    !geometry.model.trim() ||
    !isPlainObject(speaker) ||
    !["tract_length_scale", "pharynx_scale", "mouth_scale"].every(
      (key) =>
        typeof speaker[key] === "number" && Number.isFinite(speaker[key]) && speaker[key] > 0,
    ) ||
    !Array.isArray(geometry.citations) ||
    !geometry.citations.length ||
    geometry.citations.some((c) => typeof c !== "string" || !c.trim())
  )
    throw new Error(
      "E_INVENTORY_SCHEMA: derived_from area_function requires source, model, positive speaker scales and citations",
    );
  for (const key of ["F1", "F2", "F3", "F4", "B1", "B2", "B3", "B4"]) {
    if (typeof target[key] !== "number" || !Number.isFinite(target[key]) || target[key] <= 0) {
      throw new Error(`E_INVENTORY_SCHEMA: area_function requires precomputed positive ${key}`);
    }
  }
  return cloneValue(geometry) as unknown as AreaFunctionDerivation;
}

export type InventorySelection = {
  areaFunction?: AreaFunctionDerivation;
  defaultDurationMs?: number;
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
  target: Record<string, unknown>,
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
    const markers = options.inventorySpec.stress_markers;
    const probeTarget =
      Object.values(markers)
        .map((marker) => effectiveTargets[lookupKey + marker])
        .find(Boolean) || effectiveTargets[lookupKey];
    const isNucleus = options.inventorySpec.nucleus_types.includes(String(probeTarget?.type));

    if (isNucleus) {
      const stressMarker = markers[options.stress ?? 0];
      if (stressMarker === undefined)
        throw new Error(`E_STRESS_TARGET: undeclared stress ${options.stress}`);
      target = effectiveTargets[lookupKey + stressMarker] as Record<string, unknown> | undefined;
      if (target) {
        selectedKey = lookupKey + stressMarker;
        resolvedKey = phoneme === lookupKey ? lookupKey + stressMarker : phoneme;
      } else if (options.stress === 2) {
        const fallback = normalizeSecondaryFallback(
          options.inventorySpec.secondary_stress_fallback,
        );
        if (!fallback)
          throw new Error(
            `E_STRESS_TARGET: ${lookupKey}${stressMarker} requires a cited realization policy`,
          );
        target = effectiveTargets[lookupKey + markers[fallback.target]];
        selectedKey = lookupKey + markers[fallback.target];
        secondaryStressFallback = true;
        if (!target) throw new Error(`E_STRESS_TARGET: declared target ${selectedKey} is absent`);
        resolvedKey = phoneme === lookupKey ? selectedKey : phoneme;
      } else {
        throw new Error(`E_STRESS_TARGET: requested target ${lookupKey}${stressMarker} is absent`);
      }
    } else {
      // Stress suffixes select nucleus targets only.
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
  if (targetDuration === undefined)
    options.diagnostics?.warn(
      "Inventory target uses the declared default duration",
      { selectedKey, applied: options.inventorySpec.default_duration_ms },
      "INVENTORY_DURATION_DEFAULT",
    );
  if (Object.hasOwn(target, "duration_model")) validateDurationModel(target.duration_model);

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
  const areaFunction = readAreaFunctionDerivation(target);
  options.onSelection?.({
    ...(areaFunction ? { areaFunction } : {}),
    inputPhone: phoneme,
    stress: options.stress ?? null,
    lookupKey,
    selectedKey,
    secondaryStressFallback,
    ...(targetDuration === undefined
      ? { defaultDurationMs: options.inventorySpec.default_duration_ms }
      : {}),
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
    duration: targetDuration || options.inventorySpec.default_duration_ms,
    inherentDuration: targetDuration,
  };

  for (const [entryKey, value] of Object.entries(target)) {
    if (entryKey === "dur" || entryKey === "area_function") continue;
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
  if (!Array.isArray(normalization.phases) || !normalization.phases.length)
    throw new Error("E_FRONTEND_CONFIG: normalization.phases is required");
  if (!parseRecognitionConfig(spec))
    throw new Error("E_FRONTEND_CONFIG: text_recognition is required");
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
    dictionaryPath: typeof spec.dictionary_path === "string" ? spec.dictionary_path : undefined,
  };
}
