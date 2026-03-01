/**
 * Tests that verify the YAML frontend config sections (`output:` and
 * `transcription:`) in the default bundled frontend contain the expected values, matching
 * the hardcoded defaults in track-assembler.ts and transcribe-text.ts.
 */
import { describe, expect, it } from "vitest";
import { QLATT_V12_CEL_RULEPACK } from "../src/declarative-frontend/rule-pack";

const spec = QLATT_V12_CEL_RULEPACK as Record<string, any>;

describe("YAML frontend config — output section", () => {
  const output = spec.output;

  it("output section exists", () => {
    expect(output).toBeDefined();
    expect(typeof output).toBe("object");
  });

  it("blend.factor is 0.35", () => {
    expect(output.blend.factor).toBe(0.35);
  });

  it("blend.keys matches [F1, F2, F3, B1, B2, B3]", () => {
    expect(output.blend.keys).toEqual(["F1", "F2", "F3", "B1", "B2", "B3"]);
  });

  it("blend.smooth_types matches [vowel, nasal, liquid, glide]", () => {
    expect(output.blend.smooth_types).toEqual(["vowel", "nasal", "liquid", "glide"]);
  });

  it("min_duration.stop_release_ms is 5", () => {
    expect(output.min_duration.stop_release_ms).toBe(5);
  });

  it("min_duration.default_ms is 20", () => {
    expect(output.min_duration.default_ms).toBe(20);
  });

  it("transition_ms is 30", () => {
    expect(output.transition_ms).toBe(30);
  });

  it("final_silence_ms is 100", () => {
    expect(output.final_silence_ms).toBe(100);
  });

  it("blend has citations", () => {
    expect(Array.isArray(output.blend.citations)).toBe(true);
    expect(output.blend.citations.length).toBeGreaterThan(0);
  });
});

describe("YAML frontend config — transcription section", () => {
  const transcription = spec.transcription;

  it("transcription section exists", () => {
    expect(transcription).toBeDefined();
    expect(typeof transcription).toBe("object");
  });

  it("diagnostic_symbols has all 24 consonant entries", () => {
    const symbols = transcription.diagnostic_symbols;
    expect(typeof symbols).toBe("object");

    const expectedEntries: Record<string, string[]> = {
      b: ["B"], ch: ["CH"], d: ["D"], dh: ["DH"],
      f: ["F"], g: ["G"], hh: ["HH"], jh: ["JH"],
      k: ["K"], l: ["L"], m: ["M"], n: ["N"],
      ng: ["NG"], p: ["P"], r: ["R"], s: ["S"],
      sh: ["SH"], t: ["T"], th: ["TH"], v: ["V"],
      w: ["W"], y: ["Y"], z: ["Z"], zh: ["ZH"],
    };

    for (const [key, value] of Object.entries(expectedEntries)) {
      expect(symbols[key]).toEqual(value);
    }
    expect(Object.keys(symbols)).toHaveLength(24);
  });

  it("punctuation_tokens has all 6 marks", () => {
    expect(transcription.punctuation_tokens).toEqual(
      expect.arrayContaining([",", ".", "?", "!", ";", ":"])
    );
    expect(transcription.punctuation_tokens).toHaveLength(6);
  });
});
