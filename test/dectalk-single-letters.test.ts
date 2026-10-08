/**
 * One-letter words in the dectalk-english frontend.
 *
 * DECtalk's text stage spells a one-letter word its dictionary does not take
 * (LTS/ls_task.c:2760-2775; the letter names are the lower-case rows of
 * INCLUDE/usa_type.tab). A capital letter followed by a period is an initial:
 * spelled, and its period sent twice (ls_task.c:2612-2623, 1516-1519,
 * 1547-1549), so a clause with no phone follows it. "I" is the dictionary's
 * pronoun and "a" has its own rule (ls_task.c:2647-2673).
 *
 * The clause shapes below are what the instrumented DECtalk prints for the
 * same texts: "A." is silence, EY, silence, then an empty clause; "A. B. C."
 * three such pairs; "I." one clause.
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

function classesOf(text: string, word: string): unknown {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const item = utterance
    .relation("Word")
    .listItems()
    .find((candidate) => candidate.get("text") === word || candidate.get("word") === word);
  return item?.get("form_classes");
}

describe("one-letter words in dectalk-english", () => {
  it("spells a letter that is not a word, with the class noun", () => {
    expect(phones("Plan C is ready.").slice(5, 7)).toEqual(["S", "IY"]);
    expect(phones("a f c")).toEqual(["AX", "EH", "F", "S", "IY"]);
    expect(classesOf("Plan C is ready.", "c")).toEqual(["noun"]);
  });

  it("keeps the article and the pronoun as they were", () => {
    expect(phones("A day.")).toEqual(["AX", "D", "D_REL", "EY", "SIL"]);
    expect(phones("I.")).toEqual(["AY", "SIL"]);
  });

  it("follows an initial with a clause of its own for the second period", () => {
    expect(phones("A.")).toEqual(["EY", "SIL", "SIL"]);
    expect(phones("C.")).toEqual(["S", "IY", "SIL", "SIL"]);
    expect(phones("A. F. C.")).toEqual([
      "EY",
      "SIL",
      "SIL",
      "EH",
      "F",
      "SIL",
      "SIL",
      "S",
      "IY",
      "SIL",
      "SIL",
    ]);
  });

  it("does not take a lower-case letter or a letter inside a word for an initial", () => {
    expect(phones("c.")).toEqual(["S", "IY", "SIL"]);
    expect(phones("Plan C.")).toEqual(["P", "P_REL", "L", "AE", "N", "S", "IY", "SIL", "SIL"]);
    expect(phones("Mr. Smith.").filter((phone) => phone === "SIL")).toHaveLength(1);
  });

  it("leaves a frontend that does not ask for initials alone", () => {
    expect(phones("A.", "qlatt-english").filter((phone) => phone === "SIL")).toHaveLength(1);
  });

  // DECtalk reads phonemes only in brackets after [:phoneme on]
  // (CMD/Cmd_init.c:87, CMD/cm_pars.c:361), so a text of letters that are
  // also phoneme symbols is letters. Exported "B." is B, release, IY and the
  // two clause ends.
  it("reads a letter that is also a phoneme symbol as the letter", () => {
    expect(phones("B.")).toEqual(["B", "B_REL", "IY", "SIL", "SIL"]);
    expect(phones("b")).toEqual(["B", "B_REL", "IY"]);
  });

  it("keeps phoneme-symbol input in a frontend that does not turn it off", () => {
    expect(phones("B.", "qlatt-english")).toEqual(["B_CL", "B_REL", "SIL"]);
  });

  // Measured on DECtalk 4.63 (symbols into ph_sort): "Plan n is ready." has
  // EH N and "Plan em is ready." EH M; the dictionary's "'n" (EN) and "'em"
  // (IX M) are reached only by the written apostrophe.
  it("does not find a dictionary word by adding an apostrophe", () => {
    expect(phones("N.")).toEqual(["EH", "N", "SIL", "SIL"]);
    expect(phones("Plan n is ready.").slice(5, 7)).toEqual(["EH", "N"]);
    expect(phones("Plan em is ready.").slice(5, 7)).toEqual(["EH", "M"]);
  });

  it("keeps the apostrophe lookup in a frontend that does not turn it off", () => {
    // The default dictionary has "'cuse" (K Y UW1 Z) and no "cuse".
    expect(phones("cuse", "qlatt-english").slice(-3)).toEqual(["Y", "UW", "Z"]);
  });
});
