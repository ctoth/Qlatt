/**
 * Text with no punctuation at its end, in the dectalk-english frontend.
 *
 * DECtalk closes such a text as a sentence when it is flushed: the text task
 * sends a breath break (LTS/ls_task.c:1236-1260) and the phonemic stage gets
 * the words, a word boundary and the period symbol. The frontend once threw
 * on any such text that ended in a voiceless stop ("1st", "cat", "$1.01"):
 * the one rule written for a stop with nothing after it built an invalid
 * control window, and no test ever reached it.
 *
 * The same texts are in test/oracle-corpora/dectalk-us-unpunctuated-v1.json
 * against say.exe's packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function phones(text: string, frontendId = "dectalk-english"): string[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false)
    .map((segment) => String(segment.get("phoneme")));
}

// One of each kind of last word: a word ending in each voiceless stop and in
// other sounds, a number, an ordinal, money, an abbreviation with and without
// its period, a letter, a contraction, a spelled word.
const UNPUNCTUATED = [
  "cat",
  "cap",
  "back",
  "hello",
  "dog",
  "hello world",
  "The cat sat on the mat",
  "42",
  "1st",
  "$1.01",
  "3:45",
  "Mr",
  "Mr. Smith",
  "It is on Main St",
  "B",
  "A",
  "isn't",
  "TV",
  "nth",
  "He left. Then he sat",
  "cat ",
  "cat\n",
];

describe("text with no final punctuation in dectalk-english", () => {
  it.each(UNPUNCTUATED)("speaks %j and ends it as a sentence", (text) => {
    const spoken = phones(text);
    expect(spoken.length).toBeGreaterThan(1);
    expect(spoken.at(-1)).toBe("SIL");
  });

  it("speaks the text as it speaks the same text with a period", () => {
    for (const text of ["cat", "1st", "$1.01", "hello world", "42", "The cat sat on the mat"]) {
      expect(phones(text), text).toEqual(phones(`${text}.`));
    }
  });

  it("gives nothing for an empty text and does not throw", () => {
    expect(phones("")).toEqual([]);
    expect(phones("   ")).toEqual([]);
  });

  it("does not add a second sentence end to a text that has one", () => {
    for (const text of ["cat.", "why?", "hello!"]) {
      expect(phones(text).filter((phone) => phone === "SIL").length, text).toBe(
        phones(text.slice(0, -1)).filter((phone) => phone === "SIL").length,
      );
    }
  });

  // LTS/ls_task.c:2647-2673: "a" is [x] unless it stands against a
  // punctuation mark, and the flush is not one. PH/ph_aloph.c:754-762 then
  // makes a cited clause's lone schwa IY.
  it("does not take the supplied sentence end for a punctuation mark", () => {
    expect(phones("It is a")).toEqual(["IH", "DF", "IH", "Z", "AX", "SIL"]);
    expect(phones("It is a.")).toEqual(["IH", "DF", "IH", "Z", "EY", "SIL"]);
    expect(phones("A")).toEqual(["IY", "SIL"]);
  });

  it("leaves a frontend that does not close its texts alone", () => {
    expect(phones("hello", "qlatt-english").at(-1)).not.toBe("SIL");
  });
});
