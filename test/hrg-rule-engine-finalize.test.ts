import { describe, expect, it } from "vitest";
import { replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        duration: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
    point: {
      features: {
        value: { kind: "number" },
        tag: { kind: "string" },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    F0Point: { kind: "list", itemTypes: ["point"] },
  },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Taylor, Black & Caley 2001"],
};

function fixture(): Utterance {
  const utterance = new Utterance(SCHEMA);
  const transaction = utterance.beginTransaction(META);
  const first = transaction.createItem("segment", "first");
  const second = transaction.createItem("segment", "second");
  for (const [item, duration] of [[first, 100], [second, 50]] as const) {
    transaction.set(item, "duration", duration);
    transaction.set(item, "active", true);
    transaction.append("Segment", item);
  }
  transaction.partitionAnchors([first, second], utterance.axis.start.id, utterance.axis.end.id);
  transaction.commit();
  return utterance;
}

describe("graph-native phase finalization", () => {
  it("journals base timing, resolves point time, checkpoints, and replays", () => {
    const utterance = fixture();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", scalars: { duration: {} }, features: { active: [true, false] } },
        F0Point: { type: "point", value_type: "number" },
      },
      rules: {
        midpoint: {
          select: { relation: "Segment", where: "current.id == 'first'" },
          insert_point: { relation: "F0Point", at: "midpoint(current)", value: "100", tag: "f0" },
          citations: ["O'Shaughnessy 1976"],
        },
      },
      phases: [
        { name: "prosody", rules: ["midpoint"] },
        { name: "finalize", after: ["prosody"], rules: [], compute_times: true, resolve_points: ["F0Point"] },
      ],
    });

    runGraphRuleEngine(utterance, spec);

    const first = utterance.getItem("first");
    const second = utterance.getItem("second");
    if (!first || !second) throw new Error("missing fixture Items");
    const firstAnchor = utterance.intervalAnchor(first);
    const secondAnchor = utterance.intervalAnchor(second);
    if (!firstAnchor || !secondAnchor) throw new Error("missing fixture anchors");
    expect(utterance.axis.getMarkTime(firstAnchor.leftMarkId)).toBe(0);
    expect(utterance.axis.getMarkTime(firstAnchor.rightMarkId)).toBe(100);
    expect(utterance.axis.getMarkTime(secondAnchor.rightMarkId)).toBe(150);
    const point = utterance.relation("F0Point").listItems()[0];
    expect(utterance.resolveAnchorTime(point)).toBe(50);
    expect(utterance.checkpoints().map((checkpoint) => checkpoint.phase)).toEqual(["prosody", "finalize"]);
    expect(utterance.journal().at(-1)?.operations.map((operation) => operation.kind)).toEqual([
      "resolve_mark_time",
      "resolve_mark_time",
      "resolve_mark_time",
    ]);
    expect(replayJournal(SCHEMA, utterance.journal()).graphDigest()).toBe(utterance.graphDigest());
  });

  it("rejects a structural firing after timing finalization", () => {
    const utterance = fixture();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", scalars: { duration: {} }, features: { active: [true, false] } },
      },
      rules: {
        late_suppress: {
          select: { relation: "Segment", where: "current.id == 'first'" },
          suppress: true,
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [
        { name: "finalize", rules: [], compute_times: true },
        { name: "late", after: ["finalize"], rules: ["late_suppress"] },
      ],
    });

    expect(() => runGraphRuleEngine(utterance, spec)).toThrowError(/E_FINALIZE_DIRTY/);
    expect(utterance.getItem("first")?.get("active")).toBe(true);
  });

  it("allows scalar-only rules after timing finalization", () => {
    const utterance = fixture();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: { type: "base", scalars: { duration: {} }, features: { active: [true, false] } },
      },
      rules: {
        late_scalar: {
          select: { relation: "Segment", where: "current.id == 'first'" },
          apply: [{ field: "duration", op: "add", value: "5", tag: "late" }],
          citations: ["Klatt 1976"],
        },
      },
      phases: [
        { name: "finalize", rules: [], compute_times: true },
        { name: "late", after: ["finalize"], rules: ["late_scalar"] },
      ],
    });

    runGraphRuleEngine(utterance, spec);
    expect(utterance.getItem("first")?.get("duration")).toBe(105);
  });
});
