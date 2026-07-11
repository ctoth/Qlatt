import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

describe("declarative frontend generic select rules", () => {
  it("applies select/apply rules in declared order", () => {
    const spec = {
      relations: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        add10: {
          select: { relation: "phone", where: "true" },
          apply: [{ field: "duration", op: "add", value: "10", tag: "a" }],
        },
        mul2: {
          select: { relation: "phone", where: "true" },
          apply: [{ field: "duration", op: "mul", value: "2", tag: "b" }],
        },
      },
      phases: [{ name: "duration", rules: ["add10", "mul2"] }],
    };

    const input = [{ phoneme: "AE", relation: "phone", duration: 20, status: 1 }];
    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].duration).toBe(60);
  });

  it("filters suppressed tokens between select rules", () => {
    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop", "fricative", "silence"] },
          scalars: { duration: { unit: "ms" } },
        },
      },
      rules: {
        suppressVowels: {
          select: { relation: "phone", where: "current.type == 'vowel'" },
          suppress: true,
        },
        add5: {
          select: { relation: "phone", where: "true" },
          apply: [{ field: "duration", op: "add", value: "5", tag: "d" }],
        },
      },
      phases: [{ name: "duration", rules: ["suppressVowels", "add5"] }],
    };

    const input = [
      {
        phoneme: "AE",
        relation: "phone",
        type: "vowel",
        duration: 100,
        status: 1,
        sync_left: { kind: "START" },
        sync_right: { kind: "START" },
      },
      {
        phoneme: "T",
        relation: "phone",
        type: "stop",
        duration: 80,
        status: 1,
        sync_left: { kind: "START" },
        sync_right: { kind: "END" },
      },
    ];
    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;

    expect(out[0].status).toBe(2);
    expect(out[0].duration).toBe(100);
    expect(out[1].duration).toBe(85);
  });

  it("supports effect dispatch with first-match semantics", () => {
    const spec = {
      relations: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        table_duration: {
          select: { relation: "phone", where: "true" },
          define: {
            n: "next",
          },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [
                { when: "n == null ? true : n.phoneme == 'SIL'", value: 1.2 },
                {
                  when: "n == null ? false : (has(n.voiceless) && n.voiceless == true && n.type == 'fricative')",
                  value: 0.85,
                },
                { default: 1.0 },
              ],
              tag: "segmental",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["table_duration"] }],
    };

    const input = [
      { id: "p1", relation: "phone", phoneme: "AA", duration: 100, status: 1 },
      {
        id: "p2",
        relation: "phone",
        phoneme: "S",
        type: "fricative",
        voiceless: true,
        duration: 80,
        status: 1,
      },
      { id: "p3", relation: "phone", phoneme: "SIL", duration: 50, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].duration).toBeCloseTo(85);
    expect(out[1].duration).toBeCloseTo(96);
    expect(out[2].duration).toBeCloseTo(60);
  });
});
