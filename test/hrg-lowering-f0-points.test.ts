import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";
import { loadInventorySpecFromPath } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

const META = {
  ruleId: "fixture",
  phase: "prosody",
  tag: "f0",
  reason: "captured point-contour fixture",
  citations: ["O'Shaughnessy 1976"],
};

type BaselinePoint = {
  id: string;
  tag?: string;
  timeMs: number;
  valueHz: number;
};

type BaselineSegment = {
  duration: number;
  id: string;
  params: Record<string, number>;
  phoneme: string;
  type: string;
};

type ProductionFrame = {
  params: Record<string, number>;
  phoneme?: string;
  time: number;
};

function latestFeature(item: Readonly<Record<string, unknown>>, key: string): unknown {
  if (!isPlainObject(item.features)) throw new Error("baseline Item features missing");
  const history = item.features[key];
  if (!Array.isArray(history) || history.length === 0) throw new Error(`baseline ${key} missing`);
  const write = history[history.length - 1];
  if (!isPlainObject(write)) throw new Error(`baseline ${key} history invalid`);
  return write.value;
}

function schemaFor(columns: readonly string[]): HrgSchema {
  const segmentFeatures: Record<string, FeatureSchema> = {
    active: { kind: "boolean" },
    duration: { kind: "number" },
    phoneme: { kind: "string" },
    type: { kind: "string" },
  };
  for (const column of columns) segmentFeatures[column] = { kind: "number" };
  return {
    itemTypes: {
      f0Point: {
        features: {
          tag: { kind: "string" },
          value: { kind: "number" },
        },
      },
      segment: { features: segmentFeatures },
    },
    relations: {
      F0Point: { kind: "list", itemTypes: ["f0Point"] },
      Segment: { kind: "list", itemTypes: ["segment"] },
    },
  };
}

function readFixture(): {
  points: BaselinePoint[];
  policy: LowerOptions;
  productionFrames: ProductionFrame[];
  segments: BaselineSegment[];
} {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL("./fixtures/hrg-convergence-baseline/qlatt-english-fricatives.json", import.meta.url),
    "utf8",
  ));
  const spec = loadBundledRulepackSpec("qlatt-english");
  if (
    !isPlainObject(parsed)
    || !isPlainObject(parsed.reconstructedGraph)
    || !Array.isArray(parsed.reconstructedGraph.items)
    || !isPlainObject(parsed.oldProduction)
    || !isPlainObject(parsed.oldProduction.controlScore)
    || !Array.isArray(parsed.oldProduction.controlScore.f0_points)
    || !Array.isArray(parsed.oldProduction.sourceFrames)
    || typeof spec.inventory_path !== "string"
  ) {
    throw new Error("point-contour fixture/spec invalid");
  }
  const policy: LowerOptions = spec.output.lowering;
  const inventory = loadInventorySpecFromPath(spec.inventory_path).phoneme_targets;
  const segments = parsed.reconstructedGraph.items.flatMap((item): BaselineSegment[] => {
    if (!isPlainObject(item) || item.type !== "segment" || typeof item.id !== "string") return [];
    const phoneme = latestFeature(item, "phoneme");
    const duration = latestFeature(item, "dur_ms");
    if (typeof phoneme !== "string" || typeof duration !== "number") {
      throw new Error("baseline Segment invalid");
    }
    const target = inventory[phoneme] ?? inventory[`${phoneme}0`] ?? inventory[`${phoneme}1`];
    if (!target || typeof target.type !== "string") throw new Error(`inventory type missing for ${phoneme}`);
    const params: Record<string, number> = {};
    for (const column of policy.columns) {
      const value = latestFeature(item, column);
      if (typeof value !== "number") throw new Error(`baseline '${column}' invalid`);
      params[column] = value;
    }
    return [{ duration, id: item.id, params, phoneme, type: target.type }];
  });
  const points = parsed.oldProduction.controlScore.f0_points.map((point): BaselinePoint => {
    if (
      !isPlainObject(point)
      || typeof point.id !== "string"
      || !isPlainObject(point.timing)
      || point.timing.kind !== "absolute"
      || typeof point.timing.time_ms !== "number"
      || typeof point.value_hz !== "number"
    ) {
      throw new Error("baseline F0 point invalid");
    }
    return {
      id: point.id,
      timeMs: point.timing.time_ms,
      valueHz: point.value_hz,
      ...(typeof point.tag === "string" ? { tag: point.tag } : {}),
    };
  });
  const productionFrames = parsed.oldProduction.sourceFrames.map((frame): ProductionFrame => {
    if (!isPlainObject(frame) || typeof frame.time !== "number" || !isPlainObject(frame.params)) {
      throw new Error("production frame invalid");
    }
    const params: Record<string, number> = {};
    for (const [key, value] of Object.entries(frame.params)) {
      if (typeof value === "number") params[key] = value;
    }
    return typeof frame.phoneme === "string"
      ? { params, phoneme: frame.phoneme, time: frame.time }
      : { params, time: frame.time };
  });
  return { points, policy, productionFrames, segments };
}

