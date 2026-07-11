import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

describe("declarative frontend CEL expressions", () => {
  it("evaluates CEL where and value expressions with params", () => {
    const spec = {
      parameters: { enabled: true, mul: 1.5, add: 10 },
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
      },
      rules: {
        scale_and_add: {
          select: {
            relation: "phone",
            where: "current.type == 'vowel' && params.enabled == true",
          },
          apply: [
            {
              field: "duration",
              op: "set",
              value: "current.duration * params.mul + params.add",
              tag: "cel",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["scale_and_add"] }],
    };

    const input = [
      { relation: "phone", type: "vowel", duration: 100, status: 1 },
      { relation: "phone", type: "stop", duration: 80, status: 1 },
    ];
    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;

    expect(out[0].duration).toBe(160);
    expect(out[1].duration).toBe(80);
  });

  it("emits E_CEL_INVALID for malformed expressions", () => {
    const spec = parseDslSpec({
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: {} },
        },
      },
      rules: {
        bad: {
          select: { relation: "phone", where: "current.type ==" },
          apply: [{ field: "duration", op: "add", value: "1", tag: "x" }],
        },
      },
      phases: [{ name: "duration", rules: ["bad"] }],
    });

    const diagnostics = validateDslSpec(spec);
    expect(diagnostics.some((d) => d.code === "E_CEL_INVALID")).toBe(true);
  });

  it("evaluates rule-level define bindings once per firing", () => {
    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
      },
      rules: {
        use_define: {
          select: {
            relation: "phone",
            where: "current.type == 'stop'",
          },
          define: {
            rel: "current.phoneme == 'K_CL' ? 'K_REL' : 'T_REL'",
            t: "target(rel)",
          },
          apply: [
            {
              field: "duration",
              op: "set",
              value: "t.duration",
              tag: "define",
            },
            {
              field: "params.AF",
              op: "set",
              value: "t.params.AF",
              tag: "define",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["use_define"] }],
    };

    const input = [{ relation: "phone", type: "stop", phoneme: "K_CL", duration: 80, params: {}, status: 1 }];
    const out = runRuleEngine(input, compileRuleEngineSpec(spec), {
      inventoryResolver: (phoneme) => {
        if (phoneme !== "K_REL") return null;
        return { phoneme: "K_REL", duration: 35, params: { AF: 47 } };
      },
    }).sequence;

    expect(out[0].duration).toBe(35);
    expect(out[0].params.AF).toBe(47);
  });

  it("counts phones in the current SIL-delimited clause", () => {
    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop", "silence"] },
          scalars: { whole: {}, clause: {} },
        },
      },
      rules: {
        count_scope: {
          select: {
            relation: "phone",
            where: "current.phoneme != 'SIL'",
          },
          apply: [
            { field: "whole", op: "set", value: "phone_count()", tag: "count" },
            { field: "clause", op: "set", value: "clause_phone_count()", tag: "count" },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["count_scope"] }],
    };

    const input = [
      { relation: "phone", phoneme: "R", type: "stop", status: 1 },
      { relation: "phone", phoneme: "EH", type: "vowel", status: 1 },
      { relation: "phone", phoneme: "D", type: "stop", status: 1 },
      { relation: "phone", phoneme: "SIL", type: "silence", status: 1 },
      { relation: "phone", phoneme: "B", type: "stop", status: 1 },
      { relation: "phone", phoneme: "L", type: "stop", status: 1 },
      { relation: "phone", phoneme: "UW", type: "vowel", status: 1 },
      { relation: "phone", phoneme: "SIL", type: "silence", status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;

    expect(out[0].whole).toBe(6);
    expect(out[0].clause).toBe(3);
    expect(out[4].whole).toBe(6);
    expect(out[4].clause).toBe(3);
    expect(out[3].clause).toBeUndefined();
  });
});
