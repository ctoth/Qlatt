import {
  cloneValue,
  isPlainObject,
  loadYamlSource,
  loadYamlSourceSync,
  parseYamlString,
} from "../yaml-loader";

export type InventorySpec = {
  base_params: Record<string, number>;
  phoneme_targets: Record<string, Record<string, unknown>>;
};

/**
 * Resources loaded from a frontend.yaml spec.
 * Every path originates in the frontend spec — no hardcoded defaults.
 */
export type FrontendResources = {
  inventory: InventorySpec;
  inventoryPath: string;
  ltsPath?: string;
  morphologyPath?: string;
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

function parseInventorySpec(source: string): InventorySpec {
  const raw = parseYamlString(source, "inventory spec");
  if (!isPlainObject(raw)) {
    throw new Error("E_INVENTORY_SCHEMA: inventory spec must be a YAML object document");
  }

  return {
    base_params: normalizeBaseParams(raw.base_params),
    phoneme_targets: normalizePhonemeTargets(raw.phoneme_targets),
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
    filled.AV = 0;
    filled.AF = 0;
    filled.AH = 0;
    filled.AVS = -70;
    filled.F0 = 0;
  }

  return filled;
}

export function materializePhonemeTarget(
  phoneme: unknown,
  options: { stress?: number | null; inventorySpec: InventorySpec },
) {
  const effectiveTargets = options.inventorySpec.phoneme_targets;
  const effectiveBase = options.inventorySpec.base_params;
  const baseKey = typeof phoneme === "string" && phoneme.length > 0 ? phoneme : "SIL";

  // Resolve the actual lookup key, applying stress-aware vowel resolution when
  // an options bag with a stress value is provided.
  let resolvedKey = baseKey;
  let target: Record<string, unknown> | undefined;

  if (options && "stress" in options) {
    // Determine whether the base phoneme is a vowel by probing stressed variants
    // (vowels only exist in inventory as e.g. AH1/AH0, never bare AH).
    const probeTarget =
      effectiveTargets[baseKey + "1"] ||
      effectiveTargets[baseKey + "0"] ||
      effectiveTargets[baseKey];
    const isVowel = (probeTarget as Record<string, unknown> | undefined)?.type === "vowel";

    if (isVowel) {
      const stressMarker = options.stress === 1 ? "1" : "0";
      const fallbackMarker = stressMarker === "1" ? "0" : "1";
      target = effectiveTargets[baseKey + stressMarker] as Record<string, unknown> | undefined;
      if (target) {
        resolvedKey = baseKey + stressMarker;
      } else {
        target = effectiveTargets[baseKey + fallbackMarker] as Record<string, unknown> | undefined;
        if (target) {
          resolvedKey = baseKey + fallbackMarker;
        }
      }
    } else {
      // Consonant: try with suffixes then bare key (matches original frontend logic)
      target =
        (effectiveTargets[baseKey + "1"] as Record<string, unknown> | undefined) ||
        (effectiveTargets[baseKey + "0"] as Record<string, unknown> | undefined) ||
        (effectiveTargets[baseKey] as Record<string, unknown> | undefined);
      if (target) {
        // resolvedKey stays baseKey for consonants (they don't rename)
        resolvedKey = baseKey;
      }
    }
  } else {
    // No options: direct lookup (backward-compatible path)
    target = effectiveTargets[resolvedKey] as Record<string, unknown> | undefined;
  }

  // Final fallback to SIL
  if (!target) {
    target = (effectiveTargets.SIL || {}) as Record<string, unknown>;
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
    duration: targetDuration || 30,
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
  spec: Record<string, unknown>,
): FrontendResources {
  const inventoryPath = spec.inventory_path as string | undefined;
  if (!inventoryPath) {
    throw new Error("E_FRONTEND_SPEC: inventory_path is required");
  }
  return {
    inventory: loadInventorySpecFromPath(inventoryPath),
    inventoryPath,
    ltsPath: (spec.lts_path as string) || undefined,
    morphologyPath: (spec.morphology_path as string) || undefined,
  };
}
