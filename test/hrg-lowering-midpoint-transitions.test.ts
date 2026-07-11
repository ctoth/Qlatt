import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";
import { isPlainObject } from "../src/yaml-loader";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        active: { kind: "boolean" },
        phoneme: { kind: "string" },
        type: { kind: "string" },
        duration: { kind: "number" },
        F1: { kind: "number" },
        F2: { kind: "number" },
        F3: { kind: "number" },
        B1: { kind: "number" },
        B2: { kind: "number" },
        B3: { kind: "number" },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const POLICY = {
  columns: ["F1", "F2", "F3", "B1", "B2", "B3"],
  timeline: {
    initial_silence_ms: { value: 30 },
    final_silence_ms: { value: 100 },
    duration_floors: {
      stop_release_ms: { value: 5 },
      default_ms: { value: 20 },
    },
    event_points: {
      include_segment_start: true,
      include_control_boundaries: true,
      include_f0_anchors: true,
      include_transition_steady_time: true,
    },
  },
  transitions: {
    default_transition_ms: { value: 30 },
    blend: {
      factor: { value: 0.35 },
      keys: ["F1", "F2", "F3", "B1", "B2", "B3"],
      smooth_types: ["vowel", "nasal", "liquid", "glide"],
    },
    sonorant_f2: {
      key: "F2",
      span_ms: { value: 45 },
      neighbor_weight: { value: 0.75 },
      current_type: "vowel",
      neighbor_types: ["nasal", "liquid", "glide"],
    },
  },
} as const satisfies LowerOptions;

const META = {
  ruleId: "fixture",
  phase: "formant",
  tag: "transition",
  reason: "direct midpoint transition fixture",
  citations: ["Broad & Fertig 1970"],
};

function addSegment(
  transaction: ReturnType<Utterance["beginTransaction"]>,
  id: string,
  phoneme: string,
  type: string,
  duration: number,
  params: Readonly<Record<string, number>>,
): Item {
  const segment = transaction.createItem("segment", id);
  transaction.set(segment, "phoneme", phoneme);
  transaction.set(segment, "type", type);
  transaction.set(segment, "duration", duration);
  transaction.set(segment, "active", true);
  for (const [key, value] of Object.entries(params)) transaction.set(segment, key, value);
  transaction.append("Segment", segment);
  return segment;
}

function productionTransitionParams(): Record<string, number> {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL("./fixtures/hrg-convergence-baseline/qlatt-english-fricatives.json", import.meta.url),
    "utf8",
  ));
  if (!isPlainObject(parsed) || !isPlainObject(parsed.oldProduction)) {
    throw new Error("production fixture missing");
  }
  const frames = parsed.oldProduction.sourceFrames;
  if (!Array.isArray(frames)) throw new Error("production frames missing");
  const frame = frames.find(
    (candidate) => isPlainObject(candidate)
      && candidate.phoneme === "EH"
      && typeof candidate.time === "number"
      && Math.abs(candidate.time - 0.535) <= 1e-9,
  );
  if (!isPlainObject(frame) || !isPlainObject(frame.params)) {
    throw new Error("captured EH midpoint event missing");
  }
  const params: Record<string, number> = {};
  for (const [key, value] of Object.entries(frame.params)) {
    if (typeof value === "number") params[key] = value;
  }
  return params;
}

describe("HRG lowering midpoint transitions", () => {
  it("matches captured qlatt-English EH-to-L midpoint cells", () => {
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const eh = addSegment(build, "seg_3", "EH", "vowel", 155, {
      F1: 580, F2: 1799, F3: 2605, B1: 70, B2: 90, B3: 130,
    });
    const l = addSegment(build, "seg_4", "L", "liquid", 65, {
      F1: 310, F2: 900, F3: 2400, B1: 50, B2: 100, B3: 200,
    });
    build.partitionAnchors([eh, l], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
    const ehAnchor = utterance.intervalAnchor(eh);
    const lAnchor = utterance.intervalAnchor(l);
    if (!ehAnchor || !lAnchor) throw new Error("fixture anchors missing");
    timing.resolveMarkTime(ehAnchor.leftMarkId, 380);
    timing.resolveMarkTime(ehAnchor.rightMarkId, 535);
    timing.resolveMarkTime(lAnchor.rightMarkId, 600);
    timing.commit();

    const lowered = lowerToFrames(utterance, POLICY);
    const transition = lowered.frames.find(
      (frame) => frame.segmentId === eh.id && Math.abs(frame.time - 0.535) <= 1e-9,
    );
    const f2Start = lowered.frames.find(
      (frame) => frame.segmentId === eh.id && Math.abs(frame.time - 0.52) <= 1e-9,
    );
    const production = productionTransitionParams();

    expect(transition).toBeDefined();
    for (const column of POLICY.columns) {
      expect(transition?.params[column], column).toBe(production[column]);
    }
    expect(f2Start?.params.F2).toBe(1799);
  });
});
