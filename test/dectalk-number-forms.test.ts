/**
 * Fractions, part numbers and a dollar amount before "million" in the
 * dectalk-english lexicon (src/g2p/table-number.ts speakFraction,
 * speakPartDigits, speakMoneyBeforeQuantity, speakQuantityAfterMoney, and the
 * part-number reading of src/g2p/index.ts).
 *
 * Every expected reading was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-number-forms-v1.json against its packets.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LtsTableDocument } from "../src/g2p/table-lts-pronounce";
import {
  isFraction,
  numberWords,
  speakFraction,
  speakMoneyBeforeQuantity,
  speakPartDigits,
  speakQuantityAfterMoney,
} from "../src/g2p/table-number";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const table = JSON.parse(
  readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8"),
) as LtsTableDocument;
const lists = table.numberPhones as NonNullable<LtsTableDocument["numberPhones"]>;

/** Words joined by `_`, a morpheme mark as `*`, stress as the vowel's digit. */
const words = (symbols: readonly number[] | null): string | null =>
  symbols === null
    ? null
    : numberWords(symbols, table)
        .map((word) =>
          word.phonemes
            .map((phone, index) => (word.morphemeAfter?.includes(index) ? `${phone} *` : phone))
            .join(" "),
        )
        .join(" _ ");

/** The frontend's final phones for a text, a stop counted once. */
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

describe("DECtalk's fraction test", () => {
  it.each(["1/8", "3/8", "10/3", "24/7", "1/100", "50/50", "9/11"])("takes %s", (text) => {
    expect(isFraction(text)).toBe(true);
  });

  // A numerator or denominator that starts with 0, three numerator digits,
  // and a denominator of three digits other than 100 or of four.
  it.each(["0/5", "1/05", "100/3", "1/101", "1/1000", "1/", "/2", "1-2"])("refuses %s", (text) => {
    expect(isFraction(text)).toBe(false);
  });
});

describe("a fraction as DECtalk speaks it", () => {
  it.each([
    ["1/8", "W AH1 N _ EY1 TH"],
    ["3/8", "TH R IY1 _ EY1 TH S"],
    ["1/3", "W AH1 N _ TH RR1 D"],
    ["2/3", "T UW1 _ TH RR1 D Z"],
    ["3/2", "TH R IY1 _ HH AE1 V Z"],
    ["2/2", "T UW1 _ HH AE1 V Z"],
    ["5/12", "F AY1 V _ T W EH1 L V TH S"],
    ["2/13", "T UW1 _ TH RR1 * T IY1 N TH S"],
    ["2/22", "T UW1 _ T W EH1 N T IY0 _ S EH1 K AX0 N D Z"],
    ["4/23", "F OR1 _ T W EH1 N T IY0 _ TH RR1 D Z"],
    ["1/20", "W AH1 N _ T W EH1 N T IY0 IX0 TH"],
    ["1/100", "W AH1 N _ W AH0 N _ HH AH1 N D R AX0 D TH"],
    ["10/3", "T EH1 N _ TH RR1 D Z"],
  ])("%s", (text, expected) => {
    expect(words(speakFraction(text, lists))).toBe(expected);
  });

  it("is not a reading of a word that fails the test", () => {
    expect(speakFraction("1/1000", lists)).toBeNull();
    expect(speakFraction("0/5", lists)).toBeNull();
  });
});

describe("a run of digits in a part number", () => {
  it.each([
    ["10", "T EH1 N"],
    ["15", "F IH1 F * T IY1 N"],
    ["52", "F IH1 F T IY0 _ T UW1"],
    ["100", "W AH0 N _ HH AH1 N D R AX0 D"],
    ["105", "W AH0 N _ Z IY1 R OW0 _ F AY1 V"],
    ["255", "T UW0 _ F IH1 F T IY0 _ F AY1 V"],
    ["1000", "W AH0 N _ TH AW1 Z AX0 N D"],
    ["1900", "N AY1 N * T IY1 N _ HH AH1 N D R AX0 D"],
    ["1905", "N AY1 N * T IY1 N _ Z IY1 R OW0 _ F AY1 V"],
    ["1990", "N AY1 N * T IY1 N _ N AY1 N T IY0"],
    ["2010", "T W EH1 N T IY0 _ T EH1 N"],
  ])("%s", (run, expected) => {
    expect(words(speakPartDigits(run, lists))).toBe(expected);
  });

  // One digit, five digits and a run with a leading zero are spelled.
  it.each(["9", "12345", "007", "08"])("leaves %s to the spelling", (run) => {
    expect(speakPartDigits(run, lists)).toBeNull();
  });
});

