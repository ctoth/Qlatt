/**
 * Words DECtalk's dictionary holds twice, capitalised and in lower case.
 *
 * dic/Dic_us.txt has "New" n`uw beside "new" n'uw, "Miss" m`Is beside "miss"
 * m'Is, "Baton" beside "baton" and "Bologna" beside "bologna". The search
 * takes the capitalised entry for a word written with a capital first letter
 * and a lower-case second one, and the lower-case entry for any other writing
 * (LTS/ls_dict.c:641-718). The sentences are in
 * test/oracle-corpora/dectalk-us-capitalised-entries-v1.json against DECtalk's
 * packets; the stresses below are what its phonemic stage is sent.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { searchDictionary } from "../src/g2p/table-dictionary-search";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const table = JSON.parse(
  fs.readFileSync(path.resolve("public/rules/frontends/dectalk-english/lts-table.json"), "utf8"),
) as { dictionaryWords: string[]; capitalisedEntries: Record<string, { phonemes: string[] }> };

/** The vowels of a text's first word with their stress. */
function firstWordVowels(text: string, frontendId = "dectalk-english"): string[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, { frontendId });
  const word = utterance.relation("Word").listItems()[0];
  return utterance
    .relation("Segment")
    .listItems()
    .filter(
      (segment) =>
        segment.get("active") !== false &&
        segment.get("type") === "vowel" &&
        utterance.relation("SylStructure").node(segment)?.parent?.parent?.item === word,
    )
    .map((segment) => `${String(segment.get("phoneme"))}:${String(segment.get("stress"))}`);
}

describe("a word the DECtalk dictionary holds capitalised and in lower case", () => {
  it("is found by the search's own steps as the table says", () => {
    const words = table.dictionaryWords;
    const found = (written: string) => {
      const hit = searchDictionary(words, written, false);
      return hit ? words[hit.index] : null;
    };
    const keys = Object.keys(table.capitalisedEntries).filter((key) => !key.endsWith("."));
    expect(keys).toEqual(["baton", "bologna", "miss", "new"]);
    for (const key of keys) {
      const capitalised = key.charAt(0).toUpperCase() + key.slice(1);
      expect(found(capitalised)).toBe(capitalised);
      expect(found(key)).toBe(key);
      expect(found(key.toUpperCase())).toBe(key);
    }
  });

  it("has the capitalised entry's phones when written capitalised", () => {
    expect(firstWordVowels("New post is up.")).toEqual(["UW:2"]);
    expect(firstWordVowels("Miss the bus.")).toEqual(["IH:2"]);
  });

  it("has the lower-case entry's phones in lower case and in capitals", () => {
    expect(firstWordVowels("new post is up.")).toEqual(["UW:1"]);
    expect(firstWordVowels("NEW post is up.")).toEqual(["UW:1"]);
    expect(firstWordVowels("MISS Lane ran.")).toEqual(["IH:1"]);
  });

  // The root of a suffixed word is searched as the word was written.
  it("has the capitalised root under a suffix", () => {
    expect(firstWordVowels("Misses ran.")[0]).toBe("IH:2");
    expect(firstWordVowels("misses ran.")[0]).toBe("IH:1");
  });

  it("is one entry in a frontend whose dictionary has no such pair", () => {
    expect(firstWordVowels("New post is up.", "qlatt-english")).toEqual(
      firstWordVowels("new post is up.", "qlatt-english"),
    );
  });
});
