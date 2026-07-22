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
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const POLICY = {
  columns: ["F1", "F2", "F3"],
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
  transitions: {
    default_transition_ms: { value: 30 },
    blend: {
      factor: { value: 0.5 },
      keys: ["F1", "F2", "F3"],
      smooth_types: ["vowel", "nasal", "liquid", "glide"],
      smooth_all_boundaries: true,
    },
    loci: {
      P: {
        "1": {
          F1: { locus_hz: 350, prcnt: 55, durtran_ms: 20 },
          F2: { locus_hz: 950, prcnt: 56, durtran_ms: 50 },
          F3: { locus_hz: 2200, prcnt: 25, durtran_ms: 50 },
        },
      },
      T: {
        "1": {
          F1: { locus_hz: 320, prcnt: 43, durtran_ms: 35 },
          F2: { locus_hz: 1700, prcnt: 66, durtran_ms: 35 },
          F3: { locus_hz: 2650, prcnt: 30, durtran_ms: 45 },
        },
      },
    },
    vowel_category: {
      AE: { forward: 1, backward: 1 },
    },
    locus_glue_types: ["stop_release", "stop_aspiration"],
  },
} as const satisfies LowerOptions;

const META = {
  ruleId: "fixture",
  phase: "formant",
  tag: "transition",
  reason: "direct locus transition fixture",
  citations: ["DECtalk 4.63 ph_sttr2.c; p_us_rom.h us_maleloc"],
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
    throw new Error(`captured AE locus event missing at ${time}`);
  }
  const params: Record<string, number> = {};
  for (const [key, value] of Object.entries(frame.params)) {
    if (typeof value === "number") params[key] = value;
  }
  return params;
}

