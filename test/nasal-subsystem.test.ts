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
    expect(result.values.nasalCoreFnzTarget).toBe(475);
    expect(result.values.nasalCoreFnz).toBe(250);
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

    expect(result.values.nasalCoreFnz).toBe(475);
    expect(result.values.nasalPlaceFnz).toBe(3000);
    expect(result.values.nasalPlaceBnz).toBe(100);
    expect(Number(result.values.anLinear)).toBeGreaterThan(0.5);
  });

  it("keeps the core nasal path active in the graph and adds a separate place antiformant node", async () => {
    const { graph } = await loadExperimentConfig("klatt80-baseline");
    expect(graph.nodes.nz?.options?.bypassAtZero).toBeUndefined();
    expect(graph.nodes.np?.options?.bypassAtZero).toBeUndefined();
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
          stream: "phone",
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
