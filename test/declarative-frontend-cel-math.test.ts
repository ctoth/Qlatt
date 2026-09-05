import { describe, expect, it } from "vitest";
import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../src/declarative-frontend/cel-expressions";

/**
 * #47: rounding and modulo on the rule-engine CEL surface.
 *
 * Without `floor`/`ceil`/`round`/`mod`, digit extraction and clock arithmetic
 * cannot be written in YAML, so that policy stays in TypeScript. The
 * normative definitions live in docs/host-contract.md section 4.
 */
describe("rule-engine CEL rounding builtins", () => {
  it("floor rounds toward negative infinity", () => {
    expect(evaluateExpression("floor(3.7)", {})).toBe(3);
    expect(evaluateExpression("floor(-3.2)", {})).toBe(-4);
    expect(evaluateExpression("floor(x)", { x: 5.999 })).toBe(5);
  });

  it("ceil rounds toward positive infinity", () => {
    expect(evaluateExpression("ceil(3.2)", {})).toBe(4);
    expect(evaluateExpression("ceil(-3.7)", {})).toBe(-3);
  });

  it("round rounds half away from zero (Fortran NINT / C round)", () => {
    expect(evaluateExpression("round(2.5)", {})).toBe(3);
    expect(evaluateExpression("round(-2.5)", {})).toBe(-3);
    expect(evaluateExpression("round(2.4)", {})).toBe(2);
    expect(evaluateExpression("round(-2.4)", {})).toBe(-2);
    expect(evaluateExpression("round(0.5)", {})).toBe(1);
  });

  it("accepts CEL int literals and returns JS numbers", () => {
    const floored = evaluateExpression("floor(3)", {});
    expect(floored).toBe(3);
    expect(typeof floored).toBe("number");
    expect(typeof evaluateExpression("round(7)", {})).toBe("number");
  });

  it("mod is the floored modulo (result takes the sign of the divisor)", () => {
    expect(evaluateExpression("mod(7, 3)", {})).toBe(1);
    expect(evaluateExpression("mod(-7, 3)", {})).toBe(2);
    expect(evaluateExpression("mod(7, -3)", {})).toBe(-2);
    expect(evaluateExpression("mod(7.5, 2)", {})).toBe(1.5);
    expect(evaluateExpression("mod(x, 12)", { x: 23 })).toBe(11);
  });

  it("mod rejects a zero divisor", () => {
    expect(() => evaluateExpression("mod(7, 0)", {})).toThrow(/mod.*zero/);
  });

  it("supports the % operator on two doubles", () => {
    expect(evaluateExpression("7.5 % 2.0", {})).toBe(1.5);
    expect(evaluateExpression("x % y", { x: 7.5, y: 2 })).toBe(1.5);
  });

  it("expresses digit extraction and clock arithmetic", () => {
    expect(evaluateExpression("mod(floor(n / 10), 10)", { n: 1234 })).toBe(3);
    expect(evaluateExpression("mod(hour + 5, 12)", { hour: 9 })).toBe(2);
  });

  it("passes function-surface validation", () => {
    expect(validateExpressionSyntax("floor(current.duration)")).toBeNull();
    expect(validateExpressionSyntax("ceil(current.duration)")).toBeNull();
    expect(validateExpressionSyntax("round(current.duration)")).toBeNull();
    expect(validateExpressionSyntax("mod(current.duration, 10)")).toBeNull();
  });
});
