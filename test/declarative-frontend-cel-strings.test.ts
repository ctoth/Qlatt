import { describe, expect, it } from "vitest";
import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../src/declarative-frontend/cel-expressions";

/**
 * #47: the minimal string set on the rule-engine CEL surface.
 *
 * Before this, `lower()` was the only string operation, so allomorph and
 * normalization policy that needs to split, slice, join, or pattern-match
 * orthography stayed in TypeScript. cel-js already evaluates the CEL
 * standard receiver-style methods (`s.matches(re)`, `s.substring(a, b)`,
 * `s.split(sep)`); the validator's function whitelist was the only gate.
 */
describe("rule-engine CEL string builtins", () => {
  it("split divides a string on a separator", () => {
    expect(evaluateExpression("split('a-b-c', '-')", {})).toEqual(["a", "b", "c"]);
    expect(evaluateExpression("split(w, '')", { w: "abc" })).toEqual(["a", "b", "c"]);
    expect(evaluateExpression("split('abc', '-')", {})).toEqual(["abc"]);
  });

  it("substring slices by code-unit index with an optional end", () => {
    expect(evaluateExpression("substring('hello', 1, 3)", {})).toBe("el");
    expect(evaluateExpression("substring('hello', 2)", {})).toBe("llo");
    expect(evaluateExpression("substring(w, 0, 1)", { w: "AH1" })).toBe("A");
  });

  it("concat joins string forms and concatenates lists", () => {
    expect(evaluateExpression("concat('a', 'b')", {})).toBe("ab");
    expect(evaluateExpression("concat('a', 'b', 'c')", {})).toBe("abc");
    expect(evaluateExpression("concat('AH', 1)", {})).toBe("AH1");
    expect(evaluateExpression("concat(['a'], ['b', 'c'])", {})).toEqual(["a", "b", "c"]);
  });

  it("matches tests a string against a regular expression", () => {
    expect(evaluateExpression("matches('AH1', '^[A-Z]+[0-2]$')", {})).toBe(true);
    expect(evaluateExpression("matches('AH', '^[A-Z]+[0-2]$')", {})).toBe(false);
    expect(evaluateExpression("matches(w, 'ing$')", { w: "walking" })).toBe(true);
  });

  it("accepts the CEL receiver-style string methods", () => {
    expect(validateExpressionSyntax("current.word.matches('ing$')")).toBeNull();
    expect(validateExpressionSyntax("current.word.substring(1, 3)")).toBeNull();
    expect(validateExpressionSyntax("current.word.split('-')")).toBeNull();
    expect(validateExpressionSyntax("current.word.startsWith('un')")).toBeNull();
    expect(validateExpressionSyntax("current.word.endsWith('ly')")).toBeNull();
    expect(validateExpressionSyntax("['a', 'b'].join('-')")).toBeNull();
    expect(evaluateExpression("w.matches('ing$')", { w: "walking" })).toBe(true);
    expect(evaluateExpression("w.substring(1, 3)", { w: "hello" })).toBe("el");
    expect(evaluateExpression("['a', 'b'].join('-')", {})).toBe("a-b");
  });

  it("passes function-surface validation for the function-style forms", () => {
    expect(validateExpressionSyntax("split(current.word, '-')")).toBeNull();
    expect(validateExpressionSyntax("substring(current.word, 1)")).toBeNull();
    expect(validateExpressionSyntax("substring(current.word, 1, 2)")).toBeNull();
    expect(validateExpressionSyntax("concat(current.word, 'ing')")).toBeNull();
    expect(validateExpressionSyntax("matches(current.word, '^un')")).toBeNull();
  });
});
