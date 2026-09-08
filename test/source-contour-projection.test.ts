import { afterEach, describe, expect, it, vi } from "vitest";
import * as rulepack from "../src/declarative-frontend/rule-pack";
import { assertFrontendVocabulary } from "../src/experiments/frontend-vocabulary";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { loadSourceContourSync } from "../src/source-contour";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import * as yaml from "../src/yaml-loader";

const fixturePath = "/test/fixtures/source-contour-projection.yaml";

afterEach(() => vi.restoreAllMocks());

describe("source contour projection policy", () => {
  it("projects a fixture-only source field into frames in declared order with provenance", () => {
    const spec = rulepack.loadBundledRulepackSpec("qlatt-english");
    vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue({
      ...spec,
      source_contour_path: fixturePath,
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
    vi.spyOn(yaml, "loadYamlDocumentSync").mockReturnValue(document);
    expect(() => loadSourceContourSync(fixturePath)).toThrow(error);
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
    vi.spyOn(yaml, "loadYamlDocumentSync").mockReturnValue(document);
    expect(() => loadSourceContourSync(fixturePath)).toThrow(error);
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
    vi.spyOn(yaml, "loadYamlDocument").mockImplementation(async (path) =>
      path.endsWith("source-contour.yaml") ? document : loadDocument(path),
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
