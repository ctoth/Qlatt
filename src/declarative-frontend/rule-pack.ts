import { parseDslSpec } from "./parser";
import { assertValidSpec } from "./validation";
import { listBundledYamlPaths, loadYamlSource, loadYamlSourceSync } from "../yaml-loader";

type PlainObject = Record<string, unknown>;

export const DEFAULT_RULEPACK_PATH = "/rules/frontend.yaml";

function normalizeRuleShape(spec: PlainObject): PlainObject {
  for (const rule of Object.values((spec.rules ?? {}) as Record<string, unknown>)) {
    if (rule && typeof rule === "object" && (rule as Record<string, unknown>).op == null) {
      delete (rule as Record<string, unknown>).op;
    }
  }
  return spec;
}

const BUNDLED_RULEPACK_CACHE = new Map<string, PlainObject>();

export function listBundledRulepackPaths(): string[] {
  const known = new Set<string>([...listBundledYamlPaths("/rules/"), ...BUNDLED_RULEPACK_CACHE.keys(), DEFAULT_RULEPACK_PATH]);
  return [...known].sort();
}

export function loadRulepackSpecFromPath(specPath: string = DEFAULT_RULEPACK_PATH): PlainObject {
  const cached = BUNDLED_RULEPACK_CACHE.get(specPath);
  if (cached) return cached;

  let source = "";
  try {
    source = loadYamlSourceSync(specPath);
  } catch {
    const known = listBundledRulepackPaths();
    throw new Error(
      `E_RULESET_PATH_UNKNOWN: '${specPath}' could not be loaded` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
    );
  }

  const spec = normalizeRuleShape(parseDslSpec(source));
  assertValidSpec(spec);
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export async function preloadRulepackSpecFromPath(
  specPath: string = DEFAULT_RULEPACK_PATH
): Promise<PlainObject> {
  const cached = BUNDLED_RULEPACK_CACHE.get(specPath);
  if (cached) return cached;

  let source = "";
  try {
    source = await loadYamlSource(specPath);
  } catch {
    const known = listBundledRulepackPaths();
    throw new Error(
      `E_RULESET_PATH_UNKNOWN: '${specPath}' could not be loaded` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
    );
  }

  const spec = normalizeRuleShape(parseDslSpec(source));
  assertValidSpec(spec);
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export const QLATT_V12_CEL_RULEPACK = await preloadRulepackSpecFromPath(DEFAULT_RULEPACK_PATH);
export const QLATT_V11_SLICE_RULEPACK = QLATT_V12_CEL_RULEPACK;
