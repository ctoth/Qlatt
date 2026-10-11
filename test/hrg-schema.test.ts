import { describe, expect, it } from "vitest";
import type {
  FeatureSchema,
  HrgSchema,
  ItemTypeSchema,
  RelationSchema,
} from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";

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

const TARGET_SCHEMA = {
  kind: "union",
  variants: [
    { kind: "number" },
    { kind: "null" },
    { kind: "object", fields: { hz: { kind: "number" } } },
    { kind: "array", items: { kind: "number" } },
  ],
} as const satisfies FeatureSchema;

/** One feature of every schema kind, to pin the text of each rejection. */
const VALUE_SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        ...SCHEMA.itemTypes.segment.features,
        place: { kind: "string", values: ["labial", "velar"] },
        voiced: { kind: "boolean" },
        absent: { kind: "null" },
        kind: { kind: "literal", value: "segment" },
        tracks: {
          kind: "object",
          fields: {},
          additional: {
            kind: "array",
            items: { kind: "array", items: { kind: "number" } },
          },
        },
        target: TARGET_SCHEMA,
        targets: { kind: "array", items: TARGET_SCHEMA },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
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

  it("says where a value was rejected and what was expected there", () => {
    const utterance = new Utterance(VALUE_SCHEMA);
    const segment = utterance.createItem("segment");
    const message = (key: string, value: unknown): string => {
      try {
        segment.set(key, value, WRITE);
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
      return "accepted";
    };
    const at = (key: string, path: string, expected: string): string =>
      `E_HRG_FEATURE_VALUE: item type 'segment' feature '${key}' at '${path}' must be ${expected}`;

    expect(message("dur_ms", "slow")).toBe(at("dur_ms", "dur_ms", "a finite number"));
    expect(message("dur_ms", Number.NaN)).toBe(at("dur_ms", "dur_ms", "a finite number"));
    expect(message("place", "uvular")).toBe(at("place", "place", "one of [labial, velar]"));
    expect(message("voiced", 1)).toBe(at("voiced", "voiced", "a boolean"));
    expect(message("absent", 0)).toBe(at("absent", "absent", "null"));
    expect(message("kind", "point")).toBe(at("kind", "kind", 'the literal "segment"'));
    expect(message("metadata", [])).toBe(at("metadata", "metadata", "an object"));
    expect(message("metadata", { source: "inventory" })).toBe(
      at("metadata", "metadata.weights", "present"),
    );
    expect(message("metadata", { source: "inventory", weights: 1 })).toBe(
      at("metadata", "metadata.weights", "an array"),
    );
    expect(message("metadata", { source: "inventory", weights: [0.5, "heavy"] })).toBe(
      at("metadata", "metadata.weights[1]", "a finite number"),
    );
    expect(message("metadata", { source: "inventory", weights: [], extra: 1 })).toBe(
      at("metadata", "metadata.extra", "a declared field"),
    );
    expect(message("tracks", { f1: [[0, 500]], f2: [[0, "high"]] })).toBe(
      at("tracks", "tracks.f2[0][1]", "a finite number"),
    );
    // A union names itself, not the variant that came nearest.
    expect(message("target", "high")).toBe(
      at("target", "target", "one of the declared union variants (received string)"),
    );
    expect(message("target", { hz: "high" })).toBe(
      at("target", "target", "one of the declared union variants (received object)"),
    );
    expect(message("targets", [120, null, [1, "2"]])).toBe(
      at("targets", "targets[2]", "one of the declared union variants (received object)"),
    );
    expect(segment.featureKeys()).toEqual([]);
  });

  it("stores the copy made by the first union variant that accepts a value", () => {
    const utterance = new Utterance(VALUE_SCHEMA);
    const segment = utterance.createItem("segment");
    const pair = [1, 2];
    const targets = [120, null, { hz: 90 }, pair];

    segment.set("target", 120, WRITE);
    expect(segment.get("target")).toBe(120);
    segment.set("target", null, WRITE);
    expect(segment.get("target")).toBeNull();
    segment.set("targets", targets, WRITE);
    pair[0] = 99;

    const stored = segment.get("targets");
    expect(stored).toEqual([120, null, { hz: 90 }, [1, 2]]);
    expect(stored).not.toBe(targets);
    expect(Object.isFrozen(stored)).toBe(true);
    expect((stored as readonly unknown[]).every((entry) => Object.isFrozen(entry))).toBe(true);
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
    const storedWeights =
      stored && typeof stored === "object" && !Array.isArray(stored) && "weights" in stored
        ? stored.weights
        : null;
    expect(Object.isFrozen(storedWeights)).toBe(true);
  });

  it("enforces declared relation membership and topology before attachment", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment");
    const point = utterance.createItem("point");

    expect(() => utterance.relation("Unknown")).toThrowError(/E_HRG_RELATION_UNDECLARED/);
    expect(() => utterance.relation("Segment").append(point, WRITE)).toThrowError(
      /E_HRG_RELATION_ITEM_TYPE/,
    );
    expect(point.node("Segment")).toBeUndefined();
    expect(utterance.relation("Segment").append(segment, WRITE).item).toBe(segment);
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
    expect(() => utterance.relation("Segment").append(point, WRITE)).toThrowError(
      /E_HRG_RELATION_ITEM_TYPE/,
    );
  });
});
