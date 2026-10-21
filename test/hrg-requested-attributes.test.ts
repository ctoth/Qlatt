import { describe, expect, it } from "vitest";
import { checkPureExpression } from "../src/declarative-frontend/cel-expressions";
import { Utterance } from "../src/declarative-frontend/hrg";
import {
  AttributeItemIdentity,
  checkRequestedAttributes,
  RequestedAttributes,
} from "../src/declarative-frontend/hrg/requested-attributes";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec, loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

const meta = { ruleId: "sample", phase: "test", tag: "fixture", reason: "fixture", citations: ["engineering fixture"] };
const definitions = {
  own: "current.duration",
  shared: "own * params.scale",
  sum: "shared + shared",
  branch: "own > 0 ? shared : current.missing",
  optional: "has(current.missing) ? current.missing : 7",
  neighbor: "path(current, 'n.duration')",
  member: "ahead(current, 1)",
  linked: "size(assoc(current, 'link'))",
  anchor: "midpoint(current)",
};

function compiled(define = definitions) {
  return compileRuleEngineSpec({
    parameters: { scale: 2 },
    relations: { Segment: { type: "base", scalars: { duration: {}, missing: {} }, features: { active: [true, false], param_scope: [] } } },
    rules: { sample: {
      select: { relation: "Segment", where: "true" }, define,
      apply: [{ field: "duration", op: "set", value: "current.duration", tag: "fixture" }], citations: meta.citations,
    } },
    phases: [{ name: "test", rules: ["sample"] }],
  });
}

function fixture() {
  const graph = new Utterance({
    itemTypes: { segment: { features: { duration: { kind: "number" }, missing: { kind: "number" }, active: { kind: "boolean" }, param_scope: { kind: "string" } } } },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  });
  const item = graph.createItem("segment", "first");
  item.set("duration", 10, meta);
  graph.segments.append(item, meta);
  const program = checkRequestedAttributes(compiled(), "sample");
  const request = new RequestedAttributes(graph, program);
  return { graph, item, program, request };
}

