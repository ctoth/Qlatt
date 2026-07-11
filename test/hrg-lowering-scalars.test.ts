import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";
import { loadInventorySpecFromPath } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Klatt 1980"],
};

// Columns whose segment-current values are not rewritten by later transition,
// F0, affect/voice-quality, or speaker/source lowering families. Each asserted
// cell is still read from the captured production event, never from the graph.
const BASE_SCALAR_COLUMNS = [
  "F6", "B6",
  "FNZ", "FNP", "BNP", "BNZ", "AN",
  "nasalPlaceIndex", "nasalMurmurStrength",
  "nasalPoleBaseHz", "nasalPoleBwHz", "nasalZeroBwHz", "nasalPlaceBwHz",
  "nasalPlaceMFnzHz", "nasalPlaceNFnzHz", "nasalPlaceNgFnzHz", "nasalB1AdditionHz",
  "A2", "A3", "FGP", "BGP", "FGZ", "BGZ", "BGS", "NFC",
] as const;

type ScalarBaselineSegment = {
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

type ScalarBaseline = {
  policy: LowerOptions;
  productionFrames: ProductionFrame[];
  segments: ScalarBaselineSegment[];
};

function latestFeature(item: Readonly<Record<string, unknown>>, key: string): unknown {
  const features = item.features;
  if (!isPlainObject(features)) throw new Error("baseline Item features missing");
  const history = features[key];
  if (!Array.isArray(history) || history.length === 0) throw new Error(`baseline ${key} missing`);
  const write = history[history.length - 1];
  if (!isPlainObject(write)) throw new Error(`baseline ${key} history invalid`);
  return write.value;
}

function citedNumber(value: unknown, path: string): { value: number } {
  if (!isPlainObject(value) || typeof value.value !== "number") {
    throw new Error(`compiled lowering policy '${path}' missing`);
  }
  return { value: value.value };
}

function eventPoints(value: unknown): LowerOptions["timeline"]["event_points"] {
  if (
    !isPlainObject(value)
    || typeof value.include_segment_start !== "boolean"
    || typeof value.include_control_boundaries !== "boolean"
    || typeof value.include_f0_anchors !== "boolean"
    || typeof value.include_transition_steady_time !== "boolean"
  ) {
    throw new Error("compiled lowering event-point policy missing");
  }
  return {
    include_segment_start: value.include_segment_start,
    include_control_boundaries: value.include_control_boundaries,
    include_f0_anchors: value.include_f0_anchors,
    include_transition_steady_time: value.include_transition_steady_time,
  };
}

function transitions(value: unknown): LowerOptions["transitions"] {
  if (
    !isPlainObject(value)
    || !isPlainObject(value.blend)
    || !Array.isArray(value.blend.keys)
    || value.blend.keys.some((entry) => typeof entry !== "string")
    || !Array.isArray(value.blend.smooth_types)
    || value.blend.smooth_types.some((entry) => typeof entry !== "string")
  ) {
    throw new Error("compiled lowering transition policy missing");
  }
  return {
    default_transition_ms: citedNumber(value.default_transition_ms, "default_transition_ms"),
    blend: {
      factor: citedNumber(value.blend.factor, "blend.factor"),
      keys: value.blend.keys,
      smooth_types: value.blend.smooth_types,
      ...(value.blend.smooth_all_boundaries === true ? { smooth_all_boundaries: true } : {}),
    },
  };
}

function loadPolicyAndInventory(frontendId: string): {
  inventoryPath: string;
  policy: LowerOptions;
} {
  const spec: unknown = loadBundledRulepackSpec(frontendId);
  if (
    !isPlainObject(spec)
    || typeof spec.inventory_path !== "string"
    || !isPlainObject(spec.output)
    || !isPlainObject(spec.output.lowering)
  ) {
    throw new Error("compiled frontend lowering/inventory policy missing");
  }
  const lowering = spec.output.lowering;
  if (
    !Array.isArray(lowering.columns)
    || lowering.columns.some((value) => typeof value !== "string")
    || !isPlainObject(lowering.timeline)
    || !isPlainObject(lowering.timeline.duration_floors)
  ) {
    throw new Error("compiled lowering columns/timeline missing");
  }
  return {
    inventoryPath: spec.inventory_path,
    policy: {
      columns: lowering.columns,
      transitions: transitions(lowering.transitions),
      timeline: {
        initial_silence_ms: citedNumber(lowering.timeline.initial_silence_ms, "initial_silence_ms"),
        final_silence_ms: citedNumber(lowering.timeline.final_silence_ms, "final_silence_ms"),
        duration_floors: {
          stop_release_ms: citedNumber(
            lowering.timeline.duration_floors.stop_release_ms,
            "duration_floors.stop_release_ms",
          ),
          default_ms: citedNumber(
            lowering.timeline.duration_floors.default_ms,
            "duration_floors.default_ms",
          ),
        },
        event_points: eventPoints(lowering.timeline.event_points),
      },
    },
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

function loadScalarBaseline(fileName: string, frontendId: string): ScalarBaseline {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL(`./fixtures/hrg-convergence-baseline/${fileName}`, import.meta.url),
    "utf8",
  ));
  if (
    !isPlainObject(parsed)
    || !isPlainObject(parsed.reconstructedGraph)
    || !Array.isArray(parsed.reconstructedGraph.items)
    || !isPlainObject(parsed.oldProduction)
    || !Array.isArray(parsed.oldProduction.sourceFrames)
  ) {
    throw new Error("baseline graph/production frames missing");
  }
  const { inventoryPath, policy } = loadPolicyAndInventory(frontendId);
  const segments = parsed.reconstructedGraph.items.flatMap((item): ScalarBaselineSegment[] => {
    if (!isPlainObject(item) || item.type !== "segment" || typeof item.id !== "string") return [];
    const phoneme = latestFeature(item, "phoneme");
    const duration = latestFeature(item, "dur_ms");
    if (typeof phoneme !== "string" || typeof duration !== "number") {
      throw new Error("baseline Segment identity/timing invalid");
    }
    const params: Record<string, number> = {};
    for (const column of policy.columns) {
      const value = latestFeature(item, column);
      if (typeof value !== "number") throw new Error(`baseline Segment '${column}' invalid`);
      params[column] = value;
    }
    return [{
      duration,
      id: item.id,
      params,
      phoneme,
      type: inventoryType(inventoryPath, phoneme),
    }];
  });
  const productionFrames = parsed.oldProduction.sourceFrames.map((frame): ProductionFrame => {
    if (!isPlainObject(frame) || typeof frame.time !== "number" || !isPlainObject(frame.params)) {
      throw new Error("baseline production frame invalid");
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

function effectiveDuration(segment: ScalarBaselineSegment, policy: LowerOptions): number {
  const release = segment.type === "stop_release" || segment.type === "stop_aspiration";
  const floor = release
    ? policy.timeline.duration_floors.stop_release_ms.value
    : policy.timeline.duration_floors.default_ms.value;
  return Math.max(segment.duration, floor);
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
    transitions: {
      default_transition_ms: { value: 0 },
      blend: {
        factor: { value: 0 },
        keys: [],
        smooth_types: [],
      },
    },
    timeline: {
      initial_silence_ms: { value: 0 },
      final_silence_ms: { value: 0 },
      duration_floors: {
        stop_release_ms: { value: 0 },
        default_ms: { value: 0 },
      },
      event_points: {
        include_segment_start: true,
        include_control_boundaries: true,
        include_f0_anchors: true,
        include_transition_steady_time: true,
      },
    },
  };
}

function buildBaselineUtterance(baseline: ScalarBaseline): Utterance {
  const utterance = new Utterance(schemaFor(baseline.policy.columns));
  const build = utterance.beginTransaction(META);
  const items = baseline.segments.map((entry) => {
    const segment = build.createItem("segment", entry.id);
    build.set(segment, "phoneme", entry.phoneme);
    build.set(segment, "type", entry.type);
    build.set(segment, "duration", entry.duration);
    build.set(segment, "active", true);
    for (const column of baseline.policy.columns) build.set(segment, column, entry.params[column]);
    build.append("Segment", segment);
    return segment;
  });
  build.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();

  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  let cursorMs = 0;
  items.forEach((item, index) => {
    const anchor = utterance.intervalAnchor(item);
    const entry = baseline.segments[index];
    if (!anchor || !entry) throw new Error("fixture interval missing");
    timing.resolveMarkTime(anchor.leftMarkId, cursorMs);
    cursorMs += effectiveDuration(entry, baseline.policy);
    timing.resolveMarkTime(anchor.rightMarkId, cursorMs);
  });
  timing.commit();
  return utterance;
}

describe("HRG lowering scalar histories", () => {
  it.each([
    ["qlatt-English", "qlatt-english", "qlatt-english-fricatives.json"],
    ["DECtalk English", "dectalk-english", "dectalk-english-stops.json"],
    ["qlatt-beauty structural", "qlatt-beauty", "qlatt-beauty-bridge-demo.json"],
  ])("matches captured production base-scalar cells for %s", (_label, frontendId, fileName) => {
    const baseline = loadScalarBaseline(fileName, frontendId);
    const utterance = buildBaselineUtterance(baseline);
    const lowered = lowerToFrames(utterance, baseline.policy);
    const ownedColumns = BASE_SCALAR_COLUMNS.filter((column) => baseline.policy.columns.includes(column));
    expect(ownedColumns.length).toBeGreaterThan(10);

    let cursorMs = baseline.policy.timeline.initial_silence_ms.value;
    for (const segment of baseline.segments) {
      const frame = lowered.frames.find(
        (candidate) => candidate.segmentId === segment.id
          && Math.abs(candidate.time * 1000 - cursorMs) <= 1e-6,
      );
      if (!frame?.phoneme) throw new Error(`lowered boundary frame missing for '${segment.id}'`);
      const production = baseline.productionFrames.find(
        (candidate) => candidate.phoneme === frame.phoneme
          && Math.abs(candidate.time - frame.time) <= 1e-9,
      );
      if (!production) throw new Error(`production boundary frame missing for '${frame.segmentId}'`);
      for (const column of ownedColumns) {
        expect(frame.params[column], `${frame.segmentId}.${column}`).toBe(production.params[column]);
      }
      cursorMs += effectiveDuration(segment, baseline.policy);
    }
  });

  it.each([
    ["qlatt-English", "qlatt-english", "qlatt-english-fricatives.json"],
    ["DECtalk English", "dectalk-english", "dectalk-english-stops.json"],
  ])("projects selected %s silence/source params at both track edges", (_label, frontendId, fileName) => {
    const baseline = loadScalarBaseline(fileName, frontendId);
    const utterance = buildBaselineUtterance(baseline);
    const resourceDecision = utterance.provenance.add({
      stage: "frontend",
      type: "selected_silence_resource",
      subject: `frontend:${frontendId}:SIL`,
      reason: "selected frontend SIL inventory and source policy",
      citations: ["Klatt 1980"],
    });
    const productionInitial = baseline.productionFrames[0];
    const productionFinal = baseline.productionFrames.at(-1);
    if (!productionInitial || !productionFinal) throw new Error("production silence frames missing");

    const initialParams = { ...productionInitial.params };
    for (const key of baseline.policy.transitions.blend.keys) {
      initialParams[key] = productionFinal.params[key];
    }
    const lowered = lowerToFrames(utterance, baseline.policy, {
      silence: {
        initialParams,
        finalParams: productionFinal.params,
        decisionId: resourceDecision.id,
      },
    });
    const initial = lowered.frames[0];
    const final = lowered.frames.at(-1);
    if (!initial || !final) throw new Error("lowered silence frames missing");
    for (const column of baseline.policy.columns) {
      expect(initial.params[column], `initial.${column}`).toBe(productionInitial.params[column]);
      expect(final.params[column], `final.${column}`).toBe(productionFinal.params[column]);
    }
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

    const lowered = lowerToFrames(utterance, loweringOptions(["F1"]));
    const segmentFrame = lowered.frames.find((frame) => frame.segmentId === "history");

    expect(segment.writes("F1")).toHaveLength(2);
    expect(segmentFrame?.params.F1).toBe(700);
    expect(segmentFrame?.provenance.F1).toBe(latest.decisionId);
    const segmentIndex = lowered.frames.findIndex((frame) => frame.segmentId === "history");
    expect(lowered.provenanceByFrame[segmentIndex].F1).toBe(latest.decisionId);
  });
});
