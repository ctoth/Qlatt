import { describe, it, expect } from "vitest";
import {
  evaluateExpression,
  validateExpressionSyntax,
} from "../src/declarative-frontend/cel-expressions";

/**
 * Phase 5.2 sub-task B: the `isTrue(obj, field)` safe optional-bool accessor.
 *
 * Replaces the `has(obj.field) ? obj.field == true : false` guard idiom. It must
 * return the SAME value in all cases: absent field -> false, present-and-true ->
 * true, present-and-not-true (false / non-bool) -> false, and must be
 * throw-safe (a bare `obj.missingField` access throws "No such key" in CEL).
 */
describe("isTrue CEL accessor", () => {
  it("returns true only when the field is strictly boolean true", () => {
    expect(evaluateExpression("isTrue(o, 'f')", { o: { f: true } })).toBe(true);
  });

  it("returns false when the field is absent (throw-safe)", () => {
    expect(evaluateExpression("isTrue(o, 'f')", { o: { g: 1 } })).toBe(false);
  });

  it("returns false when the field is boolean false", () => {
    expect(evaluateExpression("isTrue(o, 'f')", { o: { f: false } })).toBe(false);
  });

  it("returns false for a present non-boolean truthy value", () => {
    expect(evaluateExpression("isTrue(o, 'f')", { o: { f: 1 } })).toBe(false);
    expect(evaluateExpression("isTrue(o, 'f')", { o: { f: "true" } })).toBe(false);
  });

  it("returns false when the object is null or missing", () => {
    expect(evaluateExpression("isTrue(o, 'f')", { o: null })).toBe(false);
  });

  it("matches the legacy has()-guard idiom across all cases", () => {
    const legacy = "has(o.f) ? o.f == true : false";
    const modern = "isTrue(o, 'f')";
    const cases = [{ f: true }, { f: false }, { g: 1 }, { f: 1 }, { f: "true" }];
    for (const o of cases) {
      expect(evaluateExpression(modern, { o })).toBe(evaluateExpression(legacy, { o }));
    }
  });

  it("passes function-surface validation (whitelisted)", () => {
    expect(validateExpressionSyntax("isTrue(current, 'voiced')")).toBeNull();
  });
});
