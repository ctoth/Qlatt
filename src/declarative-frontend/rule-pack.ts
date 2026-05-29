import { parseDslSpec, SPEC_VALIDATED } from "./parser";
import { assertValidSpec } from "./validation";
import { loadYamlSource, loadYamlSourceSync, resolveIncludePath } from "../yaml-loader";

type PlainObject = Record<string, unknown>;

const ROOT_DSL_KEYS = new Set([
  "version",
  "inventory_path",
  "lts_path",
  "f0_model",
  "parameters",
  "input_contract",
  "streams",
  "topology",
  "predicates",
  "string_sets",
  "maps",
  "syllabification",
  "patterns",
  "phases",
  "rules",
  "interpolation",
  "output",
  "transcription",
  "include",
]);

const MERGED_CHILD_ROOT_KEYS = new Set([
  "rules",
  "predicates",
  "patterns",
  "streams",
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
 * - rules, predicates, patterns, streams: merge by key, error on duplicate
 * - phases: concat (root first, then child)
 * - topology: concat + dedup each sub-key (hierarchy, parallel, point)
 * - All other fields (version, parameters, output, etc.): root wins, child ignored
 */
function mergeChildIntoRoot(root: PlainObject, child: PlainObject, childPath: string): void {
  // Merge keyed dictionaries (error on duplicate).
  // Chunk 3: `string_sets` and `maps` are pipeline-level reusable literal-data
  // blocks; merge them the same way as predicates so a child include can
  // declare them.
  for (const key of [
    "rules",
    "predicates",
    "patterns",
    "streams",
    "string_sets",
    "maps",
  ] as const) {
    const childDict = (child[key] ?? {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(childDict)) {
      if (!root[key]) root[key] = {};
      const rootDict = root[key] as Record<string, unknown>;
      if (rootDict[k] !== undefined) {
        throw new Error(`Duplicate ${key} "${k}" in included file ${childPath}`);
      }
      rootDict[k] = v;
    }
  }

  // Syllabification: a single whole-object block (not a keyed dictionary).  A
  // child include may supply it; error if both root and child declare one.
  if (child.syllabification !== undefined && hasNonEmptyValue(child.syllabification)) {
    if (root.syllabification !== undefined && hasNonEmptyValue(root.syllabification)) {
      throw new Error(`Duplicate syllabification block in included file ${childPath}`);
    }
    root.syllabification = child.syllabification;
  }

  // Phases: concat (root first, then child in include order)
  const childPhases = child.phases as unknown[];
  if (Array.isArray(childPhases) && childPhases.length > 0) {
    root.phases = [...(Array.isArray(root.phases) ? root.phases : []), ...childPhases];
  }

  // Topology: concat + dedup each sub-key
  const childTopology = child.topology as PlainObject | undefined;
  if (childTopology && typeof childTopology === "object") {
    if (!root.topology) root.topology = {};
    const rootTopology = root.topology as PlainObject;
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
    if (!ROOT_DSL_KEYS.has(key)) continue;
    if (!hasNonEmptyValue(value)) continue;
    throw new Error(
      `E_UNMERGED_CHILD_ROOT_KEY: included file ${childPath} declares non-empty root key "${key}", but mergeChildIntoRoot does not merge that key`
    );
  }
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

  for (const relPath of includes) {
    const absPath = resolveIncludePath(parentPath, relPath);
    if (seenPaths.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath} (from ${parentPath})`);
    }
    seenPaths.add(absPath);

    const source = loadYamlSourceSync(absPath);
    const childSpec = parseDslSpec(source);
    resolveIncludesSync(childSpec, absPath, seenPaths);
    mergeChildIntoRoot(spec, childSpec, absPath);
  }

  return spec;
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

  for (const relPath of includes) {
    const absPath = resolveIncludePath(parentPath, relPath);
    if (seenPaths.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath} (from ${parentPath})`);
    }
    seenPaths.add(absPath);

    const source = await loadYamlSource(absPath);
    const childSpec = parseDslSpec(source);
    await resolveIncludesAsync(childSpec, absPath, seenPaths);
    mergeChildIntoRoot(spec, childSpec, absPath);
  }

  return spec;
}

const BUNDLED_RULEPACK_CACHE = new Map<string, PlainObject>();

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

  const spec = parseDslSpec(source);
  resolveIncludesSync(spec, specPath);
  assertValidSpec(spec, { requireLoweringSpec: true });
  (spec as any)[SPEC_VALIDATED] = true;
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

  const spec = parseDslSpec(source);
  await resolveIncludesAsync(spec, specPath);
  assertValidSpec(spec, { requireLoweringSpec: true });
  (spec as any)[SPEC_VALIDATED] = true;
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export function loadBundledRulepackSpec(
  frontendId: string = DEFAULT_FRONTEND_ID
): PlainObject {
  return loadRulepackSpecFromPath(resolveBundledRulepackPath(frontendId));
}

export async function preloadBundledRulepackSpec(
  frontendId: string = DEFAULT_FRONTEND_ID
): Promise<PlainObject> {
  return preloadRulepackSpecFromPath(resolveBundledRulepackPath(frontendId));
}

export const QLATT_ENGLISH_RULEPACK = await preloadBundledRulepackSpec(DEFAULT_FRONTEND_ID);
