import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";

describe("declarative frontend hierarchy navigation helpers", () => {
  it("materializes parent stream fields on current token", () => {
    const spec = {
      streams: {
        syllable: { type: "span" },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        stressed_parent_boost: {
          select: {
            stream: "phone",
            where: "current.syllable.stress == 1",
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

  it("rejects deprecated navigation helpers in CEL expressions", () => {
    const spec = parseDslSpec({
      streams: {
        syllable: { type: "span" },
        phone: { type: "base" },
      },
      rules: {
        mark_if_two_children: {
          select: {
            stream: "syllable",
            where: "size(children(current, 'phone')) == 2",
          },
          apply: [{ field: "marked", op: "set", value: "1", tag: "h2" }],
        },
      },
      phases: [{ name: "structure", rules: ["mark_if_two_children"] }],
    });

    const diagnostics = validateDslSpec(spec);
    expect(diagnostics.some((d) => d.code === "E_CEL_INVALID")).toBe(true);
  });
});
