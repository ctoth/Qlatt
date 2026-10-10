import { afterEach, describe, expect, it, vi } from "vitest";
import { parseYamlString } from "../src/yaml-loader";

it("parses a YAML mapping through the installed js-yaml module shape", () => {
  expect(parseYamlString<{ value: number }>("value: 43\n")).toEqual({ value: 43 });
});

describe("loadYamlDocumentOrNull", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock("../src/path-utils");
    vi.resetModules();
  });

  type Answer = { status: number; contentType: string; body: string } | Error;

  /** The loader as a browser runs it: no filesystem, every path answered by `answers`. */
  async function browserLoader(answers: Record<string, Answer>) {
    const requested: string[] = [];
    const requestedSync: string[] = [];
    const answerTo = (url: string): Answer =>
      answers[url] ?? { status: 404, contentType: "text/html", body: "Not Found" };
    class FakeRequest {
      status = 0;
      responseText = "";
      private url = "";
      private contentType: string | null = null;
      open(_method: string, url: string) {
        this.url = url;
      }
      send() {
        requestedSync.push(this.url);
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
    vi.stubGlobal("XMLHttpRequest", FakeRequest);
    vi.resetModules();
    vi.doMock("../src/path-utils", async (importOriginal) => ({
      ...(await importOriginal<typeof import("../src/path-utils")>()),
      isNodeRuntime: () => false,
      readFileFromFsSync: () => null,
      resolveFileFromFsSync: () => null,
    }));
    vi.stubGlobal("fetch", async (url: string) => {
      requested.push(url);
      const answer = answerTo(url);
      if (answer instanceof Error) throw answer;
      return new Response(answer.body, {
        status: answer.status,
        headers: { "content-type": answer.contentType },
      });
    });
    return { requested, requestedSync, ...(await import("../src/yaml-loader")) };
  }

  /** What a synchronous load of `path` throws. */
  function syncFailure(load: (path: string) => string, path: string): Error {
    try {
      load(path);
    } catch (error) {
      return error as Error;
    }
    throw new Error(`'${path}' loaded`);
  }

  it("is null when the server answers 404", async () => {
    const { loadYamlDocumentOrNull, requested } = await browserLoader({});
    expect(await loadYamlDocumentOrNull("/experiments/child/graph.yaml")).toBeNull();
    expect(requested).toEqual(["/experiments/child/graph.yaml"]);
  });

  it("is null when the server answers 200 with an HTML page (the Vite dev server's fallback)", async () => {
    const { loadYamlDocumentOrNull } = await browserLoader({
      "/experiments/child/graph.yaml": {
        status: 200,
        contentType: "text/html",
        body: '<!doctype html>\n<html lang="en"></html>\n',
      },
    });
    expect(await loadYamlDocumentOrNull("/experiments/child/graph.yaml")).toBeNull();
  });

  it("returns the document the server serves as YAML", async () => {
    const { loadYamlDocumentOrNull } = await browserLoader({
      "/experiments/child/graph.yaml": { status: 200, contentType: "text/yaml", body: "a: 1\n" },
    });
    expect(await loadYamlDocumentOrNull("/experiments/child/graph.yaml")).toEqual({ a: 1 });
  });

  it("throws on a YAML syntax error, naming the path", async () => {
    const { loadYamlDocumentOrNull } = await browserLoader({
      "/experiments/child/semantics.yaml": {
        status: 200,
        contentType: "text/yaml",
        body: "params:\n  AV: { type: float\n",
      },
    });
    await expect(loadYamlDocumentOrNull("/experiments/child/semantics.yaml")).rejects.toThrow(
      /^E_YAML_PARSE: '\/experiments\/child\/semantics\.yaml': /,
    );
  });

  it("throws on an empty document, naming the path", async () => {
    const { loadYamlDocumentOrNull } = await browserLoader({
      // js-yaml refuses a file with no document in it...
      "/experiments/child/semantics.yaml": {
        status: 200,
        contentType: "text/yaml",
        body: "# nothing here\n",
      },
      // ...and parses a null document, which the loader refuses.
      "/experiments/child/graph.yaml": { status: 200, contentType: "text/yaml", body: "~\n" },
    });
    await expect(loadYamlDocumentOrNull("/experiments/child/semantics.yaml")).rejects.toThrow(
      "E_YAML_PARSE: '/experiments/child/semantics.yaml': expected a document, but the input is empty",
    );
    await expect(loadYamlDocumentOrNull("/experiments/child/graph.yaml")).rejects.toThrow(
      "E_YAML_SCHEMA: '/experiments/child/graph.yaml' resolved to empty document",
    );
  });

  it("throws on a server error instead of reading it as absence", async () => {
    const { loadYamlDocumentOrNull } = await browserLoader({
      "/experiments/child/graph.yaml": { status: 500, contentType: "text/plain", body: "boom" },
    });
    await expect(loadYamlDocumentOrNull("/experiments/child/graph.yaml")).rejects.toThrow(
      "E_YAML_FETCH: '/experiments/child/graph.yaml' request for '/experiments/child/graph.yaml' failed (HTTP 500)",
    );
  });

  it("throws on a request that got no answer instead of reading it as absence", async () => {
    const { loadYamlDocumentOrNull } = await browserLoader({
      "/experiments/child/graph.yaml": new TypeError("Failed to fetch"),
    });
    await expect(loadYamlDocumentOrNull("/experiments/child/graph.yaml")).rejects.toThrow(
      "E_YAML_FETCH: '/experiments/child/graph.yaml' request for '/experiments/child/graph.yaml' failed: Failed to fetch",
    );
  });

  it("says a missing resource is not found, and nothing else is", async () => {
    const { isYamlNotFoundError, loadYamlSource, loadYamlSourceSync } = await browserLoader({
      "/experiments/child/registry.yaml": { status: 503, contentType: "text/plain", body: "" },
    });
    const missing = await loadYamlSource("/experiments/child/graph.yaml").catch((error) => error);
    expect(isYamlNotFoundError(missing)).toBe(true);
    expect(missing.message).toBe(
      "E_YAML_PATH_UNKNOWN: '/experiments/child/graph.yaml' could not be loaded",
    );
    const failed = await loadYamlSource("/experiments/child/registry.yaml").catch((error) => error);
    expect(isYamlNotFoundError(failed)).toBe(false);
    // The server answers 404 and there is no filesystem: the synchronous loader finds nothing.
    const fromSync = syncFailure(loadYamlSourceSync, "/experiments/child/graph.yaml");
    expect(isYamlNotFoundError(fromSync)).toBe(true);
  });

  it("synchronous: a 200 with an HTML page is not found, and is not taken for the file's text", async () => {
    const { isYamlNotFoundError, loadYamlSourceSync, requestedSync } = await browserLoader({
      "/rules/child/policy.yaml": {
        status: 200,
        contentType: "text/html; charset=utf-8",
        body: '<!doctype html>\n<html lang="en"></html>\n',
      },
    });
    const missing = syncFailure(loadYamlSourceSync, "/rules/child/policy.yaml");
    expect(isYamlNotFoundError(missing)).toBe(true);
    expect(missing.message).toBe(
      "E_YAML_PATH_UNKNOWN: '/rules/child/policy.yaml' could not be loaded",
    );
    // The answer is remembered: a second load does not ask again.
    expect(isYamlNotFoundError(syncFailure(loadYamlSourceSync, "/rules/child/policy.yaml"))).toBe(
      true,
    );
    expect(requestedSync).toEqual(["/rules/child/policy.yaml"]);
  });

  it("synchronous: returns the text the server serves as YAML", async () => {
    const { loadYamlSourceSync } = await browserLoader({
      "/rules/child/policy.yaml": { status: 200, contentType: "text/yaml", body: "a: 1\n" },
    });
    expect(loadYamlSourceSync("/rules/child/policy.yaml")).toBe("a: 1\n");
  });

  it("synchronous: throws on a server error instead of reading it as absence", async () => {
    const { isYamlNotFoundError, loadYamlSourceSync } = await browserLoader({
      "/rules/child/policy.yaml": { status: 500, contentType: "text/plain", body: "boom" },
    });
    const failed = syncFailure(loadYamlSourceSync, "/rules/child/policy.yaml");
    expect(isYamlNotFoundError(failed)).toBe(false);
    expect(failed.message).toBe(
      "E_YAML_FETCH: '/rules/child/policy.yaml' request for '/rules/child/policy.yaml' failed (HTTP 500)",
    );
  });

  it("synchronous: throws on a request that got no answer instead of reading it as absence", async () => {
    const cause = new Error("Failed to execute 'send' on 'XMLHttpRequest'");
    const { isYamlNotFoundError, loadYamlSourceSync } = await browserLoader({
      "/rules/child/policy.yaml": cause,
    });
    const failed = syncFailure(loadYamlSourceSync, "/rules/child/policy.yaml");
    expect(isYamlNotFoundError(failed)).toBe(false);
    expect(failed.message).toBe(
      "E_YAML_FETCH: '/rules/child/policy.yaml' request for '/rules/child/policy.yaml' failed: Failed to execute 'send' on 'XMLHttpRequest'",
    );
    expect(failed.cause).toBe(cause);
  });

  it("the asynchronous loader does not ask again for what the synchronous loader found absent", async () => {
    const { loadYamlDocumentOrNull, loadYamlSourceSync, requested } = await browserLoader({});
    syncFailure(loadYamlSourceSync, "/rules/child/policy.yaml");
    expect(await loadYamlDocumentOrNull("/rules/child/policy.yaml")).toBeNull();
    expect(requested).toEqual([]);
  });

  it("under Node, is null for a file that is not on disk and makes no request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.resetModules();
    const { loadYamlDocumentOrNull } = await import("../src/yaml-loader");
    // laine88 inherits its graph: public/experiments/laine88 has only semantics.yaml.
    expect(await loadYamlDocumentOrNull("/experiments/laine88/graph.yaml")).toBeNull();
    expect(await loadYamlDocumentOrNull("/experiments/laine88/semantics.yaml")).toMatchObject({
      name: "laine88",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
