import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";
import { loadInventorySpecFromPath } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        type: { kind: "string" },
        duration: { kind: "number" },
        active: { kind: "boolean" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: ["Klatt 1976"],
};

type BaselineTiming = {
  id: string;
  phoneme: string;
  type: string;
  duration: number;
};

type ProductionFrameTiming = {
  time: number;
  phoneme?: string;
};

type TimingBaseline = {
  timings: BaselineTiming[];
  productionFrames: ProductionFrameTiming[];
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

function loadSegmentType(frontendId: string, phoneme: string): string {
  const spec: unknown = loadBundledRulepackSpec(frontendId);
  if (!isPlainObject(spec) || typeof spec.inventory_path !== "string") {
    throw new Error("compiled frontend inventory path missing");
  }
  const targets = loadInventorySpecFromPath(spec.inventory_path).phoneme_targets;
  const target = targets[phoneme] ?? targets[`${phoneme}0`] ?? targets[`${phoneme}1`];
  if (!target || typeof target.type !== "string") {
    throw new Error(`selected inventory type for '${phoneme}' missing`);
  }
  return target.type;
}

function loadBaseline(fileName: string, frontendId: string): TimingBaseline {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL(`./fixtures/hrg-convergence-baseline/${fileName}`, import.meta.url),
    "utf8",
  ));
  if (
    !isPlainObject(parsed)
    || !isPlainObject(parsed.reconstructedGraph)
    || !isPlainObject(parsed.oldProduction)
  ) {
    throw new Error("baseline graph/production output missing");
  }
  const items = parsed.reconstructedGraph.items;
  const sourceFrames = parsed.oldProduction.sourceFrames;
  if (!Array.isArray(items) || !Array.isArray(sourceFrames)) {
    throw new Error("baseline Items/production frames missing");
  }
  const timings = items.flatMap((item): BaselineTiming[] => {
    if (!isPlainObject(item) || item.type !== "segment" || typeof item.id !== "string") return [];
    const phoneme = latestFeature(item, "phoneme");
    const duration = latestFeature(item, "dur_ms");
    if (typeof phoneme !== "string" || typeof duration !== "number") {
      throw new Error("baseline segment timing invalid");
    }
    return [{ id: item.id, phoneme, type: loadSegmentType(frontendId, phoneme), duration }];
  });
  const productionFrames = sourceFrames.map((frame): ProductionFrameTiming => {
    if (!isPlainObject(frame) || typeof frame.time !== "number") {
      throw new Error("baseline production frame timing invalid");
    }
    return typeof frame.phoneme === "string"
      ? { time: frame.time, phoneme: frame.phoneme }
      : { time: frame.time };
  });
  return { timings, productionFrames };
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

function loadTimingPolicy(frontendId: string): LowerOptions {
  const spec: unknown = loadBundledRulepackSpec(frontendId);
  if (!isPlainObject(spec) || !isPlainObject(spec.output) || !isPlainObject(spec.output.lowering)) {
    throw new Error("compiled lowering policy missing");
  }
  const lowering = spec.output.lowering;
  if (!Array.isArray(lowering.columns) || lowering.columns.some((value) => typeof value !== "string")) {
    throw new Error("compiled lowering columns missing");
  }
  if (!isPlainObject(lowering.timeline) || !isPlainObject(lowering.timeline.duration_floors)) {
    throw new Error("compiled lowering timeline missing");
  }
  return {
    columns: lowering.columns,
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
  };
}

function effectiveDuration(entry: BaselineTiming, policy: LowerOptions): number {
  const stopRelease = entry.type === "stop_release" || entry.type === "stop_aspiration";
  const floor = stopRelease
    ? policy.timeline.duration_floors.stop_release_ms.value
    : policy.timeline.duration_floors.default_ms.value;
  return Math.max(entry.duration, floor);
}

function resolveTimes(
  utterance: Utterance,
  segments: readonly Item[],
  entries: readonly BaselineTiming[],
  policy: LowerOptions,
): void {
  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  let elapsedMs = 0;
  const resolved = new Set<string>();
  segments.forEach((segment, index) => {
    const anchor = utterance.intervalAnchor(segment);
    const entry = entries[index];
    if (!anchor || !entry) throw new Error("fixture timing missing");
    if (!resolved.has(anchor.leftMarkId)) {
      timing.resolveMarkTime(anchor.leftMarkId, elapsedMs);
      resolved.add(anchor.leftMarkId);
    }
    elapsedMs += effectiveDuration(entry, policy);
    timing.resolveMarkTime(anchor.rightMarkId, elapsedMs);
    resolved.add(anchor.rightMarkId);
  });
  timing.commit();
}

