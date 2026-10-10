import { load as loadYaml } from "js-yaml";
import {
  isNodeRuntime,
  normalizePath,
  readFileFromFsSync,
  resolveFileFromFsSync,
} from "./path-utils";
import {
  keepSyncResource,
  noteSynchronousFetch,
  noteSyncResourceRequest,
  primedSyncResource,
} from "./sync-resource-cache";

type PlainObject = Record<string, unknown>;

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

function readYamlSourceFromUrlSync(specPath: string): string | null {
  if (typeof XMLHttpRequest !== "function") return null;
  const request = new XMLHttpRequest();
  request.open("GET", specPath, false);
  request.send();
  if (request.status < 200 || request.status >= 300) return null;
  return typeof request.responseText === "string" ? request.responseText : null;
}

function parseYaml<T = unknown>(source: string, label: string): T {
  const parsed = loadYaml(source);
  if (parsed === null || parsed === undefined) {
    throw new Error(`E_YAML_SCHEMA: '${label}' resolved to empty document`);
  }
  return parsed as T;
}

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
    const fromUrl = readYamlSourceFromUrlSync(attempt);
    if (typeof fromUrl === "string") {
      noteSyncResourceRequest(specPath);
      noteSynchronousFetch(specPath);
      keepSyncResource(attempt, fromUrl);
      return fromUrl;
    }
  }

  for (const attempt of attempts) {
    const fromFs = readFileFromFsSync(attempt);
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
      const fromFs = readFileFromFsSync(attempt);
      if (typeof fromFs === "string") return fromFs;
      const existing = resolveFileFromFsSync(attempt);
      if (existing !== null) {
        throw new Error(`E_YAML_READ: '${specPath}' exists at '${existing}' but could not be read`);
      }
    }
  }

  if (typeof fetch === "function") {
    for (const attempt of attempts) {
      // Under Node a path that is not a URL has no base to resolve against:
      // the filesystem probe above was the whole answer.
      if (isNodeRuntime() && !ABSOLUTE_URL.test(attempt)) continue;
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
      if (response.status === 404 || response.status === 410) continue;
      if (!response.ok) {
        throw new Error(
          `E_YAML_FETCH: '${specPath}' request for '${attempt}' failed (HTTP ${response.status})`,
        );
      }
      // The Vite dev server answers a path with no file behind it with
      // 200 and index.html (its SPA fallback), so an HTML answer to a YAML
      // request is also "no such resource". A YAML file is served as text/yaml.
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.toLowerCase().startsWith("text/html")) continue;
      return await response.text();
    }
  }

  throw new YamlNotFoundError(specPath);
}

export async function loadYamlDocument<T = unknown>(specPath: string): Promise<T> {
  const source = await loadYamlSource(specPath);
  let parsed: unknown;
  try {
    parsed = loadYaml(source);
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

export function parseYamlString<T = unknown>(source: string, label: string = "yaml"): T {
  return parseYaml<T>(source, label);
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
