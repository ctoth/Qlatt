/**
 * A sign written on a number, and a lone "a" right after a number, in the
 * dectalk-english lexicon (src/g2p/table-number.ts speakSignedNumber and
 * src/g2p/index.ts).
 *
 * Every expected reading was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-signed-numbers-v1.json against its packets.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LtsTableDocument } from "../src/g2p/table-lts-pronounce";
import { numberWords, speakSignedNumber } from "../src/g2p/table-number";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const table = JSON.parse(
  readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8"),
) as LtsTableDocument;
const lists = table.numberPhones as NonNullable<LtsTableDocument["numberPhones"]>;

/** Words joined by `_`, a pause as `,`, stress as the vowel's digit. */
const words = (symbols: readonly number[] | null): string | null =>
  symbols === null
    ? null
    : numberWords(symbols, table)
        .map((word) => `${word.pauseBefore ? ", " : ""}${word.phonemes.join(" ")}`)
        .join(" _ ");

/** The frontend's final phones for a text, a stop counted once. */
function phones(text: string): string {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false)
    .filter((segment) => !["stop_release", "stop_aspiration"].includes(String(segment.get("type"))))
    .map((segment) =>
      segment.get("phoneme") === "SIL"
        ? String(segment.get("punctuationSymbol") ?? "")
        : String(segment.get("phoneme")),
    )
    .filter((phone) => phone !== "")
    .join(" ");
}

describe("a number with a sign on it", () => {
  it.each([
    ["-7", "M AY1 N AX0 S _ S EH1 V AX0 N"],
    ["+3", "P L AH1 S _ TH R IY1"],
    ["-2.5", "M AY1 N AX0 S _ T UW1 _ P OY1 N T _ F AY1 V"],
    ["-.5", "M AY1 N AX0 S _ P OY1 N T _ F AY1 V"],
    ["-$20", "M AY1 N AX0 S _ T W EH1 N T IY0 _ D AA1 L RR0 Z"],
    ["-7s", "M AY1 N AX0 S _ S EH1 V AX0 N Z"],
    // The fraction's reading, not the dictionary's entry "1/2".
    ["-1/2", "M AY1 N AX0 S _ W AH1 N _ HH AE1 F"],
    ["-3/8", "M AY1 N AX0 S _ TH R IY1 _ EY1 TH S"],
  ])("%s", (text, expected) => {
    expect(words(speakSignedNumber(text, lists))).toBe(expected);
  });

  it("is never a year", () => {
    // "1990" alone is "nineteen ninety"; with a sign the number is read out.
    const spoken = words(speakSignedNumber("-1990", lists)) ?? "";
    expect(spoken).toContain("TH AW1 Z AX0 N D");
    expect(spoken).not.toContain("N AY1 N T IY0 _ ");
  });

  it("is not a reading of a word that is no number", () => {
    expect(speakSignedNumber("-5th", lists)).toBeNull();
    expect(speakSignedNumber("-10-15", lists)).toBeNull();
    expect(speakSignedNumber("-", lists)).toBeNull();
    expect(speakSignedNumber("7", lists)).toBeNull();
  });

  it("is spoken in a sentence, and a hyphen before a part number is named", () => {
    // (The /s/ of "minus" and of "seven" are one phone after the allophone rules.)
    expect(phones("The answer is -7.")).toContain("M AY N AX S EH V AX N .");
    expect(phones("It is -10 now.")).toContain("M AY N AX S T EH N");
    expect(phones("Add +3 to the score.")).toContain("P L AH S TH R IY");
    expect(phones("It is -10-15 now.")).toContain("D AE SH T EH N D AE SH F IH F T IY N");
    expect(phones("The answer is 7.")).not.toContain("M AY N AX S");
  });
});

describe("a lone a right after a number", () => {
  const classOf = (text: string): unknown => {
    const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
      frontendId: "dectalk-english",
    });
    return utterance
      .relation("Word")
      .listItems()
      .find((word) => word.get("text") === "a")
      ?.get("text_form_classes");
  };

  it("is the letter after a plain number or an ordinal", () => {
    expect(classOf("Take 2 a day.")).toEqual(["noun"]);
    expect(classOf("Seat 23 A is here.")).toEqual(["noun"]);
    expect(classOf("Take 2nd a day.")).toEqual(["noun"]);
    expect(phones("Take 2 a day.")).toContain("T UW EY D EY");
  });

  // LTS/ls_task.c:3768-3773: the count is set for any word that begins with
  // a digit and reaches the plain-number routine, before the word is found
  // to be no number. Each is what say.exe sends.
  it("is the letter after a part number that begins with a digit", () => {
    expect(classOf("Rooms are 80-120 a night.")).toEqual(["noun"]);
    expect(classOf("Pay 10-taxes a day.")).toEqual(["noun"]);
    expect(classOf("Rooms are $80- a night.")).toEqual(["noun"]);
  });

  it("is the article after a part number that begins with a letter, a fraction or a date", () => {
    expect(classOf("Fly the B-52 a day.")).toEqual(["art"]);
    expect(classOf("Take 3/7 a day.")).toEqual(["art"]);
    expect(classOf("Go 3-May a day.")).toEqual(["art"]);
  });

  it("is the article anywhere else", () => {
    expect(classOf("Take 2 of a kind.")).toEqual(["art"]);
    expect(classOf("Take $2 a day.")).toEqual(["art"]);
    expect(classOf("At 9:30 a day.")).toEqual(["art"]);
    expect(classOf("Vitamin A is good.")).toEqual(["art"]);
  });
});