function expectedBoundaryFrames(
  baseline: TimingBaseline,
  policy: LowerOptions,
): ProductionFrameTiming[] {
  const wantedMs = [0];
  let cursorMs = policy.timeline.initial_silence_ms.value;
  for (const entry of baseline.timings) {
    wantedMs.push(cursorMs);
    cursorMs += effectiveDuration(entry, policy);
  }
  wantedMs.push(cursorMs);
  if (policy.timeline.final_silence_ms.value > 0) {
    cursorMs += policy.timeline.final_silence_ms.value;
    wantedMs.push(cursorMs);
  }

  return wantedMs.map((timeMs) => {
    const production = baseline.productionFrames.find(
      (frame) => Math.abs(frame.time * 1000 - timeMs) <= 1e-6,
    );
    if (!production) throw new Error(`production oracle has no boundary event at ${timeMs} ms`);
    return production;
  });
}

describe("HRG lowering production event timing", () => {
  it.each([
    ["qlatt-English", "qlatt-english", "qlatt-english-fricatives.json"],
    ["DECtalk English", "dectalk-english", "dectalk-english-stops.json"],
    ["qlatt-beauty structural", "qlatt-beauty", "qlatt-beauty-bridge-demo.json"],
  ])("matches the captured %s boundary-event skeleton", (_label, frontendId, fileName) => {
    const baseline = loadBaseline(fileName, frontendId);
    const policy = loadTimingPolicy(frontendId);
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const segments = baseline.timings.map((entry) => {
      const segment = build.createItem("segment", entry.id);
      build.set(segment, "phoneme", entry.phoneme);
      build.set(segment, "type", entry.type);
      build.set(segment, "duration", entry.duration);
      build.set(segment, "active", true);
      build.append("Segment", segment);
      return segment;
    });
    build.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    resolveTimes(utterance, segments, baseline.timings, policy);

    const expected = expectedBoundaryFrames(baseline, policy);
    const lowered = lowerToFrames(utterance, policy);

    expect(lowered.frames).toHaveLength(expected.length);
    lowered.frames.forEach((frame, index) => {
      expect(frame.time).toBeCloseTo(expected[index].time, 9);
    });
    expect(lowered.frames.map((frame) => frame.phoneme)).toEqual(expected.map((frame) => frame.phoneme));
    expect(lowered.totalMs).toBeCloseTo(expected[expected.length - 1].time * 1000, 6);
  });

  it("rejects a missing required duration with a diagnostic and no fallback", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "missing-duration");
    segment.set("phoneme", "AA", { reason: "fixture", citations: ["Klatt 1980"] });
    segment.set("type", "vowel", { reason: "fixture", citations: ["Klatt 1980"] });
    utterance.relation("Segment").append(segment, { reason: "fixture", citations: ["Klatt 1980"] });

    expect(() => lowerToFrames(utterance, loadTimingPolicy("qlatt-english"))).toThrowError(
      /E_HRG_LOWER_DURATION_REQUIRED/,
    );
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_DURATION_REQUIRED",
    }));
  });

  it("rejects unresolved interval timing with a diagnostic", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "unresolved");
    segment.set("phoneme", "AA", { reason: "fixture", citations: ["Klatt 1980"] });
    segment.set("type", "vowel", { reason: "fixture", citations: ["Klatt 1980"] });
    segment.set("duration", 100, { reason: "fixture", citations: ["Klatt 1976"] });
    utterance.relation("Segment").append(segment, { reason: "fixture", citations: ["Klatt 1980"] });

    expect(() => lowerToFrames(utterance, loadTimingPolicy("qlatt-english"))).toThrowError(
      /E_HRG_LOWER_TIME_REQUIRED/,
    );
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_TIME_REQUIRED",
    }));
  });

  it("rejects duration-floor and resolved-interval disagreement", () => {
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const segment = build.createItem("segment", "mismatch");
    build.set(segment, "phoneme", "AA");
    build.set(segment, "type", "vowel");
    build.set(segment, "duration", 10);
    build.set(segment, "active", true);
    build.append("Segment", segment);
    build.partitionAnchors([segment], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
    timing.resolveMarkTime(utterance.axis.start.id, 0);
    timing.resolveMarkTime(utterance.axis.end.id, 10);
    timing.commit();

    expect(() => lowerToFrames(utterance, loadTimingPolicy("qlatt-english"))).toThrowError(
      /E_HRG_LOWER_TIMING_MISMATCH/,
    );
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_TIMING_MISMATCH",
    }));
  });
});
