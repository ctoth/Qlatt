import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend/adapter.js";
import { parseDslSpec } from "../src/declarative-frontend/parser.js";
import { validateDslSpec } from "../src/declarative-frontend/validation.js";

describe("declarative frontend first migration slice", () => {
  it("applies structural stop release insertion via declarative engine", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 1, word: "pat", type: "stop_closure" },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel" },
      { phoneme: "T_CL", stress: null, word: "pat", type: "stop_closure" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"] });
    const phones = out.map((t) => t.phoneme);

    expect(phones).toEqual(["P_CL", "P_REL", "P_ASP", "AE", "T_CL", "T_REL", "T_ASP", "SIL"]);
    const weakRelease = out.find((t) => t.phoneme === "T_REL");
    const weakAsp = out.find((t) => t.phoneme === "T_ASP");
    expect(weakRelease?.weak).toBe(true);
    expect(weakAsp?.weak).toBe(true);
  });

  it("applies duration rules in declared order", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        inherentDuration: 100,
        word: "cat",
      },
      {
        phoneme: "K_CL",
        type: "stop_closure",
        voiceless: true,
        duration: 80,
        inherentDuration: 80,
        word: "cat",
      },
      {
        phoneme: "IY",
        type: "vowel",
        stress: 0,
        duration: 120,
        inherentDuration: 120,
        word: "see",
      },
      {
        phoneme: "SIL",
        type: "silence",
        punctuationSymbol: ".",
        duration: 100,
        inherentDuration: 100,
        word: ".",
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(95);
    expect(out[2].duration).toBe(144);
  });

  it("parses and validates phase/rule links", () => {
    const spec = parseDslSpec({
      phases: [{ name: "a", rules: ["known", "missing"] }],
      rules: { known: { op: "noop" } },
    });
    const diagnostics = validateDslSpec(spec);
    expect(diagnostics.some((d) => d.code === "E_RULE_UNKNOWN")).toBe(true);
  });

  it("applies duration rules only to ACTIVE tokens", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        inherentDuration: 100,
        status: 1,
      },
      {
        phoneme: "IY",
        type: "vowel",
        stress: 1,
        duration: 100,
        inherentDuration: 100,
        status: 2,
      },
      {
        phoneme: "SIL",
        type: "silence",
        punctuationSymbol: ".",
        duration: 100,
        inherentDuration: 100,
        status: 1,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(168);
    expect(out[1].duration).toBe(100);
  });

  it("ignores suppressed tokens for structural insertion", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 1, word: "pat", type: "stop_closure", status: 2 },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel", status: 1 },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence", status: 1 },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"] });
    const phones = out.map((t) => t.phoneme);
    expect(phones).toEqual(["P_CL", "AE", "SIL"]);
  });

  it("materializes inserted release targets during structural phase", () => {
    const sequence = [
      { phoneme: "K_CL", stress: 1, word: "back", type: "stop_closure", status: 1 },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence", status: 1 },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"] });
    const rel = out.find((t) => t.phoneme === "K_REL");
    const asp = out.find((t) => t.phoneme === "K_ASP");

    expect(rel).toBeDefined();
    expect(asp).toBeDefined();

    expect(rel?.params).toBeDefined();
    expect(rel?.type).toBe("stop_release");
    expect(rel?.inventorySW).toBe(1);
    expect(rel?.weak).toBe(true);
    expect(rel?.duration).toBe(15);
    expect(rel?.params?.AF).toBe(45);
    expect(rel?.params?.AH).toBe(43);

    expect(asp?.params).toBeDefined();
    expect(asp?.type).toBe("stop_aspiration");
    expect(asp?.weak).toBe(true);
    expect(asp?.duration).toBe(24);
    expect(asp?.params?.AH).toBe(43);
  });
});
