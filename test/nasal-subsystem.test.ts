import { describe, expect, it } from "vitest";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrack } from "../src/tts-frontend";
import { emitNasalSubsystemExplainability } from "../src/nasal-subsystem";

describe("nasal subsystem semantics", () => {
  it("realizes oral cancellation with the core zero equal to the core pole", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: { F1: 700 },
      constants: semantics.constants ?? {},
    });

    expect(result.values.nasalCoreFnp).toBe(250);
    expect(result.values.nasalCoreFnpTarget).toBe(800);
    expect(result.values.nasalCoreFnzTarget).toBe(750);
    expect(result.values.nasalCoreFnz).toBe(250);
    expect(result.values.nasalRuntimeActive).toBe(0);
    expect(result.values.nasalCoreFnpBound).toBe(0);
    expect(result.values.nasalCoreFnzBound).toBe(0);
  });

  it("derives coupled nasal targets and place antiformants from high-level controls", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: {
        F1: 700,
        AN: 0,
        nasalCoupling: 1,
        nasalPlaceIndex: 3,
        nasalMurmurStrength: 1,
      },
      constants: semantics.constants ?? {},
    });

    expect(result.values.nasalCoreFnpTarget).toBe(800);
    expect(result.values.nasalCoreFnp).toBe(800);
    expect(result.values.nasalCoreFnzTarget).toBe(750);
    expect(result.values.nasalCoreFnz).toBe(750);
    expect(result.values.nasalPlaceFnz).toBe(3000);
    expect(result.values.nasalPlaceBnz).toBe(100);
    expect(Number(result.values.nasalSecondaryCueScale)).toBe(1);
    expect(result.values.nasalRuntimeActive).toBe(1);
    expect(result.values.nasalCoreFnpBound).toBe(800);
    expect(result.values.nasalCoreFnzBound).toBe(750);
    expect(Number(result.values.anLinear)).toBeGreaterThan(0.5);
  });

  it("moves both nasal pole and zero during partial vowel nasalization", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: {
        F1: 700,
        nasalCoupling: 0.5,
        nasalMurmurStrength: 0,
      },
      constants: semantics.constants ?? {},
    });

    expect(result.values.nasalCoreFnpTarget).toBe(800);
    expect(result.values.nasalCoreFnzTarget).toBe(750);
    expect(result.values.nasalCoreFnp).toBe(525);
    expect(result.values.nasalCoreFnz).toBe(500);
    expect(result.values.nasalPlaceFnz).toBe(0);
    expect(result.values.nasalPlaceBnz).toBe(0);
  });

  it("keeps the parallel nasal branch silent for oral defaults", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: {
        F1: 700,
        AN: 0,
        nasalCoupling: 0,
        nasalPlaceIndex: 0,
        nasalMurmurStrength: 0,
      },
      constants: semantics.constants ?? {},
    });

    expect(result.values.nasalParallelDb).toBe(0);
    expect(Number(result.values.nasalSecondaryCueScale)).toBe(0);
    expect(Number(result.values.anLinear)).toBe(0);
    expect(result.values.nasalRuntimeActive).toBe(0);
    expect(result.values.nasalCoreBnpBound).toBe(0);
    expect(result.values.nasalCoreBnzBound).toBe(0);
  });

  it("tapers B1 widening nonlinearly for partial coupling", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: {
        F0: 100,
        F1: 700,
        B1: 100,
        nasalCoupling: 0.5,
        nasalB1AdditionHz: 107,
      },
      constants: semantics.constants ?? {},
    });

    expect(Number(result.values.nasalSecondaryCueScale)).toBeCloseTo(0.25, 6);
    expect(Number(result.values.B1)).toBeGreaterThan(120);
    expect(Number(result.values.B1)).toBeLessThan(130);
  });

  it("bypasses the core nasal graph in oral speech and keeps a separate place antiformant node", async () => {
    const { graph } = await loadExperimentConfig("klatt80-baseline");
    expect(graph.nodes.nz?.options?.bypassAtZero).toBe(true);
    expect(graph.nodes.np?.options?.bypassAtZero).toBe(true);
    expect(graph.nodes.parallelNasal?.options?.bypassAtZero).toBe(true);
    expect(graph.nodes.nzPlace?.options?.bypassAtZero).toBe(true);
  });
});

describe("nasal subsystem explainability", () => {
  it("records nasal provenance events for declarative nasal behavior", () => {
    const provenance = createProvenanceCollector();
    const diagnostics = createDiagnostics();

    textToKlattTrack("nina", 110, 30, { provenance, diagnostics });

    const decisions = provenance.getDecisions();
    expect(decisions.some((decision) => decision.type === "nasal_place_assigned")).toBe(true);
    expect(decisions.some((decision) => decision.type === "nasal_coupling_contour_applied")).toBe(true);
    expect(decisions.some((decision) => decision.type === "nasal_core_zero_derived")).toBe(true);
    expect(diagnostics.getEntries().some((entry) => entry.code === "I_NASAL_RUNTIME_BOUND")).toBe(true);
  });

  it("emits stable nasal diagnostic codes for invalid declarative inputs", () => {
    const diagnostics = createDiagnostics();
    const provenance = createProvenanceCollector();

    emitNasalSubsystemExplainability(
      [
        {
          id: "ph_0",
          relation: "phone",
          type: "nasal",
          phoneme: "N",
          params: { nasalCoupling: 1.5, nasalPlaceIndex: 9, FNZ: 1700 },
        },
      ],
      [
        {
          phoneme: "N",
          params: { nasalCoupling: 1, nasalCoreFnz: 250, nasalPlaceFnz: 0 },
        },
      ],
      provenance,
      diagnostics,
      new Map(),
    );

    const codes = diagnostics.getEntries().map((entry) => entry.code);
    expect(codes).toContain("W_NASAL_COUPLING_CLAMPED");
    expect(codes).toContain("W_NASAL_UNKNOWN_PLACE");
    expect(codes).toContain("W_NASAL_LEGACY_PARAM_USED");
  });
});
