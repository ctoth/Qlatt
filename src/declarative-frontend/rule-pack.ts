import {
  DSL_ROOT_KEYS,
  parseDslSpec,
  type NormalizedDslSpec,
} from "./parser";
import {
  assertValidSpec,
  type ValidationDiagnostic,
} from "./validation";
import {
  loadInventorySpecFromPath,
  preloadInventorySpecFromPath,
  type InventorySpec,
} from "./inventory";
import {
  cloneValue,
  isPlainObject,
  loadYamlSource,
  loadYamlSourceSync,
  parseYamlString,
  resolveIncludePath,
} from "../yaml-loader";

type PlainObject = Record<string, unknown>;

/** Parse a rulepack YAML source into a raw object document (no DSL normalization). */
function parseRulepackDocument(source: string, label: string): PlainObject {
  const document = parseYamlString(source, label);
  if (!isPlainObject(document)) {
    throw new Error(`E_RULEPACK_DOCUMENT: ${label} must be a YAML object document`);
  }
  return document;
}

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
  "tags",
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
 * - rules, predicates, patterns, relations, tags: merge by key, error on duplicate
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
    "tags",
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

// ---------------------------------------------------------------------------
// Cross-frontend inheritance: `extends: <baseFrontendId>`
// ---------------------------------------------------------------------------
//
// A frontend rulepack may declare `extends: qlatt-english` to inherit the base
// frontend's root document (version, parameters/policy tree, output, speaker/
// source paths, transcription, …). The child's own root keys override the base
// via deep merge (child wins at every leaf; arrays and scalars replace, nested
// objects merge). This lets a near-clone frontend (e.g. qlatt-beauty) be
// expressed as "base + delta" instead of a full copy.
//
// Included files are resolved with a base-directory FALLBACK: a relative
// include that is absent under the child frontend's directory is resolved
// against the base frontend's directory instead. This is how the child inherits
// the base's byte-identical phase files without keeping local copies — beauty's
// own files (which exist under its directory) override "by path", and any file
// it does not provide falls through to the base.
//
// Only the child's root document is merged (NOT the base's resolved includes),
// so the base contributes root-level data (parameters, output, …) while rules/
// phases come from the child's own (fallback-resolved) include list.

/** Directory portion of a "/"-separated resource path. */
function dirOfPath(path: string): string {
  return path.substring(0, path.lastIndexOf("/"));
}

/**
 * Deep-merge two plain objects, child winning at every leaf.
 * - Two plain objects → merge keys recursively.
 * - Anything else (arrays, scalars, type mismatch) → child value replaces base.
 */
function deepMergeChildWins(base: unknown, child: unknown): unknown {
  if (isPlainObject(base) && isPlainObject(child)) {
    const out: PlainObject = {};
    for (const key of Object.keys(base)) out[key] = cloneValue(base[key]);
    for (const [key, value] of Object.entries(child)) {
      out[key] = key in out ? deepMergeChildWins(out[key], value) : cloneValue(value);
    }
    return out;
  }
  return cloneValue(child);
}

/** Base-directory fallback for include resolution under `extends`. */
type IncludeFallback = { readonly fromDir: string; readonly toDir: string };

/**
 * Rewrite a child-directory absolute include path to its base-directory
 * equivalent, when the child does not provide the file. Returns null when no
 * fallback applies.
 */
function fallbackIncludePath(
  absPath: string,
  fallback: IncludeFallback | undefined,
): string | null {
  if (!fallback) return null;
  const prefix = fallback.fromDir + "/";
  if (!absPath.startsWith(prefix)) return null;
  return fallback.toDir + "/" + absPath.slice(prefix.length);
}

/**
 * Synchronously resolve includes for a parsed spec.
 * Recursively loads, parses, and merges child specs.
 * Detects circular includes via a set of already-seen paths.
 * When `fallback` is set (child `extends` a base frontend), a relative include
 * absent under the child directory is loaded from the base directory instead.
 */
