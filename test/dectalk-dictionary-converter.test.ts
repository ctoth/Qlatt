import fs from "node:fs";
import { expect, it } from "vitest";
import {
  convertPhonemeField,
  convertPhonemeFieldDetailed,
  selectDictionaryRows,
} from "../scripts/build-dectalk-dict";
import { createDiagnostics } from "../src/diagnostics";

const dictionary = JSON.parse(
  fs.readFileSync("public/rules/frontends/dectalk-english/dectalk-dictionary.json", "utf8"),
) as Record<string, string>;

// Actual Dic_us.txt fields: retain the shipped lexicon spelling and both stress levels.
it.each([
  ["about", "xb`Wt"],
  ["knew", "n`Y"],
  ["'em", "|m"],
  ["overrun", "`ovR#~'r^n"],
  ["minutiae", "mIn'uSi q`i"],
  ["new", "n'uw"],
  ["record", "r'EkRd"],
])("preserves the existing dictionary pronunciation of %s", (word, field) => {
  const diagnostics = createDiagnostics();
  expect(convertPhonemeField(field, diagnostics)).toBe(dictionary[word]);
  expect(diagnostics.getEntries()).toEqual([]);
});

it("retains rule-block, morpheme and internal word-boundary metadata", () => {
  expect(convertPhonemeFieldDetailed("`ovR#~'r^n")).toEqual({
    phones: ["OW2", "V", "RR0", "R", "AH1", "N"],
    rulesBlocked: [3],
    boundaryAfter: [2],
    wordBreakAfter: [],
  });
  expect(convertPhonemeFieldDetailed("mIn'uSi q`i")).toEqual({
    phones: ["M", "IH0", "N", "UW1", "SH", "IY0", "IY2"],
    rulesBlocked: [],
    boundaryAfter: [],
    wordBreakAfter: [5],
  });
});

it("reports an unknown field character without changing its known pronunciation", () => {
  const diagnostics = createDiagnostics();
  expect(convertPhonemeField("n`Y!", diagnostics)).toBe(dictionary.knew);
  expect(diagnostics.getEntries()).toMatchObject([
    {
      level: "warn",
      code: "DICT_UNKNOWN_CHARACTER",
      data: { field: "n`Y!", character: "!", offset: 3 },
    },
  ]);
});

it("keeps secondary and capitalized rows available to the existing table builder", () => {
  const rows = selectDictionaryRows(
    [
      "record,P,r'EkRd,00000000001000000000000000000,250",
      "record,S,rIk'ord,00000000000000000100000000000,250",
      "New,N,n`uw,10000000000000000000000000001,450",
      "new,N,n'uw,10000000000000000000000000000,150",
    ].join("\n"),
  );
  expect(rows.best.get("record")?.pos).toBe("P");
  expect(convertPhonemeField(rows.secondary.get("record")!.phonemes)).toBe("R IH0 K OW1 R D");
  expect(rows.secondary.get("record")?.formClass).toBe("00000000000000000100000000000");
  expect(convertPhonemeField(rows.capitalised.get("new")!.phonemes)).toBe("N UW2 W");
});
