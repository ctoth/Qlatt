import { isAlias, isMap, isNode, isScalar, isSeq, LineCounter, parseDocument } from "yaml";
import { isNodeRuntime, normalizePath, readFileFromFsSync } from "./path-utils";
import { isAbsentResourceAnswer, requestFailureDetail, requestTextSync } from "./resource-answer";
import {
  isAbsentSyncResource,
  keepSyncResource,
  noteAbsentSyncResource,
  noteSynchronousFetch,
  noteSyncResourceRequest,
  primedSyncResource,
} from "./sync-resource-cache";

type PlainObject = Record<string, unknown>;

export interface YamlSourceIdentity {
  readonly resource: string;
  readonly role: string | null;
}

/** One-based coordinates, with an exclusive end; paths keep sequence indices numeric. */
export interface YamlDocumentSpan extends YamlSourceIdentity {
  readonly path: readonly (string | number)[];
  readonly line: number;
  readonly column: number;
  readonly endLine: number;
  readonly endColumn: number;
}

export interface YamlNodeSpans {
  readonly key?: YamlDocumentSpan;
  readonly value: YamlDocumentSpan;
  /** The authored anchor definition, separate from this alias's occurrence. */
  readonly aliasTarget?: YamlDocumentSpan;
}

const DOCUMENT_SPANS = new WeakMap<object, readonly YamlNodeSpans[]>();
const NO_DOCUMENT_SPANS: readonly YamlNodeSpans[] = Object.freeze([]);

/** Carry authored locations through a transformation that returns a new object. */
export function withYamlDocumentSpans<T extends object>(
  document: T,
  spans: readonly YamlNodeSpans[],
): T {
  DOCUMENT_SPANS.set(document, spans);
  return document;
}

/** Metadata for an uncomposed parsed document; entries can be serialized independently. */
export function yamlDocumentSpans(document: unknown): readonly YamlNodeSpans[] {
  return document !== null && typeof document === "object"
    ? (DOCUMENT_SPANS.get(document) ?? NO_DOCUMENT_SPANS)
    : NO_DOCUMENT_SPANS;
}

function parseYamlValue(source: string, identity: YamlSourceIdentity): unknown {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, {
    version: "1.2",
    schema: "core",
    merge: false,
    uniqueKeys: true,
    lineCounter,
  });
  // parseDocument recovers malformed input into an AST; never consume that recovery.
  if (document.errors.length > 0) throw document.errors[0];
  // No document is different from an explicit null document (including `---`).
  if (document.contents === null) throw new Error("expected a document, but the input is empty");
  const value: unknown = document.toJS();
  if (value === null || typeof value !== "object") return value;

  type LocatedNode = {
    node: unknown;
    key: unknown;
    path: readonly (string | number)[];
  };
  const nodes: LocatedNode[] = [];
  const paths = new Map<object, readonly (string | number)[]>();
  function visit(node: unknown, path: readonly (string | number)[], key?: unknown): void {
    if (!isNode(node)) return;
    const frozenPath = Object.freeze([...path]);
    paths.set(node, frozenPath);
    nodes.push({ node, key, path: frozenPath });
    if (isMap(node)) {
      for (const pair of node.items) {
        const name = isScalar(pair.key) ? String(pair.key.value) : String(pair.key);
        visit(pair.value, [...path, name], pair.key);
      }
    } else if (isSeq(node)) {
      node.items.forEach((item, index) => {
        visit(item, [...path, index]);
      });
    }
    // Aliases are not traversed: their target is indexed at its authored path.
  }
  function span(node: unknown, path: readonly (string | number)[]): YamlDocumentSpan | undefined {
    if (!isNode(node) || !node.range) return undefined;
    const start = lineCounter.linePos(node.range[0]);
    const end = lineCounter.linePos(node.range[1]);
    return Object.freeze({
      resource: identity.resource,
      role: identity.role,
      path,
      line: start.line,
      column: start.col,
      endLine: end.line,
      endColumn: end.col,
    });
  }
  visit(document.contents, []);
  const index: YamlNodeSpans[] = [];
  for (const entry of nodes) {
    const valueSpan = span(entry.node, entry.path);
    if (!valueSpan) continue;
    const keySpan = span(entry.key, entry.path);
    const target = isAlias(entry.node) ? entry.node.resolve(document) : undefined;
    const targetPath = target && paths.get(target);
    const aliasTarget = targetPath ? span(target, targetPath) : undefined;
    index.push(
      Object.freeze({
        ...(keySpan ? { key: keySpan } : {}),
        value: valueSpan,
        ...(aliasTarget ? { aliasTarget } : {}),
      }),
    );
  }
  DOCUMENT_SPANS.set(value, Object.freeze(index));
  return value;
}

