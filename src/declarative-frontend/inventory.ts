import {
  isPlainObject,
  listBundledYamlPaths,
  loadYamlSource,
  loadYamlSourceSync,
  parseYamlString,
} from "../yaml-loader";

type InventorySpec = {
  base_params: Record<string, number>;
  phoneme_targets: Record<string, Record<string, unknown>>;
};

// Source-of-truth inventory data lives in /public/rules/inventory.yaml.
export const DEFAULT_INVENTORY_PATH = "/rules/inventory.yaml";

function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValue(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }
  return value;
}
const BUNDLED_INVENTORY_CACHE = new Map<string, InventorySpec>();

export function listBundledInventoryPaths(): string[] {
  const known = new Set<string>([
    ...listBundledYamlPaths("/rules/"),
    ...BUNDLED_INVENTORY_CACHE.keys(),
    DEFAULT_INVENTORY_PATH,
  ]);
  return [...known].sort();
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

export function loadInventorySpecFromPath(specPath: string = DEFAULT_INVENTORY_PATH): InventorySpec {
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
  specPath: string = DEFAULT_INVENTORY_PATH
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

const INVENTORY = await preloadInventorySpecFromPath(DEFAULT_INVENTORY_PATH);

export const BASE_PARAMS: Record<string, number> = INVENTORY.base_params;
export const PHONEME_TARGETS: Record<string, Record<string, unknown>> = INVENTORY.phoneme_targets;

// --- Rule Functions ---
export function fillDefaultParams(target: Record<string, unknown> | null | undefined): Record<string, number> {
  const filled: Record<string, number> = { ...BASE_PARAMS };

  if (target) {
    // Override defaults with valid numeric values from the target.
    for (const [key, value] of Object.entries(target)) {
      if (!Object.prototype.hasOwnProperty.call(BASE_PARAMS, key)) continue;
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

export function materializePhonemeTarget(phoneme: unknown) {
  const key = typeof phoneme === "string" && phoneme.length > 0 ? phoneme : "SIL";
  const target = (PHONEME_TARGETS[key] || PHONEME_TARGETS.SIL || {}) as Record<string, unknown>;
  const targetDuration = typeof target.dur === "number" ? target.dur : undefined;
  const payload: {
    phoneme: string;
    params: Record<string, number>;
    duration: number;
    inherentDuration: number | undefined;
    [key: string]: unknown;
  } = {
    phoneme: key,
    params: fillDefaultParams(target),
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
    }
  }

  return payload;
}
