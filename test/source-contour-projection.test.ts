import { afterEach, describe, expect, it, vi } from "vitest";
import * as rulepack from "../src/declarative-frontend/rule-pack";
import {
  loadFrontendResources,
  preloadFrontendSourceContour,
} from "../src/declarative-frontend/rule-pack";
import { assertFrontendVocabulary } from "../src/experiments/frontend-vocabulary";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import * as paths from "../src/path-utils";
import { parseSourceContourDocument } from "../src/source-contour";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import * as yaml from "../src/yaml-loader";

const fixturePath = "/test/fixtures/source-contour-projection.yaml";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("source contour projection policy", () => {
  it("acquires asynchronously and reuses the parsed contour for synchronous synthesis", async () => {
    const frontend = rulepack.loadBundledRulepackSpec("qlatt-english");
    loadFrontendResources(frontend);
    const text = yaml.loadYamlSourceSync(fixturePath);
    const path = "/test/async-source-contour.yaml";
    const selected = { ...frontend, resources: { ...frontend.resources, source_contour: path } };
    const fetch = vi.fn().mockResolvedValue(new Response(text));
    vi.spyOn(paths, "isNodeRuntime").mockReturnValue(false);
    vi.stubGlobal("fetch", fetch);
    const syncLoad = vi.spyOn(yaml, "loadYamlDocumentSync").mockImplementation(() => {
      throw new Error("unexpected synchronous YAML acquisition");
    });

    const acquired = await preloadFrontendSourceContour(selected);
    expect(acquired?.path).toBe(path);
    expect(acquired?.spec.projection).toEqual(
      parseSourceContourDocument(yaml.parseYamlString(text)).projection,
    );
    expect(loadFrontendResources(selected).sourceContour?.spec).toBe(acquired?.spec);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(syncLoad).not.toHaveBeenCalled();
  });

  it("allows absent optional contour resources until a consumer requires them", async () => {
    const frontend = rulepack.loadBundledRulepackSpec("qlatt-english");
    const selected = { ...frontend, resources: { ...frontend.resources, source_contour: null } };
    expect(loadFrontendResources(selected).sourceContour).toBeUndefined();
    await expect(preloadFrontendSourceContour(selected)).resolves.toBeUndefined();
    vi.spyOn(rulepack, "resolveFrontend").mockReturnValue({
      spec: selected,
      resources: loadFrontendResources(selected),
      voices: {},
    });
    expect(() => textToKlattTrackDetailed("hello", 110, 30)).toThrow(
      /E_FRONTEND_CONFIG: frontend 'qlatt-english' requires source_contour/,
    );
    const config = await loadExperimentConfig("klatt80-baseline");
    vi.spyOn(rulepack, "preloadBundledRulepackSpec").mockResolvedValue(selected);
    await expect(assertFrontendVocabulary("qlatt-english", config)).rejects.toThrow(
      /E_FRONTEND_CONFIG: frontend 'qlatt-english' requires source_contour/,
    );
  });

  it("projects a fixture-only source field into frames in declared order with provenance", () => {
    const spec = rulepack.loadBundledRulepackSpec("qlatt-english");
    const selected = {
      ...spec,
      resources: { ...spec.resources, source_contour: fixturePath },
    };
    vi.spyOn(rulepack, "resolveFrontend").mockReturnValue({
      spec: selected,
      resources: loadFrontendResources(selected),
      voices: {},
    });
    const result = textToKlattTrackDetailed("hello", 110, 30);
    const frames = result.track.filter((frame) => frame.phoneme && frame.phoneme !== "SIL");
    expect(frames.length).toBeGreaterThan(0);
    for (const frame of frames) expect(frame.params.AV).toBe(34);
    const decisions = result.utterance.provenance.getDecisions();
    const sourceDecision = decisions.find((entry) => entry.type === "source_contour_selected");
    expect(sourceDecision?.citations).toContain(fixturePath);
    const writes = decisions.filter(
      (entry) => entry.subject.endsWith(".AV") && entry.stage === "frontend",
    );
    expect(writes.length).toBeGreaterThan(0);
    for (const write of writes) {
      expect(write.citations).toContain(fixturePath);
      expect(write.parents).toContain(sourceDecision?.id);
    }
  });

  it.each([
    [{ op: "unknown" }, /projection.*op/],
    [{ order: Number.NaN }, /projection.*order/],
    [{ field: "misspelled" }, /projection.*field/],
    [{ target_param: "" }, /projection.*target_param/],
    [{ op: "baseline_const", field: "missing" }, /projection.*field/],
    [{ op: "override_or_baseline", baseline_field: "missing" }, /projection.*baseline_field/],
  ])("rejects malformed rows at load time: %j", (change, error) => {
    const document = yaml.loadYamlDocumentSync<Record<string, unknown>>(fixturePath);
    document.projection = [
      { field: "extra_gain", target_param: "AV", op: "override_if_set", order: 1, ...change },
    ];
    expect(() => parseSourceContourDocument(document)).toThrow(error);
  });

  it.each([
    { projection: undefined, error: /projection.*array/ },
    { projection: {}, error: /projection.*array/ },
    {
      projection: [
        { field: "extra_gain", target_param: "AV", op: "override_if_set", order: 1 },
        { field: "extra_gain", target_param: "TL", op: "override_if_set", order: 1 },
      ],
      error: /projection.*order.*unique/,
    },
  ])("rejects missing/non-array projections and ambiguous order", ({ projection, error }) => {
    const document = yaml.loadYamlDocumentSync<Record<string, unknown>>(fixturePath);
    document.projection = projection;
    expect(() => parseSourceContourDocument(document)).toThrow(error);
  });

  it("rejects a projection target absent from the active experiment even when not an output column", async () => {
    const config = await loadExperimentConfig("klatt80-baseline");
    const document = yaml.loadYamlDocumentSync<Record<string, unknown>>(fixturePath);
    document.projection = [
      {
        field: "extra_gain",
        target_param: "NotAnExperimentParam",
        op: "override_if_set",
        order: 1,
      },
    ];
    const loadDocument = yaml.loadYamlDocument;
    const frontend = rulepack.loadBundledRulepackSpec("qlatt-english");
    const path = "/test/invalid-target-source-contour.yaml";
    vi.spyOn(rulepack, "preloadBundledRulepackSpec").mockResolvedValue({
      ...frontend,
      resources: { ...frontend.resources, source_contour: path },
    });
    vi.spyOn(yaml, "loadYamlDocument").mockImplementation(async (path) =>
      path === "/test/invalid-target-source-contour.yaml" ? document : loadDocument(path),
    );
    await expect(assertFrontendVocabulary("qlatt-english", config)).rejects.toThrow(
      /E_SOURCE_CONTOUR.*NotAnExperimentParam/,
    );
    config.semantics.params!.NotAnExperimentParam = { default: 0 };
    await expect(assertFrontendVocabulary("qlatt-english", config)).resolves.toBeUndefined();
    delete config.semantics.params!.NotAnExperimentParam;
    await expect(assertFrontendVocabulary("qlatt-english", config)).rejects.toThrow(
      /E_SOURCE_CONTOUR.*NotAnExperimentParam/,
    );
  });
});
