/**
 * The clause break before a word written with an opening quotation mark, in
 * the dectalk-english frontend.
 *
 * DECtalk's letter-to-sound marks a word that reaches it with `(` or `"` in
 * front, or `)` or `"` behind, and a marked word gets a clause break by the
 * rules for a conjunction (LTS/ls_task.c:5082-5106 and :5190-5229). Its
 * command-stage parser removes nearly all of those characters first; a
 * quotation that ends in a parenthesis and a period keeps its opening mark
 * and that parenthesis.
 *
 * The expected breaks are DECtalk 4.63 say.exe's own (the symbols its
 * letter-to-sound sends, read from an instrumented build); the same texts are
 * in test/oracle-corpora/dectalk-us-quote-breaks-v1.json against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function spoken(text: string, frontendId = "dectalk-english") {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  const words = utterance.relation("Word").listItems();
  return {
    marks: Object.fromEntries(
      words
        .filter((word) => word.get("written_marks") !== undefined)
        .map((word) => [String(word.get("text")), word.get("written_marks")]),
    ),
    breaksBefore: words
      .filter((word) => word.get("clause_break_before") === true)
      .map((word) => String(word.get("text"))),
    // The clause marks in the order they are spoken.
    clauseMarks: utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false && item.get("phoneme") === "SIL")
      .map((item) => item.get("punctuationSymbol"))
      .filter((mark) => typeof mark === "string" && mark !== "")
      .join(" "),
  };
}

describe("a word written with an opening quotation mark", () => {
  it("carries the marks the parser left on it", () => {
    const { marks } = spoken('The sign said "Closed (back at two)."');
    expect(marks).toEqual({ closed: ["open_quote"], two: ["close_paren"] });
  });

  it("gets a clause break as a conjunction would", () => {
    // DECtalk: S EH D , K L OW Z D ... T UW , .
    const first = spoken('The sign said "Closed (back at two)."');
    expect(first.breaksBefore).toEqual(["closed"]);
    expect(first.clauseMarks).toBe(", , .");
    // "on" is marked too, three words back from the start: no break there.
    expect(spoken('The sign on the door said "Closed (back at two)."').breaksBefore).toEqual([
      "closed",
    ]);
  });

  it("gets none within three words of the start, before a marked word, or near the end", () => {
    expect(spoken('They said "Go (home)."').breaksBefore).toEqual([]);
    expect(spoken('The old man said "Stop and (wait)."').breaksBefore).toEqual([]);
    expect(spoken('The big sign said "Closed (now)."').breaksBefore).toEqual([]);
  });

  it("has no mark when the parser removed the quotation marks", () => {
    const whole = spoken('The old sign said "Come back (at two) today."');
    expect(whole.marks).toEqual({});
    expect(whole.breaksBefore).toEqual([]);
  });

  it("is not marked in a frontend that names no marks", () => {
    expect(spoken('The sign said "Closed (back at two)."', "qlatt-english").marks).toEqual({});
  });
});
