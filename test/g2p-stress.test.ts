import { describe, expect, it } from "vitest";
import { stressPronunciation } from "../src/g2p/stress";
import { assignStress, isVowel, syllabify } from "./g2p-fixture";

// ── Block 1: Vowel/Consonant Classification ────────────────────────────

describe("vowel classification", () => {
  const VOWELS = [
    "AA",
    "AE",
    "AH",
    "AO",
    "AW",
    "AY",
    "EH",
    "ER",
    "EY",
    "IH",
    "IY",
    "OW",
    "OY",
    "UH",
    "UW",
  ];

  const CONSONANTS = [
    "B",
    "CH",
    "D",
    "DH",
    "F",
    "G",
    "HH",
    "JH",
    "K",
    "L",
    "M",
    "N",
    "NG",
    "P",
    "R",
    "S",
    "SH",
    "T",
    "TH",
    "V",
    "W",
    "Y",
    "Z",
    "ZH",
  ];

  it("classifies all ARPABET vowels as vowels", () => {
    for (const v of VOWELS) {
      expect(isVowel(v), `${v} should be a vowel`).toBe(true);
    }
  });

  it("classifies all ARPABET consonants as non-vowels", () => {
    for (const c of CONSONANTS) {
      expect(isVowel(c), `${c} should NOT be a vowel`).toBe(false);
    }
  });

  it("classifies ER as a vowel (syllabic)", () => {
    expect(isVowel("ER")).toBe(true);
  });

  it("classifies diphthongs AY, AW, OY, EY, OW as vowels", () => {
    for (const d of ["AY", "AW", "OY", "EY", "OW"]) {
      expect(isVowel(d), `${d} should be a vowel`).toBe(true);
    }
  });
});

// ── Block 2: Syllabification ────────────────────────────────────────────

describe("syllabification", () => {
  it('"cat" -> 1 syllable: [K, AE, T]', () => {
    expect(syllabify(["K", "AE", "T"])).toEqual([["K", "AE", "T"]]);
  });

  it('"better" -> 2 syllables: [B, EH] [T, ER]', () => {
    expect(syllabify(["B", "EH", "T", "ER"])).toEqual([
      ["B", "EH"],
      ["T", "ER"],
    ]);
  });

  it('"banana" -> 3 syllables: [B, AH] [N, AE] [N, AH]', () => {
    expect(syllabify(["B", "AH", "N", "AE", "N", "AH"])).toEqual([
      ["B", "AH"],
      ["N", "AE"],
      ["N", "AH"],
    ]);
  });

  it('"strength" -> 1 syllable with complex onset+coda: [S, T, R, EH, NG, TH]', () => {
    expect(syllabify(["S", "T", "R", "EH", "NG", "TH"])).toEqual([
      ["S", "T", "R", "EH", "NG", "TH"],
    ]);
  });

  it('"extra" -> 2 syllables with onset maximization: [EH, K] [S, T, R, AH]', () => {
    expect(syllabify(["EH", "K", "S", "T", "R", "AH"])).toEqual([
      ["EH", "K"],
      ["S", "T", "R", "AH"],
    ]);
  });

  it("single vowel -> 1 syllable: [AH]", () => {
    expect(syllabify(["AH"])).toEqual([["AH"]]);
  });

  it('"please" -> 1 syllable with cluster onset: [P, L, IY, Z]', () => {
    expect(syllabify(["P", "L", "IY", "Z"])).toEqual([["P", "L", "IY", "Z"]]);
  });

  it("no vowels -> 1 degenerate syllable", () => {
    expect(syllabify(["S", "T"])).toEqual([["S", "T"]]);
  });

  it("empty input -> empty output", () => {
    expect(syllabify([])).toEqual([]);
  });
});

// ── Block 3: Stress Assignment ──────────────────────────────────────────

