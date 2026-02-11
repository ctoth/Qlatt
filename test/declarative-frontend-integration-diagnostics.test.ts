import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend integration diagnostics", () => {
  it("surfaces validator diagnostics through engine entrypoint for invalid specs", () => {
    const invalidSpec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {},
      phases: [
        {
          name: "bad",
          rules: ["missing_rule"],
          resolve_points: ["phone"],
        },
      ],
    };

    expect(() => runRuleEngine([], invalidSpec)).toThrowError(/E_RULE_UNKNOWN/);
    expect(() => runRuleEngine([], invalidSpec)).toThrowError(
      /E_PHASE_RESOLVE_POINT_STREAM_INVALID/
    );
  });
});
