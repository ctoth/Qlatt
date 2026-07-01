import { describe, expect, it } from "vitest";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import { dbToLinear } from "../src/builtin-functions";

describe("DSP paper-divergence TDDs", () => {
  it("defaults the klatt80 baseline to the classic impulse source rather than LF", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    expect(semantics.params?.sourceMode?.default).toBe(0);
  });

  it("does not insert a non-paper output compressor or non-unity post-filter gain staging", async () => {
    const { graph, semantics } = await loadExperimentConfig("klatt80-baseline");

    expect(graph.nodes.outputCompressor).toBeUndefined();
    expect(graph.nodes.masterGain).toBeUndefined();
    expect(semantics.params?.masterGain?.default).toBe(1);
    expect(semantics.params?.outputGain?.default).toBe(1);
  });

  it("keeps the nasal cancellation pair active in oral speech instead of hard-bypassing it", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: { F1: 700, nasalCoupling: 0, nasalMurmurStrength: 0 },
      constants: semantics.constants ?? {},
    });

    expect(result.values.nasalCoreFnp).toBe(250);
    expect(result.values.nasalCoreFnz).toBe(250);
    expect(result.values.nasalCoreFnpBound).toBe(250);
    expect(result.values.nasalCoreFnzBound).toBe(250);
  });

  it("does not apply an unsupported 10x multiplier to AVS gain", async () => {
    const { semantics } = await loadExperimentConfig("klatt80-baseline");
    const { topoEvaluator } = createConfiguredEvaluator();
    const result = topoEvaluator.evaluate(semantics, {
      params: {
        GO: 47,
        AVS: 47,
        Rd: 0.7,
        RdRef: 0.7,
        EePhraseDb: 0,
        RdPhraseOffset: 0,
      },
      constants: semantics.constants ?? {},
    });

    const expected = dbToLinear(47 + 47 - 91);
    expect(Number(result.values.avsGain)).toBeCloseTo(expected, 6);
  });
});
