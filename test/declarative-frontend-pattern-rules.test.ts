import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

describe("declarative frontend pattern rules", () => {
  it("suppresses all captures for a matched pattern", () => {
    const spec = {
      streams: {
        phone: {
          type: "base",
          features: { type: ["stop", "vowel", "fricative"] },
        },
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
        suppress_cv: {
          match: "cv",
          suppress: true,
        },
      },
      phases: [{ name: "sandhi", rules: ["suppress_cv"] }],
    };

    const input = [
      {
        stream: "phone",
        phoneme: "T",
        type: "stop",
        status: 1,
        sync_left: { kind: "START" },
        sync_right: { kind: "FINITE", rank: "000000000001" },
      },
      {
        stream: "phone",
        phoneme: "AE",
        type: "vowel",
        status: 1,
        sync_left: { kind: "FINITE", rank: "000000000001" },
        sync_right: { kind: "FINITE", rank: "000000000002" },
      },
      {
        stream: "phone",
        phoneme: "S",
        type: "fricative",
        status: 1,
        sync_left: { kind: "START" },
        sync_right: { kind: "END" },
      },
    ];
    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;

    expect(out[0].status).toBe(2);
    expect(out[1].status).toBe(2);
    expect(out[2].status).toBe(1);
  });

  it("applies targeted effects to captures", () => {
    const spec = {
      streams: {
        phone: {
          type: "base",
          features: { type: ["stop", "vowel"] },
          scalars: { duration: { unit: "ms" } },
        },
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
        boost_vowel_after_stop: {
          match: "cv",
          apply: [{ target: "v", field: "duration", op: "add", value: "20", tag: "cv" }],
        },
      },
      phases: [{ name: "duration", rules: ["boost_vowel_after_stop"] }],
    };

    const input = [
      { stream: "phone", phoneme: "T", type: "stop", duration: 80, status: 1 },
      { stream: "phone", phoneme: "AE", type: "vowel", duration: 100, status: 1 },
      { stream: "phone", phoneme: "K", type: "stop", duration: 70, status: 1 },
    ];
    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;

    expect(out[1].duration).toBe(120);
    expect(out[0].duration).toBe(80);
    expect(out[2].duration).toBe(70);
  });
});
