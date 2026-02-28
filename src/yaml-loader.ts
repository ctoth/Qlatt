import yaml from "js-yaml";
import { normalizePath, isNodeRuntime, readFileFromFsSync } from "./path-utils";

type PlainObject = Record<string, unknown>;

function readYamlSourceFromUrlSync(specPath: string): string | null {
  if (typeof XMLHttpRequest !== "function") return null;
  const request = new XMLHttpRequest();
  request.open("GET", specPath, false);
  request.send();
  if (request.status < 200 || request.status >= 300) return null;
  return typeof request.responseText === "string" ? request.responseText : null;
}

function parseYaml<T = unknown>(source: string, label: string): T {
  const parsed = yaml.load(source);
  if (parsed === null || parsed === undefined) {
    throw new Error(`E_YAML_SCHEMA: '${label}' resolved to empty document`);
  }
  return parsed as T;
}

export function loadYamlSourceSync(specPath: string): string {
  const normalizedPath = normalizePath(specPath);
  const attempts = [normalizedPath, specPath].filter((value, index, all) => all.indexOf(value) === index);

  for (const attempt of attempts) {
    const fromUrl = readYamlSourceFromUrlSync(attempt);
    if (typeof fromUrl === "string") return fromUrl;
  }

  for (const attempt of attempts) {
    const fromFs = readFileFromFsSync(attempt);
    if (typeof fromFs === "string") return fromFs;
  }

  throw new Error(`E_YAML_PATH_UNKNOWN: '${specPath}' could not be loaded`);
}

export async function loadYamlSource(specPath: string): Promise<string> {
  const normalizedPath = normalizePath(specPath);
  const attempts = [normalizedPath, specPath].filter((value, index, all) => all.indexOf(value) === index);

  // In Node/test/CLI, prefer filesystem paths to avoid failed fetch() probes.
  if (isNodeRuntime()) {
    for (const attempt of attempts) {
      const fromFs = readFileFromFsSync(attempt);
      if (typeof fromFs === "string") return fromFs;
    }
  }

  if (typeof fetch === "function") {
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt);
        if (!response.ok) continue;
        return await response.text();
      } catch {
        // Try next candidate path.
      }
    }
  }

  throw new Error(`E_YAML_PATH_UNKNOWN: '${specPath}' could not be loaded`);
}

export async function loadYamlDocument<T = unknown>(specPath: string): Promise<T> {
  const source = await loadYamlSource(specPath);
  return parseYaml<T>(source, specPath);
}

export async function loadYamlDocumentOrNull<T = unknown>(specPath: string): Promise<T | null> {
  try {
    return await loadYamlDocument<T>(specPath);
  } catch {
    return null;
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
 * @example resolveIncludePath("/rules/frontend.yaml", "duration.yaml") → "/rules/duration.yaml"
 * @example resolveIncludePath("/rules/frontend.yaml", "/shared/common.yaml") → "/shared/common.yaml"
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
      Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)])
    );
  }
  return value;
}
