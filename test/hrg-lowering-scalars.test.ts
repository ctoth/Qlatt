import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Klatt 1980"],
};

function schemaFor(columns: readonly string[]): HrgSchema {
  const features: Record<string, FeatureSchema> = {
    active: { kind: "boolean" },
    duration: { kind: "number" },
    phoneme: { kind: "string" },
  };
  for (const column of columns) features[column] = { kind: "number" };
  return {
    itemTypes: { segment: { features } },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  };
}

function resolveSingleSegment(utterance: Utterance, segment: Item, durationMs: number): void {
  const anchor = utterance.intervalAnchor(segment);
  if (!anchor) throw new Error("fixture interval anchor missing");
  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  timing.resolveMarkTime(anchor.leftMarkId, 0);
  timing.resolveMarkTime(anchor.rightMarkId, durationMs);
  timing.commit();
}

function loweringOptions(columns: readonly string[]): LowerOptions {
  return {
    columns,
    timeline: {
      initial_silence_ms: { value: 0 },
      final_silence_ms: { value: 0 },
      duration_floors: {
        stop_release_ms: { value: 0 },
        default_ms: { value: 0 },
      },
    },
  };
}

describe("HRG lowering scalar histories", () => {
  it("uses the latest stamped value and decision from a feature write history", () => {
    const utterance = new Utterance(schemaFor(["F1"]));
    const build = utterance.beginTransaction(META);
    const segment = build.createItem("segment", "history");
    build.set(segment, "phoneme", "AA");
    build.set(segment, "duration", 10);
    build.set(segment, "active", true);
    build.append("Segment", segment);
    build.partitionAnchors([segment], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    segment.set("F1", 500, { reason: "inventory target", citations: ["Klatt 1980"] });
    const latest = segment.set("F1", 700, {
      reason: "contextual rewrite",
      citations: ["Fant 1960"],
    });
    resolveSingleSegment(utterance, segment, 10);

    const lowered = lowerToFrames(utterance, loweringOptions(["F1"]));
    const segmentFrame = lowered.frames.find((frame) => frame.segmentId === "history");

    expect(segment.writes("F1")).toHaveLength(2);
    expect(segmentFrame?.params.F1).toBe(700);
    expect(segmentFrame?.provenance.F1).toBe(latest.decisionId);
    const segmentIndex = lowered.frames.findIndex((frame) => frame.segmentId === "history");
    expect(lowered.provenanceByFrame[segmentIndex].F1).toBe(latest.decisionId);
  });
});
