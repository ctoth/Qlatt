import { describe, expect, it } from "vitest";
import type { FeatureSchema, HrgSchema, LowerOptions } from "../src/declarative-frontend/hrg";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import { compileAffect } from "../src/input/affect";
import { parseAffectPresets } from "../src/input/affect-presets";
import {
  attachDirectionsToUtterance,
  buildDirectionItemSchema,
  parseDirectionInput,
} from "../src/input/parse";
import { readRdPolicy } from "../src/input/rd-policy";
import { parseVoiceQualityChannels } from "../src/input/vq-channels";
import { loadYamlDocumentSync } from "../src/yaml-loader";

const rdPolicy = readRdPolicy(loadYamlDocumentSync("/rules/policy/vq-channels.yaml"));
const channels = parseVoiceQualityChannels(loadYamlDocumentSync("/rules/policy/vq-channels.yaml"));
const library = parseAffectPresets(loadYamlDocumentSync("/rules/affect/presets.yaml"));
const context = { frontendId: "fixture", rdPolicy, vqChannels: channels };

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "affect lowering fixture",
  citations: ["Rutledge_1995"],
};

const COLUMNS = [
  "F0",
  "F1",
  "F2",
  "F3",
  "B1",
  "B2",
  "B3",
  "AV",
  "AH",
  "GO",
  "TL",
  "Rd",
  "RdPhraseOffset",
  "jitter",
] as const;

function schema(): HrgSchema {
  const segmentFeatures: Record<string, FeatureSchema> = {
    active: { kind: "boolean" },
    duration: { kind: "number" },
    phoneme: { kind: "string" },
    type: { kind: "string" },
  };
  for (const column of COLUMNS) segmentFeatures[column] = { kind: "number" };
  return {
    itemTypes: {
      direction: buildDirectionItemSchema(channels),
      f0Point: { features: { value: { kind: "number" } } },
      segment: { features: segmentFeatures },
      word: { features: { text: { kind: "string" } } },
    },
    relations: {
      Affect: { kind: "list", itemTypes: ["direction"] },
      Break: { kind: "list", itemTypes: ["direction"] },
      F0Point: { kind: "list", itemTypes: ["f0Point"] },
      Intonation: { kind: "list", itemTypes: ["direction"] },
      Segment: { kind: "list", itemTypes: ["segment"] },
      SylStructure: { kind: "tree", itemTypes: ["word", "segment"] },
      Word: { kind: "list", itemTypes: ["word"] },
    },
  };
}

function varianceFixture(): Utterance {
  const parsed = parseDirectionInput(
    {
      score: { text: "red moon" },
      directionTrack: {
        version: "1",
        global: { affect: { preset: "angry", degree: 1 } },
      },
    },
    { affectLibrary: library, vqChannels: channels },
  );
  const utterance = new Utterance(schema(), parsed.provenance);
  attachDirectionsToUtterance(parsed, utterance);

  const build = utterance.beginTransaction(META);
  const segments = ["EH", "UW"].map((phoneme, index) => {
    const segment = build.createItem("segment", `variance-segment-${index}`);
    build.set(segment, "phoneme", phoneme);
    build.set(segment, "type", "vowel");
    build.set(segment, "duration", 100);
    build.set(segment, "active", true);
    for (const [key, value] of Object.entries(params())) build.set(segment, key, value);
    build.append("Segment", segment);
    return segment;
  });
  build.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();

  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  timing.resolveMarkTime(utterance.axis.start.id, 0);
  const firstAnchor = utterance.intervalAnchor(segments[0]);
  if (!firstAnchor) throw new Error("first variance Segment anchor missing");
  timing.resolveMarkTime(firstAnchor.rightMarkId, 100);
  timing.resolveMarkTime(utterance.axis.end.id, 200);
  timing.commit();

  const contour = utterance.beginTransaction({ ...META, ruleId: "contour", tag: "f0" });
  const values = [100, 200];
  segments.forEach((segment, index) => {
    const anchor = utterance.intervalAnchor(segment);
    const value = values[index];
    if (!anchor || value == null) throw new Error("variance contour anchor missing");
    const point = contour.createItem("f0Point", `variance-point-${index}`);
    contour.set(point, "value", value);
    contour.append("F0Point", point);
    contour.anchorPoint(point, anchor.leftMarkId, anchor.rightMarkId, 0);
  });
  contour.commit();
  return utterance;
}

const POLICY: LowerOptions = {
  columns: COLUMNS,
  timeline: {
    initial_silence_ms: { value: 0 },
    final_silence_ms: { value: 0 },
    duration_floors: { stop_release_ms: { value: 1 }, default_ms: { value: 1 } },
    event_points: {
      include_segment_start: true,
      include_control_boundaries: true,
      include_f0_anchors: true,
      include_transition_steady_time: true,
    },
  },
  transitions: {
    min_transition_edge_ms: { value: 20, citations: ["engineering estimate: fixture"] },
    default_transition_ms: { value: 0 },
    blend: { factor: { value: 0.5 }, keys: [], smooth_types: [] },
  },
  f0: {
    renderer: { type: "point_interpolation" },
    output_clamp: { min_hz: { value: 0 }, max_hz: { value: 500 } },
  },
};

