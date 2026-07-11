import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, LowerOptions } from "../src/declarative-frontend/hrg";
import { compileAffect } from "../src/input/affect";
import {
  attachDirectionsToUtterance,
  DIRECTION_ITEM_SCHEMA,
  parseDirectionInput,
} from "../src/input/parse";

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "affect lowering fixture",
  citations: ["Rutledge_1995"],
};

const COLUMNS = [
  "F0", "F1", "F2", "F3", "B1", "B2", "B3", "AV", "AH", "GO", "TL",
  "Rd", "RdPhraseOffset", "jitter",
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
      direction: DIRECTION_ITEM_SCHEMA,
      segment: { features: segmentFeatures },
      word: { features: { text: { kind: "string" } } },
    },
    relations: {
      Affect: { kind: "list", itemTypes: ["direction"] },
      Break: { kind: "list", itemTypes: ["direction"] },
      Intonation: { kind: "list", itemTypes: ["direction"] },
      Segment: { kind: "list", itemTypes: ["segment"] },
      SylStructure: { kind: "tree", itemTypes: ["word", "segment"] },
      Word: { kind: "list", itemTypes: ["word"] },
    },
  };
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
    default_transition_ms: { value: 0 },
    blend: { factor: { value: 0.5 }, keys: [], smooth_types: [] },
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

function fixture(): Utterance {
  const parsed = parseDirectionInput({
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
  });
  const utterance = new Utterance(schema(), parsed.provenance);
  attachDirectionsToUtterance(parsed, utterance);

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
  it("composes global and field-wise winning local deltas over graph-linked Words", () => {
    const angry = compileAffect("angry", 1).vq;
    const utterance = fixture();
    const lowered = lowerToFrames(utterance, POLICY);
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
  });
});
