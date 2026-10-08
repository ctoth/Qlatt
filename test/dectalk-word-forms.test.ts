/**
 * Words DECtalk's text task reads in a way of their own, in the
 * dectalk-english frontend: a word with hyphens in it, a dictionary word with
 * a slash, an abbreviation with punctuation written against it, and a word
 * the letter-to-sound rules mark a morpheme boundary in.
 *
 * What each case expects was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same sentences are in
 * test/oracle-corpora/dectalk-us-word-forms-v1.json against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

/**
 * The phones of a text, a stop counted once, with `#` after a phone that has
 * a morpheme boundary or a compound's joint after it and `,` or `.` for a
 * punctuation silence.
 */
function spoken(text: string): string {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const out: string[] = [];
  for (const segment of utterance.relation("Segment").listItems()) {
    if (segment.get("active") === false) continue;
    const phoneme = String(segment.get("phoneme"));
    const type = segment.get("type");
    if (type === "stop_release" || type === "stop_aspiration") continue;
    if (phoneme === "SIL") {
      const mark = segment.get("punctuationSymbol");
      if (mark != null) out.push(String(mark));
      continue;
    }
    out.push(phoneme);
    if (segment.get("morpheme_boundary_after") === true) out.push("#");
  }
  return out.join(" ");
}

function boundaryOf(text: string, phoneme: string): unknown {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Segment")
    .listItems()
    .find((segment) => segment.get("phoneme") === phoneme)
    ?.get("rime_boundary");
}

describe("hyphenated words in dectalk-english", () => {
  it("marks the joint after a first part the dictionary has", () => {
    expect(spoken("It is a well-known fact.")).toContain("W EH LX # N OW N");
    expect(spoken("She is twenty-one.")).toContain("IY # W AH N");
  });

  it("puts nothing after a later part the dictionary has", () => {
    // DECtalk: M AH DH RR, the mark, IH N L AO.
    const phones = spoken("My mother-in-law is here.");
    expect(phones).toContain("RR # IH N L AO");
    expect(phones.split("#").length).toBe(2);
  });

  it("marks the joint after a part the rules read, wherever it stands", () => {
    // (AO and R are one phone, OR, after the allophone rules.)
    expect(spoken("The zorb-nat is red.")).toContain("Z OR B # N AE");
    expect(spoken("The well-zorb-known one.")).toContain("W EH LX # Z OR B # N OW N");
  });

  it("spells a part with no vowel and a part of one letter, with no mark", () => {
    expect(spoken("The tv-set is on.")).toContain("T IY V IY S EH");
    expect(spoken("It is f-a-r away.")).toContain("EH F EY AR");
  });

  it("leaves a hyphenated word the dictionary has to the dictionary", () => {
    expect(spoken("The x-ray is clear.")).toContain("EH K S R EY");
  });

  it("gives the phone before a part that starts a verb phrase the comma value", () => {
    // The hyphen's morpheme value and the verb phrase's on one phone
    // (0100 | 0240 = 0340); DECtalk's duration routine prints bou=224.
    expect(boundaryOf("Re-enter the code.", "IY")).toBe("comma");
    expect(boundaryOf("Re enter the code.", "IY")).toBe("vp");
  });
});

describe("dictionary words with a slash in dectalk-english", () => {
  it("speaks them as the dictionary's word, with its morpheme mark", () => {
    expect(spoken("It is a yes/no question.")).toContain("Y EH S # N OW");
    expect(spoken("Use red and/or blue.")).toContain("AE N D # OR");
  });

  it("speaks a slash that stands alone as the word slash", () => {
    expect(spoken("Type a / here.")).toContain("S L AE SH");
  });
});

describe("punctuation written against an abbreviation in dectalk-english", () => {
  it("finds the abbreviation before a comma, a colon and a question mark", () => {
    expect(spoken("He is John Smith Jr., a lawyer.")).toContain("JH UW N Y RR ,");
    expect(spoken("On Main St., turn left.")).toContain("S T R IY T ,");
    expect(spoken("It is on Main St.: go.")).toContain("S T R IY T :");
    expect(spoken("Is it Smith Jr.? He knows.")).toContain("JH UW N Y RR ?");
  });

  it("finds it inside brackets, and ends the sentence at the text's end only", () => {
    expect(spoken("The (Dept. of State) is here.")).toContain("D IH P AR T M AX N D AX V");
    expect(spoken("He is (Smith Jr.) now.")).toContain("JH UW N Y RR N AW .");
    expect(spoken("He is (Smith Jr.)")).toMatch(/JH UW N Y RR \.$/);
  });

  it("spells dotted capitals before a comma and inside brackets", () => {
    expect(spoken("She is an M.D., and he is not.")).toContain("EH M D IY ,");
    expect(spoken("The U.S., and others.")).toContain("Y UW EH S ,");
    expect(spoken("See (U.S.A.) there.")).toContain("Y UW EH S EY DH");
  });

  it("reads a unit as the dictionary's word when a mark follows its period", () => {
    // "5 lb. now" is "pounds", from the table of units; "5 lb., not" is the
    // dictionary's "lb.", "pound" (LTS/ls_task.c:2102-2116).
    expect(spoken("It weighs 5 lb. now.")).toContain("P AW N D Z N AW");
    expect(spoken("It weighs (5 lb.) now.")).toContain("P AW N D Z N AW");
    expect(spoken("It weighs 5 lb., not more.")).toContain("P AW N D ,");
  });
});

describe("the letter-to-sound rules' morpheme marks in dectalk-english", () => {
  it("keeps the mark, and glottalizes a /t/ before it", () => {
    // DECtalk: L AY T, the morpheme mark, HX AW S, the /t/ glottalized.
    expect(spoken("The lighthouse is tall.")).toContain("L AY TX # HH AW S");
    expect(spoken("The doghouse is small.")).toContain("G # HH AW S");
  });

  it("marks nothing in a word the rules do not divide", () => {
    expect(spoken("The lightbulb is new.")).not.toContain("#");
  });
});
