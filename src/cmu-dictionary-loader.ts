import { isNodeRuntime, normalizePath, readFileFromFsSync } from "./path-utils";

function readDictionarySourceFromUrlSync(specPath: string): string | null {
  if (typeof XMLHttpRequest !== "function") return null;
  const request = new XMLHttpRequest();
  request.open("GET", specPath, false);
  request.send();
  if (request.status < 200 || request.status >= 300) return null;
  return typeof request.responseText === "string" ? request.responseText : null;
}

export type CmuDictionary = Record<string, string>;
export const DEFAULT_CMU_DICTIONARY_PATH = "/cmu-dictionary.json";

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
  specPath: string = DEFAULT_CMU_DICTIONARY_PATH,
): Promise<CmuDictionary> {
  const cached = DICTIONARY_CACHE.get(specPath);
  if (cached) return cached;

  const attempts = normalizeAttempts(specPath);

  if (isNodeRuntime()) {
    for (const attempt of attempts) {
      const source = readFileFromFsSync(attempt);
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

  const known = listBundledCmuDictionaryPaths();
  throw new Error(
    `E_CMU_DICT_PATH_UNKNOWN: '${specPath}' could not be loaded` +
      (known.length > 0 ? ` (known: ${known.join(", ")})` : ""),
  );
}

/**
 * Synchronous per-path dictionary loader.
 *
 * Mirrors {@link loadYamlSourceSync}'s strategy (sync XHR in the browser, sync
 * filesystem read under Node) so the synchronous TTS pipeline can load a
 * per-frontend dictionary declared via `dictionary_path`. Caches per path in
 * the same {@link DICTIONARY_CACHE} the async loader uses, so a path loaded
 * either way is shared. Generic: a path -> a parsed flat word->pron map.
 */
export function loadCmuDictionaryFromPathSync(specPath: string): CmuDictionary {
  const cached = DICTIONARY_CACHE.get(specPath);
  if (cached) return cached;

  const attempts = normalizeAttempts(specPath);

  for (const attempt of attempts) {
    const fromUrl = readDictionarySourceFromUrlSync(attempt);
    if (typeof fromUrl === "string") {
      const parsed = parseDictionary(fromUrl, attempt);
      DICTIONARY_CACHE.set(specPath, parsed);
      return parsed;
    }
  }

  for (const attempt of attempts) {
    const source = readFileFromFsSync(attempt);
    if (typeof source === "string") {
      const parsed = parseDictionary(source, attempt);
      DICTIONARY_CACHE.set(specPath, parsed);
      return parsed;
    }
  }

  const known = listBundledCmuDictionaryPaths();
  throw new Error(
    `E_CMU_DICT_PATH_UNKNOWN: '${specPath}' could not be loaded` +
      (known.length > 0 ? ` (known: ${known.join(", ")})` : ""),
  );
}
