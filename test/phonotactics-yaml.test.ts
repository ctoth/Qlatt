import { describe, expect, it } from "vitest";
import { isVowel, syllabify } from "../src/g2p/syllabify";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const PHONOTACTICS_PATH = "/rules/frontends/qlatt-english/phonotactics.yaml";

interface PhonotacticsData {
  version: string;
  citations: string[];
  vowels: string[];
  legal_onsets: string[];
  voicing_classes: {
    voiceless_finals: string[];
    td_finals: string[];
    sibilant_finals: string[];
    voiceless_consonants: string[];
  };
}

function isLegalOnset(consonants: string[]): boolean {
  if (consonants.length <= 1) return true;
  const data = loadYamlDocumentSync<PhonotacticsData>(PHONOTACTICS_PATH);
  const key = consonants.join("");
  return new Set(data.legal_onsets).has(key);
}

describe("phonotactics.yaml", () => {
  it("loads and contains exactly 16 vowels", () => {
    const data = loadYamlDocumentSync<PhonotacticsData>(PHONOTACTICS_PATH);
    expect(data.vowels).toHaveLength(16);
  });

  it("contains exactly 28 legal onset clusters", () => {
    const data = loadYamlDocumentSync<PhonotacticsData>(PHONOTACTICS_PATH);
    expect(data.legal_onsets).toHaveLength(28);
  });

  it('isVowel("AA") returns true, isVowel("P") returns false', () => {
    expect(isVowel("AA")).toBe(true);
    expect(isVowel("P")).toBe(false);
  });

  it('isLegalOnset(["S","P","R"]) returns true, isLegalOnset(["S","R","P"]) returns false', () => {
    expect(isLegalOnset(["S", "P", "R"])).toBe(true);
    expect(isLegalOnset(["S", "R", "P"])).toBe(false);
  });

  it("voicing classes contain expected phonemes", () => {
    const data = loadYamlDocumentSync<PhonotacticsData>(PHONOTACTICS_PATH);
    expect(data.voicing_classes.voiceless_finals).toContain("CH");
    expect(data.voicing_classes.td_finals).toContain("T");
    expect(data.voicing_classes.sibilant_finals).toContain("Z");
  });

  it("syllabification of multi-syllable word produces correct boundaries", () => {
    // "HELLO" = HH AH L OW → two syllables: [HH, AH] [L, OW]
    const result = syllabify(["HH", "AH", "L", "OW"]);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(["HH", "AH"]);
    expect(result[1]).toEqual(["L", "OW"]);
  });
});
