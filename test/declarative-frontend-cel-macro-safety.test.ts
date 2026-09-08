import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";
import { expandCelMacros, parseCelMacroBlock } from "../src/declarative-frontend/cel-macros";
import { parseDslSpec } from "../src/declarative-frontend/parser";

describe("CEL macro and builtin boundaries", () => {
  it("expands calls after a ternary question mark", () => {
    const macros = parseCelMacroBlock({ twice: { params: ["x"], body: "x * 2" } });
    expect(evaluateExpression(expandCelMacros("true ? twice(3) : 0", macros), {})).toBe(6);
  });

  it("leaves literal data intact and carries called macro citations into rules", () => {
    const spec = parseDslSpec({
      functions: {
        half: { params: ["x"], body: "x / 2", citations: ["Macro source"] },
        quarter: { params: ["x"], body: "half(half(x))" },
      },
      string_sets: { examples: ["quarter(8)"] },
      parameters: { label: "quarter(8)" },
      rules: {
        scale: {
          description: "quarter(8)",
          define: { amount: "quarter(8)" },
          citations: ["Rule source"],
        },
      },
    });
    expect(spec.string_sets).toEqual({ examples: ["quarter(8)"] });
    expect(spec.parameters).toEqual({ label: "quarter(8)" });
    expect(spec.rules.scale.description).toBe("quarter(8)");
    expect(spec.rules.scale.citations).toEqual(["Rule source", "Macro source"]);
  });

  it("rejects binder macros instead of capturing the caller's variables", () => {
    expect(() =>
      parseCelMacroBlock({
        add: { params: ["value"], body: "[1].map(x, x + value)" },
      }),
    ).toThrow(/E_RULEPACK_FUNCTIONS.*comprehension/);
  });

  it("does not expose inherited fields through get", () => {
    expect(evaluateExpression("get(obj, 'constructor', 5)", { obj: {} })).toBe(5);
  });

  it("rejects nonnumeric arguments consistently with the semantics surface", () => {
    expect(() => evaluateExpression("floor('2')", {})).toThrow();
    expect(() => evaluateExpression("floor(x)", { x: Infinity })).toThrow();
  });

  it("preserves a small remainder with a large positive divisor", () => {
    expect(evaluateExpression("mod(1.0, 1e20)", {})).toBe(1);
  });
});
