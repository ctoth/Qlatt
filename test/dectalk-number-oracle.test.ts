/**
 * DECtalk number oracle.
 *
 * For each number of test/fixtures/dectalk-oracle/dectalk-us-numbers-v1.phonemes.json
 * (DECtalk's phoneme log for a number written in digits;
 * scripts/oracle/export-number-fixture.ts), the number port sends the same
 * symbols: phones, stress marks, word boundaries, verb-phrase starts and
 * pauses. The log is written by DECtalk's phonetic stage, so the port's
 * symbols are compared as that stage stores them (storeSyntacticMarkers).
 *
 * KNOWN_GAPS is a ratchet: each listed number must still differ, so fixing one
 * forces its removal.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { numberLogTokens, numberSymbolTokens } from "../scripts/oracle/number-log";
import {
  isYear,
  type NumberPhones,
  numberWords,
  speakDigits,
  speakNumber,
  storeSyntacticMarkers,
} from "../src/g2p/table-number";

const repoRoot = path.resolve(__dirname, "..");
const readJson = <T>(...parts: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), "utf8")) as T;

const fixture = readJson<{ entries: Record<string, string> }>(
  "test",
  "fixtures",
  "dectalk-oracle",
  "dectalk-us-numbers-v1.phonemes.json",
);
const table = readJson<{
  numberPhones: NumberPhones;
  phonemeSymbols: string[][];
  stressBearing: number[];
}>("public", "rules", "frontends", "dectalk-english", "lts-table.json");
const lists = table.numberPhones;

const KNOWN_GAPS: Readonly<Record<string, string>> = {};

const ours = (text: string): string => {
  const symbols = speakDigits(text, lists);
  return symbols === null
    ? "not a number"
    : numberSymbolTokens(storeSyntacticMarkers(symbols)).join(" ");
};
const theirs = (log: string): string => numberLogTokens(log).join(" ");

describe("DECtalk number oracle", () => {
  it("lists only oracle numbers as known gaps", () => {
    expect(Object.keys(KNOWN_GAPS).filter((text) => !(text in fixture.entries))).toEqual([]);
  });

  it("speaks every other oracle number as DECtalk does", () => {
    const wrong: string[] = [];
    for (const [text, log] of Object.entries(fixture.entries)) {
      if (text in KNOWN_GAPS) continue;
      const mine = ours(text);
      const expected = theirs(log);
      if (mine !== expected) wrong.push(`${text}: DECtalk ${expected} | port ${mine}`);
    }
    expect(wrong).toEqual([]);
  });

  it.each(Object.entries(KNOWN_GAPS))("%s is still a known gap (%s)", (text) => {
    expect(ours(text)).not.toBe(theirs(fixture.entries[text]));
  });

  it("uses the unstressed unit before 'hundred' and its own 'and'", () => {
    // 101: w ah n | hx ' ah n d r ax d ) eh n d | w ' ah n.
    expect(ours("101")).toBe("W AH N _ HX ' AH N D R AX D ) EH N D _ W ' AH N");
  });

  it("reads four digits as a year unless they start with 0 or hold 00 in the middle", () => {
    expect(isYear("1984")).toBe(true);
    expect(isYear("2005")).toBe(false);
    expect(isYear("0984")).toBe(false);
    expect(isYear("198")).toBe(false);
    // 1305: th ' rr t ' iy n | z ' iy r ow | f ' ay v.
    expect(ours("1305")).toBe("TH ' RR T ' IY N _ Z ' IY R OW _ F ' AY V");
  });

  it("keeps the word boundary that precedes a verb-phrase start out of the stored stream", () => {
    // PH/ph_task.c:856-885: of two markers in a row the weaker is dropped.
    expect(storeSyntacticMarkers([48, 111, 113, 4])).toEqual([48, 113, 4]);
    expect(storeSyntacticMarkers([48, 113, 111, 4])).toEqual([48, 113, 4]);
  });

  it("is not a number when the text holds anything but digits and separators", () => {
    expect(speakNumber("12a", lists)).toBeNull();
    expect(speakNumber("", lists)).toBeNull();
  });

  it("cuts a spoken number into words with their boundaries", () => {
    const words = (text: string) => numberWords(speakDigits(text, lists) ?? [], table);
    // 101: one | hundred | ) and | one.
    expect(words("101")).toEqual([
      { phonemes: ["W", "AH0", "N"] },
      { phonemes: ["HH", "AH1", "N", "D", "R", "AX0", "D"] },
      { phonemes: ["EH0", "N", "D"], phraseStart: "vp" },
      { phonemes: ["W", "AH1", "N"] },
    ]);
    // 1,234,567 pauses after "million" and after "thousand".
    expect(
      words("1,234,567")
        .map((word, index) => (word.pauseBefore ? index : -1))
        .filter((index) => index >= 0),
    ).toHaveLength(2);
    // 19: nine|teen, the boundary after the N.
    expect(words("19")).toEqual([
      { phonemes: ["N", "AY1", "N", "T", "IY1", "N"], morphemeAfter: [2] },
    ]);
  });

  it("has a phone for every symbol of every oracle number", () => {
    for (const text of Object.keys(fixture.entries)) {
      expect(() => numberWords(speakDigits(text, lists) ?? [], table)).not.toThrow();
    }
  });
});
