/**
 * Words with an accented letter in the dectalk-english frontend.
 *
 * DECtalk 4.63 say.exe is handed one byte for such a letter. Its dictionary
 * is searched for the word as written (LTS/ls_task.c:697, 2040-2160), and a
 * word it does not have goes to the letter-to-sound rules, which read each
 * character through ls_fold[] (LTS/l_us_ru1.c:108-112, INCLUDE/ls_fold.tab):
 * the accented letter is its plain one there, and the dictionary is not
 * searched again for the folded word (ls_task.c:752-765).
 *
 * Every expected reading was measured on say.exe; the same texts are in
 * test/oracle-corpora/dectalk-us-accented-letters-v1.json against its packets.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LtsTableDocument } from "../src/g2p/table-lts-pronounce";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

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

describe("a word with an accented letter", () => {
  it.each([
    // The rules' reading of "cafe", not the dictionary's entry "cafe".
    ["We met at a small café downtown.", "K EY F D AW N"],
    ["He is a bit naïve about money.", "N EY V AX B AW T"],
    ["Send your résumé by Friday.", "R IX S UW M B AY"],
    ["The piñata broke on the first hit.", "P IX N AA DF AX B R OW K"],
    ["Her fiancé is from Zürich.", "Z YU RX IX CH ."],
    ["Two cafés were open.", "K EY F S W RR"],
    ["The École is closed.", "IX K OW LX IH Z"],
  ])("%s is read by rule with the accent folded away", (text, expected) => {
    expect(phones(text)).toContain(expected);
  });

  it("is the dictionary's when the dictionary has it with its accent", () => {
    expect(phones("The exposé ran on Sunday.")).toContain("EH K S P OW Z EY R AE N");
  });

  it("differs from the same word written plain", () => {
    expect(phones("We met at a small cafe downtown.")).toContain("K AE F EY D AW N");
    expect(phones("Send your resume by Friday.")).toContain("R EH Z UH M EY B AY");
  });
});

describe("the generated tables", () => {
  it("hold the fold of every accented letter of ls_fold.tab", () => {
    const table = JSON.parse(
      readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8"),
    ) as LtsTableDocument;
    expect(table.letterFold?.["é"]).toBe("e");
    expect(table.letterFold?.["Ñ"]).toBe("n");
    expect(table.letterFold?.["ß"]).toBe("s");
    expect(Object.keys(table.letterFold ?? {})).toHaveLength(62);
  });

  it("hold the dictionary's entries with a byte above 127 under that character", () => {
    const dictionary = JSON.parse(readFileSync("public/dectalk-dictionary.json", "utf8")) as Record<
      string,
      string
    >;
    expect(dictionary["exposé"]).toBe("EH2 K S P OW0 Z EY1");
    expect(Object.keys(dictionary).some((key) => key.includes("�"))).toBe(false);
  });
});
