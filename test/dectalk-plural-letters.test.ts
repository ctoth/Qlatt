/**
 * The plural of a letter in the dectalk-english frontend ("p's", which
 * DECtalk's text parser writes as the letter with phonemic z against it).
 *
 * The phonemic text ends the text letter-to-sound had gathered, and the
 * letter's delimiter routine sends no word boundary when what follows the
 * word is not a character (LTS/ls_task.c:446-470, 1153-1154): the letter,
 * the z and the next word are one word. A mark right after the z begins a
 * word and is spoken by its name (1420-1437). The next word's class reaches
 * the phonetics after the z (PH/ph_task.c:598-601).
 *
 * Every expected reading was measured on DECtalk 4.63 say.exe; the same
 * texts are in test/oracle-corpora/dectalk-us-plural-letters-v1.json against
 * its packets.
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
    /** The final phones, a mark as itself. */
    phones: segments
      .map((segment) =>
        segment.get("phoneme") === "SIL"
          ? String(segment.get("punctuationSymbol") ?? "")
          : String(segment.get("phoneme")),
      )
      .filter((phone) => phone !== "")
      .join(" "),
    /** The Words: what stands between two word boundaries. */
    words: utterance
      .relation("Word")
      .listItems()
      .filter((word) => word.get("active") !== false)
      .map((word) => String(word.get("text"))),
    /** The stress of the phone `offset` places from the first Z. */
    stressByZ: (offset: number): unknown =>
      segments[segments.findIndex((segment) => segment.get("phoneme") === "Z") + offset]?.get(
        "stress",
      ) ?? null,
  };
}

describe("a letter with phonemic z written against it", () => {
  it("is one word with the z and with the word after it", () => {
    // "the", then x, z and "mark" as one word, then "it".
    expect(speak("The x's mark it.").words).toHaveLength(3);
    expect(speak("The x's mark it.").phones).toBe("DH IY EH K S Z M AR K IH T .");
    // "she got all A's and" and then B, z and "this" as one word, then "term".
    expect(speak("She got all A's and B's this term.").words).toHaveLength(7);
  });

  it("is one word with the z before a word that starts a phrase", () => {
    // mind, your, p+z, and, q+z+period.
    expect(speak("Mind your p's and q's.").words).toHaveLength(5);
  });

  it.each([
    ["He got two B's.", "B IY Z P IR IY AX D ."],
    ["Did he get two B's? Yes.", "B IY Z K W EH S CH AX N M AR K Y EH S ."],
    ["He got two B's! Yes.", "B IY Z EH K S K L AX M EY SH AX N P OY N T Y EH S ."],
    ["Two c's, then one d's worth.", "S IY Z K AA M AX DH EH N"],
    ["He got two B's; then left.", "B IY Z S EH M IY K OW L AX N DH EH N"],
  ])("%s speaks the mark after the z as a word", (text, expected) => {
    expect(speak(text).phones).toContain(expected);
  });

  it("gives a helper verb joined to it its stress on its own vowel", () => {
    // DECtalk: the EH of the letter keeps primary stress, the AA of "are" has secondary.
    const spoken = speak("How many s's are in Mississippi?");
    expect(spoken.phones).toContain("EH S Z AR IH N");
    expect(spoken.stressByZ(-2)).toBe(1);
    expect(spoken.stressByZ(1)).toBe(2);
  });

  it("leaves a plural the parser does not rewrite as it was", () => {
    expect(speak("The 3's are here.").words).toHaveLength(4);
  });
});
