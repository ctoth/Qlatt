/**
 * Date words as DECtalk's command text parser writes them ("3-May",
 * "23-Aug-1984"), read by the dectalk-english lexicon (src/g2p/table-number.ts
 * speakDate) against DECtalk's phoneme log for the same text
 * (test/fixtures/dectalk-oracle/dectalk-us-date-tokens-v1.phonemes.json,
 * recorded by scripts/oracle/export-number-fixture.ts --list).
 *
 * Every text the port reads must read as DECtalk does. The texts it does not
 * read are listed here by name, so that the list cannot change unnoticed.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { numberLogTokens, numberSymbolTokens } from "../scripts/oracle/number-log";
import {
  type NumberPhones,
  speakNumberToken,
  storeSyntacticMarkers,
} from "../src/g2p/table-number";

const entries = (
  JSON.parse(
    readFileSync("test/fixtures/dectalk-oracle/dectalk-us-date-tokens-v1.phonemes.json", "utf8"),
  ) as { entries: Record<string, string | null> }
).entries;
const lists = (
  JSON.parse(readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8")) as {
    numberPhones: NumberPhones;
  }
).numberPhones;

/**
 * Not read by speakNumberToken, with why. DECtalk's own reading of each is in
 * the fixture.
 */
const NOT_READ: readonly string[] = [
  // A month written out: DECtalk's text parser shortens it to three letters
  // before the word reaches letter-to-sound (CMD/par_rule2.par:517), so the
  // word as written is not a date.
  "3-June",
  "5-January",
  // Not dates to DECtalk either: spelled, the hyphen by name.
  "3-Mayor",
  "3-Abc",
  "3-Ma",
  "123-Jan",
  "3-May-1",
  "3-May-123",
  "3-May-12345",
  "May-3",
];

describe("DECtalk date words", () => {
  it("the fixture has no text say.exe refused", () => {
    expect(Object.values(entries).filter((log) => log === null)).toEqual([]);
  });

  it("the texts the port does not read are exactly the listed ones", () => {
    const unread = Object.keys(entries).filter((text) => speakNumberToken(text, lists) === null);
    expect([...unread].sort()).toEqual([...NOT_READ].sort());
  });

  const read = Object.entries(entries).filter(
    (entry): entry is [string, string] =>
      entry[1] !== null && speakNumberToken(entry[0], lists) !== null,
  );

  it("the port reads the dates of the list", () => {
    expect(read.length).toBe(Object.keys(entries).length - NOT_READ.length);
    expect(read.length).toBe(33);
  });

  it.each(read)("%s reads as DECtalk reads it", (text, log) => {
    const mine = numberSymbolTokens(
      storeSyntacticMarkers(speakNumberToken(text, lists) as number[]),
    ).join(" ");
    expect(mine).toBe(numberLogTokens(log).join(" "));
  });
});
