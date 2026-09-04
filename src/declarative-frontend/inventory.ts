import {
  cloneValue,
  isPlainObject,
  loadYamlSource,
  loadYamlSourceSync,
  parseYamlString,
} from "../yaml-loader";

export type InventorySpec = {
  base_params: Record<string, number>;
  normalization_aliases?: Readonly<Record<string, string>>;
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
  ltsPath?: string;
  morphologyPath?: string;
  /**
   * Optional per-frontend pronunciation dictionary path (JSON, flat
   * word -> "ARPABET ..." map). When set, this frontend does dictionary-first
   * lookup against this file instead of the global CMU default. Generic:
   * a path -> a map -> lookup. Frontends without it keep the global behavior.
   */
  dictionaryPath?: string;
};

const BUNDLED_INVENTORY_CACHE = new Map<string, InventorySpec>();

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

  if (!Object.prototype.hasOwnProperty.call(output, "SIL")) {
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

function parseInventorySpec(source: string): InventorySpec {
  const raw = parseYamlString(source, "inventory spec");
  if (!isPlainObject(raw)) {
    throw new Error("E_INVENTORY_SCHEMA: inventory spec must be a YAML object document");
  }

  const phonemeTargets = normalizePhonemeTargets(raw.phoneme_targets);
  return {
    base_params: normalizeBaseParams(raw.base_params),
    normalization_aliases: normalizeNormalizationAliases(raw.normalization_aliases, phonemeTargets),
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
        (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
    );
  }

  const spec = parseInventorySpec(source);
  BUNDLED_INVENTORY_CACHE.set(specPath, spec);
  return spec;
}

export async function preloadInventorySpecFromPath(
  specPath: string,
): Promise<InventorySpec> {
  const cached = BUNDLED_INVENTORY_CACHE.get(specPath);
  if (cached) return cached;

  let source = "";
  try {
    source = await loadYamlSource(specPath);
  } catch {
    const known = listBundledInventoryPaths();
    throw new Error(
      `E_INVENTORY_PATH_UNKNOWN: '${specPath}' could not be loaded` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
    );
  }

  const spec = parseInventorySpec(source);
  BUNDLED_INVENTORY_CACHE.set(specPath, spec);
  return spec;
}

// --- Rule Functions ---
export function fillDefaultParams(
  target: Record<string, unknown> | null | undefined,
  baseParams: Record<string, number>,
): Record<string, number> {
  const effectiveBase = baseParams;
  const filled: Record<string, number> = { ...effectiveBase };

  if (target) {
    // Override defaults with valid numeric values from the target.
    for (const [key, value] of Object.entries(target)) {
      if (!Object.prototype.hasOwnProperty.call(effectiveBase, key)) continue;
      if (typeof value === "number" && Number.isFinite(value)) {
        filled[key] = value;
      } else {
        console.warn(
          `[fillDefaultParams] Invalid value '${String(value)}' for key '${key}' in target. Using default: ${filled[key]}`
        );
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

  return filled;
}

export function materializePhonemeTarget(
  phoneme: unknown,
  options: { stress?: number | null; inventorySpec: InventorySpec },
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
  let target: Record<string, unknown> | undefined;

  if (options && "stress" in options) {
    // Determine whether the base phoneme is a vowel by probing stressed variants
    // (vowels only exist in inventory as e.g. AH1/AH0, never bare AH).
    const probeTarget =
      effectiveTargets[lookupKey + "1"] ||
      effectiveTargets[lookupKey + "0"] ||
      effectiveTargets[lookupKey];
    const isVowel = (probeTarget as Record<string, unknown> | undefined)?.type === "vowel";

    if (isVowel) {
      const stressMarker = options.stress === 1 ? "1" : "0";
      const fallbackMarker = stressMarker === "1" ? "0" : "1";
      target = effectiveTargets[lookupKey + stressMarker] as Record<string, unknown> | undefined;
      if (target) {
        resolvedKey = phoneme === lookupKey ? lookupKey + stressMarker : phoneme;
      } else {
        target = effectiveTargets[lookupKey + fallbackMarker] as Record<string, unknown> | undefined;
        if (target) {
          resolvedKey = phoneme === lookupKey ? lookupKey + fallbackMarker : phoneme;
        }
      }
    } else {
      // Consonant: try with suffixes then bare key (matches original frontend logic)
      target =
        (effectiveTargets[lookupKey + "1"] as Record<string, unknown> | undefined) ||
        (effectiveTargets[lookupKey + "0"] as Record<string, unknown> | undefined) ||
        (effectiveTargets[lookupKey] as Record<string, unknown> | undefined);
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
  const filledParams = fillDefaultParams(target, effectiveBase);

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
    } else if (typeof value === "number" && !Object.prototype.hasOwnProperty.call(effectiveBase, entryKey)) {
      payload[entryKey] = value;
    } else if ((Array.isArray(value) || isPlainObject(value)) && !Object.prototype.hasOwnProperty.call(effectiveBase, entryKey)) {
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
export function loadFrontendResources(
  spec: unknown,
): FrontendResources {
  if (!isPlainObject(spec)) {
    throw new Error("E_FRONTEND_SPEC: frontend spec must be an object");
  }
  const inventoryPath = spec.inventory_path;
  if (typeof inventoryPath !== "string" || inventoryPath.length === 0) {
    throw new Error("E_FRONTEND_SPEC: inventory_path is required");
  }
  return {
    inventory: loadInventorySpecFromPath(inventoryPath),
    inventoryPath,
    ltsPath: typeof spec.lts_path === "string" ? spec.lts_path : undefined,
    morphologyPath: typeof spec.morphology_path === "string" ? spec.morphology_path : undefined,
    dictionaryPath: typeof spec.dictionary_path === "string" ? spec.dictionary_path : undefined,
  };
}
