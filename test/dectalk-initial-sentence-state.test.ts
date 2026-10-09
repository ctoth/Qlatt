/**
 * An initial's periods and the text stage's "first word of a sentence" state
 * in the dectalk-english frontend (pipeline.yaml dectalk_ends_sentence;
 * phases/postlexical.yaml dectalk_wh_question_period and
 * dectalk_sentence_initial_auxiliary).
 *
 * DECtalk resets that state where its delimiter routine reads a period, a
 * question mark or an exclamation mark (LTS/ls_task.c:1160-1236). The two
 * periods after an initial are sent as phones and do not pass through it
 * (2612-2617, 1516-1519, 1547-1549), so the state stays: a wh-word before the
 * initial still turns the next question mark into a period, and an auxiliary
 * after the initial is not a sentence's first word.
 *
 * Every expected reading was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-initial-sentence-state-v1.json against its
 * packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Row = { phone: string; word: string; stress: unknown };

function rows(text: string): Row[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false)
    .map((segment) => ({
      phone:
        segment.get("phoneme") === "SIL"
          ? String(segment.get("punctuationSymbol") ?? "")
          : String(segment.get("phoneme")),
      word: String(segment.get("word") ?? ""),
      stress: segment.get("stress") ?? null,
    }));
}

/** The clause marks of a text, in order. */
const marks = (text: string): string =>
  rows(text)
    .map((row) => row.phone)
    .filter((phone) => [".", "?", "!", ","].includes(phone))
    .join(" ");

/** The stress of the vowel of the second "is" (or the only one) of a text. */
const lastIsStress = (text: string): unknown =>
  rows(text)
    .filter((row) => row.word.toLowerCase() === "is" && row.phone === "IH")
    .at(-1)?.stress;

describe("an initial's periods", () => {
  it("are marked as sent by the text rule, and a written period is not", () => {
    const sent = (text: string): unknown[] => {
      const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
        frontendId: "dectalk-english",
      });
      return utterance
        .relation("Segment")
        .listItems()
        .filter((segment) => segment.get("active") !== false)
        .filter((segment) => segment.get("punctuationSymbol") != null)
        .map((segment) => segment.get("punctuation_sent") ?? false);
    };
    expect(sent("Who is J. Smith? Ask.")).toEqual([true, true, false, false]);
    expect(sent("Who is he. Ask.")).toEqual([false, false]);
    // Two written periods in a row are not an initial's.
    expect(sent("He left.. Then she did.")).not.toContain(true);
  });

  it("leave a wh-question a wh-question", () => {
    // DECtalk: JH EY . . AA R . (the question mark is sent as a period).
    expect(marks("Who is J. R.? Ask.")).toBe(". . . .");
    expect(marks("Who is J. Smith? Ask.")).toBe(". . . .");
  });

  it("do not make one of a question that begins with no wh-word", () => {
    // DECtalk: JH EY . . AA R ?
    expect(marks("Is it J. R.? Ask.")).toBe(". . ? .");
  });

  it("do not make the next word a sentence's first", () => {
    // DECtalk: "Who is J. Is it Bob? Ask." has IH Z unstressed and a period
    // after "Bob"; "J. Is it Bob? Ask." has IH Z unstressed and a question mark.
    expect(marks("Who is J. Is it Bob? Ask.")).toBe(". . . .");
    expect(lastIsStress("Who is J. Is it Bob? Ask.")).not.toBe(2);
    expect(marks("J. Is it Bob? Ask.")).toBe(". . ? .");
    expect(lastIsStress("J. Is it Bob? Ask.")).not.toBe(2);
  });

  it("differ in that from a written period", () => {
    // DECtalk: "Who is he. Is it Bob? Ask." has IH Z with secondary stress and a question mark.
    expect(marks("Who is he. Is it Bob? Ask.")).toBe(". ? .");
    expect(lastIsStress("Who is he. Is it Bob? Ask.")).toBe(2);
  });
});
