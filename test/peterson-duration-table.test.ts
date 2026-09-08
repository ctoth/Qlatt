import { describe, expect, it } from "vitest";
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const inventorySpec = loadInventorySpecFromPath("/rules/frontends/qlatt-english/inventory.yaml");

describe("Peterson & Lehiste 1960 Table I intrinsic vowel durations", () => {
  // The all-CNC-list column, converted from centiseconds to milliseconds.
  // /i/ is IY (beat); /ɪ/ is IH (bit), as printed in the original table.
  it.each([
    ["IY", 207],
    ["IH", 161],
    ["EY", 200],
    ["EH", 204],
    ["AE", 284],
    ["AH", 181],
    ["AA", 265],
    ["AO", 250],
    ["OW", 222],
    ["UH", 163],
    ["UW", 235],
    ["AW", 302],
    ["AY", 310],
    ["OY", 360],
    ["ER", 256],
  ] as const)("materializes the measured %s baseline", (phone, ms) => {
    for (const stress of [1, 2]) {
      const target = materializePhonemeTarget(phone, { stress, inventorySpec });
      expect(target.duration).toBe(ms);
      expect(target.inherentDuration).toBe(ms);
    }
  });

  it("retains the separately modeled unstressed targets", () => {
    expect(materializePhonemeTarget("IY", { stress: 0, inventorySpec }).duration).toBe(70);
    expect(materializePhonemeTarget("IH", { stress: 0, inventorySpec }).duration).toBe(60);
  });

  it("carries the table source and baseline into the production utterance", () => {
    const { utterance } = textToKlattTrackDetailed("bead", 110);
    const vowel = utterance.segments.listItems().find((item) => item.get("phoneme") === "IY");
    expect(vowel?.get("inherentDuration")).toBe(207);
    expect(
      utterance.provenance.getDecisions().filter((d) => d.type === "inventory_selected"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          citations: expect.arrayContaining([
            expect.stringContaining("Peterson & Lehiste 1960 Table I"),
          ]),
        }),
      ]),
    );
  });
});
