import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine.js";

describe("declarative frontend generic select rules", () => {
  it("applies select/apply rules in declared order", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        add10: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "add", value: "10", tag: "a" }],
        },
        mul2: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "2", tag: "b" }],
        },
      },
      phases: [{ name: "duration", rules: ["add10", "mul2"] }],
    };

    const input = [{ phoneme: "AE", stream: "phone", duration: 20, status: 1 }];
    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(60);
  });

  it("filters suppressed tokens between select rules", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        suppressVowels: {
          select: { stream: "phone", where: "current.type = 'vowel'" },
          suppress: true,
        },
        add5: {
          select: { stream: "phone", where: "true" },
          apply: [{ field: "duration", op: "add", value: "5", tag: "d" }],
        },
      },
      phases: [{ name: "duration", rules: ["suppressVowels", "add5"] }],
    };

    const input = [
      { phoneme: "AE", stream: "phone", type: "vowel", duration: 100, status: 1 },
      { phoneme: "T", stream: "phone", type: "stop", duration: 80, status: 1 },
    ];
    const out = runRuleEngine(input, spec).sequence;

    expect(out[0].status).toBe(2);
    expect(out[0].duration).toBe(100);
    expect(out[1].duration).toBe(85);
  });
});

