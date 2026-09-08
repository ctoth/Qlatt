import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { expandFormantBanks } from "../src/formant-bank";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import type { SemanticsDocument } from "../src/semantics/types";
import { textToKlattTrack } from "../src/tts-frontend";
import { parseYamlString } from "../src/yaml-loader";

const path = resolve("public/experiments/klatt80-baseline/semantics.yaml");
const semantics = parseYamlString<SemanticsDocument>(readFileSync(path, "utf8"), path);
const expandedSemantics = structuredClone(semantics);
const graphPath = resolve("public/experiments/klatt80-baseline/graph.yaml");
expandFormantBanks(
  parseYamlString<Parameters<typeof expandFormantBanks>[0]>(
    readFileSync(graphPath, "utf8"),
    graphPath,
  ),
  expandedSemantics,
);

function evaluate(overrides: Record<string, number> = {}) {
  const params: Record<string, number> = {
    F0: 0,
    AV: 0,
    AH: 0,
    AF: 55,
    AVS: 0,
    GO: 47,
    SW: 1,
    sampleRate: 48000,
    Ac: 0.1,
    Ug: 300,
    fricationMode: 1,
    fricPressureExponent: 1.3,
    fricAreaExponent: 0.3,
    fricReferenceDb: 55,
    fricFrontCavityCm: 1.2,
  };
  for (let index = 1; index <= 10; index++) {
    params[`F${index}`] = 500 + (index - 1) * 1000;
    params[`B${index}`] = 100;
    params[`A${index}`] = 40;
  }
  Object.assign(params, overrides);
  const result = createConfiguredEvaluator().topoEvaluator.evaluate(expandedSemantics, {
    params,
    constants: semantics.constants ?? {},
  });
  expect(result.errors).toEqual([]);
  return result.values;
}

describe("aerodynamic frication integration", () => {
  it("carries cited physical inventory targets through HRG lowering and clears them afterward", () => {
    const track = textToKlattTrack("Sue saw fish.", 110);
    for (const phone of ["S", "SH", "F"]) {
      const frames = track.filter((frame) => frame.phoneme === phone);
      expect(frames.length).toBeGreaterThan(0);
      expect(frames.some((frame) => Number(frame.params.Ac) > 0)).toBe(true);
      expect(frames.some((frame) => Number(frame.params.Ug) > 0)).toBe(true);
    }
    const vowels = track.filter((frame) => frame.phoneme === "UW" || frame.phoneme === "AO");
    expect(vowels.length).toBeGreaterThan(0);
    expect(vowels.every((frame) => Number(frame.params.Ac ?? 0) === 0)).toBe(true);
  });
  it("selects the physical source and records derived pressure and AF", () => {
    const values = evaluate();
    expect(values.fricLegacyMix).toBe(0);
    expect(values.fricSourceArea).toBe(0.1);
    expect(values.fricPressureKpa).toBeCloseTo(0.4617, 5);
    expect(values.fricDbAdjusted).toBeCloseTo(55, 5);
  });

  it("applies the pressure law exactly once across source and downstream gain", () => {
    const reference = evaluate();
    const doubled = evaluate({ Ug: 600 });
    expect(Number(doubled.fricDbAdjusted) - Number(reference.fricDbAdjusted)).toBeCloseTo(
      20 * 1.3 * Math.log10(4),
      5,
    );
    expect(doubled.fricGainScaled).toBeCloseTo(Number(reference.fricGainScaled), 10);
  });

  it("retains dB fallback when disabled or when no aerodynamic target exists", () => {
    const overrides: Record<string, number>[] = [{ fricationMode: 0 }, { Ac: 0 }];
    for (const override of overrides) {
      const values = evaluate({ ...override, AF: 43 });
      expect(values.fricLegacyMix).toBe(1);
      expect(values.fricSourceArea).toBe(0);
      expect(values.fricDbAdjusted).toBe(43);
      expect(values.fricA2).toBe(40);
    }
  });

  it("does not resurrect dB noise when a physical constriction has zero flow", () => {
    const values = evaluate({ Ug: 0 });
    expect(values.fricLegacyMix).toBe(0);
    expect(values.fricSourceArea).toBe(0.1);
    expect(values.fricDriveGain).toBe(0);
  });

  it("derives parallel amplitudes from the front cavity rather than old A values", () => {
    const reference = evaluate();
    const changedDb = evaluate({ A2: 70, A3: 70, A4: 70 });
    expect(changedDb.fricA2).toBe(reference.fricA2);
    expect(changedDb.fricA3).toBe(reference.fricA3);
    expect(evaluate({ fricFrontCavityCm: 2.5 }).fricA3).not.toBe(reference.fricA3);
  });

  it("binds each parallel formant to its authored amplitude realization", () => {
    const graphPath = resolve("public/experiments/klatt80-baseline/graph.yaml");
    const graph = parseYamlString<Parameters<typeof expandFormantBanks>[0]>(
      readFileSync(graphPath, "utf8"),
      graphPath,
    );
    const document = structuredClone(semantics);
    expandFormantBanks(graph, document);
    expect(graph.nodes.parallelF2Gain.params?.gain).toEqual({ bind: "fricA2Linear" });
    const rule = document.realize?.a2Linear;
    expect(typeof rule === "object" && rule.deps?.includes("A2")).toBe(true);
  });
});
