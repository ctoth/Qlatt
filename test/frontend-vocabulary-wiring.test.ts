import { describe, expect, it } from "vitest";
import { readLowerOptions } from "../src/declarative-frontend/hrg/lowering";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../src/formant-bank";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";

describe("emitted vocabulary has synthesis wiring", () => {
  // A missing consumer must not be hidden by deleting an authored output column.
  it.each(["qlatt-english", "dectalk-english", "qlatt-beauty"])(
    "%s retains cascade-count and high-frequency amplitude outputs",
    (frontendId) => {
      const columns = readLowerOptions(loadBundledRulepackSpec(frontendId).output.lowering).columns;
      expect(columns).toEqual(expect.arrayContaining(["NFC", "A9", "A10"]));
    },
  );

  it.each(["klatt80-baseline", "dectalk-english", "qlatt-beauty"])(
    "%s uses NFC to bypass only the upper cascade stages",
    async (experimentId) => {
      const { graph, semantics } = await loadExperimentConfig(experimentId);
      expandFormantBanks(graph, semantics);
      const { topoEvaluator } = createConfiguredEvaluator();
      const evaluate = (NFC: number) => {
        const result = topoEvaluator.evaluate(semantics, {
          params: { NFC, sampleRate: 48000 },
          constants: semantics.constants ?? {},
        });
        expect(result.errors).toEqual([]);
        return result.values;
      };
      const five = evaluate(5);
      const six = evaluate(6);
      expect(five.cascadeF5Frequency).toBeGreaterThan(0);
      expect(five.cascadeF6Frequency).toBe(0);
      expect(six.cascadeF6Frequency).toBeGreaterThan(0);
      expect(graph.nodes.cascadeF6.params?.frequency).toEqual({ bind: "cascadeF6Frequency" });
      expect(graph.nodes.cascadeF6.options?.bypassAtZero).toBe(true);
      expect(graph.nodes.parallelF6.params?.frequency).toEqual({ bind: "F6" });
    },
  );

  it("routes DECtalk A9/A10 into parallel output without extending its cascade", async () => {
    const { graph, semantics } = await loadExperimentConfig("dectalk-english");
    expandFormantBanks(graph, semantics);
    expect(graph.nodes).not.toHaveProperty("cascadeF9");
    expect(graph.nodes).not.toHaveProperty("cascadeF10");
    const { topoEvaluator } = createConfiguredEvaluator();
    const gains = (A9: number, A10: number) => {
      const result = topoEvaluator.evaluate(semantics, {
        params: { A9, A10, sampleRate: 48000 },
        constants: semantics.constants ?? {},
      });
      expect(result.errors).toEqual([]);
      return result.values;
    };
    const silent = gains(0, 0);
    const active = gains(42, 35);
    for (const index of [9, 10]) {
      expect(graph.nodes[`parallelF${index}`]?.params?.frequency).toEqual({ bind: `F${index}` });
      expect(graph.nodes[`parallelF${index}Gain`]?.params?.gain).toEqual({
        bind: `a${index}Linear`,
      });
      expect(graph.connections).toContainEqual(["parallelFricGain", `parallelF${index}`]);
      expect(graph.connections).toContainEqual([`parallelF${index}`, `parallelF${index}Gain`]);
      expect(graph.connections).toContainEqual([`parallelF${index}Gain`, "parallelSum"]);
      expect(silent[`a${index}Linear`]).toBe(0);
      expect(Math.abs(Number(active[`a${index}Linear`]))).toBeGreaterThan(0);
    }
  });
});
