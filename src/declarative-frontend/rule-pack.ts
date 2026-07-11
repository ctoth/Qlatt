import {
  DSL_ROOT_KEYS,
  parseDslSpec,
  type NormalizedDslSpec,
} from "./parser";
import { assertValidSpec } from "./validation";
import {
  cloneValue,
  isPlainObject,
  loadYamlSource,
  loadYamlSourceSync,
  resolveIncludePath,
} from "../yaml-loader";

type PlainObject = Record<string, unknown>;

function freezeRecursively(value: unknown): void {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return;
  for (const nested of Object.values(value)) freezeRecursively(nested);
  Object.freeze(value);
}

const MERGED_CHILD_ROOT_KEYS = new Set([
  "rules",
  "predicates",
  "patterns",
  "relations",
  "string_sets",
  "maps",
  "syllabification",
  "phases",
  "topology",
]);

const ALLOWED_UNMERGED_CHILD_ROOT_KEYS = new Set(["version", "include"]);

function hasNonEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((entry) => hasNonEmptyValue(entry));
  if (typeof value === "object") {
    return Object.values(value as PlainObject).some((entry) => hasNonEmptyValue(entry));
  }
  return true;
}

export const DEFAULT_FRONTEND_ID = "qlatt-english";
export const BUNDLED_FRONTEND_RULEPACK_PATHS = Object.freeze({
  [DEFAULT_FRONTEND_ID]: "/rules/frontends/qlatt-english/frontend.yaml",
  "dectalk-english": "/rules/frontends/dectalk-english/frontend.yaml",
  "qlatt-beauty": "/rules/frontends/qlatt-beauty/frontend.yaml",
} as const);

export type BundledFrontendId = keyof typeof BUNDLED_FRONTEND_RULEPACK_PATHS;
export const DEFAULT_RULEPACK_PATH = BUNDLED_FRONTEND_RULEPACK_PATHS[DEFAULT_FRONTEND_ID];

// ---------------------------------------------------------------------------
// Include resolution: load child specs and merge them into the root spec
// ---------------------------------------------------------------------------

/**
 * Merge a child spec into the root spec, mutating root in-place.
 *
 * Merge semantics:
 * - rules, predicates, patterns, relations: merge by key, error on duplicate
 * - phases: concat (root first, then child)
 * - topology: concat + dedup each sub-key (hierarchy, parallel, point)
 * - All other fields (version, parameters, output, etc.): root wins, child ignored
 */
function mergeChildIntoRoot(
  root: PlainObject,
  child: PlainObject,
  childPath: string,
): PlainObject {
  const merged = cloneValue(root);
  if (!isPlainObject(merged)) {
    throw new Error("E_RULEPACK_COMPILE: normalized root must remain an object");
  }
  // Merge keyed dictionaries (error on duplicate).
  // Chunk 3: `string_sets` and `maps` are pipeline-level reusable literal-data
  // blocks; merge them the same way as predicates so a child include can
  // declare them.
  for (const key of [
    "rules",
    "predicates",
    "patterns",
    "relations",
    "string_sets",
    "maps",
  ] as const) {
    const childDict = (child[key] ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(childDict)) {
      if (!merged[key]) merged[key] = {};
      const rootDict = merged[key] as Record<string, unknown>;
      if (rootDict[k] !== undefined) {
        throw new Error(`Duplicate ${key} "${k}" in included file ${childPath}`);
      }
      rootDict[k] = v;
    }
  }

  // Syllabification: a single whole-object block (not a keyed dictionary).  A
  // child include may supply it; error if both root and child declare one.
  if (child.syllabification !== undefined && hasNonEmptyValue(child.syllabification)) {
    if (merged.syllabification !== undefined && hasNonEmptyValue(merged.syllabification)) {
      throw new Error(`Duplicate syllabification block in included file ${childPath}`);
    }
    merged.syllabification = child.syllabification;
  }

  // Phases: concat (root first, then child in include order)
  const childPhases = child.phases as unknown[];
  if (Array.isArray(childPhases) && childPhases.length > 0) {
    merged.phases = [...(Array.isArray(merged.phases) ? merged.phases : []), ...childPhases];
  }

  // Topology: concat + dedup each sub-key
  const childTopology = child.topology as PlainObject | undefined;
  if (childTopology && typeof childTopology === "object") {
    if (!merged.topology) merged.topology = {};
    const rootTopology = merged.topology as PlainObject;
    for (const sub of ["hierarchy", "parallel", "point"] as const) {
      const childArr = (childTopology as Record<string, unknown>)[sub];
      if (Array.isArray(childArr) && childArr.length > 0) {
        rootTopology[sub] = [
          ...new Set([
            ...(Array.isArray(rootTopology[sub]) ? (rootTopology[sub] as string[]) : []),
            ...(childArr as string[]),
          ]),
        ];
      }
    }
  }

  for (const [key, value] of Object.entries(child)) {
    if (MERGED_CHILD_ROOT_KEYS.has(key)) continue;
    if (ALLOWED_UNMERGED_CHILD_ROOT_KEYS.has(key)) continue;
    if (!DSL_ROOT_KEYS.has(key)) continue;
    if (!hasNonEmptyValue(value)) continue;
    throw new Error(
      `E_UNMERGED_CHILD_ROOT_KEY: included file ${childPath} declares non-empty root key "${key}", but mergeChildIntoRoot does not merge that key`
    );
  }

  return merged;
}

