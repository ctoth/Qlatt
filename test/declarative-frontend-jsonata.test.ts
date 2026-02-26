import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";

describe("declarative frontend CEL expressions", () => {
  it("evaluates CEL where and value expressions with params", () => {
    const spec = {
      parameters: { enabled: true, mul: 1.5, add: 10 },
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        scale_and_add: {
          select: {
            stream: "phone",
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
      { stream: "phone", type: "vowel", duration: 100, status: 1 },
      { stream: "phone", type: "stop", duration: 80, status: 1 },
    ];
    const out = runRuleEngine(input, spec).sequence;

    expect(out[0].duration).toBe(160);
    expect(out[1].duration).toBe(80);
  });

  it("emits E_CEL_INVALID for malformed expressions", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad: {
          select: { stream: "phone", where: "current.type ==" },
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
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        use_define: {
          select: {
            stream: "phone",
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

    const input = [{ stream: "phone", type: "stop", phoneme: "K_CL", duration: 80, params: {}, status: 1 }];
    const out = runRuleEngine(input, spec, {
      inventoryResolver: (phoneme) => {
        if (phoneme !== "K_REL") return null;
        return { phoneme: "K_REL", duration: 35, params: { AF: 47 } };
      },
    }).sequence;

    expect(out[0].duration).toBe(35);
    expect(out[0].params.AF).toBe(47);
  });
});