function params(): Record<(typeof COLUMNS)[number], number> {
  return {
    F0: 150,
    F1: 700,
    F2: 1200,
    F3: 2600,
    B1: 130,
    B2: 110,
    B3: 190,
    AV: 60,
    AH: 35,
    GO: 47,
    TL: 10,
    Rd: 0.7,
    RdPhraseOffset: 0,
    jitter: 4,
  };
}

function fixture(withAffect = true): Utterance {
  const parsed = parseDirectionInput(
    {
      score: { text: "red moon" },
      directionTrack: {
        version: "1",
        global: { affect: { preset: "angry", degree: 1 } },
        spans: [
          {
            id: "low",
            anchor: { unit: "word", start: 1 },
            precedence: 1,
            voiceQuality: { intensityBoost: 10, f0Scale: 2 },
          },
          {
            id: "high",
            anchor: { unit: "word", start: 1 },
            precedence: 2,
            voiceQuality: { intensityBoost: -2, f0Scale: 0.5 },
          },
        ],
      },
    },
    { affectLibrary: library, vqChannels: channels },
  );
  const utterance = new Utterance(schema(), parsed.provenance);
  if (withAffect) attachDirectionsToUtterance(parsed, utterance);

  const build = utterance.beginTransaction(META);
  const words = ["red", "moon"].map((text, index) => {
    const word = build.createItem("word", `word-${index}`);
    build.set(word, "text", text);
    build.append("Word", word);
    build.addRoot("SylStructure", word);
    return word;
  });
  const segments = ["EH", "UW"].map((phoneme, index) => {
    const segment = build.createItem("segment", `segment-${index}`);
    build.set(segment, "phoneme", phoneme);
    build.set(segment, "type", "vowel");
    build.set(segment, "duration", 100);
    build.set(segment, "active", true);
    for (const [key, value] of Object.entries(params())) build.set(segment, key, value);
    build.append("Segment", segment);
    const word = words[index];
    if (!word) throw new Error("word Item missing");
    build.addDaughter("SylStructure", word, segment);
    return segment;
  });
  build.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();

  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  timing.resolveMarkTime(utterance.axis.start.id, 0);
  const firstAnchor = utterance.intervalAnchor(segments[0]);
  if (!firstAnchor) throw new Error("first Segment anchor missing");
  timing.resolveMarkTime(firstAnchor.rightMarkId, 100);
  timing.resolveMarkTime(utterance.axis.end.id, 200);
  timing.commit();
  return utterance;
}

