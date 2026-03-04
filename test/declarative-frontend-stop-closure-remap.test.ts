import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { qlattInventoryResolver } from "./utils/qlatt-english-inventory";

function getActivePhoneTokens(result: Record<string, unknown>[]) {
  return result
    .filter((t) => (t.stream === "phone" || t.stream == null) && t.status !== 2)
    .map((t) => ({ phoneme: t.phoneme, type: t.type }));
}

describe("remap_stops_to_closures structural rule", () => {
  it("remaps P to P_CL with stop_closure params", () => {
    const sequence = [
      { phoneme: "P", stress: 0, word: "pat", type: "stop" },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const active = getActivePhoneTokens(out);
    // P should become P_CL (stop_closure), and then stop release/aspiration rules fire too
    const closure = active.find((t) => t.phoneme === "P_CL");
    expect(closure).toBeTruthy();
    expect(closure?.type).toBe("stop_closure");
    // Original P should not appear in active tokens
    const bareP = active.find((t) => t.phoneme === "P");
    expect(bareP).toBeUndefined();
  });

  it("remaps all 6 voiceless and voiced stops", () => {
    const stops = ["P", "T", "K", "B", "D", "G"];
    for (const stop of stops) {
      const sequence = [
        { phoneme: stop, stress: 0, word: "test", type: "stop" },
        { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
      ];

      const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
      const active = out.filter((t) => t.status !== 2);
      const closure = active.find((t) => t.phoneme === `${stop}_CL`);
      expect(closure, `${stop} should be remapped to ${stop}_CL`).toBeTruthy();
      expect(closure?.type).toBe("stop_closure");
      const bare = active.find((t) => t.phoneme === stop);
      expect(bare, `bare ${stop} should not remain in active tokens`).toBeUndefined();
    }
  });

  it("leaves vowels unaffected", () => {
    const sequence = [
      { phoneme: "AE", stress: 1, word: "at", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const active = getActivePhoneTokens(out);
    const vowel = active.find((t) => t.phoneme === "AE");
    expect(vowel).toBeTruthy();
    expect(vowel?.type).toBe("vowel");
  });

  it("does not double-remap P_CL (idempotency)", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 0, word: "pat", type: "stop_closure" },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const active = out.filter((t) => t.status !== 2);
    // P_CL should still be present
    const closure = active.find((t) => t.phoneme === "P_CL");
    expect(closure).toBeTruthy();
    expect(closure?.type).toBe("stop_closure");
    // There should be no P_CL_CL
    const doubleClosure = active.find((t) => t.phoneme === "P_CL_CL");
    expect(doubleClosure).toBeUndefined();
  });

  it("preserves word and stress metadata through remapping", () => {
    const sequence = [
      { phoneme: "T", stress: 1, word: "tap", type: "stop" },
      { phoneme: "AE", stress: 1, word: "tap", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const active = out.filter((t) => t.status !== 2);
    const closure = active.find((t) => t.phoneme === "T_CL");
    expect(closure).toBeTruthy();
    expect(closure?.word).toBe("tap");
    expect(closure?.stress).toBe(1);
  });
});
