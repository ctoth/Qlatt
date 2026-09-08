import { expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

it("preserves lexical secondary stress on both Segment and Syllable", () => {
  const { utterance } = textToKlattTrackDetailed("celebration");
  const stresses = (relation: string) =>
    utterance
      .relation(relation)
      .listItems()
      .map((item) => item.get("stress"));
  expect(stresses("Segment")).toContain(2);
  expect(stresses("Syllable")).toContain(2);
});
