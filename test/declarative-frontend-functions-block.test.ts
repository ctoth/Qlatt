import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { expandCelMacros, parseCelMacroBlock } from "../src/declarative-frontend/cel-macros";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";

/**
 * #47: the rulepack `functions:` block.
 *
 * A frontend declares named CEL macros once and every rule expression may
 * call them. Macros are expanded textually at load time (before validation),
 * so the validated and executed rulepack is plain CEL: a host that ports the
 * rule engine needs no macro support, and every existing validation pass
 * (function surface, relation helpers, item-field reads) sees the expansion.
 */

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        type: { kind: "string", values: ["vowel", "stop"] },
        duration: { kind: "number" },
        energy: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

function fixture(): { utterance: Utterance; vowelId: string; stopId: string } {
  const utterance = new Utterance(SCHEMA);
  const vowel = utterance.createItem("segment", "vowel");
  vowel.set("type", "vowel", INPUT);
  vowel.set("duration", 100, INPUT);
  vowel.set("energy", 2, INPUT);
  utterance.relation("Segment").append(vowel, INPUT);
  const stop = utterance.createItem("segment", "stop");
  stop.set("type", "stop", INPUT);
  stop.set("duration", 80, INPUT);
  stop.set("energy", 1, INPUT);
  utterance.relation("Segment").append(stop, INPUT);
  return { utterance, vowelId: vowel.id, stopId: stop.id };
}

const RELATIONS = {
  Segment: {
    type: "base",
    features: { type: ["vowel", "stop"] },
    scalars: { duration: {}, energy: {} },
  },
};

const FUNCTIONS = {
  is_vowel: {
    params: ["item"],
    body: "item.type == 'vowel'",
    citations: ["Peterson & Barney 1952"],
  },
  half: { params: ["x"], body: "x / 2" },
  scaled: {
    params: ["x", "k"],
    body: "half(x) * k",
    description: "Half of x, scaled by k",
  },
};

function asYamlPath(path: string): string {
  return path.replace(/\\/g, "/");
}

