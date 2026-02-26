import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend rule constraints", () => {
  it("applies select rule effects only when constraint evaluates true", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      parameters: { min_duration: 90 },
      rules: {
        long_vowels_only: {
          select: { stream: "phone", where: "current.type == 'vowel'" },
          constraint: "current.duration >= params.min_duration",
          apply: [{ field: "duration", op: "add", value: "10", tag: "c1" }],
        },
      },
      phases: [{ name: "dur", rules: ["long_vowels_only"] }],
    };

    const input = [
      { id: "p1", stream: "phone", type: "vowel", duration: 100, status: 1 },
      { id: "p2", stream: "phone", type: "vowel", duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out.find((t) => t.id === "p1")?.duration).toBe(110);
    expect(out.find((t) => t.id === "p2")?.duration).toBe(80);
  });

  it("applies pattern rule effects only when post-match constraint passes", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      patterns: {
        cv: {
          stream: "phone",
          sequence: [
            { capture: "c", where: "current.type == 'stop'" },
            { capture: "v", where: "current.type == 'vowel'" },
          ],
        },
      },
      rules: {
        first_cv_only: {
          match: "cv",
          constraint: "c.id == 'p1' && v.id == 'p2'",
          apply: [{ target: "v", field: "duration", op: "add", value: "5", tag: "c2" }],
        },
      },
      phases: [{ name: "dur", rules: ["first_cv_only"] }],
    };

    const input = [
      { id: "p1", stream: "phone", type: "stop", duration: 70, status: 1 },
      { id: "p2", stream: "phone", type: "vowel", duration: 100, status: 1 },
      { id: "p3", stream: "phone", type: "stop", duration: 70, status: 1 },
      { id: "p4", stream: "phone", type: "vowel", duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out.find((t) => t.id === "p2")?.duration).toBe(105);
    expect(out.find((t) => t.id === "p4")?.duration).toBe(100);
  });
});
