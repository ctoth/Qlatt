import { expect, it } from "vitest";
import { createDiagnostics } from "../src/diagnostics";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../src/formant-bank";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";

it("selects the physical source and routes aerodynamic subglottal pressure", async () => {
  const { graph, semantics, registry } = await loadExperimentConfig("steinecke95");
  expandFormantBanks(graph, semantics);
  const { topoEvaluator } = createConfiguredEvaluator();
  const result = topoEvaluator.evaluate(semantics, {
    params: { sourceMode: 3, subglottalPressure: 14.786 },
    constants: semantics.constants ?? {},
  });
  expect(result.errors).toEqual([]);
  expect(result.values.twoMassSourceSwitch).toBe(1);
  expect(result.values.impulseSourceSwitch).toBe(0);
  expect(result.values.lfSourceSwitch).toBe(0);
  expect(result.values.sourceBypassSwitch).toBe(1);
  expect(result.values.sourceDirectSwitch).toBe(0);
  expect(result.values.sourceDiffSwitch).toBe(0);
  expect(graph.nodes.aeroModel.params?.ps).toEqual({ bind: "twoMassPressure" });
  expect(registry.primitives["aerodynamic-model"].outputs).toBe(9);
  expect(graph.connections).toContainEqual({
    from: { node: "aeroModel", port: 8 },
    to: "twoMassSource",
  });
  expect(graph.connections).toContainEqual(["twoMassSource", "twoMassGain"]);
  expect(graph.connections).toContainEqual(["twoMassGain", "sourceSum"]);
});

it.each([0, 1, 2])("keeps legacy mode %i selection unchanged", async (sourceMode) => {
  const { graph, semantics } = await loadExperimentConfig("steinecke95");
  expandFormantBanks(graph, semantics);
  const { topoEvaluator } = createConfiguredEvaluator();
  const result = topoEvaluator.evaluate(semantics, {
    params: { sourceMode },
    constants: semantics.constants ?? {},
  });
  expect(result.errors).toEqual([]);
  expect(result.values.twoMassSourceSwitch).toBe(0);
  expect(result.values.impulseSourceSwitch).toBe(sourceMode === 1 ? 0 : 1);
  expect(result.values.lfSourceSwitch).toBe(sourceMode === 1 ? 1 : 0);
});

it("reports out-of-range controls and bounds them in the cited semantics", async () => {
  const { graph, semantics } = await loadExperimentConfig("steinecke95");
  expandFormantBanks(graph, semantics);
  const diagnostics = createDiagnostics();
  const { topoEvaluator } = createConfiguredEvaluator();
  const result = topoEvaluator.evaluate(semantics, {
    params: { subglottalPressure: 40, foldAsymmetry: 0.1 },
    constants: semantics.constants ?? {},
    diagnostics,
  });
  expect(result.errors).toEqual([]);
  expect(result.values.twoMassPressure).toBe(30);
  expect(result.values.twoMassAsymmetry).toBe(0.4);
  for (const name of ["subglottalPressure", "foldAsymmetry"]) {
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "W_SEMANTICS_PARAM_RANGE",
        data: expect.objectContaining({ name }),
      }),
    );
  }
});
