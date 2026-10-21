/**
 * Frontend resource manifests (`public/rules/frontends/<id>/resources.json`)
 * and the primed-resource cache the synchronous loaders read
 * (src/sync-resource-cache.ts).
 *
 * A manifest audits what a frontend's synchronous pipeline reads when loaded
 * cold. Browser warmup uses the asynchronous resource owner instead. If
 * this test fails after a frontend gained or lost a resource (an include, a
 * voice file, a table), regenerate:
 *
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/build-frontend-resource-manifests.ts --write
 */

import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { dump, load } from "js-yaml";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  frontendIds,
  readManifest,
  recordFrontendResources,
} from "../scripts/build-frontend-resource-manifests";
import {
  listBundledFrontendIds,
  loadBundledRulepackSpec,
  preloadBundledRulepackPath,
  preloadBundledRulepackSpec,
  preloadFrontend,
  preloadFrontendResources,
  preloadFrontendSourceContour,
  resolveBundledRulepackPath,
  resolveFrontend,
  rulepackRuleOrigins,
} from "../src/declarative-frontend/rule-pack";
import * as paths from "../src/path-utils";
import {
  clearPrimedSyncResources,
  primeSyncResources,
  recordSyncResources,
  takeSynchronousFetches,
} from "../src/sync-resource-cache";
import { loadYamlSource, loadYamlSourceSync } from "../src/yaml-loader";

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
    vi.restoreAllMocks();
    clearPrimedSyncResources();
    takeSynchronousFetches();
    vi.unstubAllGlobals();
  });

  type Answer = { status: number; contentType: string; body: string };
  const NOT_FOUND: Answer = { status: 404, contentType: "text/html", body: "Not Found" };
  /** What the Vite dev server answers for a path with no file behind it. */
  const DEV_SERVER_FALLBACK: Answer = {
    status: 200,
    contentType: "text/html",
    body: '<!doctype html>\n<html lang="en"></html>\n',
  };

  /**
   * A browser's two ways of reading a URL, counting the blocking one. A string
   * is a YAML file's text; a path that is not listed is answered 404.
   */
  function stubBrowser(files: Record<string, string | Answer>) {
    const blocking: string[] = [];
    const parallel: string[] = [];
    const answerTo = (url: string): Answer => {
      const file = files[url] ?? NOT_FOUND;
      return typeof file === "string"
        ? { status: 200, contentType: "text/yaml", body: file }
        : file;
    };
    class FakeRequest {
      status = 0;
      responseText = "";
      private url = "";
      private contentType = "";
      open(_method: string, url: string) {
        this.url = url;
      }
      send() {
        blocking.push(this.url);
        const answer = answerTo(this.url);
        this.status = answer.status;
        this.responseText = answer.body;
        this.contentType = answer.contentType;
      }
      getResponseHeader(name: string) {
        return name.toLowerCase() === "content-type" ? this.contentType : null;
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeRequest);
    vi.stubGlobal("fetch", async (url: string) => {
      parallel.push(url);
      const answer = answerTo(url);
      return new Response(answer.body, {
        status: answer.status,
        headers: { "content-type": answer.contentType },
      });
    });
    return { blocking, parallel };
  }

  it.each(["sync", "async"])(
    "%s: discovers an added catalogue entryPoint",
    async (mode) => {
      const manifestPath = "/rules/frontends/manifest.json";
      const id = `catalogue-fixture-${mode}`;
      const entry = `/rules/frontends/${id}/selected.yaml`;
      const files: Record<string, string> = {};
      for (const resource of readManifest("qlatt-english")) {
        files[resource] = fs.readFileSync(path.join("public", resource), "utf8");
      }
      const manifest = JSON.parse(files[manifestPath]);
      manifest.frontends.push({ id, entryPoint: "selected.yaml" });
      files[manifestPath] = JSON.stringify(manifest);
      files[entry] = "extends: qlatt-english\n";
      const { blocking, parallel } = stubBrowser(files);
      vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
      const spec =
        mode === "async"
          ? await preloadBundledRulepackSpec(id)
          : loadBundledRulepackSpec(id);
      expect(spec.rules.speech_rate_scaling).toBeDefined();
      expect(listBundledFrontendIds()).toContain(id);
      expect(resolveBundledRulepackPath(id)).toBe(entry);
      expect(resolveBundledRulepackPath()).toBe("/rules/frontends/qlatt-english/frontend.yaml");
      expect(() => resolveBundledRulepackPath("unknown-catalogue-id")).toThrow(
        /E_FRONTEND_ID_UNKNOWN.*unknown-catalogue-id/,
      );
      if (mode === "async") {
        const prepared = await preloadFrontend(await preloadBundledRulepackPath(id));
        const fetched = [...parallel];
        expect(resolveFrontend(resolveBundledRulepackPath(id))).toEqual(prepared);
        expect(parallel).toEqual(fetched);
        expect(parallel.filter((resource) => resource === manifestPath)).toHaveLength(1);
        expect(blocking).toEqual([]);
      } else {
        expect(blocking).toContain(entry);
        expect(parallel).toEqual([]);
      }
    },
    120000,
  );

  it.each([
    {},
    { frontends: [{ id: "missing-entry" }] },
    { frontends: [{ id: " ", entryPoint: "frontend.yaml" }] },
    { frontends: [{ id: "blank-entry", entryPoint: " " }] },
    {
      frontends: [
        { id: "duplicate", entryPoint: "a.yaml" },
        { id: "duplicate", entryPoint: "b.yaml" },
      ],
    },
  ])("rejects invalid catalogue declarations %j", async (document) => {
    stubBrowser({ "/rules/frontends/manifest.json": JSON.stringify(document) });
    vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
    expect(() => listBundledFrontendIds()).toThrow(/E_FRONTEND_MANIFEST/);
    await expect(preloadBundledRulepackPath()).rejects.toThrow(/E_FRONTEND_MANIFEST/);
  });

  /** Relocate the real bundled documents, changing only known reference slots. */
  function relativeDocument(resource: string, source: string): string {
    if (!resource.endsWith(".yaml")) return source;
    const document = load(source) as Record<string, unknown>;
    const relative = (value: unknown) =>
      typeof value === "string" && value.startsWith("/rules/")
        ? path.posix.relative(path.posix.dirname(resource), value)
        : value;
    const resources = document.resources as Record<string, unknown> | undefined;
    if (resources) {
      document.resources = Object.fromEntries(
        Object.entries(resources).map(([role, value]) => [role, relative(value)]),
      );
    }
    for (const key of ["accent_policy_path", "phonology_path", "phonotactics_path"]) {
      if (Object.hasOwn(document, key)) document[key] = relative(document[key]);
    }
    for (const [section, keys] of [
      ["speakers", ["dir", "definition_path"]],
      ["text_parser", ["table_path"]],
    ] as const) {
      const nested = document[section] as Record<string, unknown> | undefined;
      for (const key of keys) {
        if (nested && Object.hasOwn(nested, key)) nested[key] = relative(nested[key]);
      }
    }
    if (Array.isArray(document.include)) document.include = document.include.map(relative);
    return dump(document);
  }

  it.each(["http-sync", "http-async", "file-sync", "file-async"])(
    "%s: acquires relative frontend resources and nested dependencies from their documents",
    async (mode) => {
      const dir = fs.mkdtempSync(path.join(tmpdir(), "qlatt-relative # "));
      const base = mode.startsWith("file")
        ? pathToFileURL(dir + path.sep).href
        : `https://resources.example/${mode}/`;
      const url = (resource: string) => new URL(resource.slice(1), base).href;
      const files: Record<string, string> = {};
      try {
        for (const resource of readManifest("qlatt-english")) {
          const source = relativeDocument(
            resource,
            fs.readFileSync(path.join("public", resource), "utf8"),
          );
          files[url(resource)] = source;
          if (mode.startsWith("file")) {
            const target = path.join(dir, resource);
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, source);
          }
        }
        const requests = mode.startsWith("http") ? stubBrowser(files) : undefined;
        if (requests) vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
        const entry = url("/rules/frontends/qlatt-english/frontend.yaml");
        const result = mode.endsWith("async")
          ? await preloadFrontend(entry)
          : resolveFrontend(entry);
        const acquired = result.resources;
        expect(acquired.inventoryPath).toBe(url("/rules/frontends/qlatt-english/inventory.yaml"));
        expect(acquired.inventoryDocuments).toEqual([
          acquired.inventoryPath,
          url("/rules/languages/english/phonology.yaml"),
        ]);
        expect(acquired.lts.path).toBe(url("/rules/languages/english/lts-rules.yaml"));
        expect(acquired.lexicon?.dictionary.hello).toBeDefined();
        expect(acquired.morphology?.phonotactics).toBe(acquired.stress?.phonotactics);
        expect(acquired.stress?.path).toBe(url("/rules/languages/english/stress-policy.yaml"));
        expect(acquired.stress?.policy.phonotacticsPath).toBe(
          url("/rules/languages/english/phonotactics.yaml"),
        );
        expect(acquired.sourceContour?.path).toBe(
          url("/rules/frontends/qlatt-english/policy/source-contour.yaml"),
        );
        if (requests) {
          const requested = mode.endsWith("async") ? requests.parallel : requests.blocking;
          expect(requested).toContain(url("/rules/languages/english/phonotactics.yaml"));
          expect(requested.every((resource) => resource.startsWith(base))).toBe(true);
          if (mode.endsWith("async")) expect(requests.blocking).toEqual([]);
        }
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    },
    120000,
  );

  it.each(["sync", "async"])(
    "%s: keeps inherited resource owners and child-first include shadow/fallback",
    async (mode) => {
      const base = `https://resources.example/inherited-${mode}/`;
      const url = (resource: string) => new URL(resource.slice(1), base).href;
      const files: Record<string, string> = {};
      for (const resource of readManifest("qlatt-beauty")) {
        const source = fs.readFileSync(path.join("public", resource), "utf8");
        files[resource] = source;
        if (resource === "/rules/frontends/qlatt-english/frontend.yaml") {
          const ancestor = load(source) as { resources: Record<string, string> };
          ancestor.resources.speaker_profile = "policy/speaker-profile.yaml";
          files[resource] = dump(ancestor);
        }
        files[url(resource)] = relativeDocument(resource, source);
      }
      const requests = stubBrowser(files);
      vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
      const entry = url("/rules/frontends/qlatt-beauty/frontend.yaml");
      const result = mode === "async" ? await preloadFrontend(entry) : resolveFrontend(entry);
      expect(result.resources.inventoryPath).toBe(
        url("/rules/frontends/qlatt-beauty/inventory.yaml"),
      );
      expect(result.resources.lts.path).toBe("/rules/languages/english/lts-rules.yaml");
      expect(result.resources.speakerProfile?.path).toBe(
        "/rules/frontends/qlatt-english/policy/speaker-profile.yaml",
      );
      expect(result.resources.inventoryDocuments).toContain(
        url("/rules/languages/english/phonology.yaml"),
      );
      expect(result.voices.beauty.path).toBe(
        url("/rules/frontends/qlatt-beauty/speakers/beauty.yaml"),
      );
      const origins = rulepackRuleOrigins(result.spec);
      expect(origins.tobi_accent).toBe(url("/rules/frontends/qlatt-beauty/phases/prosody.yaml"));
      expect(origins.speech_rate_scaling).toBe(
        "/rules/frontends/qlatt-english/phases/duration.yaml",
      );
      const requested = mode === "async" ? requests.parallel : requests.blocking;
      expect(requested).toContain(url("/rules/frontends/qlatt-beauty/phases/duration.yaml"));
      if (mode === "async") expect(requests.blocking).toEqual([]);
    },
    120000,
  );

  it("resolves DECtalk's parser, speaker definition and voice directory beside its frontend", async () => {
    const base = "https://resources.example/dectalk-relative/";
    const url = (resource: string) => new URL(resource.slice(1), base).href;
    const files: Record<string, string> = {};
    for (const resource of readManifest("dectalk-english")) {
      files[url(resource)] = relativeDocument(
        resource,
        fs.readFileSync(path.join("public", resource), "utf8"),
      );
    }
    const entry = url("/rules/frontends/dectalk-english/frontend.yaml");
    const frontend = load(files[entry]) as { speakers: { dir: string } };
    frontend.speakers.dir += "/?revision=1#directory";
    files[entry] = dump(frontend);
    const { blocking, parallel } = stubBrowser(files);
    vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
    const result = await preloadFrontend(entry);
    expect(result.resources.textParser?.config.tablePath).toBe(
      url("/rules/frontends/dectalk-english/text-parser-table.json"),
    );
    expect(result.resources.speakerDefinition?.path).toBe(
      url("/rules/frontends/dectalk-english/speaker-definition.json"),
    );
    expect(Object.values(result.voices).length).toBeGreaterThan(0);
    for (const [name, voice] of Object.entries(result.voices)) {
      expect(voice.path).toBe(url(`/rules/frontends/dectalk-english/speakers/${name}.yaml`));
      expect(parallel).toContain(voice.path);
    }
    expect(parallel.every((resource) => resource.startsWith(base))).toBe(true);
    expect(blocking).toEqual([]);
  });

  it.each(frontendIds())("%s: prepares resources without synchronous requests", async (id) => {
    const prefix = `/async-owner-${id}/rules/`;
    const replacePaths = (text: string) => text.replaceAll("/rules/", prefix);
    const entry = `${prefix}frontends/${id}/frontend.yaml`;
    const files: Record<string, string> = {};
    for (const resource of readManifest(id)) {
      const source = replacePaths(fs.readFileSync(path.join("public", resource), "utf8"));
      files[replacePaths(resource)] = source;
      // extends resolves bundled frontend IDs before reading their relative includes.
      files[resource] = source;
    }
    const { blocking, parallel } = stubBrowser(files);
    vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
    const prepared = await preloadFrontend(entry);
    const { spec, resources: acquired } = prepared;
    expect(blocking).toEqual([]);
    expect(parallel).toContain(acquired.inventoryPath);
    expect(parallel).toContain(acquired.lts.path);
    expect(parallel).toContain(acquired.lexicon?.path);
    const fetched = [...parallel];
    const resolved = resolveFrontend(entry);
    const sync = resolved.resources;
    expect(resolved.spec).toBe(spec);
    expect(resolved.voices).toEqual(prepared.voices);
    for (const [name, voice] of Object.entries(prepared.voices)) {
      expect(resolved.voices[name].document).toBe(voice.document);
      expect(Object.isFrozen(voice.document)).toBe(true);
    }
    expect(sync).toEqual(acquired);
    expect(sync.inventory).toBe(acquired.inventory);
    expect(sync.lts.document).toBe(acquired.lts.document);
    expect(sync.lexicon?.dictionary).toBe(acquired.lexicon?.dictionary);
    expect(sync.stress).toBe(acquired.stress);
    expect(sync.vqChannels?.channels).toBe(acquired.vqChannels?.channels);
    expect(sync.affectPresets?.library).toBe(acquired.affectPresets?.library);
    expect(Object.isFrozen(prepared)).toBe(true);
    expect(Object.isFrozen(acquired)).toBe(true);
    expect(Object.isFrozen(acquired.inventory.phoneme_targets)).toBe(true);
    expect(Object.isFrozen(acquired.lts.document)).toBe(true);
    expect(() => {
      acquired.inventory.base_params.F1 = -1;
    }).toThrow(TypeError);
    if (acquired.lexicon) {
      expect(Object.isFrozen(acquired.lexicon.dictionary)).toBe(true);
    }
    if (acquired.affectPresets) {
      const library = acquired.affectPresets.library;
      expect(Object.isFrozen(library.presets)).toBe(true);
      expect(Object.isFrozen(library.presets.tender.vq)).toBe(true);
      expect(() => Object.assign(library.presets, { tender: undefined })).toThrow(TypeError);
    }
    if (id === "dectalk-english") {
      expect(acquired.morphology).toBeUndefined();
      expect(acquired.stress).toBeUndefined();
      expect(acquired.affectPresets).toBeUndefined();
      expect(acquired.vqChannels).toBeUndefined();
    }
    expect((await preloadFrontendSourceContour(spec))?.spec).toBe(acquired.sourceContour?.spec);
    expect(parallel).toEqual(fetched);
    expect(blocking).toEqual([]);
  });

  it("keeps nested dependency errors contextual", async () => {
    const spec = loadBundledRulepackSpec("qlatt-english");
    const lts = "/async-owner-error/lts.yaml";
    const morphology = "/async-owner-error/morphology.yaml";
    const missing = "/async-owner-error/missing-phonotactics.yaml";
    const { blocking } = stubBrowser({
      [lts]: fs.readFileSync("public/rules/languages/english/lts-rules.yaml", "utf8"),
      [morphology]: `phonotactics_path: ${missing}\n`,
    });
    vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
    await expect(
      preloadFrontendResources({
        ...spec,
        resources: { ...spec.resources, lts, morphology },
      }),
    ).rejects.toThrow(/E_FRONTEND_CONFIG: morphology.phonotactics_path could not load/);
    expect(blocking).toEqual([]);
  });

  it("without priming, a synchronous load makes a blocking request and says so", () => {
    const { blocking } = stubBrowser({ "/fixture/a.yaml": "a: 1\n" });
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(blocking).toEqual(["/fixture/a.yaml"]);
    expect(takeSynchronousFetches()).toEqual(["/fixture/a.yaml"]);
  });

  it("a file that was not primed is requested once, however often it is read", () => {
    const { blocking } = stubBrowser({ "/fixture/a.yaml": "a: 1\n" });
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(blocking).toEqual(["/fixture/a.yaml"]);
    expect(takeSynchronousFetches()).toEqual(["/fixture/a.yaml"]);
  });

  it("the asynchronous loader reuses text the synchronous loader fetched", async () => {
    const { blocking, parallel } = stubBrowser({ "/fixture/a.yaml": "a: 1\n" });
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(await loadYamlSource("/fixture/a.yaml")).toBe("a: 1\n");
    expect(blocking).toEqual(["/fixture/a.yaml"]);
    expect(parallel).toEqual([]);
  });

  it("after priming, the same load makes no request", async () => {
    const { blocking, parallel } = stubBrowser({
      "/fixture/a.yaml": "a: 1\n",
      "/fixture/b.yaml": "b: 2\n",
    });
    const notPrimed = await primeSyncResources([
      "/fixture/a.yaml",
      "/fixture/b.yaml",
      "/fixture/missing.yaml",
    ]);
    expect(notPrimed).toEqual({ absent: ["/fixture/missing.yaml"], failed: [] });
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
    // The server said the third does not exist: it is not found, and not asked for again.
    expect(() => loadYamlSourceSync("/fixture/missing.yaml")).toThrow(/E_YAML_PATH_UNKNOWN/);
    expect(blocking).toEqual([]);
  });

  it("priming does not keep a dev server's HTML fallback page as a file's text", async () => {
    const { blocking, parallel } = stubBrowser({
      "/fixture/a.yaml": "a: 1\n",
      "/fixture/child/a.yaml": DEV_SERVER_FALLBACK,
    });
    expect(await primeSyncResources(["/fixture/a.yaml", "/fixture/child/a.yaml"])).toEqual({
      absent: ["/fixture/child/a.yaml"],
      failed: [],
    });
    expect(() => loadYamlSourceSync("/fixture/child/a.yaml")).toThrow(/E_YAML_PATH_UNKNOWN/);
    await expect(loadYamlSource("/fixture/child/a.yaml")).rejects.toThrow(/E_YAML_PATH_UNKNOWN/);
    // Neither loader asked again, and priming again reports it without a request.
    expect(await primeSyncResources(["/fixture/child/a.yaml"])).toEqual({
      absent: ["/fixture/child/a.yaml"],
      failed: [],
    });
    expect(blocking).toEqual([]);
    expect(parallel.sort()).toEqual(["/fixture/a.yaml", "/fixture/child/a.yaml"]);
  });

  it("a resource whose priming request failed is not absent: the loader asks for it", async () => {
    const files: Record<string, string | Answer> = {
      "/fixture/a.yaml": { status: 503, contentType: "text/plain", body: "" },
    };
    const { blocking } = stubBrowser(files);
    expect(await primeSyncResources(["/fixture/a.yaml"])).toEqual({
      absent: [],
      failed: ["/fixture/a.yaml"],
    });
    expect(() => loadYamlSourceSync("/fixture/a.yaml")).toThrow(
      "E_YAML_FETCH: '/fixture/a.yaml' request for '/fixture/a.yaml' failed (HTTP 503)",
    );
    // The server recovers: the file is read.
    files["/fixture/a.yaml"] = "a: 1\n";
    expect(loadYamlSourceSync("/fixture/a.yaml")).toBe("a: 1\n");
    expect(blocking).toEqual(["/fixture/a.yaml", "/fixture/a.yaml"]);
  });
});
