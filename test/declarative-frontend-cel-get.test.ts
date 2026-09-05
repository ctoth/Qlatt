import { describe, expect, it } from "vitest";
import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../src/declarative-frontend/cel-expressions";

/**
 * #47: the safe optional-field accessor.
 *
 * A bare `obj.missing` throws "No such key" in cel-js, which is why every
 * optional read was wrapped in `has()` and why `isTrue(obj, field)` takes the
 * field by name. `get(obj, field, default)` makes the `has()` guard optional:
 * it returns the stored value when the field is present and non-null, and
 * the supplied default otherwise. It never throws for a missing field.
 */
describe("get CEL accessor", () => {
  it("returns the stored value when the field is present", () => {
    expect(evaluateExpression("get(obj, 'a', 0)", { obj: { a: 7 } })).toBe(7);
    expect(evaluateExpression("get(obj, 'name', '')", { obj: { name: "cake" } })).toBe("cake");
  });

  it("returns the default when the field is absent", () => {
    expect(evaluateExpression("get(obj, 'missing', 5)", { obj: { a: 1 } })).toBe(5);
    expect(evaluateExpression("get(obj, 'missing', 'x')", { obj: {} })).toBe("x");
  });

  it("returns the default when the object is null or not an object", () => {
    expect(evaluateExpression("get(obj, 'a', 5)", { obj: null })).toBe(5);
    expect(evaluateExpression("get(obj, 'a', 5)", { obj: "string" })).toBe(5);
  });

  it("treats a present null as absent", () => {
    expect(evaluateExpression("get(obj, 'a', 5)", { obj: { a: null } })).toBe(5);
  });

  it("does not replace falsy-but-present values", () => {
    expect(evaluateExpression("get(obj, 'a', 5)", { obj: { a: 0 } })).toBe(0);
    expect(evaluateExpression("get(obj, 'a', true)", { obj: { a: false } })).toBe(false);
    expect(evaluateExpression("get(obj, 'a', 'x')", { obj: { a: "" } })).toBe("");
  });

  it("composes with arithmetic without a has() guard", () => {
    expect(evaluateExpression("get(current, 'boost', 0) + 1", { current: {} })).toBe(1);
    expect(evaluateExpression("get(current, 'boost', 0) + 1", { current: { boost: 2 } })).toBe(3);
  });

  it("passes function-surface validation", () => {
    expect(validateExpressionSyntax("get(current, 'stress', 0) > 0")).toBeNull();
  });
});
