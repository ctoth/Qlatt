import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { describe, expect, it } from "vitest";
import { affectDegree, parseAffectPresets } from "../src/input/affect-presets";

function document() {
  return load(readFileSync("public/rules/affect/presets.yaml", "utf8")) as {
    degree: { points: number[][]; citations: string[] };
    variants: Record<string, Record<string, string>>;
    presets: {
      name: string;
      group: string;
      dimensions: Record<string, number>;
      vq: Record<string, number>;
      citations: string[];
    }[];
  };
}

describe("affect policy validation", () => {
  it("uses the declared curve, including intermediate knots and endpoint clamping", () => {
    const data = document();
    data.degree.points = [
      [0, 0],
      [0.5, 0.2],
      [1, 1],
    ];
    const library = parseAffectPresets(data);
    expect(affectDegree(0.5, library.degree)).toBe(0.2);
    expect(affectDegree(0.75, library.degree)).toBeCloseTo(0.6);
    expect(affectDegree(-1, library.degree)).toBe(0);
    expect(affectDegree(2, library.degree)).toBe(1);
    expect(affectDegree(Number.NaN, library.degree)).toBe(0);
  });

  it("accepts explicit variant targets that do not follow the old naming convention", () => {
    const data = document();
    data.variants.custom = { male: "happy", female: "sad" };
    expect(parseAffectPresets(data).variants.get("custom")?.get("male")).toBe("happy");
  });

  it("rejects duplicate names", () => {
    const data = document();
    data.presets.push(structuredClone(data.presets[0]));
    expect(() => parseAffectPresets(data)).toThrow(/Duplicate/);
  });

  it("rejects missing citations", () => {
    const data = document();
    data.presets[0].citations = [];
    expect(() => parseAffectPresets(data)).toThrow(/citations/);
  });

  it("rejects non-finite channel values", () => {
    const data = document();
    data.presets[0].vq.f0Scale = Number.NaN;
    expect(() => parseAffectPresets(data)).toThrow(/finite/);
  });

  it("rejects unresolved variants", () => {
    const data = document();
    data.variants.manic.male = "missing";
    expect(() => parseAffectPresets(data)).toThrow(/variant/);
  });

  it("rejects repeated curve inputs", () => {
    const data = document();
    data.degree.points = [
      [0, 0],
      [0, 0.5],
      [1, 1],
    ];
    expect(() => parseAffectPresets(data)).toThrow(/ascend/);
  });
});
