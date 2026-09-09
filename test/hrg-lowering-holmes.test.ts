import { describe, expect, it } from "vitest";
import { withFrameSchema } from "../src/declarative-frontend/hrg/frame";
import { lowerToFrames, readLowerOptions, Utterance } from "../src/declarative-frontend/hrg";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

function fixture(withBoundary = true, reverse = false, externalMs = 30, internalMs = 20) {
  const formants = { kind: "object", fields: { F2: { kind: "number" } } } as const;
  const utterance = new Utterance(withFrameSchema({
    itemTypes: {
      segment: {
        features: {
          phoneme: { kind: "string" },
          type: { kind: "string" },
          duration: { kind: "number" },
          F2: { kind: "number" },
          boundary_fixed: formants,
          boundary_proportion: formants,
          boundary_rank: { kind: "number" },
          boundary_external_ms: formants,
          boundary_internal_ms: formants,
          boundary_citations: { kind: "array", items: { kind: "string" } },
        },
      },
    },
    relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
  }));
  const meta = {
    ruleId: "fixture",
    phase: "input",
    tag: "transition",
    reason: "Holmes 1964 S OO worked example",
    citations: ["Holmes et al. 1964 p.133"],
  };
  const build = utterance.beginTransaction(meta);
  const s = build.createItem("segment", "s");
  const oo = build.createItem("segment", "oo");
  for (const [item, phone, type, f2] of [
    [s, "S", "fricative", 1720],
    [oo, "UW", "vowel", 1000],
  ] as const) {
    build.set(item, "phoneme", phone);
    build.set(item, "type", type);
    build.set(item, "duration", 100);
    build.set(item, "F2", f2);
  }
  if (withBoundary) {
    build.set(s, "boundary_fixed", { F2: 950 });
    build.set(s, "boundary_proportion", { F2: 0.5 });
    build.set(s, "boundary_rank", 18);
    build.set(s, "boundary_external_ms", { F2: externalMs });
    build.set(s, "boundary_internal_ms", { F2: internalMs });
    build.set(s, "boundary_citations", ["Holmes et al. 1964 p.133"]);
  }
  const segments = reverse ? [oo, s] : [s, oo];
  for (const item of segments) build.append("Segment", item);
  build.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();
  const timing = utterance.beginTransaction(meta);
  for (const [index, item] of segments.entries()) {
    const anchor = utterance.intervalAnchor(item);
    if (!anchor) throw new Error("missing fixture anchor");
    timing.resolveMarkTime(anchor.leftMarkId, index * 100);
    timing.resolveMarkTime(anchor.rightMarkId, (index + 1) * 100);
  }
  timing.commit();
  const base = readLowerOptions(loadBundledRulepackSpec("qlatt-english").output.lowering);
  const policy = {
    ...base,
    columns: ["F2"],
    transitions: {
      ...base.transitions,
      blend: { ...base.transitions.blend, keys: ["F2"], smooth_all_boundaries: true },
      sonorant_f2: undefined,
    },
  };
  return { utterance, track: lowerToFrames(utterance, policy) };
}

describe("Holmes boundary targets", () => {
  it("preserves zero-duration boundary discontinuities instead of blending", () => {
    const { track } = fixture(true, false, 0, 0);
    expect(
      track.frames
        .filter((frame) => frame.segmentId === "s")
        .every((frame) => frame.params.F2 === 1720),
    ).toBe(true);
    expect(
      track.frames
        .filter((frame) => frame.segmentId === "oo")
        .every((frame) => frame.params.F2 === 1000),
    ).toBe(true);
  });
  it("uses fixed plus proportional target and both tabulated durations", () => {
    const { track, utterance } = fixture();
    // The policy adds 30 ms initial silence to the resolved segment clock.
    const value = (time: number) =>
      track.frames.find((frame) => Math.abs(frame.time - time) < 1e-9)?.params.F2;
    expect(value(0.11)).toBe(1720);
    expect(value(0.13)).toBe(1450);
    expect(value(0.16)).toBe(1000);
    expect(
      utterance.diagnostics
        .getEntries()
        .some((entry) => entry.code === "HRG_LOWER_TRANSITION_FALLBACK"),
    ).toBe(false);
  });

  it("uses the same consonant-controlled boundary in reverse", () => {
    const { track } = fixture(true, true);
    expect(track.frames.find((frame) => Math.abs(frame.time - 0.13) < 1e-9)?.params.F2).toBe(1450);
    expect(track.frames.find((frame) => Math.abs(frame.time - 0.15) < 1e-9)?.params.F2).toBe(1720);
  });

  it("diagnoses the flat fallback only when table and explicit timing are absent", () => {
    const { utterance } = fixture(false);
    expect(
      utterance.diagnostics
        .getEntries()
        .some((entry) => entry.code === "HRG_LOWER_TRANSITION_FALLBACK"),
    ).toBe(true);
  });
});
