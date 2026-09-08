import { describe, expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../src/formant-bank";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";

async function evaluate(experiment: string, params: Record<string, number> = {}) {
  const { graph, semantics } = await loadExperimentConfig(experiment);
  expandFormantBanks(graph, semantics);
  const diagnostics = createDiagnostics();
  const { topoEvaluator } = createConfiguredEvaluator();
  const result = topoEvaluator.evaluate(semantics, {
    params,
    constants: semantics.constants ?? {},
    diagnostics,
  });
  expect(result.errors).toEqual([]);
  return { graph, values: result.values, diagnostics: diagnostics.getEntries() };
}

describe("Laine 1988 four-formant higher-pole correction", () => {
  it.each([14, 17.5, 21])("scales the worked zeros and bandwidths with %s cm", async (length) => {
    const { values, graph } = await evaluate("laine88", { tractLength: length, NFC: 10 });
    for (let i = 1; i <= 4; i++) {
      expect(values[`hpcF${i}`]).toBeCloseTo(((2 * i - 1) * 35000) / (4 * length));
      expect(values[`hpcB${i}`]).toBeCloseTo(((i === 4 ? 2000 : 1500) * 17.5) / length);
      expect(graph.nodes[`hpc${i}`]).toMatchObject({
        type: "antiresonator",
        params: { frequency: { bind: `hpcF${i}` }, bandwidth: { bind: `hpcB${i}` } },
      });
    }
    expect(values.NFC).toBe(4);
    for (let i = 5; i <= 10; i++) expect(values[`cascadeF${i}Frequency`]).toBe(0);
    expect(graph.connections).toEqual(
      expect.arrayContaining([
        ["cascadeOutGain", "hpc1"],
        ["hpc1", "hpc2"],
        ["hpc2", "hpc3"],
        ["hpc3", "hpc4"],
        ["hpc4", "outputSum"],
        ["parallelSum", "outputSum"],
      ]),
    );
    expect(graph.connections).not.toContainEqual(["cascadeOutGain", "outputSum"]);
  });

  it("bounds unsupported lengths and reports the input", async () => {
    const { values, diagnostics } = await evaluate("laine88", { tractLength: 0 });
    expect(values.hpcF1).toBe(625);
    expect(diagnostics).toContainEqual(
      expect.objectContaining({
        code: "W_SEMANTICS_PARAM_RANGE",
        data: { name: "tractLength", value: 0, range: [14, 21] },
      }),
    );
  });

  it("leaves the legacy baseline correction bypassed and cascade count selectable", async () => {
    const { values } = await evaluate("klatt80-baseline", { NFC: 10, F6: 5700 });
    for (let i = 1; i <= 4; i++) expect(values[`hpcF${i}`]).toBe(0);
    expect(values.NFC).toBe(10);
    expect(values.cascadeF7Frequency).toBe(6700);
  });
});
