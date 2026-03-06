import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";
import { qlattInventoryResolver } from "./utils/qlatt-english-inventory";

describe("declarative frontend first migration slice", () => {
  it("applies structural stop release insertion via declarative engine", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 1, word: "pat", type: "stop_closure" },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel" },
      { phoneme: "T_CL", stress: null, word: "pat", type: "stop_closure" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const phones = out.filter((t) => t.status !== 2).map((t) => t.phoneme);

    expect(phones).toEqual(["P_CL", "P_REL", "P_ASP", "AE", "T_CL", "T_REL", "T_ASP", "SIL"]);
    const weakRelease = out.find((t) => t.phoneme === "T_REL");
    const weakAsp = out.find((t) => t.phoneme === "T_ASP");
    expect(weakRelease?.weak).toBe(true);
    expect(weakAsp?.weak).toBe(true);
  });

  it("inserts release but no aspiration for voiced stop closures", () => {
    const sequence = [
      { phoneme: "B_CL", stress: 1, word: "bad", type: "stop_closure" },
      { phoneme: "AE", stress: 1, word: "bad", type: "vowel" },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence" },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const phones = out.filter((t) => t.status !== 2).map((t) => t.phoneme);

    expect(phones).toEqual(["B_CL", "B_REL", "AE", "SIL"]);
    expect(out.some((t) => t.phoneme === "B_ASP")).toBe(false);
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
    // AE before voiceless stop: gets vowel_before_voiceless_stop_shortening (-15ms additive)
    expect(out[0].duration).toBe(80);
    // IY (stress=0): stress_duration(mul 0.8) → vowel_shortening(mul 1.2, next=SIL)
    // With Klatt floor=50.4: 0.8*(120-50.4)+50.4=106, then 1.2*(106-50.4)+50.4=117
    // Pre-boundary lengthening requires breakIndex (not set on these tokens) → factor=1.
    expect(out[2].duration).toBe(117);
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
    // AE (stress=1): stress_duration(mul 1.3) → vowel_shortening(mul 1.2, next=SIL skipping suppressed IY)
    // With Klatt floor=42: 1.3*(100-42)+42=117, then 1.2*(117-42)+42=132
    // Pre-boundary lengthening requires breakIndex (not set on these tokens) → factor=1.
    expect(out[0].duration).toBe(132);
    expect(out[1].duration).toBe(100);
  });

  it("ignores suppressed tokens for structural insertion", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 1, word: "pat", type: "stop_closure", status: 2 },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel", status: 1 },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence", status: 1 },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const phones = out.filter((t) => t.status !== 2).map((t) => t.phoneme);
    expect(phones).toEqual(["AE", "SIL"]);
  });

  it("materializes inserted release targets during structural phase", () => {
    const sequence = [
      { phoneme: "K_CL", stress: 1, word: "back", type: "stop_closure", status: 1 },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence", status: 1 },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
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
    // Weak phrase-final aspiration duration is derived from VOT split and weak scaling.
    expect(asp?.duration).toBeCloseTo(26.301369863013697);
    expect(asp?.params?.AH).toBe(43);
  });

  it("initializes sync marks on base stream tokens during structural phase", () => {
    const sequence = [
      { phoneme: "P_CL", stress: 1, word: "pat", type: "stop_closure", status: 1 },
      { phoneme: "AE", stress: 1, word: "pat", type: "vowel", status: 1 },
      { phoneme: "SIL", punctuationSymbol: ".", word: ".", type: "silence", status: 1 },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["structural"], inventoryResolver: qlattInventoryResolver });
    const phones = out.filter((token) => (token.stream ?? "phone") === "phone");
    expect(phones.length).toBeGreaterThan(0);
    expect(
      phones.every(
        (token) => token.sync_left != null && token.sync_right != null
      )
    ).toBe(true);
    expect(phones[0]?.sync_left?.kind).toBe("START");
    expect(phones[phones.length - 1]?.sync_right?.kind).toBe("END");
  });

  it("lets set write structured values to non-scalar fields", () => {
    const out = runDeclarativeFrontend(
      [
        {
          phoneme: "M",
          type: "nasal",
          duration: 80,
          inherentDuration: 80,
          params: {},
        },
      ],
      {
        specSource: {
          version: "v1",
          streams: {
            phone: {
              type: "base",
              scalars: { duration: { unit: "ms", resolution: "klatt" } },
            },
          },
          rules: {
            structured_set: {
              select: { stream: "phone", where: "true" },
              apply: [
                {
                  field: "control_windows",
                  op: "set",
                  value: [
                    {
                      target: "'current'",
                      prefix_ms: 20,
                      fields: {
                        nasalCoupling: { op: "'set'", value: "0.5" },
                      },
                    },
                  ],
                },
              ],
            },
          },
          phases: [{ name: "formant", rules: ["structured_set"] }],
        },
        phases: ["formant"],
      }
    );

    expect(out[0].control_windows).toEqual([
      {
        target: "current",
        prefix_ms: 20,
        fields: {
          nasalCoupling: { op: "set", value: 0.5 },
        },
      },
    ]);
  });
});
