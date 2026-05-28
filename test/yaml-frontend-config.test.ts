/**
 * Tests that verify the YAML frontend config sections (`output:` and
 * `transcription:`) in the default bundled frontend contain the expected values, matching
 * the frontend runtime requirements.
 */
import { describe, expect, it } from "vitest";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";

const spec = QLATT_ENGLISH_RULEPACK as Record<string, any>;

describe("YAML frontend config — output section", () => {
  const output = spec.output.lowering;

  it("lowering output section exists", () => {
    expect(output).toBeDefined();
    expect(typeof output).toBe("object");
  });

  it("transitions.blend.factor is 0.35 (with citations)", () => {
    expect(output.transitions.blend.factor).toEqual({
      value: 0.35,
      citations: expect.any(Array),
    });
    expect(output.transitions.blend.factor.value).toBe(0.35);
  });

  it("transitions.blend.keys matches [F1, F2, F3, B1, B2, B3]", () => {
    expect(output.transitions.blend.keys).toEqual(["F1", "F2", "F3", "B1", "B2", "B3"]);
  });

  it("transitions.blend.smooth_types matches [vowel, nasal, liquid, glide]", () => {
    expect(output.transitions.blend.smooth_types).toEqual(["vowel", "nasal", "liquid", "glide"]);
  });

  it("timeline.duration_floors.stop_release_ms is 5 (with citations)", () => {
    expect(output.timeline.duration_floors.stop_release_ms).toEqual({
      value: 5,
      citations: expect.any(Array),
    });
    expect(output.timeline.duration_floors.stop_release_ms.value).toBe(5);
  });

  it("timeline.duration_floors.default_ms is 20 (with citations)", () => {
    expect(output.timeline.duration_floors.default_ms).toEqual({
      value: 20,
      citations: expect.any(Array),
    });
    expect(output.timeline.duration_floors.default_ms.value).toBe(20);
  });

  it("timeline.initial_silence_ms is 30 (with citations)", () => {
    expect(output.timeline.initial_silence_ms).toEqual({
      value: 30,
      citations: expect.any(Array),
    });
    expect(output.timeline.initial_silence_ms.value).toBe(30);
  });

  it("timeline.final_silence_ms is 100 (with citations)", () => {
    expect(output.timeline.final_silence_ms).toEqual({
      value: 100,
      citations: expect.any(Array),
    });
    expect(output.timeline.final_silence_ms.value).toBe(100);
  });

  it("transitions.blend.factor has citations", () => {
    expect(Array.isArray(output.transitions.blend.factor.citations)).toBe(true);
    expect(output.transitions.blend.factor.citations.length).toBeGreaterThan(0);
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
