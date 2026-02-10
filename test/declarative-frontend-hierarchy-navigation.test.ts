import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine.js";

describe("declarative frontend hierarchy navigation helpers", () => {
  it("supports $parent(current, stream) for active hierarchy lookups", () => {
    const spec = {
      streams: {
        syllable: { type: "span" },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        stressed_parent_boost: {
          select: {
            stream: "phone",
            where: "$parent(current, 'syllable').stress = 1",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "h1" }],
        },
      },
      phases: [{ name: "duration", rules: ["stressed_parent_boost"] }],
    };

    const input = [
      { id: "sy1", stream: "syllable", stress: 1, status: 1 },
      { id: "p1", stream: "phone", parent: "sy1", duration: 100, status: 1 },
      { id: "sy2", stream: "syllable", stress: 0, status: 1 },
      { id: "p2", stream: "phone", parent: "sy2", duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    expect(p1?.duration).toBe(110);
    expect(p2?.duration).toBe(100);
  });

  it("supports $children(current, stream) and ignores suppressed children", () => {
    const spec = {
      streams: {
        syllable: { type: "span" },
        phone: { type: "base" },
      },
      rules: {
        mark_if_two_children: {
          select: {
            stream: "syllable",
            where: "$count($children(current, 'phone')) = 2",
          },
          apply: [{ field: "marked", op: "set", value: "1", tag: "h2" }],
        },
      },
      phases: [{ name: "structure", rules: ["mark_if_two_children"] }],
    };

    const input = [
      { id: "sy1", stream: "syllable", status: 1 },
      { id: "p1", stream: "phone", parent: "sy1", status: 1 },
      { id: "p2", stream: "phone", parent: "sy1", status: 1 },
      { id: "p3", stream: "phone", parent: "sy1", status: 2 },
      { id: "sy2", stream: "syllable", status: 1 },
      { id: "p4", stream: "phone", parent: "sy2", status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const sy1 = out.find((t) => t.id === "sy1");
    const sy2 = out.find((t) => t.id === "sy2");
    expect(sy1?.marked).toBe(1);
    expect(sy2?.marked).toBeUndefined();
  });
});

