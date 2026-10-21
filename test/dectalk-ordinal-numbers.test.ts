/**
 * Numbers with an ordinal ending in the dectalk-english frontend.
 *
 * DECtalk's text task hands "42nd" to its number routine with the ordinal
 * flag (LTS/ls_task.c:3967-3972) when the ending agrees with the last digit
 * (LTS/ls_util.c:517-553). The phones come from the number lists, which are
 * not the dictionary's words: "11th" begins with a schwa where "eleventh"
 * begins IH, and "100th" has R AX D TH where "hundredth" has R IX D TH. The
 * sentences are in test/oracle-corpora/dectalk-us-ordinals-v1.json against
 * say.exe's packets.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type NumberPhones, speakOrdinalNumber } from "../src/g2p/table-number";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const lists = (
  JSON.parse(
    fs.readFileSync(path.resolve("public/rules/frontends/dectalk-english/lts-table.json"), "utf8"),
  ) as { numberPhones: NumberPhones }
).numberPhones;

function phones(text: string, frontendId = "dectalk-english"): string[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  return utterance
    .relation("Segment")
    .listItems()
    .filter((segment) => segment.get("active") !== false)
    .map((segment) => String(segment.get("phoneme")));
}

describe("the ordinal ending test", () => {
  it("takes the ending that goes with the last digit", () => {
    for (const text of ["1st", "2nd", "3rd", "4th", "21st", "42nd", "103rd", "100th", "30th"]) {
      expect(speakOrdinalNumber(text, lists), text).not.toBeNull();
    }
  });

  it("takes th after any digit that follows a 1", () => {
    for (const text of ["11th", "12th", "13th", "111th", "212th"]) {
      expect(speakOrdinalNumber(text, lists), text).not.toBeNull();
    }
    for (const text of ["11st", "12nd", "13rd"]) {
      expect(speakOrdinalNumber(text, lists), text).toBeNull();
    }
  });

  it("refuses an ending that does not agree, and anything that is not digits and an ending", () => {
    for (const text of ["22th", "1nd", "3th", "42", "nd", "4.5th", "1,000th"]) {
      expect(speakOrdinalNumber(text, lists), text).toBeNull();
    }
  });
});

describe("ordinal numbers in dectalk-english", () => {
  it("speaks them from the number lists", () => {
    expect(phones("Say 11th now.").slice(2, 9)).toEqual(["AX", "L", "EH", "V", "AX", "N", "TH"]);
    expect(phones("Say 100th now.").slice(-8, -2)).toEqual(["R", "AX", "D", "D_REL", "TH", "N"]);
  });

  it("does not speak them as the dictionary's words", () => {
    expect(phones("Say 11th now.")).not.toEqual(phones("Say eleventh now."));
    expect(phones("Say 100th now.")).not.toEqual(phones("Say one hundredth now."));
  });

  it("speaks first, second and third", () => {
    expect(phones("Say 1st now.").slice(2, 6)).toEqual(["F", "RR", "S", "T"]);
    expect(phones("Say 21st now.").slice(-7, -3)).toEqual(["RR", "S", "T", "T_REL"]);
    expect(phones("Say 42ND now.")).toEqual(phones("Say 42nd now."));
  });

  it("leaves a frontend that writes ordinals out alone", () => {
    expect(phones("Say 11th now.", "qlatt-english")).toEqual(
      phones("Say eleventh now.", "qlatt-english"),
    );
  });
});
