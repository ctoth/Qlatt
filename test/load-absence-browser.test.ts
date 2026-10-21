/**
 * "There is no such file" on every load path, as a browser sees it.
 *
 * The loaders run here without a filesystem, against a stand-in for the Vite
 * dev server: a file under `public/` is served as itself, and a path with no
 * file behind it is answered with 200 and an HTML page (the dev server's SPA
 * fallback). A test replaces single answers to make a request fail.
 *
 * Only an answer that says the resource does not exist is absence
 * (src/resource-answer.ts). qlatt-beauty extends qlatt-english and has no
 * normalization-policy.yaml of its own, so its include of that file is read
 * from qlatt-english's directory; a request for it that fails is an error.
 */

import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

type Answer = { status: number; contentType: string; body: string } | Error;

const DEV_SERVER_FALLBACK: Answer = {
  status: 200,
  contentType: "text/html",
  body: fs.readFileSync("index.html", "utf8"),
};

function servedFromPublic(url: string): Answer {
  const file = path.join("public", url);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return DEV_SERVER_FALLBACK;
  return {
    status: 200,
    contentType: url.endsWith(".json") ? "application/json" : "text/yaml",
    body: fs.readFileSync(file, "utf8"),
  };
}

/** Stub the browser's two ways of reading a URL and forget every loaded module. */
function devServer(overrides: Record<string, Answer> = {}) {
  const requested: string[] = [];
  const answerTo = (url: string): Answer => {
    requested.push(url);
    return overrides[url] ?? servedFromPublic(url);
  };
  class FakeRequest {
    status = 0;
    responseText = "";
    private url = "";
    private contentType: string | null = null;
    open(_method: string, url: string) {
      this.url = url;
    }
    send() {
      const answer = answerTo(this.url);
      if (answer instanceof Error) throw answer;
      this.status = answer.status;
      this.responseText = answer.body;
      this.contentType = answer.contentType;
    }
    getResponseHeader(name: string) {
      return name.toLowerCase() === "content-type" ? this.contentType : null;
    }
  }
  vi.resetModules();
  vi.doMock("../src/path-utils", async (importOriginal) => ({
    ...(await importOriginal<typeof import("../src/path-utils")>()),
    isNodeRuntime: () => false,
    readFileFromFsSync: () => null,
    resolveFileFromFsSync: () => null,
  }));
  vi.stubGlobal("XMLHttpRequest", FakeRequest);
  vi.stubGlobal("fetch", async (url: string) => {
    const answer = answerTo(url);
    if (answer instanceof Error) throw answer;
    return new Response(answer.body, {
      status: answer.status,
      headers: { "content-type": answer.contentType },
    });
  });
  return { requested };
}

/** What `run` throws or rejects with. */
async function failure(run: () => unknown): Promise<Error> {
  try {
    await run();
  } catch (error) {
    return error as Error;
  }
  throw new Error("nothing was thrown");
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock("../src/path-utils");
  vi.resetModules();
});

const BEAUTY = "/rules/frontends/qlatt-beauty/frontend.yaml";
const BEAUTY_POLICY = "/rules/frontends/qlatt-beauty/normalization-policy.yaml";
const ENGLISH_POLICY = "/rules/frontends/qlatt-english/normalization-policy.yaml";
const SERVER_ERROR: Answer = { status: 500, contentType: "text/plain", body: "boom" };
const NOT_YAML: Answer = { status: 200, contentType: "text/yaml", body: "rules: { a: [\n" };

type Loaders = typeof import("../src/declarative-frontend/rule-pack");

describe.each([
  ["synchronous", (loaders: Loaders) => loaders.loadRulepackSpecFromPath],
  ["asynchronous", (loaders: Loaders) => loaders.preloadRulepackSpecFromPath],
] as const)("an include of a frontend that extends another (%s loader)", (_name, loaderOf) => {
  async function loadBeauty(overrides: Record<string, Answer> = {}) {
    const { requested } = devServer(overrides);
    const rulePack = await import("../src/declarative-frontend/rule-pack");
    const load = loaderOf(rulePack);
    return { requested, rulePack, load: () => load(BEAUTY) };
  }

  it("is read from the base directory when the child directory has no such file", async () => {
    const { requested, rulePack, load } = await loadBeauty();
    const beauty = await load();
    const rules = (beauty as unknown as { rules: Record<string, unknown> }).rules;
    // phases/duration.yaml and phases/voice-quality.yaml: the base's and beauty's own.
    expect(rules).toHaveProperty("stress_duration");
    expect(rules).toHaveProperty("stress_rd_adduction");
    // The map normalization-policy.yaml declares was read from the base's file.
    expect(rulePack.rulepackMapOrigins(beauty).tn_recognition_policy.years).toBe(ENGLISH_POLICY);
    expect(requested.filter((url) => url === BEAUTY_POLICY)).toEqual([BEAUTY_POLICY]);
  }, 120000);

  it("is an error, not a fallback, when the request for the child's file fails", async () => {
    const { load } = await loadBeauty({ [BEAUTY_POLICY]: SERVER_ERROR });
    expect((await failure(load)).message).toBe(
      `E_YAML_FETCH: '${BEAUTY_POLICY}' request for '${BEAUTY_POLICY}' failed (HTTP 500)`,
    );
  }, 120000);

  it("is an error, not a fallback, when the request for the child's file gets no answer", async () => {
    const { load } = await loadBeauty({ [BEAUTY_POLICY]: new TypeError("no route") });
    expect((await failure(load)).message).toBe(
      `E_YAML_FETCH: '${BEAUTY_POLICY}' request for '${BEAUTY_POLICY}' failed: no route`,
    );
  }, 120000);

  it("is an error, not a fallback, when the child's file is not valid YAML", async () => {
    const { load } = await loadBeauty({ [BEAUTY_POLICY]: NOT_YAML });
    expect((await failure(load)).name).toBe("YAMLParseError");
  }, 120000);
});

