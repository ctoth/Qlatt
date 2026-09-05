import { describe, expect, it } from "vitest";
import {
  loadInventorySpecFromPath,
  materializePhonemeTarget,
} from "../src/declarative-frontend/inventory";

// Load inventory from the qlatt-english frontend (no globals).
const INVENTORY = loadInventorySpecFromPath("/rules/frontends/qlatt-english/inventory.yaml");
const PHONEME_TARGETS = INVENTORY.phoneme_targets;
const BASE_PARAMS = INVENTORY.base_params;

describe("materializePhonemeTarget – stress-aware lookup", () => {
  it("returns AH1 inventory entry when stress is 1", () => {
    const result = materializePhonemeTarget("AH", { stress: 1, inventorySpec: INVENTORY });
    const ah1 = PHONEME_TARGETS["AH1"] as Record<string, unknown>;
    expect(result.phoneme).toBe("AH1");
    expect(result.params.F1).toBe(ah1.F1);
    expect(result.params.F2).toBe(ah1.F2);
    expect(result.params.AV).toBe(ah1.AV);
    expect(result.duration).toBe(ah1.dur);
    expect(result.type).toBe("vowel");
  });

  it("returns AH0 inventory entry when stress is 0", () => {
    const result = materializePhonemeTarget("AH", { stress: 0, inventorySpec: INVENTORY });
    const ah0 = PHONEME_TARGETS["AH0"] as Record<string, unknown>;
    expect(result.phoneme).toBe("AH0");
    expect(result.params.F1).toBe(ah0.F1);
    expect(result.params.F2).toBe(ah0.F2);
    expect(result.params.AV).toBe(ah0.AV);
    expect(result.duration).toBe(ah0.dur);
    expect(result.type).toBe("vowel");
  });

  it("falls back to stress-0 when stress is null", () => {
    const result = materializePhonemeTarget("AH", { stress: null, inventorySpec: INVENTORY });
    const ah0 = PHONEME_TARGETS["AH0"] as Record<string, unknown>;
    expect(result.phoneme).toBe("AH0");
    expect(result.params.F1).toBe(ah0.F1);
    expect(result.duration).toBe(ah0.dur);
  });

  it("falls back to stress-0 when stress is 2 (secondary)", () => {
    const result = materializePhonemeTarget("AH", { stress: 2, inventorySpec: INVENTORY });
    const ah0 = PHONEME_TARGETS["AH0"] as Record<string, unknown>;
    expect(result.phoneme).toBe("AH0");
    expect(result.params.F1).toBe(ah0.F1);
  });

  it("returns stop_closure params for P_CL", () => {
    const result = materializePhonemeTarget("P_CL", { inventorySpec: INVENTORY });
    const pcl = PHONEME_TARGETS["P_CL"] as Record<string, unknown>;
    expect(result.phoneme).toBe("P_CL");
    expect(result.type).toBe("stop_closure");
    expect(result.params.AV).toBe(pcl.AV);
    expect(result.duration).toBe(pcl.dur);
  });

  it("rejects an unknown phoneme instead of materializing SIL", () => {
    expect(() =>
      materializePhonemeTarget("NONEXISTENT", { inventorySpec: INVENTORY }),
    ).toThrowError(/E_INVENTORY_PHONEME_UNKNOWN.*NONEXISTENT/);
  });

  it("materializes normalization aliases through their declared inventory target", () => {
    const result = materializePhonemeTarget("AX", { stress: 1, inventorySpec: INVENTORY });
    const silence = PHONEME_TARGETS.SIL as Record<string, unknown>;

    expect(result.phoneme).toBe("AX");
    expect(result.params.F1).toBe(BASE_PARAMS.F1);
    expect(result.duration).toBe(silence.dur);
    expect(result.type).toBe("silence");
  });

  it("returns S params regardless of stress option", () => {
    const withStress = materializePhonemeTarget("S", { stress: 1, inventorySpec: INVENTORY });
    const withoutStress = materializePhonemeTarget("S", { inventorySpec: INVENTORY });
    const sTarget = PHONEME_TARGETS["S"] as Record<string, unknown>;
    expect(withStress.phoneme).toBe("S");
    expect(withStress.params.AF).toBe(sTarget.AF);
    expect(withoutStress.phoneme).toBe("S");
    expect(withoutStress.params.AF).toBe(sTarget.AF);
    // Both should produce the same params
    expect(withStress.params).toEqual(withoutStress.params);
  });

  it("preserves boolean flags from inventory entry", () => {
    const result = materializePhonemeTarget("S", { inventorySpec: INVENTORY });
    expect(result.voiceless).toBe(true);
    // S has alveolar: true in inventory
    expect((result as Record<string, unknown>).alveolar).toBe(true);
  });

  it("maps SW to inventorySW", () => {
    // SIL has no SW, but let's check a phoneme that does if any
    // Check S: no explicit SW, so inventorySW should not be present
    const sResult = materializePhonemeTarget("S", { inventorySpec: INVENTORY });
    // S has SW in the defaults (0), but not in the target, so inventorySW comes from target only
    expect(sResult.inventorySW).toBeUndefined();
  });

  it("returns inherentDuration matching dur field", () => {
    const result = materializePhonemeTarget("AH", { stress: 1, inventorySpec: INVENTORY });
    const ah1 = PHONEME_TARGETS["AH1"] as Record<string, unknown>;
    expect(result.inherentDuration).toBe(ah1.dur);
  });

  it("has all params as finite numbers", () => {
    const result = materializePhonemeTarget("AH", { stress: 1, inventorySpec: INVENTORY });
    for (const [_key, value] of Object.entries(result.params)) {
      expect(Number.isFinite(value)).toBe(true);
    }
    // Verify param keys match BASE_PARAMS
    expect(Object.keys(result.params).sort()).toEqual(Object.keys(BASE_PARAMS).sort());
  });

  it("direct lookup with inventorySpec behaves as before", () => {
    const directResult = materializePhonemeTarget("AH1", { inventorySpec: INVENTORY });
    const ah1 = PHONEME_TARGETS["AH1"] as Record<string, unknown>;
    expect(directResult.phoneme).toBe("AH1");
    expect(directResult.params.F1).toBe(ah1.F1);
  });

  it("materializePhonemeTarget passes through dac property", () => {
    // DAC (Degree of Articulatory Constraint) is a numeric, non-BASE_PARAMS property.
    // It must survive materialization to be available in the rule engine.
    // Citations: Recasens 1997, Volenec 2015
    const sResult = materializePhonemeTarget("S", { stress: null, inventorySpec: INVENTORY });
    expect((sResult as Record<string, unknown>).dac).toBe(2);

    const iyResult = materializePhonemeTarget("IY", { stress: 1, inventorySpec: INVENTORY });
    expect((iyResult as Record<string, unknown>).dac).toBe(3);

    const mResult = materializePhonemeTarget("M", { stress: null, inventorySpec: INVENTORY });
    expect((mResult as Record<string, unknown>).dac).toBe(1);

    // SIL should have no dac
    const silResult = materializePhonemeTarget("SIL", { inventorySpec: INVENTORY });
    expect((silResult as Record<string, unknown>).dac).toBeUndefined();
  });

  it("stress-aware lookup with IY vowel", () => {
    const result1 = materializePhonemeTarget("IY", { stress: 1, inventorySpec: INVENTORY });
    const iy1 = PHONEME_TARGETS["IY1"] as Record<string, unknown>;
    expect(result1.phoneme).toBe("IY1");
    expect(result1.params.F1).toBe(iy1.F1);
    expect(result1.hi).toBe(true);
    expect(result1.front).toBe(true);

    const result0 = materializePhonemeTarget("IY", { stress: 0, inventorySpec: INVENTORY });
    const iy0 = PHONEME_TARGETS["IY0"] as Record<string, unknown>;
    expect(result0.phoneme).toBe("IY0");
    expect(result0.params.F1).toBe(iy0.F1);
  });

  it("preserves declarative array/object metadata from inventory entries", () => {
    const customInventory = {
      base_params: { F1: 500, AV: 0 },
      phoneme_targets: {
        SIL: { dur: 30, type: "silence" },
        AY1: {
          F1: 700,
          AV: 60,
          dur: 100,
          type: "vowel",
          diph: ["AA1", "IH1"],
          trajectory: {
            F1: [
              { value: 700, time: 0 },
              { value: 320, time: 64 },
            ],
          },
        },
      },
    };

    const result = materializePhonemeTarget("AY1", { inventorySpec: customInventory });
    expect((result as Record<string, unknown>).diph).toEqual(["AA1", "IH1"]);
    expect((result as Record<string, unknown>).trajectory).toEqual({
      F1: [
        { value: 700, time: 0 },
        { value: 320, time: 64 },
      ],
    });
  });
});
