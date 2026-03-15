import { describe, expect, it, vi, afterAll } from "vitest";
import { annotateProsody, FUNCTION_WORDS } from "../src/prosodic-annotator";
import { textToKlattTrack } from "../src/tts-frontend";
import { createProvenanceCollector } from "../src/provenance";

/**
 * Tests for prosodic structure annotation.
 *
 * Citations:
 * - Silverman et al. 1992 (ToBI break index tier)
 * - Pierrehumbert 1980 (pitch accent types, phrase accent, boundary tone)
 * - O'Shaughnessy 1976 (accent priority, function word classification)
 * - Allen, Hunnicutt & Klatt 1987 (MITalk POS-to-accent mapping)
 * - Ladd 2008 (nuclear accent = last accent in phrase)
 */

// Suppress console.warn from the pipeline (missing inventory targets, etc.)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warnSpy.mockRestore());

// ---------------------------------------------------------------------------
// Helper: build a minimal token for unit testing annotateProsody directly.
// ---------------------------------------------------------------------------

type MinimalToken = Record<string, unknown>;

function phone(
  phoneme: string,
  word: string,
  stress: number | null = null,
  type: string = "vowel",
): MinimalToken {
  return { phoneme, word, stress, type, params: {} };
}

function sil(punctuation?: string): MinimalToken {
  return {
    phoneme: "SIL",
    word: "",
    stress: null,
    type: "silence",
    punctuationSymbol: punctuation ?? null,
    params: {},
  };
}

// ---------------------------------------------------------------------------
// Unit tests: annotateProsody() with constructed tokens
// ---------------------------------------------------------------------------