describe("requested attributes on supplied graphs", () => {
  it("memoizes shared prerequisites without graph writes, retaining actual branch evidence", () => {
    const { graph, item, request } = fixture();
    const before = [graph.graphDigest(), graph.journal(), graph.provenance.getDecisions(), graph.diagnostics.getEntries()];
    const result = request.evaluate(item, "sum");
    expect(result.value).toBe(40);
    expect(request.evaluationCount).toBe(3);
    expect(request.evaluate(item, "sum")).toBe(result);
    expect(result.evidence?.parents).toHaveLength(1);
    const branch = request.evaluate(item, "branch");
    expect(branch.value).toBe(20);
    expect(branch.evidence?.reads.some((read) => read.subject === "first.missing")).toBe(false);
    expect(branch.evidence?.parents.map((parent) => parent.definition.path.at(-1))).toEqual(["own", "shared"]);
    expect([graph.graphDigest(), graph.journal(), graph.provenance.getDecisions(), graph.diagnostics.getEntries()]).toEqual(before);
    item.set("duration", 30, meta);
    expect(request.evaluate(item, "sum").value).toBe(120);
    expect(result.evidence?.parents[0].parents[0].reads[0].value).toEqual({ present: true, value: 10 });
  });

  it("separates values-only, requests, artifacts, and immutable parameter environments", () => {
    const { graph, item, request, program } = fixture();
    const values = request.evaluate(item, "sum", "values");
    expect(values).toEqual({ value: 40 });
    expect(request.evaluate(item, "sum").evidence).toBeDefined();
    expect(request.evaluationCount).toBe(6);
    const parameters = { scale: 3 };
    const other = new RequestedAttributes(graph, program, { parameters });
    parameters.scale = 9;
    expect(other.evaluate(item, "sum").value).toBe(60);
    const changed = checkRequestedAttributes(compiled({ ...definitions, sum: "shared + 1" }), "sample");
    expect(new RequestedAttributes(graph, changed).evaluate(item, "sum").value).toBe(21);
    expect(() => request.evaluate(fixture().item, "sum")).toThrow("E_ATTRIBUTE_ITEM");
    const scoped = new RequestedAttributes(graph, program, { parameterScopes: { fast: { scale: 4 } } });
    expect(scoped.evaluate(item, "sum").value).toBe(40);
    item.set("param_scope", "fast", meta);
    expect(scoped.evaluate(item, "sum").value).toBe(80);
  });

  it("records failed feature, topology, association, and temporal reads, then invalidates them", () => {
    const { graph, item, request } = fixture();
    expect(request.evaluate(item, "optional").evidence?.reads).toContainEqual(expect.objectContaining({ kind: "feature", value: { present: false, value: undefined } }));
    expect(request.evaluate(item, "neighbor").evidence?.reads).toContainEqual(expect.objectContaining({ kind: "topology", value: null }));
    expect(request.evaluate(item, "linked").evidence?.reads).toContainEqual(expect.objectContaining({ kind: "association", value: [] }));
    expect(request.evaluate(item, "anchor").evidence?.reads).toContainEqual(expect.objectContaining({ kind: "temporal", value: null }));
    item.set("missing", 15, meta);
    expect(request.evaluate(item, "optional").value).toBe(15);
    const second = graph.createItem("segment", "second");
    second.set("duration", 20, meta);
    graph.segments.append(second, meta);
    expect(request.evaluate(item, "neighbor").value).toBe(20);
    const member = request.evaluate(item, "member");
    expect(member.value).toEqual(new AttributeItemIdentity("second", "segment"));
    const link = graph.beginTransaction(meta);
    link.associate("link", item, second);
    link.commit();
    expect(request.evaluate(item, "linked").value).toBe(1);
    graph.anchorInterval(item, graph.axis.start.id, graph.axis.end.id, meta);
    const anchored = request.evaluate(item, "anchor");
    expect(anchored.value).toEqual({ leftMarkId: "START", rightMarkId: "END", ratio: 0.5 });
    graph.axis.setMarkTime("START", 5);
    expect(request.evaluate(item, "anchor")).not.toBe(anchored);
    const generation = graph.committedGeneration();
    graph.axis.createBetween("START", "END", null);
    expect(graph.committedGeneration()).toBeGreaterThan(generation);
  });

  it("preserves same-attempt reads and excludes detached values", () => {
    const { graph, item, request } = fixture();
    const transaction = graph.beginTransaction(meta);
    const detached = transaction.createItem("segment", "staged");
    const generation = graph.committedGeneration();
    detached.set("duration", 90, meta);
    expect(graph.committedGeneration()).toBe(generation);
    expect(() => request.evaluate(detached, "own")).toThrow("E_ATTRIBUTE_ITEM");
    transaction.set(item, "duration", 20);
    expect(request.evaluate(item, "own").value).toBe(10);
    transaction.set(item, "missing", request.evaluate(item, "own").value);
    transaction.commit();
    expect(item.get("missing")).toBe(10);
    expect(request.evaluate(item, "own").value).toBe(20);
  });

  it("blocks requests during apply and undo and never reuses a rolled-back generation", () => {
    const { graph, item, request } = fixture();
    const original = request.evaluate(item, "own");
    const generation = graph.committedGeneration();
    const pop = item._popWrite.bind(item);
    item._popWrite = (write) => {
      expect(() => request.evaluate(item, "own")).toThrow("E_ATTRIBUTE_UNCOMMITTED");
      pop(write);
    };
    expect(() => graph._commitAtomically(meta, () => {
      item.set("duration", 30, meta);
      expect(() => request.evaluate(item, "own")).toThrow("E_ATTRIBUTE_UNCOMMITTED");
      throw new Error("fixture rejection");
    })).toThrow("fixture rejection");
    expect(graph.committedGeneration()).toBeGreaterThan(generation);
    expect(request.evaluate(item, "own").value).toBe(10);
    expect(request.evaluate(item, "own")).not.toBe(original);
    item.set("duration", 40, meta);
    expect(request.evaluate(item, "own").value).toBe(40);
  });

  it("checks actual AST calls, preserves compiler source identities, and rejects effectful definitions", () => {
    const forged = Object.freeze({ ...compiled() });
    expect(() => checkRequestedAttributes(forged, "sample")).toThrow("E_RULEPACK_UNCHECKED");
    expect(checkPureExpression("'target(current)'", []).type).toBe("string");
    expect(() => checkPureExpression("target('AA')", [])).toThrow("E_ATTRIBUTE_IMPURE");
    expect(() => checkPureExpression("vocabulary('x', 'y')", [])).toThrow("E_ATTRIBUTE_IMPURE");
    expect(() => checkPureExpression("unknown + 1", [])).toThrow();
    const bundled = checkRequestedAttributes(loadBundledRulepackSpec("qlatt-english"), "place_f2_locus");
    expect(bundled.definitions.place.path).toEqual(["rules", "place_f2_locus", "define", "place"]);
    expect(bundled.definitions.place.sources[0].value.resource).toContain("formant.yaml");
  });

  it("matches same-stage uncached requests across order permutations and reports bounded counts", () => {
    const { graph, item, program } = fixture();
    const orders = [["sum", "branch", "shared"], ["shared", "branch", "sum"]];
    const start = performance.now();
    for (const order of orders) {
      const cached = new RequestedAttributes(graph, program);
      for (const name of order) {
        const reference = new RequestedAttributes(graph, program).evaluate(item, name);
        expect(cached.evaluate(item, name)).toEqual(reference);
      }
      expect(cached.evaluationCount).toBe(4);
    }
    console.info("supplied-graph attribute fixture", { elapsedMs: performance.now() - start, evaluationsPerOrder: 4, transactions: graph.journal().length });
    const before = graph.diagnostics.getEntries();
    runGraphRuleEngine(graph, compiled());
    expect(graph.diagnostics.getEntries()).toEqual(before);
  });
});
