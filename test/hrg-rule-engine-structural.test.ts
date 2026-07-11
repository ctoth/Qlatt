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
        duration: { kind: "number" },
        stress: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

describe("graph-native structural splice execution", () => {
  it("atomically suppresses, inserts, orders, and partitions replacement Items", () => {
    const utterance = new Utterance(SCHEMA);
    const fixture = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "fixture",
      ...INPUT,
    });
    const source = fixture.createItem("segment", "source");
    fixture.set(source, "phoneme", "AY");
    fixture.set(source, "duration", 120);
    fixture.set(source, "active", true);
    fixture.append("Segment", source);
    fixture.partitionAnchors([source], utterance.axis.start.id, utterance.axis.end.id);
    fixture.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: [], active: [true, false] },
          scalars: { duration: {} },
        },
      },
      rules: {
        expand_diphthong: {
          select: { relation: "Segment", where: "current.phoneme == 'AY'" },
          splice: {
            type: "replace_range",
            insert: [
              { phoneme: "'AA'", duration: "current.duration * 0.75", active: "true" },
              { phoneme: "'Y'", duration: "current.duration * 0.25", active: "true" },
            ],
          },
          citations: ["Allen et al. 1987"],
        },
      },
      phases: [{ name: "structural", rules: ["expand_diphthong"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const items = utterance.relation("Segment").listItems();
    expect(items.map((item) => item.id)).toEqual([
      "source",
      "source:expand_diphthong:0",
      "source:expand_diphthong:1",
    ]);
    expect(source.get("active")).toBe(false);
    expect(items[1].get("phoneme")).toBe("AA");
    expect(items[1].get("duration")).toBe(90);
    expect(items[2].get("phoneme")).toBe("Y");
    expect(items[2].get("duration")).toBe(30);
    const firstAnchor = utterance.intervalAnchor(items[1]);
    const secondAnchor = utterance.intervalAnchor(items[2]);
    expect(firstAnchor?.leftMarkId).toBe(utterance.axis.start.id);
    expect(firstAnchor?.rightMarkId).toBe(secondAnchor?.leftMarkId);
    expect(secondAnchor?.rightMarkId).toBe(utterance.axis.end.id);
    expect(utterance.journal()).toHaveLength(2);
    expect(utterance.journal()[1].operations.map((operation) => operation.kind)).toEqual([
      "set_feature",
      "create_item",
      "set_feature",
      "set_feature",
      "set_feature",
      "insert_after",
      "create_item",
      "set_feature",
      "set_feature",
      "set_feature",
      "insert_after",
      "partition_anchors",
    ]);
    expect(replayJournal(SCHEMA, utterance.journal()).graphDigest()).toBe(utterance.graphDigest());
  });

  it("derives a pattern range from tracked anchors and materializes a nested segment", () => {
    const utterance = new Utterance(SCHEMA);
    const fixture = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "fixture",
      ...INPUT,
    });
    const stop = fixture.createItem("segment", "stop");
    const vowel = fixture.createItem("segment", "vowel");
    for (const [item, phoneme, duration, stress] of [
      [stop, "T", 50, 0],
      [vowel, "AA", 100, 1],
    ] as const) {
      fixture.set(item, "phoneme", phoneme);
      fixture.set(item, "duration", duration);
      fixture.set(item, "stress", stress);
      fixture.set(item, "active", true);
      fixture.append("Segment", item);
    }
    fixture.partitionAnchors([stop, vowel], utterance.axis.start.id, utterance.axis.end.id);
    fixture.commit();
    const spec = compileRuleEngineSpec({
      parameters: { replacement: { phoneme: "CV", duration: 150 } },
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: [], active: [true, false] },
          scalars: { duration: {}, stress: {} },
        },
      },
      patterns: {
        cv: {
          relation: "Segment",
          sequence: [
            { capture: "c", where: "current.phoneme == 'T'" },
            { capture: "v", where: "current.phoneme == 'AA'" },
          ],
        },
      },
      rules: {
        coalesce: {
          match: "cv",
          splice: {
            type: "replace_range",
            range_left: "c.sync_left",
            range_right: "v.sync_right",
            insert: [
              {
                segment: {
                  target: "params.replacement",
                  copy_from: "v",
                  copy_fields: ["stress"],
                  fields: { active: "true" },
                },
              },
            ],
          },
          citations: ["Taylor, Black & Caley 2001"],
        },
      },
      phases: [{ name: "structural", rules: ["coalesce"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const items = utterance.relation("Segment").listItems();
    expect(items.map((item) => item.id)).toEqual(["stop", "vowel", "stop:coalesce:0"]);
    expect(stop.get("active")).toBe(false);
    expect(vowel.get("active")).toBe(false);
    expect(items[2].get("phoneme")).toBe("CV");
    expect(items[2].get("duration")).toBe(150);
    expect(items[2].get("stress")).toBe(1);
    expect(utterance.intervalAnchor(items[2])).toEqual(
      expect.objectContaining({
        leftMarkId: utterance.axis.start.id,
        rightMarkId: utterance.axis.end.id,
      }),
    );
  });

  it("inserts at a selected boundary in relation and temporal order", () => {
    const utterance = new Utterance(SCHEMA);
    const fixture = utterance.beginTransaction({
      ruleId: "fixture",
      phase: "input",
      tag: "fixture",
      ...INPUT,
    });
    const first = fixture.createItem("segment", "first");
    const second = fixture.createItem("segment", "second");
    for (const [item, phoneme] of [[first, "T"], [second, "AA"]] as const) {
      fixture.set(item, "phoneme", phoneme);
      fixture.set(item, "duration", 100);
      fixture.set(item, "active", true);
      fixture.append("Segment", item);
    }
    fixture.partitionAnchors([first, second], utterance.axis.start.id, utterance.axis.end.id);
    fixture.commit();
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: [], active: [true, false] },
          scalars: { duration: {} },
        },
      },
      rules: {
        release: {
          select: { relation: "Segment", where: "current.id == 'first'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ phoneme: "'REL'", duration: "20", active: "true" }],
          },
          citations: ["Klatt 1980"],
        },
      },
      phases: [{ name: "structural", rules: ["release"] }],
    });

    runGraphRuleEngine(utterance, spec);

    const items = utterance.relation("Segment").listItems();
    expect(items.map((item) => item.id)).toEqual(["first", "first:release:0", "second"]);
    const insertedAnchor = utterance.intervalAnchor(items[1]);
    const secondAnchor = utterance.intervalAnchor(second);
    expect(insertedAnchor).toEqual(expect.objectContaining({
      leftMarkId: secondAnchor?.leftMarkId,
      rightMarkId: secondAnchor?.rightMarkId,
    }));
  });
});