describe("stress assignment", () => {
  // Monosyllables: always primary stress
  it('"cat" -> K AE1 T', () => {
    expect(assignStress(["K", "AE", "T"])).toEqual(["K", "AE1", "T"]);
  });

  it('"the" (isolated) -> DH AH1', () => {
    expect(assignStress(["DH", "AH"])).toEqual(["DH", "AH1"]);
  });

  // 2-syllable: stress penult (first)
  it('"happy" -> HH AE1 P IY0', () => {
    expect(assignStress(["HH", "AE", "P", "IY"])).toEqual(["HH", "AE1", "P", "IY0"]);
  });

  it('"better" -> B EH1 T ER0', () => {
    expect(assignStress(["B", "EH", "T", "ER"])).toEqual(["B", "EH1", "T", "ER0"]);
  });

  // 3-syllable: stress antepenult (first)
  it('"animal" -> AE1 N AH0 M AH0 L', () => {
    expect(assignStress(["AE", "N", "AH", "M", "AH", "L"])).toEqual([
      "AE1",
      "N",
      "AH0",
      "M",
      "AH0",
      "L",
    ]);
  });

  it('"elephant" -> EH1 L AH0 F AH0 N T', () => {
    expect(assignStress(["EH", "L", "AH", "F", "AH", "N", "T"])).toEqual([
      "EH1",
      "L",
      "AH0",
      "F",
      "AH0",
      "N",
      "T",
    ]);
  });

  // Edge cases
  it("empty input -> empty output", () => {
    expect(assignStress([])).toEqual([]);
  });

  it("no vowels -> unchanged", () => {
    expect(assignStress(["S", "T"])).toEqual(["S", "T"]);
  });
});

// ── Block 4: Stress with Suffix Hints ───────────────────────────────────

describe("stress assignment with hints", () => {
  it('"organic" with penult-forcing hint -> AO0 R G AE1 N IH0 K', () => {
    expect(
      assignStress(["AO", "R", "G", "AE", "N", "IH", "K"], {
        stressType: "forcing",
        stressTarget: "penult",
      }),
    ).toEqual(["AO0", "R", "G", "AE1", "N", "IH0", "K"]);
  });

  it('"employee" with final-forcing hint retains an earlier secondary foot', () => {
    expect(
      assignStress(["EH", "M", "P", "L", "OY", "IY"], {
        stressType: "forcing",
        stressTarget: "final",
      }),
    ).toEqual(["EH2", "M", "P", "L", "OY0", "IY1"]);
  });

  it("antepenult-forcing hint works like default for 3-syllable word", () => {
    expect(
      assignStress(["AE", "N", "AH", "M", "AH", "L"], {
        stressType: "forcing",
        stressTarget: "antepenult",
      }),
    ).toEqual(["AE1", "N", "AH0", "M", "AH0", "L"]);
  });
});

// ── Block 5: Additional Words ───────────────────────────────────────────

describe("stress assignment — additional words", () => {
  it('"computer" uses its heavy penult (Hayes 1982, pp. 238–240)', () => {
    // Surface AH cannot distinguish schwa from STRUT. The default quantity
    // assumption retains this closed initial foot; evaluation reports the over-stress.
    expect(assignStress(["K", "AH", "M", "P", "Y", "UW", "T", "ER"])).toEqual([
      "K",
      "AH2",
      "M",
      "P",
      "Y",
      "UW1",
      "T",
      "ER0",
    ]);
  });

  it('"understand" with known verb category stresses its heavy final (Hayes 1982, p. 238)', () => {
    expect(
      stressPronunciation(["AH", "N", "D", "ER", "S", "T", "AE", "N", "D"], {
        policyPath: "/rules/frontends/qlatt-english/stress-policy.yaml",
        category: "verb",
      }).phonemes,
    ).toEqual(["AH2", "N", "D", "ER0", "S", "T", "AE1", "N", "D"]);
  });

  it('"telephone" retains final secondary from LVS (Hayes 1982, pp. 239–240)', () => {
    expect(assignStress(["T", "EH", "L", "AH", "F", "OW", "N"])).toEqual([
      "T",
      "EH1",
      "L",
      "AH0",
      "F",
      "OW2",
      "N",
    ]);
  });
});
