/**
 * Three readings the fourth messy sweep showed after the text stage, in the
 * dectalk-english frontend. Each expected value was measured on DECtalk 4.63
 * say.exe (its duration routine's phones and frames, and the word classes
 * its phonetic stage receives); the packets are in the corpus named.
 *
 *   - a /t/ in a word's last rime before a sonorant is glottalized: the
 *     boundary bits are on every phone of that rime (PH/ph_aloph.c:912-927,
 *     PH/ph_sort2.c:203-222); dectalk-us-rime-t-glottal-v1;
 *   - an /l/ after a vowel that absorbed its /r/ is not postvocalic: the
 *     phone before it in DECtalk's input is the /r/ (PH/ph_aloph.c:823-828);
 *     dectalk-us-lateral-after-r-v1;
 *   - a part number's class is its first run's, when the dictionary lookup
 *     finds that run (LTS/l_us_pr1.c:210-214, LTS/ls_util.c:808-818);
 *     dectalk-us-part-number-class-v1.
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
      .map((segment) => String(segment.get("phoneme")))
      .filter((phone) => phone !== "SIL")
      .join(" "),
    /** The stress of the n-th Segment with this phone (0 is the first). */
    stress: (phone: string, nth: number): unknown =>
      segments.filter((segment) => segment.get("phoneme") === phone)[nth]?.get("stress") ?? null,
    classes: utterance
      .relation("Word")
      .listItems()
      .filter((word) => word.get("active") !== false)
      .map((word) => word.get("form_classes") ?? null),
  };
}

describe("a /t/ in a word's last rime", () => {
  it("is glottalized before the sonorant that ends the word", () => {
    // DECtalk: AE 38, TX 6, N 15 frames.
    expect(speak("It is attn.").phones).toMatch(/AE TX N$/);
  });

  it.each([
    ["He is a witness.", "W IH T N AX S"],
    ["It was Whitney.", "W IH T N IY"],
    ["Partner up now.", "P AR T N RR"],
  ])("%s keeps its /t/: a syllabic follows in the word", (text, expected) => {
    expect(speak(text).phones).toContain(expected);
  });
});

describe("an /l/ after a vowel that absorbed its /r/", () => {
  it.each([
    ["Yes, clearly.", "K L IR L IY"],
    ["It is nearly done.", "N IR L IY"],
    ["Fairly soon.", "F ER L IY"],
    ["Barley grows.", "B AR L IY"],
  ])("%s has the plain lateral", (text, expected) => {
    expect(speak(text).phones).toContain(expected);
  });

  it("is postvocalic after a vowel of the input", () => {
    expect(speak("A girl ran.").phones).toContain("G RR LX R");
  });
});

describe("the class of a part number", () => {
  // The helper verb "is" is the clause's only verb, and is promoted to
  // secondary stress, unless another word has a verb's class.
  const isStress = (text: string): unknown => speak(text).stress("IH", 1);

  it.each([
    "It is in the folder Documents/2024/taxes.",
    "It is in the folder dogs/2024/cats.",
    "It is in the folder walks-10.",
  ])("%s: the first run's verb class counts", (text) => {
    expect(isStress(text)).toBe(0);
  });

  it.each([
    "It is in the folder music/2024.",
    "It is in the folder cat-10.",
    "It is in the folder ab/2024/taxes.",
    "It is in the folder 10-taxes.",
  ])("%s: no verb class from the first run", (text) => {
    expect(isStress(text)).toBe(2);
  });
});
