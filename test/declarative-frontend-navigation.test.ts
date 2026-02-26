import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend navigation helpers", () => {
  it("supports prev cursor over active stream order", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        first_only: {
          select: {
            stream: "phone",
            where: "prev == null",
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

  it("filters suppressed tokens for next cursor", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        last_active_only: {
          select: {
            stream: "phone",
            where: "next == null",
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

  it("supports ahead()/behind() for deeper active-token navigation", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        ahead_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'A'",
          },
          define: {
            a2: "ahead(current, 2)",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "a2 != null && a2.phoneme == 'C' ? 7 : 0",
              tag: "ahead",
            },
          ],
        },
        behind_rule: {
          select: {
            stream: "phone",
            where: "current.phoneme == 'D'",
          },
          define: {
            b2: "behind(current, 2)",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "b2 != null && b2.phoneme == 'B' ? 9 : 0",
              tag: "behind",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["ahead_rule", "behind_rule"] }],
    };

    const input = [
      { stream: "phone", phoneme: "A", duration: 70, status: 1 },
      { stream: "phone", phoneme: "X", duration: 50, status: 2 },
      { stream: "phone", phoneme: "B", duration: 80, status: 1 },
      { stream: "phone", phoneme: "C", duration: 90, status: 1 },
      { stream: "phone", phoneme: "D", duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(77);
    expect(out[2].duration).toBe(80);
    expect(out[4].duration).toBe(109);
  });
});
