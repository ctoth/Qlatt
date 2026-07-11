import { describe, expect, it } from "vitest";
import { Utterance } from "../src/declarative-frontend/hrg";
import type {
  FeatureSchema,
  HrgSchema,
  ItemTypeSchema,
  RelationSchema,
} from "../src/declarative-frontend/hrg";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        dur_ms: { kind: "number" },
        metadata: {
          kind: "object",
          fields: {
            source: { kind: "string" },
            weights: { kind: "array", items: { kind: "number" } },
          },
        },
      },
    },
    point: {
      features: {
        value: { kind: "number" },
      },
    },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    F0Point: { kind: "list", itemTypes: ["point"] },
  },
} as const satisfies HrgSchema;

const WRITE = { reason: "schema test", citations: ["Taylor, Black & Caley 2001"] };

describe("HRG schema enforcement", () => {
  it("rejects undeclared item types and features before mutation", () => {
    const utterance = new Utterance(SCHEMA);
    expect(() => utterance.createItem("word")).toThrowError(/E_HRG_ITEM_TYPE_UNDECLARED/);
    expect(utterance.allItems()).toHaveLength(0);

    const segment = utterance.createItem("segment");
    expect(() => segment.set("mystery", 1, WRITE)).toThrowError(/E_HRG_FEATURE_UNDECLARED/);
    expect(segment.featureKeys()).toEqual([]);
    expect(utterance.provenance.getDecisions()).toEqual([]);
  });

  it("rejects values that do not match the declared discriminated schema", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment");
    expect(() => segment.set("dur_ms", "slow", WRITE)).toThrowError(/E_HRG_FEATURE_VALUE/);
    expect(segment.has("dur_ms")).toBe(false);
  });

  it("stores structured values as validated immutable copies", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment");
    const metadata = { source: "inventory", weights: [0.25, 0.75] };

    segment.set("metadata", metadata, WRITE);
    metadata.source = "mutated";
    metadata.weights[0] = 99;

    const stored = segment.get("metadata");
    expect(stored).toEqual({ source: "inventory", weights: [0.25, 0.75] });
    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored && typeof stored === "object" ? stored.weights : null)).toBe(true);
  });

  it("enforces declared relation membership and topology before attachment", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment");
    const point = utterance.createItem("point");

    expect(() => utterance.relation("Unknown")).toThrowError(/E_HRG_RELATION_UNDECLARED/);
    expect(() => utterance.relation("Segment").append(point)).toThrowError(/E_HRG_RELATION_ITEM_TYPE/);
    expect(point.node("Segment")).toBeUndefined();
    expect(utterance.relation("Segment").append(segment).item).toBe(segment);
  });

  it("cannot be schema-poisoned through caller-owned objects after construction", () => {
    const segmentFeatures: Record<string, FeatureSchema> = {
      phoneme: { kind: "string" },
    };
    const itemTypes: Record<string, ItemTypeSchema> = {
      segment: { features: segmentFeatures },
      point: { features: { value: { kind: "number" } } },
    };
    const segmentItemTypes = ["segment"];
    const relations: Record<string, RelationSchema> = {
      Segment: { kind: "list", itemTypes: segmentItemTypes },
    };
    const utterance = new Utterance({ itemTypes, relations });
    const segment = utterance.createItem("segment");
    const point = utterance.createItem("point");

    segmentFeatures.mystery = { kind: "number" };
    segmentItemTypes.push("point");

    expect(() => segment.set("mystery", 1, WRITE)).toThrowError(/E_HRG_FEATURE_UNDECLARED/);
    expect(() => utterance.relation("Segment").append(point)).toThrowError(/E_HRG_RELATION_ITEM_TYPE/);
  });
});
