import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine.js";
import { parseDslSpec } from "../src/declarative-frontend/parser.js";
import { validateDslSpec } from "../src/declarative-frontend/validation.js";

describe("declarative frontend JSONata expressions", () => {
  it("evaluates JSONata where and value expressions with params", () => {
    const spec = {
      parameters: { enabled: true, mul: 1.5, add: 10 },
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        scale_and_add: {
          select: {
            stream: "phone",
            where: "current.type = 'vowel' and params.enabled = true",
          },
          apply: [
            {
              field: "duration",
              op: "set",
              value: "current.duration * params.mul + params.add",
              tag: "jsonata",
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

  it("emits E_JSONATA_INVALID for malformed expressions", () => {
    const spec = parseDslSpec({
      streams: { phone: { type: "base", scalars: { duration: {} } } },
      rules: {
        bad: {
          select: { stream: "phone", where: "current.type = " },
          apply: [{ field: "duration", op: "add", value: "1", tag: "x" }],
        },
      },
      phases: [{ name: "duration", rules: ["bad"] }],
    });

    const diagnostics = validateDslSpec(spec);
    expect(diagnostics.some((d) => d.code === "E_JSONATA_INVALID")).toBe(true);
  });
});

