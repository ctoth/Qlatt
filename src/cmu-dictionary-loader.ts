import fs from "node:fs";
import path from "node:path";

export type CmuDictionary = Record<string, string>;
export const DEFAULT_CMU_DICTIONARY_PATH = "/cmu-dictionary.json";

function normalizePath(rawPath: string): string {
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
  return normalized;
}

function isNodeRuntime(): boolean {
  return typeof process !== "undefined" && Boolean(process.versions?.node);
}

function parseDictionary(source: string, label: string): CmuDictionary {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`E_CMU_DICT_PARSE: '${label}' is not valid JSON (${detail})`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`E_CMU_DICT_SCHEMA: '${label}' must be a JSON object`);
  }

  const output: CmuDictionary = {};
  for (const [word, pronunciation] of Object.entries(parsed)) {
    if (typeof pronunciation !== "string") {
      throw new Error(`E_CMU_DICT_SCHEMA: entry '${word}' must map to a string pronunciation`);
    }
    output[word] = pronunciation;
  }
  return output;
}

function readFromFsSync(specPath: string): string | null {
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

const DICTIONARY_CACHE = new Map<string, CmuDictionary>();

function normalizeAttempts(specPath: string): string[] {
  const normalizedPath = normalizePath(specPath);
  return [normalizedPath, specPath].filter((value, index, all) => all.indexOf(value) === index);
}

export function listBundledCmuDictionaryPaths(): string[] {
  const known = new Set<string>([...DICTIONARY_CACHE.keys(), DEFAULT_CMU_DICTIONARY_PATH]);
  return [...known].sort();
}

export async function preloadCmuDictionaryFromPath(
  specPath: string = DEFAULT_CMU_DICTIONARY_PATH
): Promise<CmuDictionary> {
  const cached = DICTIONARY_CACHE.get(specPath);
  if (cached) return cached;

  const attempts = normalizeAttempts(specPath);

  if (isNodeRuntime()) {
    for (const attempt of attempts) {
      const source = readFromFsSync(attempt);
      if (typeof source !== "string") continue;
      const parsed = parseDictionary(source, attempt);
      DICTIONARY_CACHE.set(specPath, parsed);
      return parsed;
    }
  }

  if (typeof fetch === "function") {
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt);
        if (!response.ok) continue;
        const source = await response.text();
        const parsed = parseDictionary(source, attempt);
        DICTIONARY_CACHE.set(specPath, parsed);
        return parsed;
      } catch {
        // Try next candidate path.
      }
    }
  }

  for (const attempt of attempts) {
    const source = readFromFsSync(attempt);
    if (typeof source !== "string") continue;
    const parsed = parseDictionary(source, attempt);
    DICTIONARY_CACHE.set(specPath, parsed);
    return parsed;
  }

  const known = listBundledCmuDictionaryPaths();
  throw new Error(
    `E_CMU_DICT_PATH_UNKNOWN: '${specPath}' could not be loaded` +
      (known.length > 0 ? ` (known: ${known.join(", ")})` : "")
  );
}
