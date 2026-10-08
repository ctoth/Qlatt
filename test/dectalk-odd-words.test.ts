/**
 * Odd shapes of words in the dectalk-english frontend: a part number that
 * ends in a slowly spelled part, a hyphen at a word's end, a word with a
 * comma or a period ahead of the clause's mark, and questions that begin
 * with a wh-word.
 *
 * What each case expects was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-odd-words-v1.json against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function segments(text: string) {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false);
}

/** The phones of a text, a stop counted once, a clause end as its mark. */
function phones(text: string): string {
  return segments(text)
    .filter((segment) => !["stop_release", "stop_aspiration"].includes(String(segment.get("type"))))
    .map((segment) =>
      segment.get("phoneme") === "SIL"
        ? String(segment.get("punctuationSymbol") ?? "")
        : String(segment.get("phoneme")),
    )
    .filter((phone) => phone !== "")
    .join(" ");
}

describe("a part number that ends in a slowly spelled part", () => {
  it("has a pause after the word", () => {
    // DECtalk: Z IY, OW, AA R, B IY, a comma, then "now".
    expect(phones("The 12-zorb now.")).toContain("B IY , N AW .");
    expect(phones("The zorb-12 now.")).toContain("B IY , D AE SH");
  });

  it("has none after a part of three letters or a dictionary word", () => {
    expect(phones("The 12-win now.")).not.toContain(",");
    expect(phones("The 12-room now.")).not.toContain(",");
  });
});

describe("a hyphen at a word's end", () => {
  const boundaryOf = (text: string, phoneme: string): unknown =>
    segments(text)
      .find((segment) => segment.get("phoneme") === phoneme)
      ?.get("rime_boundary");

  it("leaves the word's last phone the word boundary before a word", () => {
    expect(boundaryOf("The well- known man.", "LX")).toBe("word");
  });

  it("leaves it the hyphen's morpheme boundary before a comma, with a short pause", () => {
    // The comma adds nothing to the phone before it; the pause after a phone
    // that has no clause boundary is five frames (p_us_tim.c Rule 1).
    expect(boundaryOf("Red-, green.", "D")).toBe("morpheme");
    const pause = segments("Red-, green.").find(
      (segment) => segment.get("punctuationSymbol") === ",",
    );
    const written = segments("Red, green.").find(
      (segment) => segment.get("punctuationSymbol") === ",",
    );
    expect(Number(pause?.get("duration"))).toBeLessThan(Number(written?.get("duration")));
  });

  it("gives it the period's value added to the hyphen's before a period", () => {
    expect(boundaryOf("It is red-. Then green.", "D")).toBe("exclaim");
  });
});

describe("a word with a comma or a period ahead of the clause's mark", () => {
  it("spells the word and names the comma", () => {
    expect(phones("What,! Now.")).toBe("D AH B EL Y UW EY CH EY T IY K AA M AX ! N AW .");
  });

  it("speaks the word and drops the period", () => {
    expect(phones("What.! Now.")).toBe("W AH T ! N AW .");
  });

  it("leaves a word with one comma as it is", () => {
    expect(phones("What, now.")).toBe("W AH T , N AW .");
  });
});

describe("questions that begin with a wh-word", () => {
  it.each(["What?", "Why?", "Who?", "Where?", "When?", "How?", "Which?", "What is it?"])(
    "ends %j as a statement",
    (text) => {
      expect(phones(text)).toMatch(/ \.$/);
    },
  );

  it.each(["Is it so?", "Really?", "You?"])("ends %j as a question", (text) => {
    expect(phones(text)).toMatch(/ \?$/);
  });
});