describe("HRG lowering locus transitions", () => {
  it("matches captured DECtalk P-to-AE forward locus cells and per-key spans", () => {
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const closure = addSegment(build, "seg_0", "P", "stop_closure", 83, {
      F1: 350, F2: 1051, F3: 2150,
    });
    const release = addSegment(build, "seg_1", "P_REL", "stop_release", 7, {
      F1: 400, F2: 1100, F3: 2150,
    });
    const vowel = addSegment(build, "seg_2", "AE", "vowel", 154, {
      F1: 680, F2: 1600, F3: 2430,
    });
    const nextClosure = addSegment(build, "seg_3", "T", "stop_closure", 65, {
      F1: 350, F2: 1051, F3: 2150,
    });
    build.partitionAnchors([closure, release, vowel, nextClosure], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
    const closureAnchor = utterance.intervalAnchor(closure);
    const releaseAnchor = utterance.intervalAnchor(release);
    const vowelAnchor = utterance.intervalAnchor(vowel);
    const nextClosureAnchor = utterance.intervalAnchor(nextClosure);
    if (!closureAnchor || !releaseAnchor || !vowelAnchor || !nextClosureAnchor) {
      throw new Error("fixture anchors missing");
    }
    timing.resolveMarkTime(closureAnchor.leftMarkId, 0);
    timing.resolveMarkTime(closureAnchor.rightMarkId, 83);
    timing.resolveMarkTime(releaseAnchor.rightMarkId, 90);
    timing.resolveMarkTime(vowelAnchor.rightMarkId, 244);
    timing.resolveMarkTime(nextClosureAnchor.rightMarkId, 309);
    timing.commit();

    const lowered = lowerToFrames(utterance, POLICY);
    const closureStart = lowered.frames.find(
      (frame) => frame.segmentId === closure.id && Math.abs(frame.time - 0.0192) <= 1e-9,
    );
    const releaseStart = lowered.frames.find(
      (frame) => frame.segmentId === release.id && Math.abs(frame.time - 0.1022) <= 1e-9,
    );
    expect(closureStart?.params.F3).toBe(2150);
    expect(releaseStart?.params.F3).toBe(2257.5);

    for (const time of [0.1092, 0.1292, 0.1592]) {
      const frame = lowered.frames.find(
        (candidate) => candidate.segmentId === vowel.id && Math.abs(candidate.time - time) <= 1e-9,
      );
      const production = productionParams(time);
      expect(frame, `frame ${time}`).toBeDefined();
      for (const column of POLICY.columns) {
        expect(frame?.params[column], `${time}.${column}`).toBe(production[column]);
      }
    }
    for (const time of [0.2182, 0.2282]) {
      const frame = lowered.frames.find(
        (candidate) => candidate.segmentId === vowel.id && Math.abs(candidate.time - time) <= 1e-9,
      );
      const production = productionParams(time);
      expect(frame, `frame ${time}`).toBeDefined();
      for (const column of POLICY.columns) {
        expect(frame?.params[column], `${time}.${column}`).toBe(production[column]);
      }
    }
  });

  it("applies data-gated rounded-sonorant and F2-back locus adjustments", () => {
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const closure = addSegment(build, "adjust_p", "P", "stop_closure", 83, {
      F1: 350, F2: 1051, F3: 2150,
    });
    const glide = addSegment(build, "adjust_w", "W", "glide", 100, {
      F1: 300, F2: 2000, F3: 3000,
    });
    build.partitionAnchors([closure, glide], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
    const closureAnchor = utterance.intervalAnchor(closure);
    const glideAnchor = utterance.intervalAnchor(glide);
    if (!closureAnchor || !glideAnchor) throw new Error("fixture anchors missing");
    timing.resolveMarkTime(closureAnchor.leftMarkId, 0);
    timing.resolveMarkTime(closureAnchor.rightMarkId, 83);
    timing.resolveMarkTime(glideAnchor.rightMarkId, 183);
    timing.commit();
    const policy: LowerOptions = {
      ...POLICY,
      timeline: {
        ...POLICY.timeline,
        initial_silence_ms: { value: 0 },
      },
      transitions: {
        ...POLICY.transitions,
        vowel_category: { W: { forward: 1, backward: 1 } },
        rounded_sonorant_consonant: ["W"],
        obstruent_place: { P: { palatal_or_dental: false } },
        f2_back: { W: { forward: true, backward: false } },
      },
    };

    const lowered = lowerToFrames(utterance, policy);
    const boundary = lowered.frames.find(
      (frame) => frame.segmentId === glide.id && Math.abs(frame.time - 0.083) <= 1e-9,
    );

    // F2: prcnt 56 -> rounded 78 -> F2-back 84; 950 + .84*(2000-950).
    expect(boundary?.params.F2).toBe(1832);
    // F3: prcnt 25 -> rounded floor(25/2)+50 = 62; 2200 + .62*(3000-2200).
    expect(boundary?.params.F3).toBe(2696);
  });

  it("selects the declared female locus table from speaker data", () => {
    const utterance = new Utterance(SCHEMA);
    const build = utterance.beginTransaction(META);
    const closure = addSegment(build, "female_p", "P", "stop_closure", 83, {
      F1: 350, F2: 1051, F3: 2150,
    });
    const vowel = addSegment(build, "female_ae", "AE", "vowel", 100, {
      F1: 680, F2: 1600, F3: 2430,
    });
    build.partitionAnchors([closure, vowel], utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
    const closureAnchor = utterance.intervalAnchor(closure);
    const vowelAnchor = utterance.intervalAnchor(vowel);
    if (!closureAnchor || !vowelAnchor) throw new Error("fixture anchors missing");
    timing.resolveMarkTime(closureAnchor.leftMarkId, 0);
    timing.resolveMarkTime(closureAnchor.rightMarkId, 83);
    timing.resolveMarkTime(vowelAnchor.rightMarkId, 183);
    timing.commit();
    const policy: LowerOptions = {
      ...POLICY,
      timeline: { ...POLICY.timeline, initial_silence_ms: { value: 0 } },
      transitions: {
        ...POLICY.transitions,
        loci_female: {
          P: {
            "1": {
              F1: { locus_hz: 400, prcnt: 50, durtran_ms: 20 },
              F2: { locus_hz: 1200, prcnt: 50, durtran_ms: 50 },
              F3: { locus_hz: 2500, prcnt: 50, durtran_ms: 50 },
            },
          },
        },
      },
    };

    const male = lowerToFrames(utterance, policy);
    const female = lowerToFrames(utterance, policy, { speakerSex: "female" });
    const maleBoundary = male.frames.find((frame) => frame.segmentId === vowel.id && frame.time === 0.083);
    const femaleBoundary = female.frames.find((frame) => frame.segmentId === vowel.id && frame.time === 0.083);

    expect(maleBoundary?.params.F1).toBe(531.5);
    expect(femaleBoundary?.params.F1).toBe(540);
    expect(femaleBoundary?.params.F2).toBe(1400);
    expect(femaleBoundary?.params.F3).toBe(2465);
  });
});
