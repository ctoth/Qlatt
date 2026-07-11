import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

describe("graph-native production frontend", () => {
  it("constructs and lowers one canonical Utterance", () => {
    const result = textToKlattTrackDetailed("hello world.", 110);

    expect(result.track.length).toBeGreaterThan(0);
    expect(result.utterance.relation("Token").listItems().length).toBeGreaterThan(0);
    expect(result.utterance.relation("Word").listItems().length).toBe(2);
    expect(result.utterance.relation("Syllable").listItems().length).toBeGreaterThan(0);
    expect(result.utterance.relation("Segment").listItems().length).toBeGreaterThan(0);

    const structure = result.utterance.relation("SylStructure");
    const firstWord = result.utterance.relation("Word").listItems()[0];
    const wordNode = structure.node(firstWord);
    expect(wordNode?.daughters.length).toBeGreaterThan(0);
    expect(wordNode?.daughters[0]?.daughters.length).toBeGreaterThan(0);

    expect("frontendPhones" in result).toBe(false);
    expect("controlScore" in result).toBe(false);
  });

  it.each(["dectalk-english", "qlatt-beauty"])(
    "executes %s through the same Utterance and lowerer",
    (frontendId) => {
      const result = textToKlattTrackDetailed("hello world.", 110, 30, { frontendId });

      expect(result.track.length).toBeGreaterThan(0);
      expect(result.utterance.relation("Word").listItems()).toHaveLength(2);
      expect(result.utterance.relation("Segment").listItems().length).toBeGreaterThan(0);
      expect("controlScore" in result).toBe(false);
    },
  );
});
