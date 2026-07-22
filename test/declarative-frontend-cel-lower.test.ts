import { describe, it, expect } from "vitest";
import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../src/declarative-frontend/cel-expressions";

/**
 * Phase 5.3 Stage 2: the `lower(x)` case-folding accessor.
 *
 * `markFunctionWords` stores `word` un-lowercased and the accent policy folds
 * both the list and the key before membership testing. Porting that pass to a
 * declarative rule needs the same fold on the CEL surface so that
 * `lower(current.word) in sets.function_words` is byte-identical to the
 * imperative lookup.
 */
describe("lower CEL accessor", () => {
  it("folds a string to lower case", () => {
    expect(evaluateExpression("lower(w)", { w: "The" })).toBe("the");
    expect(evaluateExpression("lower(w)", { w: "DON'T" })).toBe("don't");
    expect(evaluateExpression("lower(w)", { w: "already" })).toBe("already");
  });

  it("is idempotent on already-lower strings and empty strings", () => {
    expect(evaluateExpression("lower(w)", { w: "" })).toBe("");
    expect(evaluateExpression("lower(w)", { w: "cake" })).toBe("cake");
  });

  it("supports membership against a declared set (function-word lookup)", () => {
    const ctx = { current: { word: "The" }, sets: { function_words: ["the", "a", "of"] } };
    expect(evaluateExpression("lower(current.word) in sets.function_words", ctx)).toBe(true);
    const ctx2 = { current: { word: "Cake" }, sets: { function_words: ["the", "a", "of"] } };
    expect(evaluateExpression("lower(current.word) in sets.function_words", ctx2)).toBe(false);
  });

  it("passes function-surface validation (whitelisted)", () => {
    expect(validateExpressionSyntax("lower(current.word)")).toBeNull();
  });
});
