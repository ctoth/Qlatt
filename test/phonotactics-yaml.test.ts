import { describe, expect, it } from "vitest";
import { loadYamlDocumentSync } from "../src/yaml-loader";
import { isVowel, syllabify } from "./g2p-fixture";

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
  const key = consonants.join(" ");
  return new Set(data.legal_onsets).has(key);
}

describe("phonotactics.yaml", () => {
  it("lists the sixteen qlatt-english vowels, then the seven only dectalk-english has", () => {
    const data = loadYamlDocumentSync<PhonotacticsData>(PHONOTACTICS_PATH);
    // dectalk-english shares this file through the morphology and stress
    // policy; a root whose only vowel is RR ("nurse") must count as a syllable.
    expect(data.vowels).toEqual([
      ...["AA", "AE", "AH", "AO", "AW", "AX", "AY", "EH"],
      ...["ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"],
      ...["RR", "IX", "IR", "AR", "OR", "UR", "YU"],
    ]);
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