describe("annotateProsody — unit tests", () => {
  describe("function word detection", () => {
    it('marks "the" and "on" as function words, "cat" / "sat" / "mat" as content words', () => {
      // "The cat sat on the mat."
      const tokens = [
        sil(),                                     // leading silence
        phone("DH", "the"),                        // the
        phone("AH", "the", 0),                     // the
        phone("K", "cat"),                          // cat
        phone("AE", "cat", 1),                     // cat (stressed)
        phone("T", "cat"),                          // cat
        phone("S", "sat"),                          // sat
        phone("AE", "sat", 1),                     // sat (stressed)
        phone("T", "sat"),                          // sat
        phone("AA", "on"),                          // on
        phone("N", "on"),                           // on
        phone("DH", "the"),                        // the
        phone("AH", "the", 0),                     // the
        phone("M", "mat"),                          // mat
        phone("AE", "mat", 1),                     // mat (stressed)
        phone("T", "mat"),                          // mat
        sil("."),                                   // period
      ];

      const result = annotateProsody(tokens);

      // "the" tokens are function words
      expect(result[1].isFunctionWord).toBe(true);
      expect(result[1].isContentWord).toBe(false);
      expect(result[2].isFunctionWord).toBe(true);

      // "cat" tokens are content words
      expect(result[3].isFunctionWord).toBe(false);
      expect(result[3].isContentWord).toBe(true);
      expect(result[4].isContentWord).toBe(true);

      // "on" is a function word
      expect(result[9].isFunctionWord).toBe(true);
      expect(result[10].isFunctionWord).toBe(true);

      // "mat" is a content word
      expect(result[13].isContentWord).toBe(true);
      expect(result[14].isContentWord).toBe(true);
    });
  });

  describe("accent assignment", () => {
    it('accents stressed vowels of content words, not function words in "The cat sat."', () => {
      const tokens = [
        sil(),
        phone("DH", "the"),
        phone("AH", "the", 0),
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),
        phone("S", "sat"),
        phone("AE", "sat", 1),
        phone("T", "sat"),
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // "the" — function word, not accented even though it has stress=0
      expect(result[1].isAccented).toBe(false);
      expect(result[2].isAccented).toBe(false);

      // "cat" — content word with primary stress → all phones accented
      expect(result[3].isAccented).toBe(true);
      expect(result[4].isAccented).toBe(true);
      expect(result[5].isAccented).toBe(true);

      // "sat" — content word with primary stress → all phones accented
      expect(result[6].isAccented).toBe(true);
      expect(result[7].isAccented).toBe(true);
    });
  });

  describe("nuclear accent", () => {
    it('places nuclear accent on the last content word "mat" in "The cat sat on the mat."', () => {
      const tokens = [
        sil(),
        phone("DH", "the"),
        phone("AH", "the", 0),
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),
        phone("S", "sat"),
        phone("AE", "sat", 1),
        phone("T", "sat"),
        phone("AA", "on"),
        phone("N", "on"),
        phone("DH", "the"),
        phone("AH", "the", 0),
        phone("M", "mat"),
        phone("AE", "mat", 1),
        phone("T", "mat"),
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // "mat" stressed vowel (index 14) should be nuclear accent
      expect(result[14].isNuclearAccent).toBe(true);

      // "cat" stressed vowel (index 4) should NOT be nuclear
      expect(result[4].isNuclearAccent).toBe(false);

      // "sat" stressed vowel (index 7) should NOT be nuclear
      expect(result[7].isNuclearAccent).toBe(false);
    });
  });

  describe("break indices", () => {
    it("assigns breakIndex=3 at comma, breakIndex=4 at period", () => {
      // "The cat sat , and it ran ."
      const tokens = [
        sil(),                            // 0: leading SIL
        phone("DH", "the"),               // 1
        phone("AH", "the", 0),            // 2
        phone("K", "cat"),                 // 3
        phone("AE", "cat", 1),            // 4
        phone("T", "cat"),                 // 5
        phone("S", "sat"),                 // 6
        phone("AE", "sat", 1),            // 7
        phone("T", "sat"),                 // 8
        sil(","),                          // 9: comma SIL
        phone("AE", "and", 0),            // 10
        phone("N", "and"),                 // 11
        phone("D", "and"),                 // 12
        phone("IH", "it", 0),             // 13
        phone("T", "it"),                  // 14
        phone("R", "ran"),                 // 15
        phone("AE", "ran", 1),            // 16
        phone("N", "ran"),                 // 17
        sil("."),                          // 18: period SIL
      ];

      const result = annotateProsody(tokens);

      // Comma SIL gets breakIndex=3
      expect(result[9].breakIndex).toBe(3);
      // Period SIL gets breakIndex=4
      expect(result[18].breakIndex).toBe(4);
    });

    it("assigns breakIndex=1 on the last phone of each word", () => {
      const tokens = [
        sil(),
        phone("DH", "the"),
        phone("AH", "the", 0),        // last phone of "the" → breakIndex=1
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),              // last phone of "cat" → breakIndex=1
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // Last phone of "the" (index 2)
      expect(result[2].breakIndex).toBe(1);
      // Last phone of "cat" (index 5)
      expect(result[5].breakIndex).toBe(1);
      // Mid-word phones should be 0
      expect(result[1].breakIndex).toBe(0);
      expect(result[3].breakIndex).toBe(0);
    });
  });

  describe("question accent type", () => {
    it('assigns L* nuclear accent and H% boundary tone for questions', () => {
      // "Is the cat here ?"
      const tokens = [
        sil(),
        phone("IH", "is", 0),
        phone("Z", "is"),
        phone("DH", "the"),
        phone("AH", "the", 0),
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),
        phone("HH", "here"),
        phone("IY", "here", 1),
        phone("R", "here"),
        sil("?"),
      ];

      const result = annotateProsody(tokens);

      // "here" stressed vowel (index 9) should be nuclear with L*+H (Pierrehumbert 1980)
      expect(result[9].isNuclearAccent).toBe(true);
      expect(result[9].accentType).toBe("L*+H");

      // Boundary tone on the SIL token
      expect(result[11].boundaryTone).toBe("H%");
      expect(result[11].phraseAccent).toBe("H-");
    });
  });

  describe("declarative accent type", () => {
    it('assigns H* nuclear accent and L% boundary tone for declaratives', () => {
      // "She went to the store ."
      const tokens = [
        sil(),
        phone("SH", "she"),
        phone("IY", "she", 1),
        phone("W", "went"),
        phone("EH", "went", 1),
        phone("N", "went"),
        phone("T", "went"),
        phone("T", "to"),
        phone("UW", "to", 0),
        phone("DH", "the"),
        phone("AH", "the", 0),
        phone("S", "store"),
        phone("T", "store"),
        phone("AO", "store", 1),
        phone("R", "store"),
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // "store" stressed vowel (index 13) should be nuclear with H*+L (Pierrehumbert 1980)
      expect(result[13].isNuclearAccent).toBe(true);
      expect(result[13].accentType).toBe("H*+L");

      // "went" stressed vowel (index 4) should be prenuclear L+H* (Pierrehumbert 1980)
      expect(result[4].isAccented).toBe(true);
      expect(result[4].isNuclearAccent).toBe(false);
      expect(result[4].accentType).toBe("L+H*");

      // "she" — personal pronoun, function word, not accented
      expect(result[1].isFunctionWord).toBe(true);
      expect(result[1].isAccented).toBe(false);

      // Boundary tone on SIL
      expect(result[15].boundaryTone).toBe("L%");
      expect(result[15].phraseAccent).toBe("L-");
    });
  });

  describe("all phones of word get word-level props", () => {
    it('all phones of "cat" have isFunctionWord=false, isContentWord=true', () => {
      const tokens = [
        sil(),
        phone("DH", "the"),
        phone("AH", "the", 0),
        phone("K", "cat"),              // consonant
        phone("AE", "cat", 1),          // stressed vowel
        phone("T", "cat"),              // consonant
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // All three phones of "cat"
      expect(result[3].isFunctionWord).toBe(false);
      expect(result[3].isContentWord).toBe(true);
      expect(result[4].isFunctionWord).toBe(false);
      expect(result[4].isContentWord).toBe(true);
      expect(result[5].isFunctionWord).toBe(false);
      expect(result[5].isContentWord).toBe(true);

      // All three phones of "cat" should also be accented (word has primary stress)
      expect(result[3].isAccented).toBe(true);
      expect(result[4].isAccented).toBe(true);
      expect(result[5].isAccented).toBe(true);
    });
  });

  describe("continuation (comma) boundary tone", () => {
    it('assigns L- phrase accent and H% boundary tone at comma', () => {
      const tokens = [
        sil(),
        phone("W", "well"),
        phone("EH", "well", 1),
        phone("L", "well"),
        sil(","),                        // comma
        phone("Y", "yes"),
        phone("EH", "yes", 1),
        phone("S", "yes"),
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // Comma SIL (index 4) — continuation
      expect(result[4].phraseAccent).toBe("L-");
      expect(result[4].boundaryTone).toBe("H%");

      // Period SIL (index 8) — declarative
      expect(result[8].phraseAccent).toBe("L-");
      expect(result[8].boundaryTone).toBe("L%");
    });
  });

  describe("provenance integration", () => {
    it("emits prosodic_annotation provenance records for each phrase", () => {
      const provenance = createProvenanceCollector();
      const tokens = [
        sil(),
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),
        sil(","),
        phone("D", "dog"),
        phone("AO", "dog", 1),
        phone("G", "dog"),
        sil("."),
      ];

      annotateProsody(tokens, { provenance });
      const decisions = provenance.getDecisions();

      // Should have at least 2 decisions (one per phrase).
      const prosodicDecisions = decisions.filter(
        (d) => d.type === "prosodic_annotation"
      );
      expect(prosodicDecisions.length).toBe(2);
      expect(prosodicDecisions[0].subject).toBe("phrase:0");
      expect(prosodicDecisions[1].subject).toBe("phrase:1");
      expect(prosodicDecisions[0].citations).toContain("Silverman 1992");
      expect(prosodicDecisions[0].citations).toContain("O'Shaughnessy 1976");
    });
  });

  describe("does not modify existing token properties", () => {
    it("preserves params, duration, and other pre-existing fields", () => {
      const tokens = [
        sil(),
        { phoneme: "K", word: "cat", stress: null, type: "stop", params: { F1: 300 }, duration: 50 },
        { phoneme: "AE", word: "cat", stress: 1, type: "vowel", params: { F1: 660 }, duration: 100 },
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // Original params preserved
      expect(result[1].params.F1).toBe(300);
      expect(result[1].duration).toBe(50);
      expect(result[2].params.F1).toBe(660);
      expect(result[2].duration).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("handles empty token array without crashing", () => {
      const result = annotateProsody([]);
      expect(result).toEqual([]);
    });

    it("assigns nuclear accent to a single content word phrase", () => {
      // "Cat."
      const tokens = [
        sil(),
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // The single content word should be nuclear
      expect(result[2].isNuclearAccent).toBe(true);
      expect(result[2].accentType).toBe("H*");
      // All phones accented
      expect(result[1].isAccented).toBe(true);
      expect(result[2].isAccented).toBe(true);
      expect(result[3].isAccented).toBe(true);
    });

    it("assigns no nuclear accent in all-function-word phrase", () => {
      // "Is it in the ?"
      const tokens = [
        sil(),
        phone("IH", "is", 0),
        phone("Z", "is"),
        phone("IH", "it", 0),
        phone("T", "it"),
        phone("IH", "in", 0),
        phone("N", "in"),
        phone("DH", "the"),
        phone("AH", "the", 0),
        sil("?"),
      ];

      const result = annotateProsody(tokens);

      // No token should be accented (all function words)
      for (let i = 1; i <= 8; i++) {
        expect(result[i].isAccented).toBe(false);
        expect(result[i].isNuclearAccent).toBe(false);
        expect(result[i].accentType).toBeNull();
      }
    });

    it("initializes phraseAccent and boundaryTone to null on all tokens", () => {
      const tokens = [
        sil(),
        phone("K", "cat"),
        phone("AE", "cat", 1),
        phone("T", "cat"),
        sil("."),
      ];

      const result = annotateProsody(tokens);

      // Non-boundary tokens should have null (not undefined)
      expect(result[1].phraseAccent).toBeNull();
      expect(result[1].boundaryTone).toBeNull();
      expect(result[2].phraseAccent).toBeNull();
      expect(result[2].boundaryTone).toBeNull();

      // Boundary SIL should have non-null values
      expect(result[4].phraseAccent).toBe("L-");
      expect(result[4].boundaryTone).toBe("L%");
    });
  });

  describe("long phrase breaking", () => {
    it("inserts breakIndex=2 in phrases with >6 content words", () => {
      // Build a phrase with 8 content words: w1 w2 w3 w4 w5 w6 w7 w8
      const words = ["big", "red", "dog", "jumped", "past", "old", "stone", "wall"];
      const tokens: MinimalToken[] = [sil()];
      for (const w of words) {
        tokens.push(phone("AH", w, 1));  // single-phone content word with stress
      }
      tokens.push(sil("."));

      const result = annotateProsody(tokens);

      // With 8 content words, midpoint = floor(8/2) = 4, breakIndex at word 3 (0-indexed)
      // contentWordEnds = [1,2,3,4,5,6,7,8] (token indices)
      // midpoint=4, break at contentWordEnds[3]=4
      const break2Tokens = result.filter((t: any) => t.breakIndex === 2);
      expect(break2Tokens.length).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Function word list coverage
// ---------------------------------------------------------------------------

describe("FUNCTION_WORDS set", () => {
  it("contains at least 100 entries (base forms + contractions)", () => {
    expect(FUNCTION_WORDS.size).toBeGreaterThanOrEqual(100);
  });

  it("contains core articles", () => {
    expect(FUNCTION_WORDS.has("a")).toBe(true);
    expect(FUNCTION_WORDS.has("an")).toBe(true);
    expect(FUNCTION_WORDS.has("the")).toBe(true);
  });

  it("contains prepositions", () => {
    expect(FUNCTION_WORDS.has("in")).toBe(true);
    expect(FUNCTION_WORDS.has("on")).toBe(true);
    expect(FUNCTION_WORDS.has("to")).toBe(true);
    expect(FUNCTION_WORDS.has("from")).toBe(true);
  });

  it("contains personal pronouns", () => {
    expect(FUNCTION_WORDS.has("i")).toBe(true);
    expect(FUNCTION_WORDS.has("me")).toBe(true);
    expect(FUNCTION_WORDS.has("he")).toBe(true);
    expect(FUNCTION_WORDS.has("she")).toBe(true);
  });

  it("contains contractions", () => {
    expect(FUNCTION_WORDS.has("i'm")).toBe(true);
    expect(FUNCTION_WORDS.has("don't")).toBe(true);
    expect(FUNCTION_WORDS.has("can't")).toBe(true);
    expect(FUNCTION_WORDS.has("won't")).toBe(true);
  });

  it("does NOT contain content words", () => {
    expect(FUNCTION_WORDS.has("cat")).toBe(false);
    expect(FUNCTION_WORDS.has("run")).toBe(false);
    expect(FUNCTION_WORDS.has("big")).toBe(false);
    expect(FUNCTION_WORDS.has("quickly")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration test: through textToKlattTrack pipeline
// ---------------------------------------------------------------------------

describe("prosodic annotation — integration via textToKlattTrack", () => {
  it("annotates tokens visibly in provenance records", () => {
    const provenance = createProvenanceCollector();
    textToKlattTrack("The cat sat on the mat.", 110, 30, { provenance });

    const decisions = provenance.getDecisions();
    const prosodicDecisions = decisions.filter(
      (d) => d.type === "prosodic_annotation"
    );

    // Should have at least one prosodic annotation decision
    expect(prosodicDecisions.length).toBeGreaterThanOrEqual(1);
    expect(prosodicDecisions[0].stage).toBe("prosody");
    expect(prosodicDecisions[0].citations).toContain("Silverman 1992");
  });
});
