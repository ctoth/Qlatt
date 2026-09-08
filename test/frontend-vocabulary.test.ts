import { describe, expect, it } from "vitest";
import { assertFrontendVocabulary, checkVocabulary } from "../src/experiments/frontend-vocabulary";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";

describe("checkVocabulary", () => {
  it("reports all unknown columns and required inputs, preserving falsy defaults", async () => {
    const config = await loadExperimentConfig("klatt80-baseline");
    config.semantics.params = {
      required: {},
      alsoRequired: {},
      emitted: {},
      zero: { default: 0 },
      disabled: { default: false },
      empty: { default: "" },
    };
    delete config.graph.meta?.formantBanks;
    expect(checkVocabulary(["unknown", "another", "unknown", "emitted"], config)).toEqual({
      undeclaredColumns: ["unknown", "another"],
      missingRequiredParams: ["required", "alsoRequired"],
    });
  });

  it("expands bank inputs without mutating the original config", async () => {
    const config = await loadExperimentConfig("klatt80-baseline");
    const before = structuredClone(config);
    expect(config.semantics.params).not.toHaveProperty("F1");
    expect(checkVocabulary(["F1", "B1", "A1"], config)).toEqual({
      undeclaredColumns: [],
      missingRequiredParams: [],
    });
    expect(config).toEqual(before);
  });

  it("includes every offending name in the load error", async () => {
    const config = await loadExperimentConfig("klatt80-baseline");
    config.semantics.params!.requiredInput = {};
    const mismatch = checkVocabulary(["breathiness", "FNZ", "BNZ"], config);
    const error = await assertFrontendVocabulary("dectalk-english", config).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("E_FRONTEND_VOCABULARY");
    for (const name of [...mismatch.undeclaredColumns, ...mismatch.missingRequiredParams]) {
      expect(error.message).toContain(name);
    }
  });
});

describe("frontend/experiment pairing", () => {
  it("rejects DECtalk columns that the baseline does not declare", async () => {
    await expect(loadExperimentConfig("klatt80-baseline", "dectalk-english")).rejects.toThrow(
      /E_FRONTEND_VOCABULARY.*breathiness/,
    );
  });

  it.each([
    ["qlatt-english", "klatt80-baseline"],
    ["dectalk-english", "dectalk-english"],
    ["qlatt-beauty", "qlatt-beauty"],
  ])("accepts shipped pair %s / %s", async (frontendId, experimentId) => {
    await expect(loadExperimentConfig(experimentId, frontendId)).resolves.toBeDefined();
  });
});
