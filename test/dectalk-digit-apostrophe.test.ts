/**
 * Digits with an apostrophe between them in the dectalk-english frontend
 * ("5'10", a height): DECtalk's part-number test sends a word with a digit
 * and an apostrophe to the spelling routine (LTS/ls_task.c:4128-4158), which
 * names each character.
 *
 * Every expected reading was measured on DECtalk 4.63 say.exe; the same
 * texts are in test/oracle-corpora/dectalk-us-digit-apostrophe-v1.json
 * against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function speak(text: string) {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return {
    phones: utterance
      .relation("Segment")
      .listItems()
      .filter((segment) => segment.get("active") !== false)
      .filter(
        (segment) => !["stop_release", "stop_aspiration"].includes(String(segment.get("type"))),
      )
      .map((segment) =>
        segment.get("phoneme") === "SIL"
          ? String(segment.get("punctuationSymbol") ?? "")
          : String(segment.get("phoneme")),
      )
      .filter((phone) => phone !== "")
      .join(" "),
    words: utterance
      .relation("Word")
      .listItems()
      .filter((word) => word.get("active") !== false).length,
  };
}

describe("digits with an apostrophe between them", () => {
  it.each([
    [`He is 5'10" and still growing.`, "F AY V AX P AA S T R AX F IY W AH N Z IR OW"],
    ["It is 6'2 long.", "S IH K S AX P AA S T R AX F IY T UW L AO NG"],
    [`He ran 12'6" today.`, "W AH N T UW AX P AA S T R AX F IY S IH K S"],
  ])("%s is spelled, the apostrophe by its name", (text, expected) => {
    expect(speak(text).phones).toContain(expected);
  });

  it.each([
    // An apostrophe at the word's edge is stripped; "80's" is the plural.
    ["It is 6' long.", "S IH K S L AO NG"],
    ["Use the 80's style.", "EY DF IY Z"],
    ["The class of '09 met.", "Z IR OW N AY N"],
  ])("%s is not", (text, expected) => {
    expect(speak(text).phones).toContain(expected);
    expect(speak(text).phones).not.toContain("AX P AA S T R AX F IY");
  });

  it("leaves a word before an apostrophe and a plural number its own word", () => {
    // "the", the plural "nineties", "were", "fun".
    expect(speak("The '90s were fun.").words).toBe(4);
  });
});