function resolveIncludesSync(
  spec: PlainObject,
  parentPath: string,
  seen?: Set<string>,
  fallback?: IncludeFallback,
): PlainObject {
  const seenPaths = seen ?? new Set([parentPath]);
  const includes = spec.include as string[] | undefined;
  if (!includes || includes.length === 0) return spec;

  let resolved = spec;

  for (const relPath of includes) {
    let absPath = resolveIncludePath(parentPath, relPath);
    let source: string;
    try {
      source = loadYamlSourceSync(absPath);
    } catch (error) {
      const altPath = fallbackIncludePath(absPath, fallback);
      if (altPath === null) throw error;
      source = loadYamlSourceSync(altPath);
      absPath = altPath;
    }
    if (seenPaths.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath} (from ${parentPath})`);
    }
    seenPaths.add(absPath);

    const childDocument = parseRulepackDocument(source, `included rulepack ${absPath}`);
    const resolvedChild = resolveIncludesSync(childDocument, absPath, seenPaths, fallback);
    resolved = mergeChildIntoRoot(resolved, resolvedChild, absPath);
  }

  return resolved;
}

/**
 * Synchronously resolve a root document's `extends` clause, returning the merged
 * root and the include fallback (child dir → base dir) to use when resolving the
 * merged root's includes. When no `extends` is present, the document and an
 * undefined fallback are returned unchanged.
 */
function resolveExtendsSync(
  rootDoc: PlainObject,
  rootPath: string,
): { doc: PlainObject; fallback: IncludeFallback | undefined } {
  const baseId = rootDoc.extends;
  if (typeof baseId !== "string" || baseId.length === 0) {
    return { doc: rootDoc, fallback: undefined };
  }
  const basePath = resolveBundledRulepackPath(baseId);
  const baseSource = loadYamlSourceSync(basePath);
  const baseDoc = parseRulepackDocument(baseSource, `base rulepack ${basePath}`);
  const merged = deepMergeChildWins(baseDoc, rootDoc) as PlainObject;
  delete merged.extends;
  return {
    doc: merged,
    fallback: { fromDir: dirOfPath(rootPath), toDir: dirOfPath(basePath) },
  };
}

/** Async counterpart to {@link resolveExtendsSync}. */
async function resolveExtendsAsync(
  rootDoc: PlainObject,
  rootPath: string,
): Promise<{ doc: PlainObject; fallback: IncludeFallback | undefined }> {
  const baseId = rootDoc.extends;
  if (typeof baseId !== "string" || baseId.length === 0) {
    return { doc: rootDoc, fallback: undefined };
  }
  const basePath = resolveBundledRulepackPath(baseId);
  const baseSource = await loadYamlSource(basePath);
  const baseDoc = parseRulepackDocument(baseSource, `base rulepack ${basePath}`);
  const merged = deepMergeChildWins(baseDoc, rootDoc) as PlainObject;
  delete merged.extends;
  return {
    doc: merged,
    fallback: { fromDir: dirOfPath(rootPath), toDir: dirOfPath(basePath) },
  };
}

/**
 * Asynchronously resolve includes for a parsed spec.
 * Same as resolveIncludesSync but uses async loadYamlSource.
 */
async function resolveIncludesAsync(
  spec: PlainObject,
  parentPath: string,
  seen?: Set<string>,
  fallback?: IncludeFallback,
): Promise<PlainObject> {
  const seenPaths = seen ?? new Set([parentPath]);
  const includes = spec.include as string[] | undefined;
  if (!includes || includes.length === 0) return spec;

  let resolved = spec;

  for (const relPath of includes) {
    let absPath = resolveIncludePath(parentPath, relPath);
    let source: string;
    try {
      source = await loadYamlSource(absPath);
    } catch (error) {
      const altPath = fallbackIncludePath(absPath, fallback);
      if (altPath === null) throw error;
      source = await loadYamlSource(altPath);
      absPath = altPath;
    }
    if (seenPaths.has(absPath)) {
      throw new Error(`Circular include detected: ${absPath} (from ${parentPath})`);
    }
    seenPaths.add(absPath);

    const childDocument = parseRulepackDocument(source, `included rulepack ${absPath}`);
    const resolvedChild = await resolveIncludesAsync(childDocument, absPath, seenPaths, fallback);
    resolved = mergeChildIntoRoot(resolved, resolvedChild, absPath);
  }

  return resolved;
}

export type CompiledRulepack = Readonly<NormalizedDslSpec>;

const BUNDLED_RULEPACK_CACHE = new Map<string, CompiledRulepack>();
const RULEPACK_DIAGNOSTICS = new WeakMap<object, readonly ValidationDiagnostic[]>();

function validationInventoryPhonemes(inventory: InventorySpec | null): string[] | undefined {
  if (!inventory) return undefined;
  const symbols = new Set(Object.keys(inventory.normalization_aliases ?? {}));
  for (const phoneme of Object.keys(inventory.phoneme_targets)) {
    symbols.add(phoneme);
    symbols.add(phoneme.replace(/[01]$/, ""));
  }
  return [...symbols];
}

function recordDiagnostics(
  spec: CompiledRulepack,
  diagnostics: ValidationDiagnostic[],
): void {
  RULEPACK_DIAGNOSTICS.set(
    spec,
    Object.freeze(diagnostics.map((diagnostic) => Object.freeze({ ...diagnostic }))),
  );
}

export function getRulepackValidationDiagnostics(
  spec: CompiledRulepack,
): readonly ValidationDiagnostic[] {
  return RULEPACK_DIAGNOSTICS.get(spec) ?? Object.freeze([]);
}

export function compileRuleEngineSpec(source: unknown): CompiledRulepack {
  const parameterSchemaDeclared = isPlainObject(source) &&
    Object.prototype.hasOwnProperty.call(source, "parameters");
  const spec = parseDslSpec(source);
  const inventory = typeof spec.inventory_path === "string"
    ? loadInventorySpecFromPath(spec.inventory_path)
    : null;
  const diagnostics = assertValidSpec(spec, {
    inventoryPhonemes: validationInventoryPhonemes(inventory),
    parameterSchemaDeclared,
  });
  recordDiagnostics(spec, diagnostics);
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

  // Resolve `extends` (cross-frontend inheritance) first, then resolve includes
  // on the raw parsed YAML, then normalize the merged tree exactly once.
  // Previously the root was normalized twice: once before include resolution and
  // again on the merged result. Normalizing only the final merged tree parses
  // each spec (root and every child) exactly one time.
  const { doc: rootDoc, fallback } = resolveExtendsSync(
    parseRulepackDocument(source, specPath),
    specPath,
  );
  const merged = resolveIncludesSync(rootDoc, specPath, undefined, fallback);
  const spec = parseDslSpec(merged);
  const inventory = typeof spec.inventory_path === "string"
    ? loadInventorySpecFromPath(spec.inventory_path)
    : null;
  const diagnostics = assertValidSpec(spec, {
    inventoryPhonemes: validationInventoryPhonemes(inventory),
    requireLoweringSpec: true,
    requireTagVocabulary: true,
  });
  recordDiagnostics(spec, diagnostics);
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

  // See loadRulepackSpecFromPath: resolve `extends` then includes on the raw
  // YAML, then normalize the merged tree exactly once.
  const { doc: rootDoc, fallback } = await resolveExtendsAsync(
    parseRulepackDocument(source, specPath),
    specPath,
  );
  const merged = await resolveIncludesAsync(rootDoc, specPath, undefined, fallback);
  const spec = parseDslSpec(merged);
  const inventory = typeof spec.inventory_path === "string"
    ? await preloadInventorySpecFromPath(spec.inventory_path)
    : null;
  const diagnostics = assertValidSpec(spec, {
    inventoryPhonemes: validationInventoryPhonemes(inventory),
    requireLoweringSpec: true,
    requireTagVocabulary: true,
  });
  recordDiagnostics(spec, diagnostics);
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
