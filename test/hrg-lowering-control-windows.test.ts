import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";
import { isPlainObject } from "../src/yaml-loader";

const CONTROL_FIELD_SCHEMA = {
  kind: "object",
  fields: {
    op: { kind: "string", values: ["set", "add", "mul", "max", "min", "unset"] },
    value: { kind: "number" },
  },
  optional: ["value"],
} as const satisfies FeatureSchema;

const CONTROL_WINDOW_SCHEMA = {
  kind: "object",
  fields: {
    target: { kind: "string", values: ["current", "prev", "next"] },
    start_ms: { kind: "number" },
    end_ms: { kind: "number" },
    start_ratio: { kind: "number" },
    end_ratio: { kind: "number" },
    prefix_ms: { kind: "number" },
    suffix_ms: { kind: "number" },
    fields: {
      kind: "object",
      fields: {},
      additional: { kind: "union", variants: [{ kind: "number" }, CONTROL_FIELD_SCHEMA] },
    },
    tag: { kind: "string" },
  },
  optional: [
    "target", "start_ms", "end_ms", "start_ratio", "end_ratio",
    "prefix_ms", "suffix_ms", "tag",
  ],
} as const satisfies FeatureSchema;

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        active: { kind: "boolean" },
        phoneme: { kind: "string" },
        type: { kind: "string" },
        duration: { kind: "number" },
        AH: { kind: "number" },
        B1: { kind: "number" },
        B2: { kind: "number" },
        maxParam: { kind: "number" },
        minParam: { kind: "number" },
        unsetParam: { kind: "number" },
        control_windows: { kind: "array", items: CONTROL_WINDOW_SCHEMA },
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const POLICY = {
  columns: ["AH", "B1", "B2"],
  timeline: {
    initial_silence_ms: { value: 19.2 },
    final_silence_ms: { value: 0 },
    duration_floors: {
      stop_release_ms: { value: 7 },
      default_ms: { value: 30 },
    },
    event_points: {
      include_segment_start: true,
      include_control_boundaries: true,
      include_f0_anchors: true,
      include_transition_steady_time: true,
    },
  },
} as const satisfies LowerOptions;

const META = {
  ruleId: "fixture",
  phase: "structural",
  tag: "fixture",
  reason: "direct typed control-window fixture",
  citations: ["DECtalk 4.63 p_us_st1.c"],
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

function resolveTimes(utterance: Utterance, segments: readonly Item[], endsMs: readonly number[]): void {
  const transaction = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  segments.forEach((segment, index) => {
    const anchor = utterance.intervalAnchor(segment);
    const endMs = endsMs[index];
    const startMs = index === 0 ? 0 : endsMs[index - 1];
    if (!anchor || endMs == null || startMs == null) throw new Error("fixture timing missing");
    transaction.resolveMarkTime(anchor.leftMarkId, startMs);
    transaction.resolveMarkTime(anchor.rightMarkId, endMs);
  });
  transaction.commit();
}

function productionParams(time: number): Record<string, number> {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL("./fixtures/hrg-convergence-baseline/dectalk-english-stops.json", import.meta.url),
    "utf8",
  ));
  if (!isPlainObject(parsed) || !isPlainObject(parsed.oldProduction)) {
    throw new Error("production fixture missing");
  }
  const frames = parsed.oldProduction.sourceFrames;
  if (!Array.isArray(frames)) throw new Error("production frames missing");
  const frame = frames.find(
    (candidate) => isPlainObject(candidate)
      && candidate.phoneme === "AE"
      && typeof candidate.time === "number"
      && Math.abs(candidate.time - time) <= 1e-9,
  );
  if (!isPlainObject(frame) || !isPlainObject(frame.params)) {
    throw new Error(`production AE frame missing at ${time}`);
  }
  const params: Record<string, number> = {};
  for (const [key, value] of Object.entries(frame.params)) {
    if (typeof value === "number") params[key] = value;
  }
  return params;
}

function buildAspirationFixture(): {
  utterance: Utterance;
  release: Item;
  vowel: Item;
  windowDecisionId: string;
} {
  const utterance = new Utterance(SCHEMA);
  const build = utterance.beginTransaction(META);
  const closure = addSegment(build, "seg_0", "P", "stop_closure", 83, { AH: 0, B1: 200, B2: 180 });
  const release = addSegment(build, "seg_1", "P_REL", "stop_release", 7, { AH: 48, B1: 300, B2: 150 });
  const vowel = addSegment(build, "seg_2", "AE", "vowel", 154, { AH: 0, B1: 130, B2: 90 });
  build.partitionAnchors([closure, release, vowel], utterance.axis.start.id, utterance.axis.end.id);
  build.commit();
  const window = release.set("control_windows", [{
    target: "next",
    start_ms: 0,
    end_ms: 53,
    fields: {
      AH: { op: "set", value: 48 },
      B1: { op: "set", value: 380 },
      B2: { op: "set", value: 160 },
    },
    tag: "stop_aspiration",
  }], {
    reason: "Carry release aspiration into the following vowel",
    ruleId: "dectalk_voiceless_stop_aspiration",
    tag: "stop_aspiration",
    citations: ["DECtalk 4.63 p_us_st1.c"],
  });
  resolveTimes(utterance, [closure, release, vowel], [83, 90, 244]);
  return { utterance, release, vowel, windowDecisionId: window.decisionId };
}

