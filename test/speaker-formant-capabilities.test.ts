import { describe, expect, it, vi } from "vitest";
import * as inventory from "../src/declarative-frontend/inventory";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

describe("speaker formant capabilities", () => {
  it("carries the speaker scale to F11 declared by the active frontend inventory", () => {
    const resources = inventory.loadFrontendResources(QLATT_ENGLISH_RULEPACK);
    const extendedResources = {
      ...resources,
      inventory: {
        ...resources.inventory,
        base_params: { ...resources.inventory.base_params, F11: 11000 },
      },
    };
    const resourceSpy = vi
      .spyOn(inventory, "loadFrontendResources")
      .mockReturnValue(extendedResources);
    try {
      const result = textToKlattTrackDetailed("hello", 110, 30, {
        speaker: { formant_scale: 1.2 },
      });
      const segments = result.utterance
        .relation("Segment")
        .listItems()
        .filter((item) => item.get("active") !== false);
      expect(segments.length).toBeGreaterThan(0);
      for (const segment of segments) {
        expect(segment.get("F11")).toBeCloseTo(13200, 6);
      }
    } finally {
      resourceSpy.mockRestore();
    }
  });
});
