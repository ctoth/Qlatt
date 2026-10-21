import { describe, expect, it } from "vitest";
import { createProvenanceCollector } from "../../src/provenance";
import { createCelEvaluator } from "../../src/semantics/cel-evaluator";
import { createTopologicalEvaluator } from "../../src/semantics/topological-evaluator";

describe("Topological Evaluator", () => {
  it("evaluates in dependency order", () => {
    const celEvaluator = createCelEvaluator();
    const evaluator = createTopologicalEvaluator(celEvaluator);
    const semantics = {
      name: "test",
      realize: {
        b: { expr: "a + 1", deps: ["a"] },
        c: { expr: "b + 1", deps: ["b"] },
      },
    };
    const result = evaluator.evaluate(semantics, { params: { a: 1 }, constants: {} });
    expect(result.values).toEqual({ a: 1, b: 2, c: 3 });
  });

  it("detects cycles", () => {
    const celEvaluator = createCelEvaluator();
    const evaluator = createTopologicalEvaluator(celEvaluator);
    const semantics = {
      name: "cyclic",
      realize: {
        a: { expr: "b + 1", deps: ["b"] },
        b: { expr: "a + 1", deps: ["a"] },
      },
    };
    expect(() => evaluator.evaluate(semantics, { params: {}, constants: {} })).toThrow(/cycle/i);
  });

  it("records only successful cited object rules without changing evaluation", () => {
    const evaluator = createTopologicalEvaluator(createCelEvaluator());
    const provenance = createProvenanceCollector();
    const citations = ["engineering estimate: evaluator fixture"];
    const semantics = {
      name: "citation-fixture",
      realize: {
        cited: { expr: "a + 1", citations },
        uncited: { expr: "a + 2" },
        shorthand: "a + 3",
        failed: { expr: "missing_value + 1", citations },
      },
    };
    const context = { params: { a: 1 }, constants: {} };
    const result = evaluator.evaluate(semantics, { ...context, provenance });
    expect(result).toEqual(evaluator.evaluate(semantics, context));
    expect(result.values).toEqual({ a: 1, cited: 2, uncited: 3, shorthand: 4 });
    expect(result.errors.map((error) => error.name)).toEqual(["failed"]);
    expect(provenance.getDecisions()).toHaveLength(1);
    expect(provenance.getDecisions()[0]).toMatchObject({
      stage: "semantics",
      type: "realization_evaluated",
      subject: "realize:cited",
      reason: "citation-fixture: cited evaluated a + 1 => 2",
      citations,
    });
    expect(provenance.getDecisions()[0].timestampMs).toBeUndefined();
    expect(provenance.getDecisions()[0].parents).toBeUndefined();
  });
});
