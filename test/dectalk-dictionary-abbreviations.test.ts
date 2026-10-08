/**
 * Abbreviations in the dectalk-english frontend.
 *
 * DECtalk looks a word that is followed by a period up in its dictionary with
 * the period (LTS/ls_task.c:2040-2160); a hit is the abbreviation and eats the
 * period. The dictionary search is a binary search over entries that keep
 * their case (LTS/ls_dict.c), so what a word finds depends on how it is
 * written. Every expectation below is what the instrumented DECtalk 4.63
 * say.exe sends to its phonemic stage for the same text
 * (scripts/oracle/dectalk-debug/trace-text.ts); the sentences are also in
 * test/oracle-corpora/dectalk-us-abbrev-v1.json against its packets.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { searchDictionary } from "../src/g2p/table-dictionary-search";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const table = JSON.parse(
  fs.readFileSync(path.resolve("public/rules/frontends/dectalk-english/lts-table.json"), "utf8"),
) as { dictionaryWords: string[] };
const words = table.dictionaryWords;

/** The entry an abbreviation lookup of `word` ends on, marked when it is word + ".". */
function abbreviationLookup(word: string): string | null {
  const hit = searchDictionary(words, word, true);
  if (!hit) return null;
  return `${words[hit.index]}${hit.abbreviation ? " (abbreviation)" : ""}`;
}

function phones(text: string, frontendId = "dectalk-english"): string[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false)
    .map((segment) => String(segment.get("phoneme")));
}

describe("DECtalk's dictionary search", () => {
  it("matches a lower-case letter only with a lower-case entry letter", () => {
    expect(abbreviationLookup("Dept")).toBe("Dept. (abbreviation)");
    expect(abbreviationLookup("DEPT")).toBe("Dept. (abbreviation)");
    expect(abbreviationLookup("dept")).toBeNull();
    expect(abbreviationLookup("Ave")).toBe("Ave. (abbreviation)");
    expect(abbreviationLookup("ave")).toBeNull();
    expect(abbreviationLookup("sat")).toBeNull();
  });

  it("matches a lower-case entry with any case", () => {
    for (const written of ["st", "St", "ST"]) {
      expect(abbreviationLookup(written)).toBe("st. (abbreviation)");
    }
    expect(abbreviationLookup("Mr")).toBe("mr. (abbreviation)");
  });

  it("lands on the plain entry for the capitalised word when both entries exist", () => {
    expect(abbreviationLookup("fig")).toBe("fig. (abbreviation)");
    expect(abbreviationLookup("FIG")).toBe("fig. (abbreviation)");
    expect(abbreviationLookup("Fig")).toBe("fig");
  });

  it("finds a word with no abbreviation entry as the word", () => {
    expect(abbreviationLookup("No")).toBe("no");
    expect(abbreviationLookup("govt")).toBeNull();
    expect(searchDictionary(words, "hello", false)).not.toBeNull();
    expect(searchDictionary(words, "zorblat", false)).toBeNull();
  });

  it("keeps the capitalised and the lower-case entry of a word apart", () => {
    const capital = searchDictionary(words, "New", false);
    const lower = searchDictionary(words, "new", false);
    expect(capital && words[capital.index]).toBe("New");
    expect(lower && words[lower.index]).toBe("new");
  });
});

describe("abbreviations in dectalk-english", () => {
  it("speaks a dictionary abbreviation and does not end the sentence at its period", () => {
    expect(phones("It is on Main St. near the park.").slice(9, 15)).toEqual([
      "S",
      "T",
      "T_REL",
      "R",
      "IY",
      "TX",
    ]);
    expect(phones("Ask Mr. Then go.").filter((phone) => phone === "SIL")).toHaveLength(1);
  });

  it("ends the text after an abbreviation that is its last word", () => {
    expect(phones("Bring pens, paper, etc.").slice(-10)).toEqual([
      "EH",
      "T",
      "T_REL",
      "S",
      "EH",
      "T",
      "T_REL",
      "RR",
      "AX",
      "SIL",
    ]);
  });

  it("follows the dictionary's case", () => {
    const department = ["D", "D_REL", "IH", "P", "P_REL", "AR", "T", "T_REL", "M", "AX", "N"];
    expect(phones("The Dept. and the group agree.").slice(2, 13)).toEqual(department);
    expect(phones("The DEPT. and the group agree.").slice(2, 13)).toEqual(department);
    // "dept." is not the entry "Dept.": the letters as a word, and a sentence end.
    expect(phones("The dept. and the group agree.").slice(2, 8)).toEqual([
      "D",
      "D_REL",
      "EH",
      "P",
      "T",
      "SIL",
    ]);
    expect(phones("See fig. two now.").slice(2, 7)).toEqual(["F", "IH", "G", "G_REL", "Y"]);
    expect(phones("See Fig. two now.").slice(2, 7)).toEqual(["F", "IH", "G", "G_REL", "SIL"]);
  });

  it("does not use the shared abbreviation list or add a period to a word", () => {
    expect(phones("No.")).toEqual(["N", "OW", "SIL"]);
    expect(phones("Then he sat down.").slice(5, 8)).toEqual(["S", "AE", "T"]);
  });

  it("leaves the shared list to a frontend that does not ask for its dictionary", () => {
    // "No." is "number" in the shared list.
    expect(phones("No.", "qlatt-english")).toContain("M");
  });
});
