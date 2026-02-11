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

  it("annotates runtime rule errors with stable code and blame path", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        bad: {
          select: { stream: "phone", where: "true" },
          apply: [{ target: "other", field: "duration", op: "set", value: "10" }],
        },
      },
      phases: [{ name: "duration", rules: ["bad"] }],
    };

    const input = [{ id: "p1", stream: "phone", duration: 100, status: 1 }];
    expect(() => runRuleEngine(input, spec)).toThrowError(/E_EFFECT_TARGET_UNKNOWN/);
    expect(() => runRuleEngine(input, spec)).toThrowError(/phase=duration/);
    expect(() => runRuleEngine(input, spec)).toThrowError(/path=rules\.bad/);
  });
});
