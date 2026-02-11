import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend navigation helpers", () => {
  it("supports $prev over active stream order", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        first_only: {
          select: {
            stream: "phone",
            where: "$prev(current) = null",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "n" }],
        },
      },
      phases: [{ name: "duration", rules: ["first_only"] }],
    };

    const input = [
      { stream: "phone", phoneme: "T", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AE", duration: 100, status: 1 },
      { stream: "phone", phoneme: "S", duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(80);
    expect(out[1].duration).toBe(100);
    expect(out[2].duration).toBe(80);
  });

  it("filters suppressed tokens for $next navigation", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        last_active_only: {
          select: {
            stream: "phone",
            where: "$next(current) = null",
          },
          apply: [{ field: "duration", op: "add", value: "5", tag: "n2" }],
        },
      },
      phases: [{ name: "duration", rules: ["last_active_only"] }],
    };

    const input = [
      { stream: "phone", phoneme: "T", duration: 70, status: 1 },
      { stream: "phone", phoneme: "AE", duration: 100, status: 2 },
      { stream: "phone", phoneme: "S", duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(70);
    expect(out[1].duration).toBe(100);
    expect(out[2].duration).toBe(85);
  });
});

