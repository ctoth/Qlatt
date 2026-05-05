import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { dbToLinear } from "../src/builtin-functions";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import type { EvaluationContext, SemanticsDocument } from "../src/semantics/types";
import { parseYamlString } from "../src/yaml-loader";

const semanticsPath = resolve(__dirname, "../public/experiments/klatt80-baseline/semantics.yaml");
const semanticsRaw = readFileSync(semanticsPath, "utf-8");
const semantics = parseYamlString<SemanticsDocument>(semanticsRaw, semanticsPath);

function evaluate(params: Record<string, number>) {
  const { topoEvaluator } = createConfiguredEvaluator();
  const context: EvaluationContext = {
    params,
    constants: semantics.constants ?? {},
  };
  return topoEvaluator.evaluate(semantics, context);
}

describe("aspiration and frication routing", () => {
  it("does not promote AH into frication gain in parallel mode", () => {
    const result = evaluate({
      F0: 0,
      F1: 500,
      F2: 1500,
      F3: 2500,
      F4: 3500,
      F5: 4500,
      F6: 5500,
      F7: 6500,
      F8: 7500,
      F9: 8500,
      F10: 9500,
      B1: 80,
      B2: 90,
      B3: 100,
      B4: 300,
      B5: 300,
      B6: 300,
      B7: 400,
      B8: 500,
      B9: 600,
      B10: 800,
      AV: 0,
      AH: 55,
      AF: 0,
      AVS: 0,
      GO: 47,
      SW: 1,
      sampleRate: 44100,
    });

    expect(result.errors).toEqual([]);
    expect(result.values.fricDbAdjusted).toBe(0);
    expect(result.values.fricGain).toBeCloseTo(dbToLinear(47 + 0 - 119), 8);
    expect(result.values.aspGain as number).toBeGreaterThan(result.values.fricGain as number);
  });
});