describe("a rule pack or inventory path", () => {
  const MISSING_RULEPACK = "/rules/frontends/no-such-frontend/frontend.yaml";
  const MISSING_INVENTORY = "/rules/frontends/no-such-frontend/inventory.yaml";

  async function loaders(overrides: Record<string, Answer> = {}) {
    devServer(overrides);
    const rulePack = await import("../src/declarative-frontend/rule-pack");
    const { isYamlNotFoundError } = await import("../src/yaml-loader");
    return {
      isYamlNotFoundError,
      cases: [
        ["E_RULESET_PATH_UNKNOWN", MISSING_RULEPACK, rulePack.loadRulepackSpecFromPath],
        ["E_RULESET_PATH_UNKNOWN", MISSING_RULEPACK, rulePack.preloadRulepackSpecFromPath],
        ["E_INVENTORY_PATH_UNKNOWN", MISSING_INVENTORY, rulePack.loadInventorySpecFromPath],
        ["E_INVENTORY_PATH_UNKNOWN", MISSING_INVENTORY, rulePack.preloadInventorySpecFromPath],
      ] as const,
    };
  }

  it("that does not exist is 'path unknown', with the loader's not-found error as its cause", async () => {
    const { cases, isYamlNotFoundError } = await loaders();
    for (const [code, specPath, load] of cases) {
      const error = await failure(() => load(specPath));
      expect(error.message, load.name).toMatch(
        new RegExp(`^${code}: '${specPath}' could not be loaded(?: \\(known: .+\\))?$`),
      );
      expect(isYamlNotFoundError(error.cause), load.name).toBe(true);
    }
  });

  it("whose request fails is the request's error, not 'path unknown'", async () => {
    const { cases } = await loaders({
      [MISSING_RULEPACK]: SERVER_ERROR,
      [MISSING_INVENTORY]: SERVER_ERROR,
    });
    for (const [, specPath, load] of cases) {
      expect((await failure(() => load(specPath))).message, load.name).toBe(
        `E_YAML_FETCH: '${specPath}' request for '${specPath}' failed (HTTP 500)`,
      );
    }
  });
});

describe("a dictionary path", () => {
  const DICTIONARY = "/no-such-dictionary.json";

  async function loaders(overrides: Record<string, Answer> = {}) {
    devServer(overrides);
    const { loadCmuDictionaryFromPathSync, preloadCmuDictionaryFromPath } = await import(
      "../src/cmu-dictionary-loader"
    );
    return [loadCmuDictionaryFromPathSync, preloadCmuDictionaryFromPath] as const;
  }

  it("that does not exist is 'path unknown': the HTML page is not parsed as the dictionary", async () => {
    for (const load of await loaders()) {
      expect((await failure(() => load(DICTIONARY))).message, load.name).toBe(
        `E_CMU_DICT_PATH_UNKNOWN: '${DICTIONARY}' could not be loaded`,
      );
    }
  });

  it("whose request fails is the request's error, not 'path unknown'", async () => {
    for (const load of await loaders({ [DICTIONARY]: SERVER_ERROR })) {
      expect((await failure(() => load(DICTIONARY))).message, load.name).toBe(
        `E_CMU_DICT_FETCH: '${DICTIONARY}' request for '${DICTIONARY}' failed (HTTP 500)`,
      );
    }
  });

  it("that is not valid JSON says so", async () => {
    const notJson: Answer = { status: 200, contentType: "application/json", body: "{ nope" };
    for (const load of await loaders({ [DICTIONARY]: notJson })) {
      expect((await failure(() => load(DICTIONARY))).message, load.name).toMatch(
        /^E_CMU_DICT_PARSE: '\/no-such-dictionary\.json' is not valid JSON/,
      );
    }
  });
});