/**
 * Synchronously resolve includes for a parsed spec.
 * Recursively loads, parses, and merges child specs.
 * Detects circular includes via a set of already-seen paths.
 */
function resolveIncludesSync(
  spec: PlainObject,
  parentPath: string,
  seen?: Set<string>
): PlainObject {
  const seenPaths = seen ?? new Set([parentPath]);
  const includes = spec.include as string[] | undefined;
  if (!includes || includes.length === 0) return spec;

  let resolved = spec;

  for (const relPath of includes) {
    const absPath = resolveIncludePath(parentPath, relPath);
    if (seenPaths.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath} (from ${parentPath})`);
    }
    seenPaths.add(absPath);

    const source = loadYamlSourceSync(absPath);
    const childSpec = parseDslSpec(source);
    const resolvedChild = resolveIncludesSync(childSpec, absPath, seenPaths);
    resolved = mergeChildIntoRoot(resolved, resolvedChild, absPath);
  }

  return resolved;
}

/**
 * Asynchronously resolve includes for a parsed spec.
 * Same as resolveIncludesSync but uses async loadYamlSource.
 */
async function resolveIncludesAsync(
  spec: PlainObject,
  parentPath: string,
  seen?: Set<string>
): Promise<PlainObject> {
  const seenPaths = seen ?? new Set([parentPath]);
  const includes = spec.include as string[] | undefined;
  if (!includes || includes.length === 0) return spec;

  let resolved = spec;

  for (const relPath of includes) {
    const absPath = resolveIncludePath(parentPath, relPath);
    if (seenPaths.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath} (from ${parentPath})`);
    }
    seenPaths.add(absPath);

    const source = await loadYamlSource(absPath);
    const childSpec = parseDslSpec(source);
    const resolvedChild = await resolveIncludesAsync(childSpec, absPath, seenPaths);
    resolved = mergeChildIntoRoot(resolved, resolvedChild, absPath);
  }

  return resolved;
}

export type CompiledRulepack = Readonly<NormalizedDslSpec>;

const BUNDLED_RULEPACK_CACHE = new Map<string, CompiledRulepack>();

export function compileRuleEngineSpec(source: unknown): CompiledRulepack {
  const spec = parseDslSpec(source);
  assertValidSpec(spec);
  freezeRecursively(spec);
  return spec;
}

export function listBundledFrontendIds(): string[] {
  return Object.keys(BUNDLED_FRONTEND_RULEPACK_PATHS).sort();
}

export function resolveBundledRulepackPath(frontendId: string = DEFAULT_FRONTEND_ID): string {
  const specPath =
    BUNDLED_FRONTEND_RULEPACK_PATHS[
      frontendId as keyof typeof BUNDLED_FRONTEND_RULEPACK_PATHS
    ];
  if (typeof specPath === "string" && specPath.length > 0) {
    return specPath;
  }
  const known = listBundledFrontendIds();
  throw new Error(
    `E_FRONTEND_ID_UNKNOWN: '${frontendId}' is not a bundled frontend` +
      (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
  );
}

export function listBundledRulepackPaths(): string[] {
  const known = new Set<string>([
    ...BUNDLED_RULEPACK_CACHE.keys(),
    ...Object.values(BUNDLED_FRONTEND_RULEPACK_PATHS),
  ]);
  return [...known].sort();
}

export function loadRulepackSpecFromPath(
  specPath: string = DEFAULT_RULEPACK_PATH,
): CompiledRulepack {
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

  const parsed = parseDslSpec(source);
  const spec = parseDslSpec(resolveIncludesSync(parsed, specPath));
  assertValidSpec(spec, { requireLoweringSpec: true });
  freezeRecursively(spec);
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export async function preloadRulepackSpecFromPath(
  specPath: string = DEFAULT_RULEPACK_PATH
): Promise<CompiledRulepack> {
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

  const parsed = parseDslSpec(source);
  const spec = parseDslSpec(await resolveIncludesAsync(parsed, specPath));
  assertValidSpec(spec, { requireLoweringSpec: true });
  freezeRecursively(spec);
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export function loadBundledRulepackSpec(
  frontendId: string = DEFAULT_FRONTEND_ID
): CompiledRulepack {
  return loadRulepackSpecFromPath(resolveBundledRulepackPath(frontendId));
}

export async function preloadBundledRulepackSpec(
  frontendId: string = DEFAULT_FRONTEND_ID
): Promise<CompiledRulepack> {
  return preloadRulepackSpecFromPath(resolveBundledRulepackPath(frontendId));
}

export const QLATT_ENGLISH_RULEPACK = await preloadBundledRulepackSpec(DEFAULT_FRONTEND_ID);
