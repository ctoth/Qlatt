/**
 * Text-stage readings the fourth messy sweep showed, in the dectalk-english
 * frontend. Each expected reading was measured on DECtalk 4.63 say.exe; the
 * packets are in the corpus named at each group.
 *
 *   - a text's end after a mark with an apostrophe on it, or after the word
 *     "period" and two clause ends: one period (dectalk-us-text-end-marks-v1);
 *   - a plus sign inside a word: spelled (dectalk-us-address-plus-v1);
 *   - digits with a colon that are no clock time: spelled
 *     (dectalk-us-digit-colon-v1);
 *   - "2024-03-15": a part number (dectalk-us-dashed-dates-v1);
 *   - "to", "and", "for" with an apostrophe on them: not the mini
 *     dictionary's words (dectalk-us-quoted-special-words-v1);
 *   - a comma stripped from its word with an apostrophe: no word's class is
 *     sent again (dectalk-us-stripped-comma-v1).
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function speak(text: string) {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const segments = utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false)
    .filter(
      (segment) => !["stop_release", "stop_aspiration"].includes(String(segment.get("type"))),
    );
  return {
    phones: segments
      .map((segment) =>
        segment.get("phoneme") === "SIL"
          ? String(segment.get("punctuationSymbol") ?? "")
          : String(segment.get("phoneme")),
      )
      .filter((phone) => phone !== "")
      .join(" "),
    marks: segments
      .filter((segment) => segment.get("punctuationSymbol") != null)
      .map((segment) => String(segment.get("punctuationSymbol")))
      .join(" "),
    words: utterance
      .relation("Word")
      .listItems()
      .filter((word) => word.get("active") !== false)
      .map((word) => ({
        text: String(word.get("text")),
        phraseStart: word.get("phrase_start") ?? null,
      })),
    stressOf: (phone: string): unknown =>
      segments.findLast((segment) => segment.get("phoneme") === phone)?.get("stress") ?? null,
  };
}

describe("a text's end after a mark", () => {
  it("is one period when an apostrophe stands on the period", () => {
    expect(speak("He said 'shut the door.'").marks).toBe(".");
    expect(speak("It is at the door.'").marks).toBe(".");
  });

  it("is one period after the word period and two clause ends", () => {
    // The parser's text ends `pub / .` and its own clause end; the host adds another.
    expect(speak("See ftp://files.example.com/pub/.").phones).toMatch(/P IR IY AX D \.$/);
  });
});

describe("a plus sign inside a word", () => {
  it("is spelled with the word, where the parser leaves the word whole", () => {
    expect(speak("Write to ann+news@example.net.").phones).toContain(
      "EY EH N EH N P L AH S EH N IY D AH B EL Y UW EH S EH DF IX G Z AE M P EL",
    );
  });

  it("is a word between two words where the parser writes it apart", () => {
    expect(speak("Type ann+news now.").phones).toContain("AE N P L AH S N UW Z");
  });
});

describe("digits with a colon", () => {
  it.each([
    ["The ratio is 3:2.", "TH R IY K OW LX AX N T UW ."],
    ["Mix it 10:1 with water.", "W AH N Z IR OW K OW LX AX N W AH N"],
    ["It was 3:2:1 then.", "TH R IY K OW LX AX N T UW K OW LX AX N W AH N"],
  ])("%s is spelled digit by digit, the colon by its name", (text, expected) => {
    expect(speak(text).phones).toContain(expected);
  });

  it("is a time when the minutes have two digits", () => {
    expect(speak("Read John 3:16 aloud.").phones).toContain("TH R IY S IH K S T IY N");
  });
});

describe("digits with hyphens in the form of a date", () => {
  it("are a part number", () => {
    expect(speak("The meeting is on 2024-03-15.").phones).toContain(
      "T W EH N T IY T W EH N T IY F OR D AE SH Z IR OW TH R IY D AE SH F IH F T IY N",
    );
  });
});

describe("to, and, for with an apostrophe on them", () => {
  it.each([
    ["He left, 'and shut the door.'", "and"],
    ["He said 'to the left' twice.", "to"],
    ["It is 'for now' only.", "for"],
    ["She said 'and' twice.", "and"],
  ])("%s: the word starts no phrase", (text, word) => {
    expect(speak(text).words.find((entry) => entry.text === word)?.phraseStart).toBeNull();
  });

  it("start a phrase when written plain", () => {
    const and = speak("He left and shut the door.").words.find((entry) => entry.text === "and");
    expect(and?.phraseStart).toBe("pp");
  });
});

describe("a comma stripped from its word with an apostrophe", () => {
  it("does not send the first word's class again", () => {
    // DECtalk: "went" has emphasis after the quoted comma, primary stress
    // after a written one (the class of "be" is counted a second time there).
    expect(speak("'Be late,' they went.").stressOf("EH")).toBe(3);
    expect(speak("Be late, they went.").stressOf("EH")).toBe(1);
  });
});
