/**
 * Symbols, bare decimals, slash paths and dictionary entries of several
 * words in the dectalk-english frontend.
 *
 * What each case expects was measured on DECtalk 4.63 say.exe, as the symbols
 * its phonemic stage receives; the same texts are in
 * test/oracle-corpora/dectalk-us-symbol-words-v1.json against its packets.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function utteranceOf(text: string) {
  return textToKlattTrackDetailed(text, undefined, 30, { frontendId: "dectalk-english" }).utterance;
}

/** The phones of a text, a stop counted once, a clause end as its mark. */
function phones(text: string): string {
  return utteranceOf(text)
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

const wordsOf = (text: string): string[] =>
  utteranceOf(text)
    .relation("Word")
    .listItems()
    .map((word) => String(word.get("text")));

describe("a symbol standing alone", () => {
  it.each([
    // The phones after the allophone rules (TX, ER, LX, DX are theirs).
    ["@", "AE TX"],
    ["&", "AE N D"],
    ["*", "AE S T RR IH S K"],
    ["+", "P L AH S"],
    ["=", "IY K W AX LX Z"],
    ["^", "K ER AX TX"],
    ["~", "T IH LX DX AX"],
    ["%", "P RR S EH N T"],
  ])("%s is the dictionary's word", (symbol, word) => {
    expect(phones(`Type ${symbol} now.`)).toContain(` ${word} `);
  });

  it("is two words when the dictionary's entry is", () => {
    // "#" is N AH M B RR, a word boundary, S AY N.
    expect(wordsOf("Type # now.")).toEqual(["type", "##1", "##2", "now"]);
    expect(wordsOf("Type > now.").length).toBe(4);
  });

  it("is in the generated map, as every dictionary entry with no letter and no digit is", () => {
    const map = readFileSync(
      "public/rules/frontends/dectalk-english/dictionary-abbreviations.yaml",
      "utf8",
    );
    const symbols = map.slice(map.indexOf("tn_symbol_words:"));
    for (const symbol of ["@", "#", "?", "!"]) {
      expect(symbols).toContain(`"${symbol}": "word"`);
    }
  });
});

describe("a decimal with no digit before its point", () => {
  it("is a number, not a sentence end", () => {
    expect(phones("The odds are .5 at best.")).toBe(
      "DH IY AA D Z AR P OY N T F AY V EH T B EH S T .",
    );
    expect(phones("It is .05 now.")).toContain("P OY N T Z IR OW F AY V");
  });

  it("leaves a sentence's own period alone", () => {
    expect(phones("It is five. Now go.")).toContain("F AY V . N AW");
    expect(phones("It is .5. Now go.")).toContain("P OY N T F AY V . N AW");
  });
});

describe("a path with slashes", () => {
  it("names each slash and spells a part the dictionary lacks", () => {
    // DECtalk: slash, U, S, R, slash, B, I, N ("bin" is not in its dictionary).
    expect(phones("Look in /usr/bin now.")).toContain(
      "S L AE SH Y UW EH S AR S L AE SH B IY AY EH N N AW",
    );
    expect(phones("Look in /home now.")).toContain("S L AE SH HH OW M");
    expect(phones("Look in bin/ now.")).toContain("B IY AY EH N S L AE SH");
  });
});

describe("two words written apart", () => {
  it("stay two words though the dictionary has them joined", () => {
    expect(wordsOf("The zip code is here.")).toEqual(["the", "zip", "code", "is", "here"]);
    expect(wordsOf("The zipcode is here.")).toEqual(["the", "zipcode", "is", "here"]);
  });
});
