import { parseDslSpec, SPEC_VALIDATED } from "./parser";
import { assertValidSpec } from "./validation";
import { loadYamlSource, loadYamlSourceSync, resolveIncludePath } from "../yaml-loader";

type PlainObject = Record<string, unknown>;

export const DEFAULT_RULEPACK_PATH = "/rules/frontend.yaml";

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
  // Merge keyed dictionaries (error on duplicate)
  for (const key of ["rules", "predicates", "patterns", "streams"] as const) {
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
  // All other fields: root wins, child ignored — nothing to do.
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

export function listBundledRulepackPaths(): string[] {
  const known = new Set<string>([...BUNDLED_RULEPACK_CACHE.keys(), DEFAULT_RULEPACK_PATH]);
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
  assertValidSpec(spec);
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
  assertValidSpec(spec);
  (spec as any)[SPEC_VALIDATED] = true;
  BUNDLED_RULEPACK_CACHE.set(specPath, spec);
  return spec;
}

export const QLATT_V12_CEL_RULEPACK = await preloadRulepackSpecFromPath(DEFAULT_RULEPACK_PATH);
