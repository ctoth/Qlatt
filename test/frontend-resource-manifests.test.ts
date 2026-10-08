/**
 * Frontend resource manifests (`public/rules/frontends/<id>/resources.json`)
 * and the primed-resource cache the synchronous loaders read
 * (src/sync-resource-cache.ts).
 *
 * A manifest lists what a frontend's synchronous pipeline reads when loaded
 * cold, so a page can fetch it all in parallel before the first Speak. If
 * this test fails after a frontend gained or lost a resource (an include, a
 * voice file, a table), regenerate:
 *
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/build-frontend-resource-manifests.ts --write
 */

import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  frontendIds,
  readManifest,
  recordFrontendResources,
} from "../scripts/build-frontend-resource-manifests";
import {
  clearPrimedSyncResources,
  primeSyncResources,
  recordSyncResources,
  takeSynchronousFetches,
} from "../src/sync-resource-cache";
import { loadYamlSourceSync } from "../src/yaml-loader";

describe("frontend resource manifests", () => {
  it.each(frontendIds())(
    "%s: the manifest lists exactly what a cold load and one phrase read",
    (frontendId) => {
      const recorded = recordFrontendResources(frontendId);
      expect(recorded.length).toBeGreaterThan(0);
      expect(readManifest(frontendId)).toEqual(recorded);
    },
    120000,
  );

  it.each(frontendIds())("%s: every listed resource is a file the site serves", (frontendId) => {
    for (const resource of readManifest(frontendId)) {
      expect(fs.existsSync(path.join("public", resource)), resource).toBe(true);
    }
  });
});

describe("primed resources", () => {
  afterEach(() => {
    clearPrimedSyncResources();
    takeSynchronousFetches();
    vi.unstubAllGlobals();
  });

  /** A browser's two ways of reading a URL, counting the blocking one. */
  function stubBrowser(files: Record<string, string>) {
    const blocking: string[] = [];
    const parallel: string[] = [];
    class FakeRequest {
      status = 0;
      responseText = "";
      private url = "";
      open(_method: string, url: string) {
        this.url = url;
      }
      send() {
        blocking.push(this.url);
        const text = files[this.url];
        this.status = text === undefined ? 404 : 200;
        this.responseText = text ?? "";
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeRequest);
    vi.stubGlobal("fetch", async (url: string) => {
      parallel.push(url);
      const text = files[url];
      return { ok: text !== undefined, text: async () => text ?? "" };
    });
    return { blocking, parallel };
  }

  it("without priming, a synchronous load makes a blocking request and says so", () => {
    const { blocking } = stubBrowser({ "/fixture/a.yaml": "a: 1\n" });
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(blocking).toEqual(["/fixture/a.yaml"]);
    expect(takeSynchronousFetches()).toEqual(["/fixture/a.yaml"]);
  });

  it("after priming, the same load makes no request", async () => {
    const { blocking, parallel } = stubBrowser({
      "/fixture/a.yaml": "a: 1\n",
      "/fixture/b.yaml": "b: 2\n",
    });
    const failed = await primeSyncResources([
      "/fixture/a.yaml",
      "/fixture/b.yaml",
      "/fixture/missing.yaml",
    ]);
    expect(failed).toEqual(["/fixture/missing.yaml"]);
    expect(parallel.sort()).toEqual([
      "/fixture/a.yaml",
      "/fixture/b.yaml",
      "/fixture/missing.yaml",
    ]);
    const stop = recordSyncResources();
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(loadYamlSourceSync("/fixture/b.yaml")).toBe("b: 2\n");
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(blocking).toEqual([]);
    expect(takeSynchronousFetches()).toEqual([]);
    // The recorder still sees what was read: distinct paths, first-read order.
    expect(stop()).toEqual(["/fixture/a.yaml", "/fixture/b.yaml"]);
    // A resource that could not be primed is still loaded the blocking way.
    expect(() => loadYamlSourceSync("/fixture/missing.yaml")).toThrow(/E_YAML_PATH_UNKNOWN/);
    expect(blocking).toEqual(["/fixture/missing.yaml"]);
  });
});
