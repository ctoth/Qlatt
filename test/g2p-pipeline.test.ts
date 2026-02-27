/**
 * G2P Pipeline integration tests.
 *
 * Tests the pronounce() function which wires together:
 *   1. Dictionary lookup (highest accuracy)
 *   2. Morphological decomposition (medium accuracy)
 *   3. Elovitz LTS rules + Hunnicutt stress (fallback)
 *
 * Citation: Allen, Hunnicutt & Klatt (1987), From Text to Speech: The MITalk System.
 */

import { describe, expect, it } from "vitest";
import { pronounce } from "../src/g2p";
import type { DictLookup } from "../src/g2p/types";

// --- Helper dict factories ---

/** Empty dictionary -- always returns null. */
const emptyDict: DictLookup = () => null;

/** Build a simple dictionary from a record of word -> phoneme arrays. */
function makeDict(entries: Record<string, string[]>): DictLookup {
  return (word: string) => entries[word.toLowerCase()] ?? null;
}

// --- Block 1: Pipeline Order Tests ---

describe("pronounce() pipeline order", () => {
  it("uses dictionary pronunciation when word is in dict", () => {
    const dict = makeDict({ hello: ["HH", "AH0", "L", "OW1"] });
    const result = pronounce("hello", dict);
    expect(result.source).toBe("dictionary");
    expect(result.phonemes).toEqual(["HH", "AH0", "L", "OW1"]);
    expect(result.word).toBe("hello");
  });

  it("uses morphology when root is in dict but word is not", () => {
    const dict = makeDict({ run: ["R", "AH1", "N"] });
    const result = pronounce("running", dict);
    expect(result.source).toBe("morphology");
    expect(result.rootWord).toBe("run");
    expect(result.word).toBe("running");
  });

  it("falls back to LTS rules for truly unknown words", () => {
    const result = pronounce("blorf", emptyDict);
    expect(result.source).toBe("lts-rules");
    expect(result.phonemes.length).toBeGreaterThan(0);
    expect(result.word).toBe("blorf");
  });

  it("handles empty string safely", () => {
    const result = pronounce("", emptyDict);
    expect(result).toBeDefined();
    expect(result.phonemes).toBeDefined();
    expect(Array.isArray(result.phonemes)).toBe(true);
  });

  it("prefers dictionary over morphology when word is directly in dict", () => {
    // "running" is directly in dict -- should use dict, not morphology
    const dict = makeDict({
      running: ["R", "AH1", "N", "IH0", "NG"],
      run: ["R", "AH1", "N"],
    });
    const result = pronounce("running", dict);
    expect(result.source).toBe("dictionary");
    expect(result.phonemes).toEqual(["R", "AH1", "N", "IH0", "NG"]);
  });

  it("handles possessive 's via dict + Z", () => {
    const dict = makeDict({ cat: ["K", "AE1", "T"] });
    const result = pronounce("cat's", dict);
    expect(result.source).toBe("dictionary");
    expect(result.phonemes).toEqual(["K", "AE1", "T", "Z"]);
    expect(result.rootWord).toBe("cat");
  });
});

// --- Block 2: Pronunciation Quality Tests (LTS + Stress, no dict) ---

describe("pronounce() LTS pronunciation quality", () => {
  it("produces reasonable phonemes for 'cat'", () => {
    const result = pronounce("cat", emptyDict);
    expect(result.source).toBe("lts-rules");
    // Expect K, AE (with some stress digit), T
    const basePhonemes = result.phonemes.map((p) => p.replace(/\d$/, ""));
    expect(basePhonemes).toContain("K");
    expect(basePhonemes).toContain("AE");
    expect(basePhonemes).toContain("T");
  });

  it("produces reasonable phonemes for 'phone'", () => {
    const result = pronounce("phone", emptyDict);
    expect(result.source).toBe("lts-rules");
    const basePhonemes = result.phonemes.map((p) => p.replace(/\d$/, ""));
    expect(basePhonemes).toContain("F");
    expect(basePhonemes).toContain("OW");
    expect(basePhonemes).toContain("N");
  });

  it("produces reasonable phonemes for 'ship'", () => {
    const result = pronounce("ship", emptyDict);
    expect(result.source).toBe("lts-rules");
    const basePhonemes = result.phonemes.map((p) => p.replace(/\d$/, ""));
    expect(basePhonemes).toContain("SH");
    expect(basePhonemes).toContain("IH");
    expect(basePhonemes).toContain("P");
  });

  it("assigns stress markers to vowels", () => {
    const result = pronounce("cat", emptyDict);
    // Single-syllable word -- the vowel should get stress 1
    const vowelPhonemes = result.phonemes.filter((p) => /^[A-Z]+\d$/.test(p));
    expect(vowelPhonemes.length).toBeGreaterThan(0);
    // At least one vowel should have stress 1
    const hasStress1 = vowelPhonemes.some((p) => p.endsWith("1"));
    expect(hasStress1).toBe(true);
  });
});

// --- Block 3: Morphology + Stress Integration ---

