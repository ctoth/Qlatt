import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";

describe("generic text replacement mechanics", () => {
  it("supports declared regex captures and flags without vocabulary policy", () => {
    expect(evaluateExpression("regexReplace('a:B a:c', '(a):([a-z])', '$2-$1', 'gi')", {})).toBe(
      "B-a c-a",
    );
  });
});
