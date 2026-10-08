/**
 * Number-like words the dectalk-english lexicon reads whole (money, clock
 * times, decimals, grouped and plural numbers; src/g2p/table-number.ts
 * speakNumberToken) against DECtalk's phoneme log for the same text
 * (test/fixtures/dectalk-oracle/dectalk-us-number-tokens-v1.phonemes.json,
 * recorded by scripts/oracle/export-number-fixture.ts --list).
 *
 * Every text the port reads must read as DECtalk does. The texts it does not
 * read are listed here by name, so that the list cannot change unnoticed.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { numberLogTokens, numberSymbolTokens } from "../scripts/oracle/number-log";
import {
  NUMBER_WBOUND,
  type NumberPhones,
  speakDigits,
  speakNumberToken,
  storeSyntacticMarkers,
} from "../src/g2p/table-number";
import { normalizeText } from "../src/tts-frontend";

const entries = (
  JSON.parse(
    readFileSync("test/fixtures/dectalk-oracle/dectalk-us-number-tokens-v1.phonemes.json", "utf8"),
  ) as { entries: Record<string, string | null> }
).entries;
const { numberPhones: lists, phonemeCharacters } = JSON.parse(
  readFileSync("public/rules/frontends/dectalk-english/lts-table.json", "utf8"),
) as { numberPhones: NumberPhones; phonemeCharacters: (number | null)[] };

/**
 * A text that the frontend's text rules write out as one word of phonemic
 * text (a clock time: lexical rule tn_clock_time), as the symbols its
 * characters stand for; null for any other text. The word boundary the text
 * ends in is the one letter-to-sound sends after a word, which a one-word log
 * does not have.
 */
const composed = (text: string): number[] | null => {
  const written = normalizeText(text, "dectalk-english").replace(/ \.$/, "");
  if (!/^\x81[^\x81\x82]+\x82$/.test(written)) return null;
  const symbols = [...written.slice(1, -1)].map((char) => {
    const symbol = phonemeCharacters[char.charCodeAt(0)];
    if (symbol === null || symbol === undefined) {
      throw new Error(`no symbol for '${char}' in the phonemic text of '${text}'`);
    }
    return symbol;
  });
  return symbols.at(-1) === NUMBER_WBOUND ? symbols.slice(0, -1) : symbols;
};

const spoken = (text: string): number[] | null =>
  /^[0-9]+$/.test(text)
    ? speakDigits(text, lists)
    : (composed(text) ?? speakNumberToken(text, lists));

/**
 * Not read by speakNumberToken, with what each needs. DECtalk's own reading of
 * each is in the fixture.
 */
const NOT_READ: readonly string[] = [
  // A sign after the dollar sign, and the dollar sign alone (ls_task.c:3184-3215).
  "$-5",
  "$+5",
  "$",
  // The next word decides (ls_task.c:3234-3309 money; 3626-3648 am and pm).
  "$3 million",
  "$5 billion",
  "$1 million",
  "$2.5 million",
  "$3 dollars",
  "3:30 pm",
  "3:30 am",
  "10:15 PM",
  "9:00 a.m.",
  "3:30 today",
  // Not a time to DECtalk: the colon is spoken as a word.
  "3:5",
  "123:45",
  "3:30.5",
  // Groups that are not threes: DECtalk says the comma as a word.
  "1,00",
  "12,34",
  "1,2345",
  "1,000th",
  // Several digit groups: read by the command text parser (CMD/cm_text.c).
  "555 1234",
  "555-1234",
  "1 800 555 1234",
  "12 34",
  "1234 5678",
  // Other rules of the text stage: percent, signs, exponents.
  "10%",
  "100%",
  "1%",
  "0.5%",
  "-5",
  "+5",
  "-3.5",
  "1e5",
  "2.5e-3",
];

describe("DECtalk number-like words", () => {
  it("the fixture has no text say.exe refused", () => {
    expect(Object.values(entries).filter((log) => log === null)).toEqual([]);
  });

  it("the texts the port does not read are exactly the listed ones", () => {
    const unread = Object.keys(entries).filter((text) => spoken(text) === null);
    expect([...unread].sort()).toEqual([...NOT_READ].sort());
  });

  const read = Object.entries(entries).filter(
    (entry): entry is [string, string] => entry[1] !== null && spoken(entry[0]) !== null,
  );

  it("the port reads most of the list", () => {
    expect(read.length).toBe(Object.keys(entries).length - NOT_READ.length);
    expect(read.length).toBeGreaterThan(55);
  });

  it.each(read)("%s reads as DECtalk reads it", (text, log) => {
    const mine = numberSymbolTokens(storeSyntacticMarkers(spoken(text) as number[])).join(" ");
    expect(mine).toBe(numberLogTokens(log).join(" "));
  });
});
