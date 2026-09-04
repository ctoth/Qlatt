import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { createDiagnostics } from "../src/diagnostics";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        dur_ms: { kind: "number" },
      },
    },
    point: { features: { value: { kind: "number" } } },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    F0Point: { kind: "list", itemTypes: ["point"] },
  },
} as const satisfies HrgSchema;

const META = {
  ruleId: "set_segment",
  phase: "duration",
  tag: "duration",
  reason: "set_segment matched",
  citations: ["Klatt 1976"],
};

describe("HRG atomic transactions", () => {
  it("rejects a bad multi-write batch without partial graph, provenance, or journal mutation", () => {
    const diagnostics = createDiagnostics();
    const utterance = new Utterance(SCHEMA, undefined, diagnostics);
    const segment = utterance.createItem("segment", "s1");
    const transaction = utterance.beginTransaction(META);
    transaction.set(segment, "phoneme", "AA");
    transaction.set(segment, "dur_ms", "invalid");

    expect(() => transaction.commit()).toThrowError(/E_HRG_FEATURE_VALUE/);
    expect(segment.featureKeys()).toEqual([]);
    expect(utterance.provenance.getDecisions()).toEqual([]);
    expect(utterance.journal()).toEqual([]);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ level: "error", code: "HRG_TRANSACTION_REJECTED" }),
    );
  });

  it("validates relation operations before committing earlier feature writes", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "s1");
    const point = utterance.createItem("point", "p1");
    const transaction = utterance.beginTransaction(META);
    transaction.set(segment, "phoneme", "AA");
    transaction.append("Segment", point);

    expect(() => transaction.commit()).toThrowError(/E_HRG_RELATION_ITEM_TYPE/);
    expect(segment.has("phoneme")).toBe(false);
    expect(utterance.relation("Segment").listItems()).toEqual([]);
  });

  it("threads explicit reads into every committed write and the immutable journal", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "s1");
    const source = segment.set("phoneme", "AA", {
      reason: "inventory",
      citations: ["Peterson & Barney 1952"],
    });
    const transaction = utterance.beginTransaction(META);

    expect(transaction.read(segment, "phoneme")).toBe("AA");
    transaction.set(segment, "dur_ms", 120);
    transaction.append("Segment", segment);
    const entry = transaction.commit();

    expect(segment.latestWrite("dur_ms")).toMatchObject({
      ruleId: META.ruleId,
      tag: META.tag,
      parents: expect.arrayContaining([source.decisionId]),
    });
    expect(segment.node("Segment")?.write).toMatchObject({
      ruleId: META.ruleId,
      tag: META.tag,
      parents: expect.arrayContaining([source.decisionId]),
    });
    expect(entry.readSet).toEqual([source.decisionId]);
    expect(entry.operations).toEqual([
      { kind: "set_feature", itemId: "s1", key: "dur_ms", value: 120 },
      { kind: "append", relationName: "Segment", itemId: "s1" },
    ]);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(utterance.journal()).toEqual([entry]);
    expect(Object.isFrozen(utterance.journal())).toBe(true);
  });
});
