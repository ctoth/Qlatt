import { describe, expect, it } from "vitest";
import { createCelEvaluator } from "../../src/semantics/cel-evaluator";
import type { ParamValue } from "../../src/semantics/types";

describe("CEL Evaluator", () => {
  it("evaluates simple math", () => {
    const evaluator = createCelEvaluator();
    expect(evaluator.evaluate("2 + 3", { params: {}, constants: {} })).toBe(5);
  });

  it("evaluates ternary", () => {
    const evaluator = createCelEvaluator();
    expect(evaluator.evaluate("x > 0 ? x : 0", { params: { x: 5 }, constants: {} })).toBe(5);
    expect(evaluator.evaluate("x > 0 ? x : 0", { params: { x: -5 }, constants: {} })).toBe(0);
  });

  it("calls registered functions", () => {
    const evaluator = createCelEvaluator();
    // Note: "double" is a CEL builtin (type cast); use a custom name instead
    evaluator.registerFunction("dbToLinear", (...args: ParamValue[]) => {
      const x = args[0];
      if (typeof x !== "number" || !Number.isFinite(x)) {
        throw new Error("dbToLinear expects a finite number");
      }
      return x * 2;
    });
    expect(evaluator.evaluate("dbToLinear(5)", { params: {}, constants: {} })).toBe(10);
  });
});