describe("cel-macros: parse and expand", () => {
  it("expands a call while preserving direct item-field access", () => {
    const macros = parseCelMacroBlock(FUNCTIONS);
    expect(expandCelMacros("is_vowel(current)", macros)).toBe("(current.type == 'vowel')");
  });

  it("expands nested macro bodies and nested call arguments", () => {
    const macros = parseCelMacroBlock(FUNCTIONS);
    expect(expandCelMacros("scaled(a, 3)", macros)).toBe("((a / 2) * 3)");
    expect(expandCelMacros("half(half(a))", macros)).toBe("((a / 2) / 2)");
    expect(expandCelMacros("half(a + b)", macros)).toBe("((a + b) / 2)");
  });

  it("leaves string literals, member calls, and unrelated identifiers alone", () => {
    const macros = parseCelMacroBlock(FUNCTIONS);
    expect(expandCelMacros("w == 'is_vowel(z)'", macros)).toBe("w == 'is_vowel(z)'");
    expect(expandCelMacros('w == "half(a)"', macros)).toBe('w == "half(a)"');
    expect(expandCelMacros("obj.half(a)", macros)).toBe("obj.half(a)");
    expect(expandCelMacros("halfway(a)", macros)).toBe("halfway(a)");
    expect(expandCelMacros("current.type == 'vowel'", macros)).toBe("current.type == 'vowel'");
  });

  it("substitutes only bare parameter identifiers in the body", () => {
    const macros = parseCelMacroBlock({
      tagged: { params: ["item"], body: "item.item == 'item' && has(item.stress)" },
    });
    expect(expandCelMacros("tagged(current)", macros)).toBe(
      "(current.item == 'item' && has(current.stress))",
    );
  });

  it("handles nested parentheses, brackets, and commas inside arguments", () => {
    const macros = parseCelMacroBlock(FUNCTIONS);
    expect(expandCelMacros("scaled(max(a, b), size([1, 2]))", macros)).toBe(
      "((max(a, b) / 2) * size([1, 2]))",
    );
  });

  it("rejects a call with the wrong number of arguments", () => {
    const macros = parseCelMacroBlock(FUNCTIONS);
    expect(() => expandCelMacros("is_vowel(a, b)", macros)).toThrow(
      /E_RULEPACK_FUNCTIONS.*is_vowel.*expects 1 argument.*got 2/,
    );
  });

  it("rejects a function whose name shadows a catalog function", () => {
    expect(() => parseCelMacroBlock({ lower: { params: ["x"], body: "x" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*'lower'.*catalog/,
    );
    expect(() => parseCelMacroBlock({ map: { params: ["x"], body: "x" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*'map'.*catalog/,
    );
  });

  it("rejects malformed declarations", () => {
    expect(() => parseCelMacroBlock({ "bad name": { params: [], body: "1" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*name/,
    );
    expect(() => parseCelMacroBlock({ f: { params: ["1x"], body: "1" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*param/,
    );
    expect(() => parseCelMacroBlock({ f: { params: ["x", "x"], body: "x" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*duplicate param/,
    );
    expect(() => parseCelMacroBlock({ f: { params: ["x"] } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*body/,
    );
    expect(() => parseCelMacroBlock({ f: { params: ["x"], body: "x +" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*body/,
    );
    expect(() => parseCelMacroBlock({ f: { params: ["x"], body: "x", extra: 1 } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*extra/,
    );
    expect(() => parseCelMacroBlock({ f: { params: ["x"], body: "x", citations: "x" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*citations/,
    );
  });

  it("rejects recursive macro definitions", () => {
    expect(() =>
      parseCelMacroBlock({
        a: { params: ["x"], body: "b(x)" },
        b: { params: ["x"], body: "a(x)" },
      }),
    ).toThrow(/E_RULEPACK_FUNCTIONS.*cycle.*a.*b/);
    expect(() => parseCelMacroBlock({ a: { params: ["x"], body: "a(x)" } })).toThrow(
      /E_RULEPACK_FUNCTIONS.*cycle/,
    );
  });

  it("accepts an absent or empty block", () => {
    expect(parseCelMacroBlock(undefined).size).toBe(0);
    expect(parseCelMacroBlock({}).size).toBe(0);
    expect(expandCelMacros("half(a)", parseCelMacroBlock({}))).toBe("half(a)");
  });
});

describe("rulepack functions: block", () => {
  it("expands macros in rule expressions at load time and runs them", () => {
    const { utterance, vowelId, stopId } = fixture();
    const spec = compileRuleEngineSpec({
      functions: FUNCTIONS,
      parameters: { k: 3 },
      relations: RELATIONS,
      rules: {
        scale_vowel: {
          kind: "scalar",
          select: { relation: "Segment", where: "is_vowel(current)" },
          define: { boosted: "scaled(current.duration, params.k)" },
          apply: [{ field: "duration", op: "set", value: "boosted", tag: "duration" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["scale_vowel"] }],
    });

    expect(spec.rules.scale_vowel.select).toMatchObject({ where: "(current.type == 'vowel')" });
    expect(spec.rules.scale_vowel.define).toEqual({
      boosted: "((current.duration / 2) * params.k)",
    });

    runGraphRuleEngine(utterance, spec);
    expect(utterance.getItem(vowelId)?.get("duration")).toBe(150);
    expect(utterance.getItem(stopId)?.get("duration")).toBe(80);
  });

  it("retains the declared block on the compiled spec for introspection", () => {
    const spec = compileRuleEngineSpec({
      functions: FUNCTIONS,
      relations: RELATIONS,
      rules: {},
      phases: [],
    });
    expect(spec.functions).toEqual(FUNCTIONS);
    expect(Object.isFrozen(spec.functions)).toBe(true);
  });

  it("still reports an undeclared function as unknown", () => {
    expect(() =>
      compileRuleEngineSpec({
        relations: RELATIONS,
        rules: {
          scale_vowel: {
            kind: "scalar",
            select: { relation: "Segment", where: "is_vowel(current)" },
            apply: [{ field: "duration", op: "mul", value: "2", tag: "duration" }],
            citations: ["Klatt 1976"],
          },
        },
        phases: [{ name: "duration", rules: ["scale_vowel"] }],
      }),
    ).toThrow(/Unknown function 'is_vowel'/);
  });

  it("reports an arity mismatch at the rule that uses the macro", () => {
    expect(() =>
      compileRuleEngineSpec({
        functions: FUNCTIONS,
        relations: RELATIONS,
        rules: {
          scale_vowel: {
            kind: "scalar",
            select: { relation: "Segment", where: "is_vowel(current, next)" },
            apply: [{ field: "duration", op: "mul", value: "2", tag: "duration" }],
            citations: ["Klatt 1976"],
          },
        },
        phases: [{ name: "duration", rules: ["scale_vowel"] }],
      }),
    ).toThrow(
      /E_RULEPACK_FUNCTIONS.*is_vowel.*expects 1 argument.*rules\.scale_vowel\.select\.where/,
    );
  });

  it("merges functions declared by included files and rejects duplicates", () => {
    const dir = mkdtempSync(join(tmpdir(), "qlatt-functions-block-"));
    try {
      const parentPath = join(dir, "frontend.yaml");
      const childPath = join(dir, "child.yaml");
      const duplicatePath = join(dir, "duplicate.yaml");
      const base = loadRulepackSpecFromPath("/rules/frontends/qlatt-english/frontend.yaml");
      const parent = {
        version: "v1",
        include: ["child.yaml"],
        output: base.output,
        tags: { duration: "Duration scaling" },
        relations: RELATIONS,
        rules: {
          lengthen_vowel: {
            kind: "scalar",
            select: { relation: "Segment", where: "is_vowel(current)" },
            apply: [{ field: "duration", op: "mul", value: "1.5", tag: "duration" }],
            citations: ["Klatt 1976"],
          },
        },
        phases: [{ name: "duration", rules: ["lengthen_vowel"] }],
      };
      writeFileSync(parentPath, JSON.stringify(parent));
      writeFileSync(childPath, JSON.stringify({ functions: FUNCTIONS }));

      const spec = loadRulepackSpecFromPath(asYamlPath(parentPath));
      expect(spec.rules.lengthen_vowel.select).toMatchObject({
        where: "(current.type == 'vowel')",
      });

      // A distinct path exercises loading, rather than the immutable path cache.
      writeFileSync(duplicatePath, JSON.stringify({ ...parent, functions: FUNCTIONS }));
      expect(() => loadRulepackSpecFromPath(asYamlPath(duplicatePath))).toThrowError(
        /Duplicate functions "is_vowel"/,
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
