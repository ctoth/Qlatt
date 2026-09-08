import { describe, expect, it } from "vitest";
import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../src/declarative-frontend/cel-expressions";

/**
 * #47: list construction and comprehension on the rule-engine CEL surface.
 *
 * cel-js already evaluates list literals and the CEL standard macros
 * (`map`, `filter`, `all`, `exists`, `exists_one`); the validator's function
 * whitelist rejected them, so a rule could not emit a phoneme sequence.
 * Results are deep-coerced so CEL ints inside lists become JS numbers.
 */
describe("rule-engine CEL list comprehension", () => {
  it("validates the CEL standard comprehension macros", () => {
    expect(validateExpressionSyntax("[1, 2, 3].map(x, x * 2)")).toBeNull();
    expect(validateExpressionSyntax("[1, 2, 3].filter(x, x > 1)")).toBeNull();
    expect(validateExpressionSyntax("[1, 2, 3].exists(x, x > 2)")).toBeNull();
    expect(validateExpressionSyntax("[1, 2, 3].all(x, x > 0)")).toBeNull();
    expect(validateExpressionSyntax("[1, 2, 3].exists_one(x, x == 2)")).toBeNull();
    expect(validateExpressionSyntax("current.daughters.map(d, d.phoneme)")).toBeNull();
  });

  it("maps and filters list literals to JS numbers", () => {
    expect(evaluateExpression("[1, 2, 3].map(x, x * 2)", {})).toEqual([2, 4, 6]);
    expect(evaluateExpression("[1, 2, 3].filter(x, x > 1)", {})).toEqual([2, 3]);
    expect(evaluateExpression("[1, 2, 3]", {})).toEqual([1, 2, 3]);
  });

  it("emits a phoneme sequence from a comprehension", () => {
    const ctx = { phones: ["AH", "T"], stress: "1" };
    expect(evaluateExpression("phones.map(p, p + stress)", ctx)).toEqual(["AH1", "T1"]);
    expect(evaluateExpression("phones.map(p, concat(p, stress))", ctx)).toEqual(["AH1", "T1"]);
  });

  it("evaluates the quantifier macros", () => {
    const ctx = { phones: ["AH1", "T", "IY0"] };
    expect(evaluateExpression("phones.exists(p, matches(p, '[12]$'))", ctx)).toBe(true);
    expect(evaluateExpression("phones.all(p, matches(p, '[12]$'))", ctx)).toBe(false);
    expect(evaluateExpression("phones.exists_one(p, matches(p, '1$'))", ctx)).toBe(true);
  });

  it("builds lists from context values and concatenates them", () => {
    const ctx = { a: "K", rest: ["AE1", "T"] };
    expect(evaluateExpression("[a] + rest", ctx)).toEqual(["K", "AE1", "T"]);
    expect(evaluateExpression("size([a] + rest)", ctx)).toBe(3);
  });
});
