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

import { normalizePath } from "./path-utils";

const primed = new Map<string, string>();
let recording: string[] | null = null;
const fetchedSynchronously: string[] = [];

/** The primed text of a resource, by the path or URL a loader is about to request. */
export function primedSyncResource(pathOrUrl: string): string | undefined {
  return primed.get(pathOrUrl);
}

/**
 * Fetch resources in parallel and keep their text for the synchronous
 * loaders. `paths` are resource paths as the loaders are given them
 * (`/rules/frontends/...`). Returns the paths that could not be fetched; those
 * are simply not primed.
 */
export async function primeSyncResources(paths: readonly string[]): Promise<string[]> {
  const failed: string[] = [];
  await Promise.all(
    paths.map(async (path) => {
      if (primed.has(path)) return;
      const url = normalizePath(path);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          failed.push(path);
          return;
        }
        const text = await response.text();
        primed.set(path, text);
        primed.set(url, text);
      } catch {
        failed.push(path);
      }
    }),
  );
  return failed;
}

/** Forget every primed resource. */
export function clearPrimedSyncResources(): void {
  primed.clear();
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
