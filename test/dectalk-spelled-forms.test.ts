/**
 * Two things DECtalk's text task spells, in the dectalk-english frontend: a
 * word with "?!" or "!?" on it, and "am" and "pm" right after a number.
 *
 * What each case expects was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-spelled-forms-v1.json against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

/** The final phones of a text, a stop counted once, a clause end as its mark. */
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

const W_H_A_T = "D AH B EL Y UW EY CH EY T IY";
const QUESTION_MARK = "K W EH S CH AX N M AR K";
const EXCLAMATION_POINT = "EH K S K L AX M EY SH AX N P OY N T";

describe("a word with a question and an exclamation mark on it", () => {
  it("is spelled, the first mark named and the second ending the clause", () => {
    expect(phones("What?!")).toBe(`${W_H_A_T} ${QUESTION_MARK} !`);
    expect(phones("What!?")).toBe(`${W_H_A_T} ${EXCLAMATION_POINT} ?`);
  });

  it("names every mark but the last of three", () => {
    expect(phones("What?!?")).toBe(`${W_H_A_T} ${QUESTION_MARK} ${EXCLAMATION_POINT} ?`);
  });

  it("is spelled inside a text too, and only that word", () => {
    expect(phones("You know what?! Yes.")).toBe(`YU N OW ${W_H_A_T} ${QUESTION_MARK} ! Y EH S .`);
  });

  it("leaves a word with one mark as it is", () => {
    expect(phones("No way! Yes.")).toBe("N OW W EY ! Y EH S .");
  });
});

describe("am and pm after a number", () => {
  it.each(["9 am", "9 AM", "9 aM", "9.5 am", "1,000 am", "1990 am", "9:30 am", "9:30:15 am"])(
    "spells the am of %j",
    (text) => {
      expect(phones(`At ${text} now.`)).toContain("EY EH M N AW");
    },
  );

  it("spells it before the text's end and before a comma", () => {
    expect(phones("Open at 9 am.")).toMatch(/N AY N EY EH M \.$/);
    expect(phones("At 9 am, go.")).toContain("N AY N EY EH M ,");
  });

  it("keeps the word am anywhere else", () => {
    expect(phones("It is AM now.")).toContain("Z AE M N AW");
    expect(phones("I AM here.")).toContain("AY AE M");
    // A dollar amount is not a plain number.
    expect(phones("At $9 am now.")).toContain("Z AE M N AW");
    expect(phones("I am 9 am now.")).toContain("AY AE M N AY N EY EH M");
  });

  it("spells pm with or without a number", () => {
    expect(phones("Open at 9 PM now.")).toContain("N AY N P IY EH M");
    expect(phones("It is PM now.")).toContain("P IY EH M");
  });
});
