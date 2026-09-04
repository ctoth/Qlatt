import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { FeatureSchema, HrgSchema, LowerOptions } from "../src/declarative-frontend/hrg";
import { lowerToFrames, readLowerOptions, Utterance } from "../src/declarative-frontend/hrg";
import { loadInventorySpecFromPath } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

const META = {
  ruleId: "fixture",
  phase: "formant",
  tag: "transition",
  reason: "complete transition matrix fixture",
  citations: ["Broad & Fertig 1970"],
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
  const features: Record<string, FeatureSchema> = {
    active: { kind: "boolean" },
    duration: { kind: "number" },
    phoneme: { kind: "string" },
    type: { kind: "string" },
  };
  for (const column of columns) features[column] = { kind: "number" };
  return {
    itemTypes: { segment: { features } },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  };
}

function inventoryType(inventoryPath: string, phoneme: string): string {
  const targets = loadInventorySpecFromPath(inventoryPath).phoneme_targets;
  const target = targets[phoneme] ?? targets[`${phoneme}0`] ?? targets[`${phoneme}1`];
  if (!target || typeof target.type !== "string") {
    throw new Error(`selected inventory type for '${phoneme}' missing`);
  }
  return target.type;
}

function readFixture(
  frontendId: string,
  fileName: string,
): {
  policy: LowerOptions;
  productionFrames: ProductionFrame[];
  segments: BaselineSegment[];
} {
  const parsed: unknown = JSON.parse(
    readFileSync(
      new URL(`./fixtures/hrg-convergence-baseline/${fileName}`, import.meta.url),
      "utf8",
    ),
  );
  const spec = loadBundledRulepackSpec(frontendId);
  if (
    !isPlainObject(parsed) ||
    !isPlainObject(parsed.reconstructedGraph) ||
    !Array.isArray(parsed.reconstructedGraph.items) ||
    !isPlainObject(parsed.oldProduction) ||
    !Array.isArray(parsed.oldProduction.sourceFrames) ||
    typeof spec.inventory_path !== "string" ||
    !isPlainObject(spec.output)
  ) {
    throw new Error("transition matrix fixture/spec invalid");
  }
  const policy = readLowerOptions(spec.output.lowering);
  const inventoryPath = spec.inventory_path;
  const segments = parsed.reconstructedGraph.items.flatMap((item): BaselineSegment[] => {
    if (!isPlainObject(item) || item.type !== "segment" || typeof item.id !== "string") return [];
    const phoneme = latestFeature(item, "phoneme");
    const duration = latestFeature(item, "dur_ms");
    if (typeof phoneme !== "string" || typeof duration !== "number") {
      throw new Error("baseline Segment invalid");
    }
    const params: Record<string, number> = {};
    for (const column of policy.columns) {
      const value = latestFeature(item, column);
      if (typeof value !== "number") throw new Error(`baseline '${column}' invalid`);
      params[column] = value;
    }
    return [
      {
        duration,
        id: item.id,
        params,
        phoneme,
        type: inventoryType(inventoryPath, phoneme),
      },
    ];
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
  return { policy, productionFrames, segments };
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
  policy: LowerOptions,
): { startsById: Map<string, number>; utterance: Utterance } {
  const utterance = new Utterance(schemaFor(policy.columns));
  const build = utterance.beginTransaction(META);
  const items = segments.map((entry) => {
    const item = build.createItem("segment", entry.id);
    build.set(item, "phoneme", entry.phoneme);
    build.set(item, "type", entry.type);
    build.set(item, "duration", entry.duration);
    build.set(item, "active", true);
    for (const column of policy.columns) build.set(item, column, entry.params[column]);
    build.append("Segment", item);
    return item;
  });
  build.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();
  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  const startsById = new Map<string, number>();
  let cursorMs = 0;
  items.forEach((item, index) => {
    const anchor = utterance.intervalAnchor(item);
    const segment = segments[index];
    if (!anchor || !segment) throw new Error("fixture timing missing");
    startsById.set(item.id, policy.timeline.initial_silence_ms.value + cursorMs);
    timing.resolveMarkTime(anchor.leftMarkId, cursorMs);
    cursorMs += effectiveDuration(segment, policy);
    timing.resolveMarkTime(anchor.rightMarkId, cursorMs);
  });
  timing.commit();
  return { startsById, utterance };
}

describe("HRG lowering complete transition matrix", () => {
  it.each([
    ["qlatt-English", "qlatt-english", "qlatt-english-fricatives.json"],
    ["qlatt-beauty structural", "qlatt-beauty", "qlatt-beauty-bridge-demo.json"],
  ])("matches every emitted %s transition event and blend cell", (_label, frontendId, fileName) => {
    const baseline = readFixture(frontendId, fileName);
    const { startsById, utterance } = buildUtterance(baseline.segments, baseline.policy);
    const lowered = lowerToFrames(utterance, baseline.policy);
    const transitionFrames = lowered.frames.filter((frame) => {
      if (!frame.segmentId) return false;
      const startMs = startsById.get(frame.segmentId);
      return startMs != null && Math.abs(frame.time * 1000 - startMs) > 1e-6;
    });
    expect(transitionFrames.length).toBeGreaterThan(0);

    for (const frame of transitionFrames) {
      const production = baseline.productionFrames.find(
        (candidate) =>
          candidate.phoneme === frame.phoneme && Math.abs(candidate.time - frame.time) <= 1e-9,
      );
      if (!production) {
        throw new Error(
          `production transition event missing for ${frame.segmentId}/${frame.phoneme ?? ""} at ${frame.time}`,
        );
      }
      for (const column of baseline.policy.transitions.blend.keys) {
        expect(frame.params[column], `${frame.segmentId}@${frame.time}.${column}`).toBeCloseTo(
          production.params[column],
          9,
        );
      }
    }
  });
});
