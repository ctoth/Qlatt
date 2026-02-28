import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

type PlainObject = Record<string, unknown>;

function normalizePath(rawPath: string): string {
  const base = (typeof import.meta !== 'undefined' && (import.meta as any).env?.BASE_URL) || "/";
  let normalized = rawPath.trim().replace(/\\/g, "/");
  if (normalized.startsWith("/public/")) {
    normalized = normalized.slice("/public".length);
  }
  if (normalized.startsWith("./")) {
    normalized = normalized.slice(1);
  }
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  // Prepend BASE_URL so paths resolve correctly on subpath deployments
  // (e.g. GitHub Pages at /Qlatt/). normalized starts with "/",
  // base ends with "/" (Vite guarantees this), so slice the leading "/".
  return base + normalized.slice(1);
}

function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function readYamlSourceFromUrlSync(specPath: string): string | null {
  if (typeof XMLHttpRequest !== "function") return null;
  const request = new XMLHttpRequest();
  request.open("GET", specPath, false);
  request.send();
  if (request.status < 200 || request.status >= 300) return null;
  return typeof request.responseText === "string" ? request.responseText : null;
}

function readYamlSourceFromFsSync(specPath: string): string | null {
  if (!isNodeRuntime()) return null;

  const normalized = normalizePath(specPath);
  const relativePath = normalized.replace(/^\/+/, "");
  const candidates = new Set<string>();

  if (path.isAbsolute(specPath)) {
    candidates.add(specPath);
  }
  if (relativePath.length > 0) {
    candidates.add(path.resolve(process.cwd(), "public", relativePath));
    candidates.add(path.resolve(process.cwd(), relativePath));
  }

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      return fs.readFileSync(candidate, "utf8");
    } catch {
      // Ignore individual filesystem probe failures.
    }
  }

  return null;
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
    const fromFs = readYamlSourceFromFsSync(attempt);
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
      const fromFs = readYamlSourceFromFsSync(attempt);
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

  for (const attempt of attempts) {
    const fromFs = readYamlSourceFromFsSync(attempt);
    if (typeof fromFs === "string") return fromFs;
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
