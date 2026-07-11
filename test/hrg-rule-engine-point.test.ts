import { describe, expect, it } from "vitest";
import { replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        active: { kind: "boolean" },
      },
    },
    f0Point: {
      features: {
        value: { kind: "number" },
        tag: { kind: "string" },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    F0Point: { kind: "list", itemTypes: ["f0Point"] },
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
  for (const [item, phoneme] of [[first, "AA"], [second, "IY"]] as const) {
    transaction.set(item, "phoneme", phoneme);
    transaction.set(item, "active", true);
    transaction.append("Segment", item);
  }
  transaction.partitionAnchors(
    [first, second],
    utterance.axis.start.id,
    utterance.axis.end.id,
  );
  transaction.commit();
  return utterance;
}

describe("graph-native point action execution", () => {
  it("creates midpoint, ratio, and sync points atomically and replays them", () => {
    const utterance = fixture();
    const spec = compileRuleEngineSpec({
      parameters: { base: 100 },
      relations: {
        Segment: { type: "base", features: { phoneme: [], active: [true, false] } },
        F0Point: { type: "point", value_type: "number" },
      },
      rules: {
        first_points: {
          select: { relation: "Segment", where: "current.id == 'first'" },
          insert_points: [
            { relation: "F0Point", at: "midpoint(current)", value: "params.base + current_index", tag: "mid" },
            { relation: "F0Point", at: "at_ratio(current, 0.25)", value: "120", tag: "ratio" },
          ],
          citations: ["O'Shaughnessy 1976"],
        },
        final_point: {
          select: { relation: "Segment", where: "current.id == 'second'" },
          insert_point: {
            relation: "F0Point",
            at: "at_sync(current.sync_right)",
            value: "90",
            tag: "tail",
          },
          citations: ["O'Shaughnessy 1976"],
        },
      },
      phases: [{ name: "prosody", rules: ["first_points", "final_point"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const points = utterance.relation("F0Point").listItems();
    expect(points.map((point) => [point.get("value"), point.get("tag")])).toEqual([
      [100, "mid"],
      [120, "ratio"],
      [90, "tail"],
    ]);
    expect(utterance.temporalAnchor(points[0])).toEqual(expect.objectContaining({ kind: "point", ratio: 0.5 }));
    expect(utterance.temporalAnchor(points[1])).toEqual(expect.objectContaining({ kind: "point", ratio: 0.25 }));
    const tail = utterance.temporalAnchor(points[2]);
    expect(tail).toEqual(expect.objectContaining({
      kind: "point",
      leftMarkId: utterance.axis.end.id,
      rightMarkId: utterance.axis.end.id,
      ratio: 0,
    }));
    expect(replayJournal(SCHEMA, utterance.journal()).graphDigest()).toBe(utterance.graphDigest());
  });
});
