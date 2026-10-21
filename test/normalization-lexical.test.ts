import { describe, expect, it } from "vitest";
import { evaluateExpression } from "../src/declarative-frontend/cel-expressions";

describe("generic text replacement mechanics", () => {
  it("supports declared regex captures and flags without vocabulary policy", () => {
    expect(evaluateExpression("regexReplace('a:B a:c', '(a):([a-z])', '$2-$1', 'gi')", {})).toBe(
      "B-a c-a",
    );
  });

  it("gives the same answer each time a pattern is used again", () => {
    // A sticky or global expression remembers where its last match ended.
    for (const flags of ["y", "g", "gy", ""]) {
      const expression = `regexReplace('aab', 'a', 'x', '${flags}')`;
      const first = evaluateExpression(expression, {});
      expect(first).toBe(flags.includes("g") ? "xxb" : "xab");
      expect(evaluateExpression(expression, {})).toBe(first);
    }
    // The same pattern under other flags is another expression.
    expect(evaluateExpression("regexReplace('Ab', 'a', 'x', '')", {})).toBe("Ab");
    expect(evaluateExpression("regexReplace('Ab', 'a', 'x', 'i')", {})).toBe("xb");
    expect(evaluateExpression("regexReplace('Ab', 'a', 'x', '')", {})).toBe("Ab");
    expect(evaluateExpression("matches('Ab', 'a')", {})).toBe(false);
    expect(evaluateExpression("regexSplit('a1b22c', '[0-9]+')", {})).toEqual(["a", "b", "c"]);
    expect(evaluateExpression("regexSplit('a1b22c', '[0-9]+')", {})).toEqual(["a", "b", "c"]);
  });
});
