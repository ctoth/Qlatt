/**
 * Text of resources fetched ahead of time, for the synchronous loaders.
 *
 * The frontend pipeline is synchronous, so in a browser its YAML and JSON
 * resources are read with synchronous XMLHttpRequest, one after another, on
 * the main thread: about fifty requests for the dectalk-english frontend, each
 * a network round trip on a deployed site. A host that knows which resources
 * a frontend reads (its resource manifest, `resources.json` beside
 * `frontend.yaml`) can fetch them in parallel beforehand with
 * {@link primeSyncResources}; the synchronous loaders then find the text here
 * and make no request.
 *
 * Nothing is primed unless a host asks. A resource that was not primed is
 * loaded as before.
 *
 * The other half is the record of what the synchronous loaders read, which is
 * how a manifest is made and kept true
 * (scripts/build-frontend-resource-manifests.ts).
 */

import { normalizePath } from "./path-utils.ts";
import { isAbsentResourceAnswer } from "./resource-answer.ts";

const primed = new Map<string, string>();
/** Paths and URLs the server said have no resource behind them. */
const absent = new Set<string>();
let recording: string[] | null = null;
const fetchedSynchronously: string[] = [];

/** The primed text of a resource, by the path or URL a loader is about to request. */
export function primedSyncResource(pathOrUrl: string): string | undefined {
  return primed.get(pathOrUrl);
}

/**
 * True when the server has already said there is no resource at this path or
 * URL ({@link isAbsentResourceAnswer}). A loader does not ask again.
 */
export function isAbsentSyncResource(pathOrUrl: string): boolean {
  return absent.has(pathOrUrl);
}

/** Record that the server said there is no resource at this path or URL. */
export function noteAbsentSyncResource(pathOrUrl: string): void {
  absent.add(pathOrUrl);
}

export interface PrimeSyncResourcesResult {
  /** Paths the server said do not exist. Nothing is kept as their text. */
  absent: string[];
  /** Paths whose request failed for any other reason. A loader asks again. */
  failed: string[];
}

/**
 * Fetch resources in parallel and keep their text for the synchronous
 * loaders. `paths` are resource paths as the loaders are given them
 * (`/rules/frontends/...`). Returns the paths that were not primed: those the
 * server said do not exist, which the loaders then treat as absent without
 * asking again, and those whose request failed, which are loaded as before.
 */
export async function primeSyncResources(
  paths: readonly string[],
): Promise<PrimeSyncResourcesResult> {
  const result: PrimeSyncResourcesResult = { absent: [], failed: [] };
  await Promise.all(
    paths.map(async (path) => {
      if (primed.has(path)) return;
      if (absent.has(path)) {
        result.absent.push(path);
        return;
      }
      const url = normalizePath(path);
      try {
        const response = await fetch(url);
        if (isAbsentResourceAnswer(response.status, response.headers.get("content-type"))) {
          absent.add(path);
          absent.add(url);
          result.absent.push(path);
          return;
        }
        if (!response.ok) {
          result.failed.push(path);
          return;
        }
        const text = await response.text();
        primed.set(path, text);
        primed.set(url, text);
      } catch {
        result.failed.push(path);
      }
    }),
  );
  return result;
}

/**
 * Keep text a synchronous loader fetched with a blocking request, so that the
 * same resource is not requested again. The loaders' callers each cache what
 * they parse, per caller: without this a file with two readers (a voice file
 * is read when the rule pack is checked and again at every utterance) is one
 * request per read.
 */
export function keepSyncResource(pathOrUrl: string, text: string): void {
  primed.set(pathOrUrl, text);
}

/** Forget every primed resource and every recorded absence. */
export function clearPrimedSyncResources(): void {
  primed.clear();
  absent.clear();
}

/**
 * Called by a synchronous loader for every resource path it is asked for,
 * before it looks anywhere. Feeds {@link recordSyncResources}.
 */
export function noteSyncResourceRequest(path: string): void {
  recording?.push(path);
}

/**
 * Called by a synchronous loader when it had to make a blocking request for a
 * resource because it was not primed.
 */
export function noteSynchronousFetch(path: string): void {
  fetchedSynchronously.push(path);
}

/**
 * Resources the synchronous loaders fetched with a blocking request since the
 * last call: what a host's priming missed.
 */
export function takeSynchronousFetches(): string[] {
  return fetchedSynchronously.splice(0);
}

/**
 * Record every resource path the synchronous loaders are asked for until the
 * returned function is called; it returns the distinct paths in first-request
 * order.
 */
export function recordSyncResources(): () => string[] {
  const mine: string[] = [];
  recording = mine;
  return () => {
    if (recording === mine) recording = null;
    return [...new Set(mine)];
  };
}