describe("HRG lowering control windows", () => {
  it("matches the captured DECtalk next-target aspiration window events", () => {
    const { utterance, vowel, windowDecisionId } = buildAspirationFixture();

    const lowered = lowerToFrames(utterance, POLICY);
    const start = lowered.frames.find((frame) => frame.segmentId === vowel.id && Math.abs(frame.time - 0.1092) <= 1e-9);
    const end = lowered.frames.find((frame) => frame.segmentId === vowel.id && Math.abs(frame.time - 0.1622) <= 1e-9);
    const productionStart = productionParams(0.1092);
    const productionEnd = productionParams(0.1622);

    expect(start).toBeDefined();
    expect(end).toBeDefined();
    for (const column of POLICY.columns) {
      expect(start?.params[column], `start.${column}`).toBe(productionStart[column]);
      expect(end?.params[column], `end.${column}`).toBe(productionEnd[column]);
      expect(start?.provenance[column], `start.${column}.provenance`).toBe(windowDecisionId);
      expect(end?.provenance[column], `end.${column}.provenance`).toBe(vowel.latestWrite(column)?.decisionId);
    }
  });

  it("applies numeric shorthand and every field operation without changing graph state", () => {
    const { utterance, release, vowel } = buildAspirationFixture();
    release.set("control_windows", [], {
      reason: "isolate current-target operation fixture",
      citations: ["Burkhardt 2009"],
    });
    vowel.set("maxParam", 5, { reason: "operation fixture", citations: ["Burkhardt 2009"] });
    vowel.set("minParam", 15, { reason: "operation fixture", citations: ["Burkhardt 2009"] });
    vowel.set("unsetParam", 20, { reason: "operation fixture", citations: ["Burkhardt 2009"] });
    const base = {
      AH: vowel.get("AH"),
      B1: vowel.get("B1"),
      B2: vowel.get("B2"),
      maxParam: vowel.get("maxParam"),
      minParam: vowel.get("minParam"),
      unsetParam: vowel.get("unsetParam"),
    };
    vowel.set("control_windows", [{
      target: "current",
      prefix_ms: 20,
      fields: {
        AH: 7,
        B1: { op: "add", value: 20 },
        B2: { op: "mul", value: 2 },
        maxParam: { op: "max", value: 10 },
        minParam: { op: "min", value: 10 },
        unsetParam: { op: "unset" },
      },
    }], { reason: "operation fixture", citations: ["Burkhardt 2009"] });

    const lowered = lowerToFrames(utterance, {
      ...POLICY,
      columns: [...POLICY.columns, "maxParam", "minParam", "unsetParam"],
    });
    const start = lowered.frames.find((frame) => frame.segmentId === vowel.id && Math.abs(frame.time - 0.1092) <= 1e-9);
    const end = lowered.frames.find((frame) => frame.segmentId === vowel.id && Math.abs(frame.time - 0.1292) <= 1e-9);

    expect(start?.params).toMatchObject({ AH: 7, B1: 150, B2: 180, maxParam: 10, minParam: 10 });
    expect(start?.params).not.toHaveProperty("unsetParam");
    expect(end?.params).toMatchObject(base);
    expect({
      AH: vowel.get("AH"),
      B1: vowel.get("B1"),
      B2: vowel.get("B2"),
      maxParam: vowel.get("maxParam"),
      minParam: vowel.get("minParam"),
      unsetParam: vowel.get("unsetParam"),
    }).toEqual(base);
  });

  it("resolves previous targets plus suffix and ratio spans on target durations", () => {
    const { utterance, release, vowel } = buildAspirationFixture();
    const windows = vowel.set("control_windows", [
      {
        target: "prev",
        suffix_ms: 5,
        fields: { B1: { op: "set", value: 999 } },
      },
      {
        target: "current",
        start_ratio: 0.25,
        end_ratio: 0.5,
        fields: { AH: { op: "set", value: 12 } },
      },
    ], { reason: "target/span fixture", citations: ["Volenec 2015"] });

    const lowered = lowerToFrames(utterance, POLICY);
    const releaseSuffixStart = lowered.frames.find(
      (frame) => frame.segmentId === release.id && Math.abs(frame.time - 0.1042) <= 1e-9,
    );
    const ratioStart = lowered.frames.find(
      (frame) => frame.segmentId === vowel.id && Math.abs(frame.time - 0.1477) <= 1e-9,
    );
    const ratioEnd = lowered.frames.find(
      (frame) => frame.segmentId === vowel.id && Math.abs(frame.time - 0.1862) <= 1e-9,
    );

    expect(releaseSuffixStart?.params.B1).toBe(999);
    expect(releaseSuffixStart?.provenance.B1).toBe(windows.decisionId);
    expect(ratioStart?.params.AH).toBe(12);
    expect(ratioStart?.provenance.AH).toBe(windows.decisionId);
    expect(ratioEnd?.params.AH).toBe(0);
    expect(release.get("B1")).toBe(300);
    expect(vowel.get("AH")).toBe(0);
  });
});
