/**
 * Date words as DECtalk's command text parser writes them ("3-May",
 * "23-Aug-1984"), written out by the dectalk-english text rules as phonemic
 * text (public/rules/normalization/lexical.yaml tn_date_text, after the
 * recognition rule tn_date_text_source) against DECtalk's phoneme log for the
 * same text
 * (test/fixtures/dectalk-oracle/dectalk-us-date-tokens-v1.phonemes.json,
 * recorded by scripts/oracle/export-number-fixture.ts --list).
 *
 * Every text the rules read must read as DECtalk does. The texts they do not
 * read are listed here by name, so that the list cannot change unnoticed.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  composedNumberSymbols,
  numberLogTokens,
  numberSymbolTokens,
} from "../scripts/oracle/number-log";
import { storeSyntacticMarkers } from "../src/g2p/table-number";

const entries = (
  JSON.parse(
    readFileSync("test/fixtures/dectalk-oracle/dectalk-us-date-tokens-v1.phonemes.json", "utf8"),
  ) as { entries: Record<string, string | null> }
).entries;
const { phonemeCharacters } = JSON.parse(
  readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8"),
) as { phonemeCharacters: (number | null)[] };

const spoken = (text: string): number[] | null => composedNumberSymbols(text, phonemeCharacters);

/**
 * Not written out as a date, with why. DECtalk's own reading of each is in
 * the fixture.
 */
const NOT_READ: readonly string[] = [
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

  it("the texts the rules do not read are exactly the listed ones", () => {
    const unread = Object.keys(entries).filter((text) => spoken(text) === null);
    expect([...unread].sort()).toEqual([...NOT_READ].sort());
  });

  const read = Object.entries(entries).filter(
    (entry): entry is [string, string] => entry[1] !== null && spoken(entry[0]) !== null,
  );

  it("the rules read the dates of the list", () => {
    expect(read.length).toBe(Object.keys(entries).length - NOT_READ.length);
    // Two of them have the month written out ("3-June", "5-January"): the
    // text goes through the frontend's text parser here, which shortens the
    // month to three letters (CMD/par_rule2.par:517) as DECtalk's does.
    expect(read.length).toBe(35);
  });

  it.each(read)("%s reads as DECtalk reads it", (text, log) => {
    const mine = numberSymbolTokens(storeSyntacticMarkers(spoken(text) as number[])).join(" ");
    expect(mine).toBe(numberLogTokens(log).join(" "));
  });
});