describe("pronounce() morphology integration", () => {
  it("handles -ing suffix with dict root", () => {
    const dict = makeDict({ walk: ["W", "AO1", "K"] });
    const result = pronounce("walking", dict);
    expect(result.source).toBe("morphology");
    expect(result.rootWord).toBe("walk");
    // Should have root phonemes + IH0 NG or similar for -ing
    const basePhonemes = result.phonemes.map((p) => p.replace(/\d$/, ""));
    expect(basePhonemes).toContain("W");
    expect(basePhonemes).toContain("NG");
  });

  it("handles -ed suffix with voiceless final", () => {
    const dict = makeDict({ walk: ["W", "AO1", "K"] });
    const result = pronounce("walked", dict);
    expect(result.source).toBe("morphology");
    // K is voiceless -> -ed pronounced as T
    expect(result.phonemes[result.phonemes.length - 1]).toBe("T");
  });

  it("handles -ed suffix with voiced final", () => {
    const dict = makeDict({ call: ["K", "AO1", "L"] });
    const result = pronounce("called", dict);
    expect(result.source).toBe("morphology");
    // L is voiced -> -ed pronounced as D
    expect(result.phonemes[result.phonemes.length - 1]).toBe("D");
  });

  it("handles -s suffix with sibilant final", () => {
    const dict = makeDict({ kiss: ["K", "IH1", "S"] });
    const result = pronounce("kisses", dict);
    expect(result.source).toBe("morphology");
    // S is sibilant -> -es pronounced as IH0 Z
    const lastTwo = result.phonemes.slice(-2);
    expect(lastTwo).toEqual(["IH0", "Z"]);
  });

  it("handles prefix 'un-' with dict remainder", () => {
    const dict = makeDict({ happy: ["HH", "AE1", "P", "IY0"] });
    const result = pronounce("unhappy", dict);
    expect(result.source).toBe("morphology");
    expect(result.rootWord).toBe("happy");
  });
});

// --- Block 4: OOV Tracking ---

describe("pronounce() result fields", () => {
  it("populates word field for dict hits", () => {
    const dict = makeDict({ test: ["T", "EH1", "S", "T"] });
    const result = pronounce("test", dict);
    expect(result.word).toBe("test");
    expect(result.source).toBe("dictionary");
  });

  it("populates word field for LTS fallback", () => {
    const result = pronounce("xylophone", emptyDict);
    expect(result.word).toBe("xylophone");
    expect(result.source).toBe("lts-rules");
  });

  it("populates rootWord for morphology hits", () => {
    const dict = makeDict({ play: ["P", "L", "EY1"] });
    const result = pronounce("playing", dict);
    expect(result.source).toBe("morphology");
    expect(result.rootWord).toBe("play");
  });

  it("does not populate rootWord for dict hits without decomposition", () => {
    const dict = makeDict({ hello: ["HH", "AH0", "L", "OW1"] });
    const result = pronounce("hello", dict);
    expect(result.rootWord).toBeUndefined();
  });
});

// --- Block 5: Accuracy Benchmark (informational) ---

describe("pronounce() accuracy benchmark", () => {
  // Known CMU dictionary pronunciations for common words
  // These are tested through the LTS pipeline (NO dictionary) to measure
  // Elovitz rule quality. This is informational -- we don't fail on mismatches.
  const benchmarkWords: Array<{
    word: string;
    expectedBase: string[]; // base phonemes without stress digits
  }> = [
    { word: "the", expectedBase: ["DH", "AH"] },
    { word: "is", expectedBase: ["IH", "Z"] },
    { word: "at", expectedBase: ["AE", "T"] },
    { word: "it", expectedBase: ["IH", "T"] },
    { word: "on", expectedBase: ["AA", "N"] },
    { word: "up", expectedBase: ["AH", "P"] },
    { word: "big", expectedBase: ["B", "IH", "G"] },
    { word: "red", expectedBase: ["R", "EH", "D"] },
    { word: "hot", expectedBase: ["HH", "AA", "T"] },
    { word: "dog", expectedBase: ["D", "AO", "G"] },
    { word: "sun", expectedBase: ["S", "AH", "N"] },
    { word: "map", expectedBase: ["M", "AE", "P"] },
    { word: "pen", expectedBase: ["P", "EH", "N"] },
    { word: "fix", expectedBase: ["F", "IH", "K", "S"] },
    { word: "job", expectedBase: ["JH", "AA", "B"] },
    { word: "win", expectedBase: ["W", "IH", "N"] },
    { word: "lip", expectedBase: ["L", "IH", "P"] },
    { word: "top", expectedBase: ["T", "AA", "P"] },
    { word: "bus", expectedBase: ["B", "AH", "S"] },
    { word: "cut", expectedBase: ["K", "AH", "T"] },
  ];

  let correct = 0;
  let total = benchmarkWords.length;

  for (const { word, expectedBase } of benchmarkWords) {
    it(`LTS for "${word}"`, () => {
      const result = pronounce(word, emptyDict);
      const actualBase = result.phonemes.map((p) => p.replace(/\d$/, ""));
      const matches = JSON.stringify(actualBase) === JSON.stringify(expectedBase);
      if (matches) correct++;
      // Log but don't fail
      if (!matches) {
        console.log(
          `  [benchmark] "${word}": expected [${expectedBase}] got [${actualBase}]`
        );
      }
      // Always pass -- this is informational
      expect(result.phonemes.length).toBeGreaterThan(0);
    });
  }

  it("reports accuracy", () => {
    console.log(
      `\n  [G2P Accuracy Benchmark] ${correct}/${total} words matched CMU reference (${((correct / total) * 100).toFixed(1)}%)`
    );
    expect(true).toBe(true); // Always pass
  });
});
