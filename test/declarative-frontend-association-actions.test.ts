import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

describe("declarative frontend association actions", () => {
  it("supports pattern associate + downstream $assoc query", () => {
    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["stop", "vowel", "fricative"] },
          scalars: { duration: { unit: "ms" } },
        },
      },
      patterns: {
        cv: {
          relation: "phone",
          sequence: [
            { capture: "c", where: "current.type == 'stop'" },
            { capture: "v", where: "current.type == 'vowel'" },
          ],
        },
      },
      rules: {
        link_cv: {
          match: "cv",
          associate: [{ from: "c", to: "v", assoc_name: "link" }],
        },
        boost_linked: {
          select: {
            relation: "phone",
            where: "size(assoc(current, 'link')) == 1",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "assoc" }],
        },
      },
      phases: [{ name: "assoc", rules: ["link_cv", "boost_linked"] }],
    };

    const input = [
      { id: "p1", relation: "phone", type: "stop", duration: 70, status: 1 },
      { id: "p2", relation: "phone", type: "vowel", duration: 100, status: 1 },
      { id: "p3", relation: "phone", type: "fricative", duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    expect(p1?.duration).toBe(80);
    expect(p2?.duration).toBe(100);
  });

  it("supports disassociate by suppressing active association edges", () => {
    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["stop", "vowel"] },
          scalars: { duration: { unit: "ms" } },
        },
      },
      patterns: {
        cv: {
          relation: "phone",
          sequence: [
            { capture: "c", where: "current.type == 'stop'" },
            { capture: "v", where: "current.type == 'vowel'" },
          ],
        },
      },
      rules: {
        link_cv: {
          match: "cv",
          associate: [{ from: "c", to: "v", assoc_name: "link" }],
        },
        unlink_cv: {
          match: "cv",
          disassociate: [{ from: "c", to: "v", assoc_name: "link" }],
        },
        boost_linked: {
          select: {
            relation: "phone",
            where: "size(assoc(current, 'link')) == 1",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "assoc" }],
        },
      },
      phases: [{ name: "assoc", rules: ["link_cv", "unlink_cv", "boost_linked"] }],
    };

    const input = [
      { id: "p1", relation: "phone", type: "stop", duration: 70, status: 1 },
      { id: "p2", relation: "phone", type: "vowel", duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const p1 = out.find((t) => t.id === "p1");
    expect(p1?.duration).toBe(70);
  });
});