describe("a dollar amount before a word that takes dollars behind it", () => {
  it("speaks the amount as a number and the word with dollars", () => {
    expect(words(speakMoneyBeforeQuantity("2", lists))).toBe("T UW1");
    expect(words(speakMoneyBeforeQuantity("2.50", lists))).toBe(
      "T UW1 _ P OY1 N T _ F AY1 V _ Z IY1 R OW0",
    );
    expect(words(speakQuantityAfterMoney("million", lists))).toBe(
      "M IH1 L Y AX0 N _ D AA1 L RR0 Z",
    );
  });

  it("knows DECtalk's six words and no other", () => {
    expect(Object.keys(lists.quantityWords ?? {}).sort()).toEqual([
      "billion",
      "hundred",
      "million",
      "thousand",
      "trillion",
      "zillion",
    ]);
    expect(speakQuantityAfterMoney("millions", lists)).toBeNull();
    expect(speakQuantityAfterMoney("dozen", lists)).toBeNull();
  });

  it("puts dollars after the word in a sentence, and only there", () => {
    expect(phones("It cost $2 million then.")).toContain("T UW M IH LX Y AX N D AA LX RR Z DH");
    expect(phones("It cost $1 million then.")).toContain("W AH N M IH LX Y AX N D AA LX RR Z");
    expect(phones("It cost $2 Million then.")).toBe(phones("It cost $2 million then."));
    expect(phones("It cost $2 millions then.")).toContain("T UW D AA LX RR Z M IH LX Y AX N Z");
    expect(phones("It cost 2 million then.")).not.toContain("D AA LX RR Z");
  });
});

describe("fractions and part numbers in a sentence", () => {
  it("takes the dictionary's word for a fraction it has", () => {
    // "1/2" is an entry: W AX N, a compound's joint, HX AE F.
    expect(phones("Add 1/2 cup.")).toContain("W AX N HH AE F");
    expect(phones("Add 1/8 cup.")).toContain("W AH N EY TH");
  });

  it("names the hyphen and the slash of a part number", () => {
    expect(phones("Read 10-15 now.")).toContain("T EH N D AE SH F IH F T IY N");
    expect(phones("Add 1/1000 cup.")).toContain("W AH N S L AE SH W AH N TH AW Z AX N D");
    // (IY and R are one phone, IR, after the allophone rules.)
    expect(phones("Add 0/5 cup.")).toContain("Z IR OW S L AE SH F AY V");
  });

  it("reads a run of letters as the dictionary's word or letter by letter", () => {
    expect(phones("The cats-12 now.")).toContain("K AE T S D AE SH");
    // "win" is not in DECtalk's dictionary: D AH B EL Y UW, AY, EH N.
    expect(phones("The win-95 now.")).toContain("AY EH N D AE SH N AY N");
    // Four letters or more are spelled slowly: a pause follows.
    expect(phones("The zorb-12 now.")).toContain("B IY , D AE SH");
  });

  // LTS/l_us_pr1.c:168-180: every hyphen of the word is named, the last one
  // too. The text parser writes "$80-$120" as "$ 80- $ 120".
  it("names a hyphen at the word's end", () => {
    // (The T of "eighty" is the flap DF after the allophone rules.)
    expect(phones("Take 80- of them.")).toContain("EY DF IY D AE SH AX V");
    expect(phones("Rooms are $80-$120 a night.")).toContain(
      "D AA L RR EY DF IY D AE SH D AA L RR W AH N",
    );
  });

  it("leaves a day and a month to the other rules", () => {
    expect(phones("On 3-May now.")).not.toContain("D AE SH");
  });
});
