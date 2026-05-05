import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
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

describe("glottal modulation open quotient semantics", () => {
  it("interpolates Fant 1997 Table 1 OQi values from Rd", () => {
    const tableCases = [
      { rd: 0.3, oqi: 0.35 },
      { rd: 0.5, oqi: 0.47 },
      { rd: 0.7, oqi: 0.555 },
      { rd: 1.0, oqi: 0.65 },
      { rd: 1.4, oqi: 0.73 },
      { rd: 2.0, oqi: 0.78 },
      { rd: 2.7, oqi: 0.79 },
    ];

    for (const { rd, oqi } of tableCases) {
      const result = evaluate({ Rd: rd, RdPhraseOffset: 0, OQ: 0 });

      expect(result.errors).toEqual([]);
      expect(result.values.effectiveRd).toBeCloseTo(rd, 8);
      expect(result.values.glottalModOQ).toBeCloseTo(oqi, 6);
    }
  });

  it("lets explicit Klatt-style OQ percent override the Rd-derived value", () => {
    const result = evaluate({ Rd: 0.7, RdPhraseOffset: 0, OQ: 42 });

    expect(result.errors).toEqual([]);
    expect(result.values.rdDerivedOpenQuotientPct).toBeCloseTo(55.5, 6);
    expect(result.values.glottalModOQ).toBeCloseTo(0.42, 6);
  });
});
