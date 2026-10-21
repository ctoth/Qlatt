/**
 * Every vowel the dictionary can hand a frontend at stress 0 has a target in
 * that frontend's inventory. A nucleus without the requested target fails
 * explicitly (docs/inventory-conventions.md), and the qlatt inventories had
 * no unstressed AY, AW or OY: "idea" (AY0), "outrun" (AW0) and "ballpoint"
 * (OY0) threw E_STRESS_TARGET instead of speaking.
 */

import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const dictionary = JSON.parse(fs.readFileSync("public/cmu-dictionary.json", "utf8")) as Record<
  string,
  string
>;
const FRONTENDS = ["qlatt-english", "qlatt-beauty"];
// Dictionary words with an unstressed diphthong before or after the stress.
const WORDS: readonly [word: string, phones: string][] = [
  ["outrun", "AW0 T R AH1 N"],
  ["outnumber", "AW0 T N AH1 M B ER0"],
  ["birdhouse", "B ER1 D HH AW0 S"],
  ["idea", "AY0 D IY1 AH0"],
  ["ballpoint", "B AO1 L P OY0 N T"],
];

describe("unstressed nuclei of the dictionary", () => {
  const unstressed = new Set<string>();
  for (const phones of Object.values(dictionary)) {
    for (const phone of String(phones).split(" ")) {
      if (phone.endsWith("0")) unstressed.add(phone.slice(0, -1));
    }
  }

  it("the dictionary has the words as this test names them", () => {
    for (const [word, phones] of WORDS) expect(dictionary[word], word).toBe(phones);
    expect([...unstressed].sort()).toContain("AW");
    expect([...unstressed].sort()).toContain("AY");
    expect([...unstressed].sort()).toContain("OY");
  });

  it.each(FRONTENDS)("%s has a target for each of them", (frontend) => {
    const inventory = loadInventorySpecFromPath(`/rules/frontends/${frontend}/inventory.yaml`);
    for (const vowel of [...unstressed].sort()) {
      const result = materializePhonemeTarget(vowel, { stress: 0, inventorySpec: inventory });
      expect(result.phoneme, vowel).toBe(`${vowel}0`);
      expect(result.type, vowel).toBe("vowel");
    }
  });

  it.each(FRONTENDS)(
    "%s gives an unstressed diphthong its strong target's formants",
    (frontend) => {
      // The declared engineering estimate: no reduced diphthong target has a source.
      const inventory = loadInventorySpecFromPath(`/rules/frontends/${frontend}/inventory.yaml`);
      for (const vowel of ["AY", "AW", "OY"]) {
        const weak = materializePhonemeTarget(vowel, { stress: 0, inventorySpec: inventory });
        const strong = materializePhonemeTarget(vowel, { stress: 1, inventorySpec: inventory });
        for (const parameter of ["F1", "F2", "F3", "B1", "B2", "B3", "AV"]) {
          expect(weak.params[parameter], `${vowel} ${parameter}`).toBe(strong.params[parameter]);
        }
      }
    },
  );

  it.each(FRONTENDS.flatMap((frontend) => WORDS.map(([word]) => [frontend, word] as const)))(
    "%s speaks '%s'",
    (frontend, word) => {
      const { track } = textToKlattTrackDetailed(word, undefined, 30, { frontendId: frontend });
      expect(track.length).toBeGreaterThan(0);
      for (const frame of track) expect(Number.isFinite(frame.params.F1)).toBe(true);
    },
  );
});
