import { isNodeRuntime, normalizePath, readFileFromFsSync } from "./path-utils";
import { isAbsentResourceAnswer, requestFailureDetail, requestTextSync } from "./resource-answer";
import {
  isAbsentSyncResource,
  noteAbsentSyncResource,
  noteSynchronousFetch,
  noteSyncResourceRequest,
  primedSyncResource,
} from "./sync-resource-cache";

export type CmuDictionary = Record<string, string>;

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
  return [...DICTIONARY_CACHE.keys()].sort();
}

export async function preloadCmuDictionaryFromPath(specPath: string): Promise<CmuDictionary> {
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
      let response: Response;
      try {
        response = await fetch(attempt);
      } catch (error) {
        // A request that got no answer says nothing about whether the
        // dictionary exists.
        throw new Error(
          `E_CMU_DICT_FETCH: '${specPath}' request for '${attempt}' failed${requestFailureDetail(0, error)}`,
          { cause: error },
        );
      }
      // Only a resource the server says does not exist is "try the next path".
      if (isAbsentResourceAnswer(response.status, response.headers.get("content-type"))) continue;
      if (!response.ok) {
        throw new Error(
          `E_CMU_DICT_FETCH: '${specPath}' request for '${attempt}' failed${requestFailureDetail(response.status)}`,
        );
      }
      const parsed = parseDictionary(await response.text(), attempt);
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

  // Text a host fetched ahead of time (src/sync-resource-cache.ts): no request.
  for (const attempt of attempts) {
    const fromPrimed = primedSyncResource(attempt);
    if (typeof fromPrimed === "string") {
      noteSyncResourceRequest(specPath);
      const parsed = parseDictionary(fromPrimed, attempt);
      DICTIONARY_CACHE.set(specPath, parsed);
      return parsed;
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
        `E_CMU_DICT_FETCH: '${specPath}' request for '${attempt}' failed${requestFailureDetail(answer.status, answer.cause)}`,
        { cause: answer.cause },
      );
    }
    noteSyncResourceRequest(specPath);
    noteSynchronousFetch(specPath);
    const parsed = parseDictionary(answer.text, attempt);
    DICTIONARY_CACHE.set(specPath, parsed);
    return parsed;
  }

  for (const attempt of attempts) {
    const source = readFileFromFsSync(attempt);
    if (typeof source === "string") {
      noteSyncResourceRequest(specPath);
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
