/**
 * A vowel with secondary stress is spoken whatever path it comes by. The
 * qlatt inventories have no entry for most vowels at stress 2 and a cited
 * `secondary_stress_fallback` that says which entry stands in.
 *
 * A rule that spelled an entry's name itself went past that policy:
 * normalize_schwa asked for "AH2" when letter-to-sound gave a schwa a
 * secondary stress, and the frontend threw E_INVENTORY_PHONEME_UNKNOWN. That
 * happens in a string of ten or more digits, which is read as one word of
 * digit names ("seven" inside it), so "The serial is 9876543210123." did not
 * speak. The rule now asks by phoneme and stress (`target(phoneme, stress)`).
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
const DIGITS = "9876543210123456";

/** For each vowel the dictionary has at stress 2, its first word in key order. */
function secondaryStressWords(): Map<string, string> {
  const words = new Map<string, string>();
  for (const word of Object.keys(dictionary).sort()) {
    // One plain word a vowel: no apostrophes, digits or alternate entries.
    if (!/^[a-z]+$/u.test(word)) continue;
    for (const phone of String(dictionary[word]).split(" ")) {
      if (phone.endsWith("2") && !words.has(phone.slice(0, -1))) {
        words.set(phone.slice(0, -1), word);
      }
    }
  }
  return words;
}

describe("vowels with secondary stress", () => {
  const words = secondaryStressWords();

  it("the dictionary has many of them, AH among them", () => {
    expect(words.size).toBeGreaterThanOrEqual(10);
    expect(words.has("AH")).toBe(true);
  });

  it.each(FRONTENDS)("%s selects an entry for each of them", (frontend) => {
    const inventory = loadInventorySpecFromPath(`/rules/frontends/${frontend}/inventory.yaml`);
    for (const vowel of [...words.keys()].sort()) {
      const result = materializePhonemeTarget(vowel, { stress: 2, inventorySpec: inventory });
      expect(result.type, vowel).toBe("vowel");
    }
  });

  it.each(FRONTENDS)("%s speaks a dictionary word with each of them", (frontend) => {
    for (const [vowel, word] of words) {
      const { track } = textToKlattTrackDetailed(`${word}.`, undefined, 30, {
        frontendId: frontend,
      });
      expect(track.length, `${vowel} in ${word}`).toBeGreaterThan(0);
    }
  });

  it.each(FRONTENDS)("%s speaks a string of digits of every length to 16", (frontend) => {
    for (let length = 1; length <= DIGITS.length; length += 1) {
      const text = `${DIGITS.slice(0, length)}.`;
      const { track } = textToKlattTrackDetailed(text, undefined, 30, { frontendId: frontend });
      expect(track.length, text).toBeGreaterThan(0);
      for (const frame of track) expect(Number.isFinite(frame.params.F1), text).toBe(true);
    }
  });

  it.each(FRONTENDS)("%s speaks the sentence that did not speak", (frontend) => {
    const { track, utterance } = textToKlattTrackDetailed(
      "The serial is 9876543210123.",
      undefined,
      30,
      { frontendId: frontend },
    );
    expect(track.length).toBeGreaterThan(0);
    // The schwa of "seven" has secondary stress here and is an AH Segment.
    const schwas = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("phoneme") === "AH" && item.get("stress") === 2);
    expect(schwas.length).toBeGreaterThan(0);
    // The decision that made it cites the inventory's policy for it.
    const inventory = loadInventorySpecFromPath(`/rules/frontends/${frontend}/inventory.yaml`);
    const policy = inventory.secondary_stress_fallback?.citations ?? [];
    expect(policy.length).toBeGreaterThan(0);
    const byRule = utterance.provenance
      .getDecisions()
      .filter((decision) => decision.reason.includes("normalize_schwa"));
    expect(byRule.length).toBeGreaterThan(0);
    expect(
      byRule.some((decision) => policy.every((citation) => decision.citations.includes(citation))),
    ).toBe(true);
  });
});
