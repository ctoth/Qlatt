/**
 * The clause breaks DECtalk's text stage inserts before it speaks a stretch
 * of words (LTS/ls_task.c ls_task_parse_sentence), in the dectalk-english
 * frontend: where a stretch ends, how long it counts at a text's end, and
 * conjunctions of several words (src/g2p/table-conjunctions.ts).
 *
 * What each case expects was measured on DECtalk 4.63 say.exe: the marks of
 * each word slot from an instrumented build, and the comma in the symbols
 * its phonemic stage receives. The same sentences are in
 * test/oracle-corpora/dectalk-us-clause-breaks-v1.json against its packets.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { conjunctionRoles } from "../src/g2p/table-conjunctions";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const sequences = (
  JSON.parse(readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8")) as {
    conjunctionSequences: string[][];
  }
).conjunctionSequences;

/** Each word with `*` for a sequence's first word and `+` for a later one. */
const marked = (text: string, markedLast = false): string =>
  conjunctionRoles(text.split(" "), sequences, markedLast)
    .map((role, index) => {
      const word = text.split(" ")[index] as string;
      return role === "first" ? `*${word}` : role === "rest" ? `+${word}` : word;
    })
    .join(" ");

/** The written words of a text, a comma where the frontend breaks the clause. */
function withBreaks(text: string): string {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Word")
    .listItems()
    .map(
      (word) =>
        `${word.get("clause_break_before") === true ? ", " : ""}${String(word.get("text"))}`,
    )
    .join(" ")
    .replaceAll(" , ", ", ");
}

describe("DECtalk's conjunctions of several words", () => {
  it("has the table's 34 sequences in its order", () => {
    expect(sequences.length).toBe(34);
    expect(sequences[0]).toEqual(["all", "the", "same"]);
    expect(sequences[33]).toEqual(["whether", "or", "not"]);
  });

  it("marks a sequence of two words", () => {
    expect(marked("go there even if it rains")).toBe("go there *even +if it rains");
    expect(marked("Even If it rains")).toBe("*Even +If it rains");
  });

  it("marks the word after a sequence of three words too", () => {
    // found_it = 3 for three words as for four (LTS/ls_task.c:4995-4998):
    // an instrumented build prints ff000020 for the "the" of "as soon as the".
    expect(marked("ran as soon as the old dog")).toBe("ran *as +soon +as +the old dog");
    expect(marked("ran as soon as")).toBe("ran *as +soon +as");
  });

  it("marks a sequence of four words and nothing after it", () => {
    expect(marked("slowly on the other hand the boy")).toBe("slowly *on +the +other +hand the boy");
  });

  it("takes the first sequence that fits, so the longer one is never found", () => {
    expect(marked("in addition to the old one")).toBe("*in +addition to the old one");
  });

  it("needs every word of the sequence", () => {
    expect(marked("as soon")).toBe("as soon");
    expect(marked("on the other side")).toBe("on the other side");
    expect(marked("even")).toBe("even");
  });

  it("does not take a word with a mark written on it", () => {
    expect(marked("go there even if", true)).toBe("go there even if");
    expect(marked("go there even if", false)).toBe("go there *even +if");
  });

  it("goes on after the last word it marked", () => {
    expect(marked("even if so that it rains")).toBe("*even +if *so +that it rains");
  });
});

describe("clause breaks in dectalk-english", () => {
  it("breaks before the first word of a conjunction of several words", () => {
    expect(withBreaks("I will go there even if the weather turns very bad today.")).toBe(
      "i will go there, even if the weather turns very bad today",
    );
    expect(withBreaks("The old man walked slowly on the other hand the boy ran fast today.")).toBe(
      "the old man walked slowly, on the other hand the boy ran fast today",
    );
  });

  it("counts the word after a three-word conjunction as marked", () => {
    // "by" is three words after "the", so it gets no break; after the
    // two-word "even if" it is four words on and gets one.
    expect(
      withBreaks("He ran as soon as the old dog by the gate barked loudly at him today."),
    ).not.toContain(",");
    expect(withBreaks("He ran even if the old dog by the gate barked loudly at him today.")).toBe(
      "he ran even if the old dog, by the gate barked loudly at him today",
    );
  });

  it("counts a stretch that the text's end closes as one word longer", () => {
    expect(withBreaks("Milk bread eggs and a dozen apples")).toBe(
      "milk bread eggs, and a dozen apples",
    );
    expect(withBreaks("Milk bread eggs and a dozen apples.")).not.toContain(",");
  });

  it("ends a stretch at an abbreviation's period and at a final apostrophe", () => {
    expect(
      withBreaks("The old bag weighs 5 lb. and the small one weighs less today."),
    ).not.toContain(",");
    expect(
      withBreaks("The old bag weighs five pounds and the small one weighs less today."),
    ).toContain(", and");
    expect(
      withBreaks("He said the Mr. Smith left and the small one stayed late today."),
    ).not.toContain(",");
    expect(withBreaks("All the dogs' old bones and the small cat ran away.")).not.toContain(",");
  });

  it("speaks a hyphen that stands alone and ends the stretch there", () => {
    const { utterance } = textToKlattTrackDetailed("Red - green.", undefined, 30, {
      frontendId: "dectalk-english",
    });
    const words = utterance.relation("Word").listItems();
    expect(words.map((word) => word.get("text"))).toEqual(["red", "-", "green"]);
    expect(words.map((word) => word.get("clause_word_count"))).toEqual([2, 2, 1]);
    expect(withBreaks("The big dog barked loudly - the small cat ran away today.")).not.toContain(
      ",",
    );
  });

  it("speaks a break one word late after a word that was read ahead", () => {
    // The break test reads the mark of the slot whose number is the count of
    // words spoken so far, and "am" after "9" is not counted (ls_util.c:827,
    // ls_task.c:3828-3843): the break of "and" is spoken before "the".
    expect(withBreaks("The big store opens nine and the small one closes late today.")).toContain(
      "nine, and the",
    );
    const late = withBreaks("The big store opens 9 am and the small one closes late today.");
    expect(late).toContain("and, the small");
    expect(late.split(",").length).toBe(2);
    expect(
      withBreaks("The big house cost $2 million and the small one cost less today."),
    ).toContain("and, the small");
  });
});
