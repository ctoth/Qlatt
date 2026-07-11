import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, Item } from "../src/declarative-frontend/hrg";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Klatt 1980"],
};

type ScalarBaseline = {
  columns: string[];
  durationMs: number;
  itemId: string;
  params: Record<string, number>;
  phoneme: string;
};

function latestFeature(item: Readonly<Record<string, unknown>>, key: string): unknown {
  const features = item.features;
  if (!isPlainObject(features)) throw new Error("baseline Item features missing");
  const history = features[key];
  if (!Array.isArray(history) || history.length === 0) throw new Error(`baseline ${key} missing`);
  const latest = history[history.length - 1];
  if (!isPlainObject(latest)) throw new Error(`baseline ${key} history invalid`);
  return latest.value;
}

function loadScalarBaseline(fileName: string): ScalarBaseline {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL(`./fixtures/hrg-convergence-baseline/${fileName}`, import.meta.url),
    "utf8",
  ));
  if (
    !isPlainObject(parsed)
    || !isPlainObject(parsed.reconstructedGraph)
    || !isPlainObject(parsed.reconstructedLowering)
  ) {
    throw new Error("baseline graph/lowering missing");
  }
  const items = parsed.reconstructedGraph.items;
  const columns = parsed.reconstructedLowering.paramKeys;
  const frames = parsed.reconstructedLowering.frames;
  if (!Array.isArray(items) || !Array.isArray(columns) || !Array.isArray(frames)) {
    throw new Error("baseline scalar collections missing");
  }
  if (columns.some((column) => typeof column !== "string")) {
    throw new Error("baseline columns invalid");
  }
  const item = items.find((candidate) => isPlainObject(candidate) && candidate.type === "segment");
  const frame = frames[0];
  if (!isPlainObject(item) || typeof item.id !== "string" || !isPlainObject(frame)) {
    throw new Error("baseline first Segment/frame missing");
  }
  const frameParams = frame.params;
  const phoneme = latestFeature(item, "phoneme");
  const durationMs = latestFeature(item, "dur_ms");
  if (!isPlainObject(frameParams) || typeof phoneme !== "string" || typeof durationMs !== "number") {
    throw new Error("baseline first Segment/frame invalid");
  }

  const params: Record<string, number> = {};
  for (const column of columns) {
    const graphValue = latestFeature(item, column);
    const frameValue = frameParams[column];
    if (typeof graphValue !== "number" || typeof frameValue !== "number") {
      throw new Error(`baseline column '${column}' is not numeric`);
    }
    params[column] = graphValue;
  }
  return { columns, durationMs, itemId: item.id, params, phoneme };
}

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

describe("HRG lowering scalar histories", () => {
  it.each([
    ["qlatt-English", "qlatt-english", "qlatt-english-fricatives.json"],
    ["DECtalk English", "dectalk-english", "dectalk-english-stops.json"],
    ["qlatt-beauty structural", "qlatt-beauty", "qlatt-beauty-bridge-demo.json"],
  ])("projects every declared %s column from current graph values", (_label, frontendId, fileName) => {
    const baseline = loadScalarBaseline(fileName);
    const spec: unknown = loadBundledRulepackSpec(frontendId);
    if (!isPlainObject(spec) || !isPlainObject(spec.output) || !isPlainObject(spec.output.lowering)) {
      throw new Error("compiled lowering policy missing");
    }
    expect(spec.output.lowering.columns).toEqual(baseline.columns);
    const utterance = new Utterance(schemaFor(baseline.columns));
    const build = utterance.beginTransaction(META);
    const segment = build.createItem("segment", baseline.itemId);
    build.set(segment, "phoneme", baseline.phoneme);
    build.set(segment, "duration", baseline.durationMs);
    build.set(segment, "active", true);
    for (const column of baseline.columns) build.set(segment, column, baseline.params[column]);
    build.append("Segment", segment);
    build.partitionAnchors([segment], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    resolveSingleSegment(utterance, segment, baseline.durationMs);

    const lowered = lowerToFrames(utterance, { columns: baseline.columns });

    expect(lowered.paramKeys).toEqual(baseline.columns);
    expect(lowered.frames[0].params).toEqual(baseline.params);
  });

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

    const lowered = lowerToFrames(utterance, { columns: ["F1"] });

    expect(segment.writes("F1")).toHaveLength(2);
    expect(lowered.frames[0].params.F1).toBe(700);
    expect(lowered.frames[0].provenance.F1).toBe(latest.decisionId);
    expect(lowered.provenanceByFrame[0].F1).toBe(latest.decisionId);
  });
});