describe("HRG lowering Affect projection", () => {
  it("uses the supplied Rd bounds and names a missing consuming resource", () => {
    const narrowed = readRdPolicy({
      effective_rd: { min: 0.6, max: 0.8, citations: ["Fant_1997"] },
    });
    const lowered = lowerToFrames(fixture(), POLICY, { ...context, rdPolicy: narrowed });
    const first = lowered.frames.find((frame) => frame.segmentId === "segment-0");
    expect(first).toBeDefined();
    if (!first) throw new Error("fixture segment missing");
    expect(first.params.Rd + first.params.RdPhraseOffset).toBeCloseTo(0.6);
    expect(() => lowerToFrames(fixture(), POLICY, { frontendId: "without-vq" })).toThrow(
      "E_FRONTEND_CONFIG: frontend 'without-vq' requires vq_channels",
    );
  });

  it.each([
    { phoneme: "REST", type: "pause", declared: true, eligible: true },
    { phoneme: "EH", type: "silence", declared: true, eligible: false },
    { phoneme: "REST", type: "silence", declared: false, eligible: false },
  ])("scales declared pause identity: $phoneme/$type, context=$declared", (testCase) => {
    for (const pauseScale of [1, 1.5]) {
      const utterance = fixture();
      const firstSegment = utterance.relation("Segment").listItems()[0];
      const globalAffect = utterance.relation("Affect").listItems()[0];
      if (!firstSegment || !globalAffect) throw new Error("pause fixture Items missing");
      firstSegment.set("phoneme", testCase.phoneme, META);
      firstSegment.set("type", testCase.type, META);
      const durationScale = 1.25;
      globalAffect.set(
        "delta",
        { ...compileAffect(library, channels, "angry", 1).vq, durationScale, pauseScale },
        META,
      );
      const policy = {
        ...POLICY,
        timeline: {
          ...POLICY.timeline,
          initial_silence_ms: { value: 10 },
          final_silence_ms: { value: 20 },
        },
      };
      const lowered = lowerToFrames(utterance, policy, {
        ...context,
        ...(testCase.declared
          ? {
              silence: {
                symbol: "REST",
                initialParams: params(),
                finalParams: params(),
                decisionId: globalAffect.latestWrite("delta")!.decisionId,
              },
            }
          : {}),
      });
      const first = lowered.frames.find((frame) => frame.segmentId === "segment-0");
      const second = lowered.frames.find((frame) => frame.segmentId === "segment-1");
      if (!first || !second) throw new Error("pause fixture frames missing");
      const edgeScale = durationScale * pauseScale;
      const firstDuration = 100 * durationScale * (testCase.eligible ? pauseScale : 1);
      const secondDuration = 100 * durationScale;
      expect(first.time).toBeCloseTo((10 * edgeScale) / 1000, 9);
      expect(second.time).toBeCloseTo((10 * edgeScale + firstDuration) / 1000, 9);
      expect(lowered.totalMs).toBeCloseTo(30 * edgeScale + firstDuration + secondDuration, 9);
      expect(utterance.axis.start.time).toBe(0);
      expect(utterance.axis.end.time).toBe(200);
    }
  });

  it("retains the existing formant clamp without a VQ resource or delta", () => {
    const utterance = fixture(false);
    const update = utterance.beginTransaction(META);
    for (const segment of utterance.relation("Segment").listItems()) {
      update.set(segment, "F1", 0);
    }
    update.commit();
    const lowered = lowerToFrames(utterance, POLICY);
    expect(lowered.frames.find((frame) => frame.segmentId === "segment-0")?.params.F1).toBe(1);
    expect(utterance.diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "HRG_LOWER_VALUE_CLAMPED",
        data: expect.objectContaining({ key: "F1", requested: 0, clamped: 1 }),
      }),
    );
  });

  it("composes global and field-wise winning local deltas over graph-linked Words", () => {
    const angry = compileAffect(library, channels, "angry", 1).vq;
    const utterance = fixture();
    const lowered = lowerToFrames(utterance, POLICY, context);
    const first = lowered.frames.find((frame) => frame.segmentId === "segment-0");
    const second = lowered.frames.find((frame) => frame.segmentId === "segment-1");
    if (!first || !second) throw new Error("lowered Segment frames missing");

    expect(first.time).toBe(0);
    expect(second.time).toBeCloseTo(0.1 * angry.durationScale, 9);
    expect(lowered.totalMs).toBeCloseTo(200 * angry.durationScale, 9);
    expect(first.params.GO).toBeCloseTo(47 + angry.intensityBoost, 9);
    expect(second.params.GO).toBeCloseTo(47 + angry.intensityBoost - 2, 9);
    expect(first.params.F0).toBeCloseTo(150 * angry.f0Scale, 9);
    expect(second.params.F0).toBeCloseTo(150 * angry.f0Scale * 0.5, 9);
    expect(first.params.Rd + first.params.RdPhraseOffset).toBeCloseTo(0.3, 9);
    expect(first.params.jitter).toBeCloseTo(4 * angry.jitterScale, 9);
    expect(lowered.provenanceByFrame[lowered.frames.indexOf(second)].GO).toBe(
      utterance.relation("Affect").listItems().at(-1)?.latestWrite("delta")?.decisionId,
    );
    expect(utterance.diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "HRG_LOWER_VALUE_CLAMPED",
        data: expect.objectContaining({ itemId: "segment-0", key: "RdPhraseOffset" }),
      }),
    );
  });

  it("scales completed F0 excursion around its voiced mean with Affect provenance", () => {
    const angry = compileAffect(library, channels, "angry", 1).vq;
    const utterance = varianceFixture();
    const lowered = lowerToFrames(utterance, POLICY, context);
    const voiced = lowered.frames.filter((frame) => frame.segmentId != null);
    const first = voiced[0];
    const second = voiced[1];
    if (!first || !second) throw new Error("variance frames missing");

    const mean = 150;
    expect(first.params.F0).toBeCloseTo(
      (mean + (100 - mean) * angry.f0VarianceScale) * angry.f0Scale,
      9,
    );
    expect(second.params.F0).toBeCloseTo(
      (mean + (200 - mean) * angry.f0VarianceScale) * angry.f0Scale,
      9,
    );
    expect((first.params.F0 + second.params.F0) / 2).toBeCloseTo(mean * angry.f0Scale, 9);
    const varianceDecision = utterance
      .relation("Affect")
      .listItems()[0]
      ?.latestWrite("delta")?.decisionId;
    expect(lowered.provenanceByFrame[lowered.frames.indexOf(first)].F0).toBe(varianceDecision);
    expect(lowered.provenanceByFrame[lowered.frames.indexOf(second)].F0).toBe(varianceDecision);
  });

  it("rejects a negative F0-variance scale with a diagnostic", () => {
    const utterance = varianceFixture();
    const affect = utterance.relation("Affect").listItems()[0];
    if (!affect) throw new Error("variance Affect Item missing");
    affect.set(
      "delta",
      { ...compileAffect(library, channels, "angry", 1).vq, f0VarianceScale: -1 },
      META,
    );

    expect(() => lowerToFrames(utterance, POLICY, context)).toThrowError(/E_HRG_LOWER_F0_VARIANCE/);
    expect(utterance.diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "HRG_LOWER_F0_VARIANCE_REJECTED",
        data: expect.objectContaining({ itemId: "variance-segment-0", scale: -1 }),
      }),
    );
  });
});
