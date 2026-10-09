/**
 * The reading of phonemic text in brackets (src/text-parser/phonemes.ts, a
 * port of DECtalk 4.63 CMD/cm_phon.c) against the two alphabets of the
 * dectalk-english text parser table. The outcomes named "measured" are the
 * symbols the instrumented say.exe's phonemic stage received for the same
 * bracket (scripts/oracle/dectalk-debug/text-layers.ts, the D line).
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { CommandTable } from "../src/text-parser/commands";
import {
  PHONEME_PARAMETERS_CLOSE,
  PHONEME_PARAMETERS_OPEN,
  PHONEME_SYMBOL_BASE,
  phonemeCharacters,
  readPhonemes,
} from "../src/text-parser/phonemes";

const table = (
  JSON.parse(
    readFileSync("public/rules/frontends/dectalk-english/text-parser-table.json", "utf8"),
  ) as { commandTable: CommandTable }
).commandTable;

/** Each symbol by its arpabet name, with its parameters after it. */
const read = (body: string, ascky = false) => {
  const result = readPhonemes(table.phonemes, body, ascky);
  const names = result.phonemes.map(
    (phoneme) =>
      // The word boundary's name is a space: shown as "|".
      ((table.phonemes.arpabet[phoneme.symbol] ?? "").trim() || "|") +
      (phoneme.parameters.length > 0 ? `<${phoneme.parameters.join(",")}>` : ""),
  );
  return `${names.join(" ")}${result.error ? " (error)" : ""}`;
};

describe("the phoneme alphabets", () => {
  it("have a name for each phone of the language", () => {
    expect(table.phonemes.arpabet).toHaveLength(table.phonemes.ascky.length);
    expect(table.phonemes.arpabet.indexOf("uw")).toBeGreaterThan(0);
    expect(table.phonemes.arpabet[table.phonemes.ascky.indexOf("u")]).toBe("uw");
    // The silence is symbol 0 in both.
    expect(table.phonemes.arpabet[0]).toBe("_ ");
    expect(table.phonemes.ascky[0]).toBe("_");
  });

  it("have the text DECtalk speaks for a bad phoneme", () => {
    expect(table.errorTexts[table.errorCodes.phoneme]).toBe("Command error in phoneme");
  });
});

describe("reading phonemic text in the arpabet", () => {
  // Measured: "[m'uwn]" is M ' UW N.
  it("takes a name of two characters, or of one before another name", () => {
    expect(read("m'uwn")).toBe("m ' uw n");
    expect(read("r'ihvrr")).toBe("r ' ih v rr");
  });

  // Measured: "[dh ax r'ihvrr r'aen d'awn]" is DH _ AX _ R ' IH V RR _ R '
  // AE N D ' AW N: the space after a one-letter name belongs to the name.
  it("takes a space as the word boundary unless it ends a one-letter name", () => {
    expect(read("dh ax r'ihvrr r'aen d'awn")).toBe("dh | ax | r ' ih v rr | r ' ae n d ' aw n");
    expect(read("dhax r'ihvrr")).toBe("dh ax | r ' ih v rr");
    expect(read("th r'iy")).toBe("th | r ' iy");
    expect(read("m uw n")).toBe("m uw | n");
  });

  // Measured: "[M'UWN]" is M ' UW N.
  it("takes capitals as small letters", () => {
    expect(read("M'UWN")).toBe(read("m'uwn"));
  });

  // Measured: "[hxehl'ow]" has HX, EH, and then "command error in phoneme".
  it("stops at a pair that is no name, with what was read before it", () => {
    expect(read("hxehl'ow")).toBe("hx eh (error)");
  });

  // Measured: "[m'uwq]" and "[zz]" are spoken with no error text.
  it("takes a one-letter name at the end of the bracket", () => {
    expect(read("m'uwq")).toBe("m ' uw q");
    expect(read("zz")).toBe("z z");
  });

  it("reads the numbers after a symbol", () => {
    expect(read("m<200>uw<400>n<150>")).toBe("m<200> uw<400> n<150>");
    expect(read("m<100>uw<400,140>n<150>")).toBe("m<100> uw<400,140> n<150>");
    expect(read("_<600>m'uwn")).toBe("_<600> m ' uw n");
  });

  // Measured: "The [uw<400,x>n] rose." speaks "command error in phoneme"
  // with no UW before it.
  it("drops a symbol whose numbers cannot be read", () => {
    expect(read("m<100>uw<400,x>n")).toBe("m<100> (error)");
  });
});

describe("reading phonemic text in the one-character alphabet", () => {
  // Measured: "[m'un]" is M ' UW N; "[Dx r'IvR r'@n d'Wn]" is DZ AX _ R '
  // IH V RR _ R ' AE N _ D ' AW N.
  it("takes each character as a symbol, capitals and small letters apart", () => {
    expect(read("m'un", true)).toBe("m ' uw n");
    expect(read("Dx r'IvR r'@n d'Wn", true)).toBe("dz ax | r ' ih v rr | r ' ae n | d ' aw n");
  });
});

describe("the symbols inside the frontend's phonemic text", () => {
  it("are one character each, with the numbers between two more", () => {
    const { phonemes } = readPhonemes(table.phonemes, "uw<400,140>n", false);
    const uw = table.phonemes.arpabet.indexOf("uw");
    const n = table.phonemes.arpabet.indexOf("n ");
    expect(phonemeCharacters(phonemes)).toBe(
      String.fromCharCode(PHONEME_SYMBOL_BASE + uw) +
        PHONEME_PARAMETERS_OPEN +
        "400,140" +
        PHONEME_PARAMETERS_CLOSE +
        String.fromCharCode(PHONEME_SYMBOL_BASE + n),
    );
  });
});
