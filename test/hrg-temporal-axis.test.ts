import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        active: { kind: "boolean" },
      },
    },
    point: { features: { value: { kind: "number" } } },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    F0Point: { kind: "list", itemTypes: ["point"] },
  },
} as const satisfies HrgSchema;

const INPUT = {
  reason: "temporal fixture construction",
  citations: ["Hertz 1987 Delta"],
  stage: "rules" as const,
};

describe("Utterance-owned temporal axis", () => {
  it("keeps mark identity and anchor order stable across insertion and suppression", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "s1");
    segment.set("phoneme", "AA", INPUT);
    segment.set("active", true, INPUT);
    utterance.segments.append(segment, INPUT);

    const start = utterance.axis.start;
    const end = utterance.axis.end;
    const middle = utterance.createMarkBetween(start.id, end.id, INPUT);
    const anchor = utterance.anchorInterval(segment, start.id, middle.id, INPUT);
    const inserted = utterance.createMarkBetween(start.id, middle.id, INPUT);

    expect(utterance.axis.compare(start.id, inserted.id)).toBeLessThan(0);
    expect(utterance.axis.compare(inserted.id, middle.id)).toBeLessThan(0);
    expect(utterance.intervalAnchor(segment)).toMatchObject({
      leftMarkId: start.id,
      rightMarkId: middle.id,
      decisionId: anchor.decisionId,
    });

    segment.set("active", false, { ...INPUT, reason: "structural suppression" });
    expect(utterance.axis.get(middle.id)).toBe(middle);
    expect(utterance.intervalAnchor(segment)?.rightMarkId).toBe(middle.id);
  });

  it("resolves interval and ratio point anchors from versioned mark times", () => {
    const utterance = new Utterance(SCHEMA);
    const point = utterance.createItem("point", "f0_1");
    point.set("value", 140, INPUT);
    utterance.relation("F0Point").append(point, INPUT);

    const middle = utterance.createMarkBetween(
      utterance.axis.start.id,
      utterance.axis.end.id,
      INPUT,
    );
    utterance.anchorPoint(point, utterance.axis.start.id, middle.id, 0.25, INPUT);
    const startTime = utterance.resolveMarkTime(utterance.axis.start.id, 0, INPUT);
    const firstMiddleTime = utterance.resolveMarkTime(middle.id, 100, INPUT);
    const secondMiddleTime = utterance.resolveMarkTime(middle.id, 120, {
      ...INPUT,
      reason: "duration rewrite",
    });

    expect(startTime.version).toBe(0);
    expect(firstMiddleTime.version).toBe(0);
    expect(secondMiddleTime.version).toBe(1);
    expect(secondMiddleTime.parents).toContain(firstMiddleTime.decisionId);
    expect(utterance.resolveAnchorTime(point)).toBe(30);
  });

  it("rejects reversed or unknown anchors before provenance mutation", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment");
    const decisionCount = utterance.provenance.getDecisions().length;

    expect(() =>
      utterance.anchorInterval(segment, utterance.axis.end.id, utterance.axis.start.id, INPUT),
    ).toThrowError(/E_HRG_TEMPORAL_ORDER/);
    expect(() => utterance.resolveMarkTime("missing", 10, INPUT)).toThrowError(
      /E_HRG_TEMPORAL_MARK_UNKNOWN/,
    );
    expect(utterance.provenance.getDecisions()).toHaveLength(decisionCount);
  });
});
