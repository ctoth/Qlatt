/**
 * Marks that stand alone or stay in a word in the dectalk-english frontend:
 * a period that is a word, a mark after a stripped parenthesis, a period
 * before a comma, words of slashes and hyphens, and a word with two periods
 * on it (public/rules/normalization/recognition.yaml, the rules from
 * tn_stripped_parenthesis_mark_source to tn_dotted_word_source).
 *
 * Every expected reading was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-lone-marks-v1.json against its packets,
 * except the exclamation after a parenthesis: its symbols agree, and the
 * pitch of its empty clause is not ported (prosody.yaml
 * dectalk_empty_clause_baseline covers a period only).
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

/** The frontend's final phones for a text, a stop counted once, a mark as itself. */
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

describe("a period standing alone", () => {
  it("is the word period where the parser writes one in Ph.D.,", () => {
    // The parser's text is `Ph . D., `.
    expect(phones("Dr. White, Ph.D., spoke.")).toBe(
      // "period" and "D" share their D: one allophone of the two.
      "D AO K T RR W AY T , P IY EY CH P IR IY AX D IY , S P OW K .",
    );
  });

  it("is the word period after the pause behind a zip code, and joins the next sentence", () => {
    expect(phones("She moved to Boston, MA 02134. Then she left.")).toContain(
      "F OR , P IR IY AX D DH EH N SH IY L EH F T .",
    );
  });

  it("is closed by the text's end when it is the last word", () => {
    expect(phones("She moved to Boston, MA 02134.")).toMatch(/F OR , P IR IY AX D \.$/);
  });

  it("is not a word where the parser gives the word for a dot", () => {
    expect(phones("He has a Ph.D. in math.")).not.toContain("P IR IY AX D");
  });
});

describe("a mark standing alone after a stripped parenthesis", () => {
  it("is the word's delimiter after the comma the parenthesis forces", () => {
    // The parser's text is `said "Go now) . Then left. `.
    expect(phones('She said "Go (now)." Then left.')).toBe(
      "SH IY S EH D G OW N AW , . DH EH N L EH F T .",
    );
  });

  it("is an exclamation's clause end the same way, and the quote after it a word", () => {
    // The parser's text is `"Stop now) ! " Then left. `.
    expect(phones('She said "Stop (now)!" Then left.')).toContain(
      "N AW , ! K W OW TX DH EH N L EH F T .",
    );
  });

  // These two are not in the packet corpus: the pitch of an empty clause that
  // ends in "?" or "," is not in this rulepack's empty-clause rules.
  it("is a question's clause end the same way", () => {
    // The parser's text is `"Is it this) ? " Then left. `.
    expect(phones('She asked "Is it (this)?" Then left.')).toContain(
      // "this" after "it": the frontend's allophone of DH there is DZ.
      "DZ IH S , ? K W OW TX DH EH N L EH F T .",
    );
  });

  it("is a second comma after the parenthesis's own", () => {
    expect(phones('He said "Wait (now)," then left.')).toContain("N AW , , DH EH N L EH F T .");
  });
});

describe("a period with a question mark right after it", () => {
  it.each([
    ["Is it Mary K.? Yes.", "K EY ? Y EH S ."],
    ["Was it the cat.? Yes.", "K AE T ? Y EH S ."],
    ["Is it the U.S.? Yes.", "Y UW EH S ? Y EH S ."],
    // A question that begins with a wh-word ends as a statement does.
    ["Who is J.? Ask him.", "JH EY . AE S K"],
  ])("%s has the mark alone", (text, expected) => {
    expect(phones(text)).toContain(expected);
  });
});

describe("a period with a comma, a semicolon or a colon right after it", () => {
  it.each([
    ["He met B., then left.", "M EH T B IY , DH EH N"],
    ["He met J. R., then left.", "JH EY . . AR , DH EH N"],
    ["He met I., then left.", "M EH DF AY , DH EH N"],
    ["He saw the cat., then left.", "K AE T , DH EH N"],
    // The semicolon and the colon are the comma's pause, kept by their own sign.
    ["He met Q.; then left.", "K YU ; DH EH N"],
    ["He met Q.: then left.", "K YU : DH EH N"],
    ["He said etc., and left.", "EH T S EH DF RR AX , EH N D"],
  ])("%s has no period there", (text, expected) => {
    expect(phones(text)).toContain(expected);
  });
});

describe("a word of slashes and hyphens", () => {
  it.each([
    // The parser writes `5 + /- 1`.
    // "plus" and "slash" share their S, as "x" and "slash" do below.
    ["His score was 5 +/- 1.", "F AY V P L AH S L AE SH D AE SH W AH N ."],
    ["It was x -/ y.", "EH K S D AE SH S L AE SH W AY ."],
    ["It was x /-/ y.", "EH K S L AE SH D AE SH S L AE SH W AY ."],
  ])("%s names each character", (text, expected) => {
    expect(phones(text)).toContain(expected);
  });
});

describe("a word with two periods on it ahead of the clause's period", () => {
  it("is spelled, each period by its name", () => {
    // The parser makes "on..." of "on . . .".
    expect(phones("It goes on . . . and on.")).toBe(
      "IH T G OW Z OW EH N P IR IY AX D P IR IY AX D . AE N D AO N .",
    );
  });

  it("is not what the parser makes of a written ellipsis", () => {
    expect(phones("It goes on... and on.")).toBe("IH T G OW Z AO N . AE N D AO N .");
  });
});