function effectiveDuration(segment: BaselineSegment, policy: LowerOptions): number {
  const release = segment.type === "stop_release" || segment.type === "stop_aspiration";
  const floor = release
    ? policy.timeline.duration_floors.stop_release_ms.value
    : policy.timeline.duration_floors.default_ms.value;
  return Math.max(segment.duration, floor);
}

function buildUtterance(
  segments: readonly BaselineSegment[],
  points: readonly BaselinePoint[],
  policy: LowerOptions,
): Utterance {
  const utterance = new Utterance(schemaFor(policy.columns));
  const build = utterance.beginTransaction(META);
  const segmentItems = segments.map((entry) => {
    const item = build.createItem("segment", entry.id);
    build.set(item, "phoneme", entry.phoneme);
    build.set(item, "type", entry.type);
    build.set(item, "duration", entry.duration);
    build.set(item, "active", true);
    for (const column of policy.columns) build.set(item, column, entry.params[column]);
    build.append("Segment", item);
    return item;
  });
  build.partitionAnchors(segmentItems, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();

  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  const spans: Array<{ endMs: number; item: Item; startMs: number }> = [];
  let cursorMs = 0;
  segmentItems.forEach((item, index) => {
    const anchor = utterance.intervalAnchor(item);
    const segment = segments[index];
    if (!anchor || !segment) throw new Error("fixture timing missing");
    const startMs = cursorMs;
    timing.resolveMarkTime(anchor.leftMarkId, startMs);
    cursorMs += effectiveDuration(segment, policy);
    timing.resolveMarkTime(anchor.rightMarkId, cursorMs);
    spans.push({ endMs: cursorMs, item, startMs });
  });
  timing.commit();

  const prosody = utterance.beginTransaction(META);
  for (const point of points) {
    const span = spans.find((candidate) => (
      point.timeMs >= candidate.startMs - 1e-6 && point.timeMs <= candidate.endMs + 1e-6
    ));
    if (!span) throw new Error(`F0 point ${point.id} lies outside the temporal axis`);
    const anchor = utterance.intervalAnchor(span.item);
    if (!anchor) throw new Error("fixture point span missing");
    const pointItem = prosody.createItem("f0Point", point.id);
    prosody.set(pointItem, "value", point.valueHz);
    if (point.tag) prosody.set(pointItem, "tag", point.tag);
    prosody.append("F0Point", pointItem);
    const ratio = span.endMs === span.startMs
      ? 0
      : (point.timeMs - span.startMs) / (span.endMs - span.startMs);
    prosody.anchorPoint(pointItem, anchor.leftMarkId, anchor.rightMarkId, ratio);
  }
  prosody.commit();
  return utterance;
}

describe("HRG lowering explicit F0 points", () => {
  it("matches every qlatt-English emitted contour cell against production", () => {
    const baseline = readFixture();
    const utterance = buildUtterance(baseline.segments, baseline.points, baseline.policy);
    const lowered = lowerToFrames(utterance, baseline.policy);
    const segmentFrames = lowered.frames.filter((frame) => frame.segmentId != null);

    expect(segmentFrames.some((frame) => Math.abs(frame.time - 0.44975) <= 1e-9)).toBe(true);
    expect(segmentFrames.some((frame) => Math.abs(frame.time - 0.38) <= 1e-9)).toBe(false);
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "F0_POINT_COINCIDENT_OVERRIDE",
      data: expect.objectContaining({ droppedHz: 122, keptHz: 190, timeMs: 380 }),
    }));
    for (const frame of segmentFrames) {
      const production = baseline.productionFrames.find(
        (candidate) => candidate.phoneme === frame.phoneme
          && Math.abs(candidate.time - frame.time) <= 1e-9,
      );
      if (!production) throw new Error(`production event missing for ${frame.phoneme ?? ""}@${frame.time}`);
      expect(frame.params.F0, `${frame.segmentId}@${frame.time}.F0`).toBeCloseTo(production.params.F0, 9);
    }
    const knownDecisions = new Set(utterance.provenance.getDecisions().map((decision) => decision.id));
    for (const frame of segmentFrames) {
      for (const key of Object.keys(frame.params)) {
        const decisionId = frame.provenance?.[key];
        expect(decisionId, `${frame.segmentId}@${frame.time}.${key} provenance`).toBeTypeOf("string");
        expect(knownDecisions.has(decisionId ?? ""), `${frame.segmentId}@${frame.time}.${key} decision`).toBe(true);
      }
    }
  });

  it("rejects an unresolved explicit point instead of inventing its time", () => {
    const baseline = readFixture();
    const utterance = buildUtterance(baseline.segments, baseline.points, baseline.policy);
    const point = utterance.createItem("f0Point", "unresolved-point");
    point.set("value", 200, META);
    utterance.relation("F0Point").append(point, META);

    expect(() => lowerToFrames(utterance, baseline.policy)).toThrowError(/E_HRG_LOWER_F0_POINT_REQUIRED/);
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_F0_POINT_REQUIRED",
    }));
  });
});
