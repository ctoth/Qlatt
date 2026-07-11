import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPlainObject } from "../src/yaml-loader";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema, Item } from "../src/declarative-frontend/hrg";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
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
  duration: number;
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

function loadBaseline(fileName: string): { timings: BaselineTiming[]; totalMs: number; frameCount: number } {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL(`./fixtures/hrg-convergence-baseline/${fileName}`, import.meta.url),
    "utf8",
  ));
  if (!isPlainObject(parsed) || !isPlainObject(parsed.reconstructedGraph)) {
    throw new Error("baseline graph missing");
  }
  const items = parsed.reconstructedGraph.items;
  if (!Array.isArray(items)) throw new Error("baseline Items missing");
  const timings = items.flatMap((item): BaselineTiming[] => {
    if (!isPlainObject(item) || item.type !== "segment" || typeof item.id !== "string") return [];
    const phoneme = latestFeature(item, "phoneme");
    const duration = latestFeature(item, "dur_ms");
    if (typeof phoneme !== "string" || typeof duration !== "number") {
      throw new Error("baseline segment timing invalid");
    }
    return [{ id: item.id, phoneme, duration }];
  });
  if (!isPlainObject(parsed.reconstructedLowering)) throw new Error("baseline lowering missing");
  const totalMs = parsed.reconstructedLowering.totalMs;
  const frames = parsed.reconstructedLowering.frames;
  if (typeof totalMs !== "number" || !Array.isArray(frames)) throw new Error("baseline timing oracle invalid");
  return { timings, totalMs, frameCount: frames.length };
}

function resolveTimes(utterance: Utterance, segments: readonly Item[]): void {
  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  let elapsedMs = 0;
  const resolved = new Set<string>();
  for (const segment of segments) {
    const anchor = utterance.intervalAnchor(segment);
    const duration = segment.get("duration");
    if (!anchor || typeof duration !== "number") throw new Error("fixture timing missing");
    if (!resolved.has(anchor.leftMarkId)) {
      timing.resolveMarkTime(anchor.leftMarkId, elapsedMs);
      resolved.add(anchor.leftMarkId);
    }
    elapsedMs += duration;
    timing.resolveMarkTime(anchor.rightMarkId, elapsedMs);
    resolved.add(anchor.rightMarkId);
  }
  timing.commit();
}

describe("HRG lowering segment timing", () => {
  it.each([
    ["qlatt-English", "qlatt-english-fricatives.json"],
    ["DECtalk English", "dectalk-english-stops.json"],
    ["qlatt-beauty structural", "qlatt-beauty-bridge-demo.json"],
  ])("matches the committed %s baseline timing exactly", (_label, fileName) => {
    const baseline = loadBaseline(fileName);
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const segments = baseline.timings.map((entry) => {
      const segment = build.createItem("segment", entry.id);
      build.set(segment, "phoneme", entry.phoneme);
      build.set(segment, "duration", entry.duration);
      build.set(segment, "active", true);
      build.append("Segment", segment);
      return segment;
    });
    build.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    resolveTimes(utterance, segments);

    const lowered = lowerToFrames(utterance, { columns: [] });

    expect(lowered.totalMs).toBe(baseline.totalMs);
    expect(lowered.frames).toHaveLength(baseline.frameCount);
    expect(lowered.timings.map((timing) => timing.durationMs)).toEqual(
      baseline.timings.map((timing) => timing.duration),
    );
  });

  it("rejects a missing required duration with a diagnostic and no fallback", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "missing-duration");
    segment.set("phoneme", "AA", { reason: "fixture", citations: ["Klatt 1980"] });
    utterance.relation("Segment").append(segment, { reason: "fixture", citations: ["Klatt 1980"] });

    expect(() => lowerToFrames(utterance, { columns: [] })).toThrowError(/E_HRG_LOWER_DURATION_REQUIRED/);
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_DURATION_REQUIRED",
    }));
  });

  it("rejects unresolved interval timing with a diagnostic", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "unresolved");
    segment.set("phoneme", "AA", { reason: "fixture", citations: ["Klatt 1980"] });
    segment.set("duration", 100, { reason: "fixture", citations: ["Klatt 1976"] });
    utterance.relation("Segment").append(segment, { reason: "fixture", citations: ["Klatt 1980"] });

    expect(() => lowerToFrames(utterance, { columns: [] })).toThrowError(/E_HRG_LOWER_TIME_REQUIRED/);
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_TIME_REQUIRED",
    }));
  });

  it("rejects duration and resolved-interval disagreement", () => {
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const segment = build.createItem("segment", "mismatch");
    build.set(segment, "phoneme", "AA");
    build.set(segment, "duration", 100);
    build.set(segment, "active", true);
    build.append("Segment", segment);
    build.partitionAnchors([segment], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
    timing.resolveMarkTime(utterance.axis.start.id, 0);
    timing.resolveMarkTime(utterance.axis.end.id, 90);
    timing.commit();

    expect(() => lowerToFrames(utterance, { columns: [] })).toThrowError(/E_HRG_LOWER_TIMING_MISMATCH/);
    expect(utterance.diagnostics.getEntries()).toContainEqual(expect.objectContaining({
      code: "HRG_LOWER_TIMING_MISMATCH",
    }));
  });
});