/**
 * The resource does not exist: no primed text, no file, and (in a browser) the
 * server said so. Every other load failure is some other error.
 */
export class YamlNotFoundError extends Error {
  readonly code = "E_YAML_PATH_UNKNOWN";

  constructor(specPath: string) {
    super(`E_YAML_PATH_UNKNOWN: '${specPath}' could not be loaded`);
    this.name = "YamlNotFoundError";
  }
}

/**
 * True for a {@link YamlNotFoundError}. Checks the code, not the class, so an
 * error from another instance of this module (a hot reload, a test's module
 * reset) is still recognized.
 */
export function isYamlNotFoundError(error: unknown): boolean {
  return error instanceof Error && (error as { code?: unknown }).code === "E_YAML_PATH_UNKNOWN";
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:\/\//i;

function parseYaml<T = unknown>(
  source: string,
  label: string,
  identity: YamlSourceIdentity = { resource: label, role: null },
): T {
  const parsed = parseYamlValue(source, identity);
  if (parsed === null || parsed === undefined) {
    throw new Error(`E_YAML_SCHEMA: '${label}' resolved to empty document`);
  }
  return parsed as T;
}

function readYamlFile(specPath: string, attempt: string): string | null {
  try {
    return readFileFromFsSync(attempt);
  } catch (cause) {
    throw new Error(`E_YAML_READ: '${specPath}' could not be read via '${attempt}'`, { cause });
  }
}

/**
 * Throws {@link YamlNotFoundError} when the resource does not exist, and a
 * different error when it exists but could not be read or the request for it
 * failed.
 */
export function loadYamlSourceSync(specPath: string): string {
  const normalizedPath = normalizePath(specPath);
  const attempts = [normalizedPath, specPath].filter(
    (value, index, all) => all.indexOf(value) === index,
  );

  // Text a host fetched ahead of time (src/sync-resource-cache.ts): no request.
  for (const attempt of attempts) {
    const fromPrimed = primedSyncResource(attempt);
    if (typeof fromPrimed === "string") {
      noteSyncResourceRequest(specPath);
      return fromPrimed;
    }
  }

  for (const attempt of attempts) {
    // The server already said there is no such resource: no second request.
    if (isAbsentSyncResource(attempt)) continue;
    const answer = requestTextSync(attempt);
    if (answer === null) break;
    if (answer.kind === "absent") {
      noteAbsentSyncResource(attempt);
      continue;
    }
    if (answer.kind === "failed") {
      throw new Error(
        `E_YAML_FETCH: '${specPath}' request for '${attempt}' failed${requestFailureDetail(answer.status, answer.cause)}`,
        { cause: answer.cause },
      );
    }
    noteSyncResourceRequest(specPath);
    noteSynchronousFetch(specPath);
    keepSyncResource(attempt, answer.text);
    return answer.text;
  }

  for (const attempt of attempts) {
    const fromFs = readYamlFile(specPath, attempt);
    if (typeof fromFs === "string") {
      noteSyncResourceRequest(specPath);
      return fromFs;
    }
  }

  throw new YamlNotFoundError(specPath);
}

/**
 * Throws {@link YamlNotFoundError} when the resource does not exist, and a
 * different error when it exists but could not be read or the request for it
 * failed.
 */
export async function loadYamlSource(specPath: string): Promise<string> {
  const normalizedPath = normalizePath(specPath);
  const attempts = [normalizedPath, specPath].filter(
    (value, index, all) => all.indexOf(value) === index,
  );

  // Text already fetched for the synchronous loaders: no second request.
  for (const attempt of attempts) {
    const fromPrimed = primedSyncResource(attempt);
    if (typeof fromPrimed === "string") return fromPrimed;
  }

  // In Node/test/CLI, prefer filesystem paths to avoid failed fetch() probes.
  if (isNodeRuntime()) {
    for (const attempt of attempts) {
      const fromFs = readYamlFile(specPath, attempt);
      if (typeof fromFs === "string") return fromFs;
    }
  }

  if (typeof fetch === "function") {
    for (const attempt of attempts) {
      // Under Node a path that is not a URL has no base to resolve against:
      // the filesystem probe above was the whole answer.
      if (isNodeRuntime() && !ABSOLUTE_URL.test(attempt)) continue;
      // The server already said there is no such resource: no second request.
      if (isAbsentSyncResource(attempt)) continue;
      let response: Response;
      try {
        response = await fetch(attempt);
      } catch (error) {
        // A request that got no answer says nothing about whether the
        // resource exists.
        throw new Error(
          `E_YAML_FETCH: '${specPath}' request for '${attempt}' failed: ${errorText(error)}`,
          { cause: error },
        );
      }
      // 404, 410, or the Vite dev server's 200 with index.html.
      if (isAbsentResourceAnswer(response.status, response.headers.get("content-type"))) continue;
      if (!response.ok) {
        throw new Error(
          `E_YAML_FETCH: '${specPath}' request for '${attempt}' failed (HTTP ${response.status})`,
        );
      }
      return await response.text();
    }
  }

  throw new YamlNotFoundError(specPath);
}

export async function loadYamlDocument<T = unknown>(specPath: string): Promise<T> {
  const source = await loadYamlSource(specPath);
  let parsed: unknown;
  try {
    parsed = parseYamlValue(source, { resource: specPath, role: null });
  } catch (error) {
    throw new Error(`E_YAML_PARSE: '${specPath}': ${errorText(error)}`, { cause: error });
  }
  if (parsed === null || parsed === undefined) {
    throw new Error(`E_YAML_SCHEMA: '${specPath}' resolved to empty document`);
  }
  return parsed as T;
}

/**
 * Null only when the resource does not exist ({@link YamlNotFoundError}). A
 * resource that exists but is empty, is not valid YAML, or could not be
 * fetched is an error, with the path in its message.
 */
export async function loadYamlDocumentOrNull<T = unknown>(specPath: string): Promise<T | null> {
  try {
    return await loadYamlDocument<T>(specPath);
  } catch (error) {
    if (isYamlNotFoundError(error)) return null;
    throw error;
  }
}

export function loadYamlDocumentSync<T = unknown>(specPath: string): T {
  const source = loadYamlSourceSync(specPath);
  return parseYaml<T>(source, specPath);
}

export function parseYamlString<T = unknown>(
  source: string,
  label: string = "yaml",
  identity: YamlSourceIdentity = { resource: label, role: null },
): T {
  return parseYaml<T>(source, label, identity);
}

/**
 * Resolve a relative include path against the directory of the parent YAML file.
 * Absolute paths (starting with "/") are returned as-is.
 * Relative paths are resolved against the parent file's directory.
 *
 * @example resolveIncludePath("/rules/frontends/qlatt-english/frontend.yaml", "phases/duration.yaml") → "/rules/frontends/qlatt-english/phases/duration.yaml"
 * @example resolveIncludePath("/rules/frontends/qlatt-english/frontend.yaml", "/shared/common.yaml") → "/shared/common.yaml"
 */
export function resolveIncludePath(parentPath: string, includePath: string): string {
  if (includePath.startsWith("/")) return includePath;
  const parentDir = parentPath.substring(0, parentPath.lastIndexOf("/"));
  return parentDir + "/" + includePath;
}

export function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Recursive deep-clone of plain objects/arrays; primitives returned by identity. */
export function cloneValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneValue(entry));
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]),
    );
  }
  return value;
}
