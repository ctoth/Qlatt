import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

describe("declarative frontend hierarchy navigation helpers", () => {
  it("materializes parent relation fields on current token", () => {
    const spec = {
      relations: {
        syllable: { type: "span" },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        stressed_parent_boost: {
          select: {
            relation: "phone",
            where: "current.syllable.stress == 1",
          },
          apply: [{ field: "duration", op: "add", value: "10", tag: "h1" }],
        },
      },
      phases: [{ name: "duration", rules: ["stressed_parent_boost"] }],
    };

    const input = [
      { id: "sy1", relation: "syllable", stress: 1, status: 1 },
      { id: "p1", relation: "phone", parent: "sy1", duration: 100, status: 1 },
      { id: "sy2", relation: "syllable", stress: 0, status: 1 },
      { id: "p2", relation: "phone", parent: "sy2", duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    expect(p1?.duration).toBe(110);
    expect(p2?.duration).toBe(100);
  });

  it("rejects deprecated navigation helpers in CEL expressions", () => {
    const spec = parseDslSpec({
      relations: {
        syllable: { type: "span" },
        phone: { type: "base" },
      },
      rules: {
        mark_if_two_children: {
          select: {
            relation: "syllable",
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
