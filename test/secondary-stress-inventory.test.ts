import { expect, it } from "vitest";
import {
  type InventorySpec,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";

const inventory: InventorySpec = {
  base_params: { F1: 500 },
  phoneme_targets: {
    AH0: { type: "vowel", F1: 300 },
    AH1: { type: "vowel", F1: 600 },
    AH2: { type: "vowel", F1: 450 },
  },
};
it("selects an explicit secondary-stress target", () => {
  expect(materializePhonemeTarget("AH", { stress: 2, inventorySpec: inventory })).toMatchObject({
    phoneme: "AH2",
    params: { F1: 450 },
  });
});
it("requires a declared realization policy when the secondary target is missing", () => {
  const { AH2: _secondary, ...targets } = inventory.phoneme_targets;
  expect(() =>
    materializePhonemeTarget("AH", {
      stress: 2,
      inventorySpec: { ...inventory, phoneme_targets: targets },
    }),
  ).toThrow(/E_STRESS_TARGET/);
});
it.each([0, 1] as const)(
  "honors the explicitly cited secondary realization target %s",
  (target) => {
    const { AH2: _secondary, ...targets } = inventory.phoneme_targets;
    const selected = materializePhonemeTarget("AH", {
      stress: 2,
      inventorySpec: {
        ...inventory,
        phoneme_targets: targets,
        secondary_stress_fallback: {
          target,
          citations: ["engineering estimate: fixture realization choice"],
        },
      },
    });
    expect(selected.phoneme).toBe(`AH${target}`);
    expect(selected.params.F1).toBe(target === 0 ? 300 : 600);
  },
);
