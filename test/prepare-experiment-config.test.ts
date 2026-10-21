import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { loadExperimentConfig, type ExperimentConfig } from "../src/experiments/load-experiment-config";
import { prepareExperimentConfig } from "../src/experiments/prepare-experiment-config";
import { loadSemanticsDocumentSync } from "../src/semantics/load-semantics";
import { loadYamlDocumentSync } from "../src/yaml-loader";
import { createPreparedRuntime } from "./runtime-fixture";

const manifest = JSON.parse(readFileSync("public/experiments/manifest.json", "utf8")) as {
  experiments: { id: string }[];
};
const authored = (): ExperimentConfig => ({
  graph: { bacon: "0.1", nodes: { gain: { type: "gain", params: { gain: { bind: "result" } } } }, outputs: ["gain"] },
  registry: { bacon: "0.1", primitives: { gain: { native: "GainNode", params: { gain: { type: "float", default: 1 } } } } },
  semantics: { name: "fixture", params: { input: { default: 1 } }, realize: {
    result: "intermediate * 2", intermediate: "input + 1", dead: "input - 1",
  } },
});

describe("checked experiment preparation", () => {
  it.each(manifest.experiments)("checks every resolved manifest entry: $id", async ({ id }) => {
    const config = await loadExperimentConfig(id);
    expect(config.graph.meta?.formantBanks).toBeUndefined();
    expect(JSON.parse(JSON.stringify(config))).toEqual(config);
  });

  it("checks macro-generated endpoints after expansion without changing authored data", async () => {
    const raw: ExperimentConfig = {
      graph: loadYamlDocumentSync("/experiments/klatt80-baseline/graph.yaml"),
      registry: loadYamlDocumentSync("/experiments/klatt80-baseline/registry.yaml"),
      semantics: loadSemanticsDocumentSync("/experiments/klatt80-baseline/semantics.yaml"),
    };
    const before = structuredClone(raw);
    const first = prepareExperimentConfig(raw);
    expect(raw).toEqual(before);
    expect(prepareExperimentConfig(raw)).toEqual(first);
    const baseline = await loadExperimentConfig("klatt80-baseline");
    expect(baseline.graph.nodes.cascadeF1).toBeDefined();
    expect(baseline.graph.connections).toContainEqual(["tp", "cascadeF1"]);
    expect(baseline.sources.graph["/nodes/cascadeF1"].resource).toContain("klatt80-baseline/graph.yaml");
    expect(await loadExperimentConfig("klatt80-baseline")).toEqual(baseline);
  });

  it("rejects a missing endpoint before allocating nodes or loading worklets", async () => {
    const config = authored();
    config.graph.connections = [["missing", "gain"]];
    const createGain = vi.fn();
    const addModule = vi.fn();
    await expect(createPreparedRuntime({ ...config, audioContext: { createGain, audioWorklet: { addModule } } as unknown as AudioContext })).rejects.toThrow(/missing/);
    expect(createGain).not.toHaveBeenCalled();
    expect(addModule).not.toHaveBeenCalled();
  });

  it("derives dependencies and keeps indirectly consumed realizations live", () => {
    const config = prepareExperimentConfig(authored());
    expect(config.semantics.realize?.result).toMatchObject({ deps: ["intermediate"] });
    expect(config.unreachable.map((entry) => entry.definition)).toEqual(["realize.dead"]);
    expect(config.semantics.realize).toHaveProperty("dead");
  });

  it("rejects invalid bindings, references and dishonest dependencies with source fields", () => {
    const binding = authored();
    binding.graph.nodes.gain.params = { gain: { bind: "absent" } };
    expect(() => prepareExperimentConfig(binding, "selected")).toThrow(/selected:.*graph.*nodes\/gain\/params\/gain.*absent/);
    const reference = authored();
    reference.semantics.realize!.result = "missing + 1";
    expect(() => prepareExperimentConfig(reference)).toThrow(/E_SEMANTICS_REFERENCE.*realize\/result\/expr.*missing/);
    reference.semantics.realize!.result = "unknownFunction(input)";
    expect(() => prepareExperimentConfig(reference)).toThrow(/E_SEMANTICS_EXPRESSION/);
    reference.semantics.realize!.result = { expr: "intermediate", deps: ["dead"] };
    expect(() => prepareExperimentConfig(reference)).toThrow(/E_SEMANTICS_DEPENDENCY/);
  });

  it("retains inherited source owners rather than attributing them to the child", async () => {
    const config = await loadExperimentConfig("test-inherit");
    expect(config.sources.graph[""].resource).toContain("klatt80-baseline/graph.yaml");
    expect(config.sources.semantics["/params/AV/default"].resource).toContain("test-inherit/semantics.yaml");
    expect(config.sources.semantics["/realize/voiceGain/expr"].resource).toContain("klatt80-baseline/semantics.yaml");
  });
});
