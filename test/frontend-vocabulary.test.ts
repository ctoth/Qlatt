import { describe, expect, it } from "vitest";
import { loadBundledFrontendManifest } from "../src/declarative-frontend/rule-pack";
import { defaultExperimentFor } from "../src/experiments/frontend-pairing";
import { assertFrontendVocabulary, checkVocabulary } from "../src/experiments/frontend-vocabulary";
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { loadBundledPackages } from "../src/package-discovery";

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

  it("reads already-expanded bank inputs without mutating the prepared config", async () => {
    const config = await loadExperimentConfig("klatt80-baseline");
    const before = structuredClone(config);
    expect(config.semantics.params).toHaveProperty("F1");
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
  it("rejects an undeclared pair before vocabulary preparation", async () => {
    await expect(loadExperimentConfig("klatt80-baseline", "dectalk-english")).rejects.toThrow(
      /E_SYNTH_PAIRING.*dectalk-english.*klatt80-baseline/,
    );
  });

  it.each([
    ["qlatt-english", "klatt80-baseline"],
    ["dectalk-english", "dectalk-english"],
    ["dectalk-english", "dectalk-vtm"],
    ["qlatt-beauty", "qlatt-beauty"],
    ["qlatt-english", "laine88"],
    ["qlatt-english", "steinecke95"],
  ])("accepts shipped pair %s / %s", async (frontendId, experimentId) => {
    await expect(loadExperimentConfig(experimentId, frontendId)).resolves.toBeDefined();
  });

  it.each(["klsyn88", "stevens91"])("does not advertise an unsupported %s pair", async (id) => {
    await expect(loadExperimentConfig(id, "qlatt-english")).rejects.toThrow(/E_SYNTH_PAIRING/);
  });

  const frontendManifest = loadBundledFrontendManifest();
  const experimentIds = loadBundledPackages().backends.map((entry) => entry.id);

  it("uses only declared manifest defaults, with no same-id inference", () => {
    expect(defaultExperimentFor("dectalk-english", frontendManifest, experimentIds)).toBe(
      "dectalk-vtm",
    );
    expect(defaultExperimentFor("qlatt-beauty", frontendManifest, experimentIds)).toBe(
      "qlatt-beauty",
    );
    expect(defaultExperimentFor("qlatt-english", frontendManifest, experimentIds)).toBe(
      "klatt80-baseline",
    );
    expect(() => defaultExperimentFor("dectalk-english", null, experimentIds)).toThrow(
      /E_FRONTEND_DEFAULT_EXPERIMENT.*not in the frontend catalogue/,
    );
    expect(() =>
      defaultExperimentFor(
        "dectalk-english",
        { frontends: [{ id: "dectalk-english" }] },
        experimentIds,
      ),
    ).toThrow(/E_FRONTEND_DEFAULT_EXPERIMENT.*declares no default experiment/);
    expect(() =>
      defaultExperimentFor(
        "x",
        { frontends: [{ id: "x", defaultExperiment: "missing" }] },
        experimentIds,
      ),
    ).toThrow(/E_FRONTEND_DEFAULT_EXPERIMENT.*'x'.*'missing'/);
  });

  it("every frontend's default experiment declares the frontend's columns", async () => {
    for (const frontend of frontendManifest.frontends ?? []) {
      const experimentId = defaultExperimentFor(frontend.id, frontendManifest, experimentIds);
      await expect(
        loadExperimentConfig(experimentId, frontend.id),
        `${frontend.id} / ${experimentId}`,
      ).resolves.toBeDefined();
    }
  });
});
