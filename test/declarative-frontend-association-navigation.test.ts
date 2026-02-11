import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend association navigation helpers", () => {
  it("supports $assoc(current, name) over active associated tokens", () => {
    const spec = {
      streams: {
        tone: { type: "parallel", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        linked_only: {
          select: {
            stream: "tone",
            where: "$count($assoc(current, 'link')) = 1",
          },
          apply: [{ field: "duration", op: "add", value: "5", tag: "a1" }],
        },
      },
      phases: [{ name: "assoc", rules: ["linked_only"] }],
    };

    const input = [
      {
        id: "t1",
        stream: "tone",
        duration: 50,
        status: 1,
        associations: { link: ["t2", "t3"] },
      },
      { id: "t2", stream: "tone", duration: 70, status: 1 },
      { id: "t3", stream: "tone", duration: 80, status: 2 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBe(55);
  });
});

