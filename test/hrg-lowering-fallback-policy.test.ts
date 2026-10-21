import { describe, expect, it } from "vitest";
import { lowerToFrames, readLowerOptions, Utterance } from "../src/declarative-frontend/hrg";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { validateDslSpec } from "../src/declarative-frontend/validation";

describe("declarative transition edge policy", () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, "20"])(
    "rejects an invalid transition edge value %s",
    (value) => {
      const spec = structuredClone(loadBundledRulepackSpec("qlatt-english"));
      const policy = readLowerOptions(spec.output.lowering);
      Reflect.set(policy.transitions.min_transition_edge_ms, "value", value);
      expect(
        validateDslSpec(spec).some(
          (diagnostic) =>
            diagnostic.code === "E_LOWERING_SPEC_NUMBER" &&
            diagnostic.path === "output.lowering.transitions.min_transition_edge_ms.value",
        ),
      ).toBe(true);
      expect(() => readLowerOptions(policy)).toThrow("E_HRG_LOWER_POLICY");
    },
  );

  it("requires a citation on the transition edge policy", () => {
    const spec = structuredClone(loadBundledRulepackSpec("qlatt-english"));
    const policy = readLowerOptions(spec.output.lowering);
    Reflect.deleteProperty(policy.transitions.min_transition_edge_ms, "citations");
    expect(
      validateDslSpec(spec).some(
        (diagnostic) =>
          diagnostic.code === "E_LOWERING_SPEC_CITATION" &&
          diagnostic.path === "output.lowering.transitions.min_transition_edge_ms.citations",
      ),
    ).toBe(true);
  });

  it("rejects a missing transition edge policy during validation and policy loading", () => {
    const spec = structuredClone(loadBundledRulepackSpec("qlatt-english"));
    const policy = readLowerOptions(spec.output.lowering);
    Reflect.deleteProperty(policy.transitions, "min_transition_edge_ms");

    expect(
      validateDslSpec(spec).some(
        (diagnostic) =>
          diagnostic.code === "E_LOWERING_SPEC_NUMBER" &&
          diagnostic.path === "output.lowering.transitions.min_transition_edge_ms",
      ),
    ).toBe(true);
    expect(() => readLowerOptions(policy)).toThrow("E_HRG_LOWER_POLICY");
  });

  it.each([
    { edgeMs: 5, noFields: false },
    { edgeMs: 20, noFields: false },
    { edgeMs: 80, noFields: false },
    { edgeMs: 100, noFields: false },
    { edgeMs: 100, noFields: true },
  ])("reports altered windows with edge $edgeMs and noFields=$noFields", ({ edgeMs, noFields }) => {
    const base = readLowerOptions(loadBundledRulepackSpec("qlatt-english").output.lowering);
    const policy = {
      ...base,
      columns: ["F1"],
      transitions: {
        ...base.transitions,
        min_transition_edge_ms: { value: edgeMs, citations: ["engineering estimate: test"] },
        default_transition_ms: { value: 90, citations: ["engineering estimate: test"] },
        blend: {
          factor: { value: 0.5, citations: ["engineering estimate: test"] },
          keys: noFields ? [] : ["F1"],
          smooth_types: ["vowel"],
          smooth_all_boundaries: true,
        },
        sonorant_f2: undefined,
      },
    };
    const utterance = new Utterance({
      itemTypes: {
        segment: {
          features: {
            phoneme: { kind: "string" },
            type: { kind: "string" },
            duration: { kind: "number" },
            active: { kind: "boolean" },
            F1: { kind: "number" },
          },
        },
      },
      relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
    });
    const metadata = {
      ruleId: "fixture",
      phase: "input",
      tag: "fixture",
      reason: "configured transition edge fixture",
      citations: ["engineering estimate: test"],
    };
    const build = utterance.beginTransaction(metadata);
    const segments = [500, 700].map((f1, index) => {
      const segment = build.createItem("segment", `segment_${index}`);
      build.set(segment, "phoneme", "AA");
      build.set(segment, "type", "vowel");
      build.set(segment, "duration", 100);
      build.set(segment, "active", true);
      build.set(segment, "F1", f1);
      build.append("Segment", segment);
      return segment;
    });
    build.partitionAnchors(segments, utterance.axis.start.id, utterance.axis.end.id);
    build.commit();
    const timing = utterance.beginTransaction(metadata);
    segments.forEach((segment, index) => {
      const anchor = utterance.intervalAnchor(segment);
      if (!anchor) throw new Error("fixture anchor missing");
      timing.resolveMarkTime(anchor.leftMarkId, index * 100);
      timing.resolveMarkTime(anchor.rightMarkId, (index + 1) * 100);
    });
    timing.commit();

    const track = lowerToFrames(utterance, policy);
    const timesFor = (id: string) =>
      track.frames.filter((frame) => frame.segmentId === id).map((frame) => frame.time);
    const dropped = edgeMs >= 100;
    const warnings = utterance.diagnostics
      .getEntries()
      .filter((entry) => entry.code === "HRG_LOWER_TRANSITION_WINDOW_LIMITED");
    expect(warnings).toHaveLength(edgeMs > 10 && !noFields ? 2 : 0);
    if (warnings.length > 0) {
      expect(warnings[0]).toMatchObject({
        level: "warn",
        data: {
          itemId: segments[0].id,
          kind: "blend",
          edge: "trailing",
          requested: { startMs: 10, endMs: 100 },
          applied: dropped ? null : { startMs: edgeMs, endMs: 100 },
          reason: "minimum_transition_edge",
          fields: ["F1"],
          citations: ["engineering estimate: test"],
          parents: expect.arrayContaining([segments[0].latestWrite("F1")?.decisionId]),
        },
      });
      expect(warnings[1]).toMatchObject({
        data: {
          itemId: segments[1].id,
          edge: "leading",
          requested: { startMs: 0, endMs: 90 },
          applied: dropped ? null : { startMs: 0, endMs: 100 - edgeMs },
        },
      });
    }
    expect(
      utterance.diagnostics
        .getEntries()
        .some((entry) => entry.code === "HRG_LOWER_TRANSITION_FALLBACK"),
    ).toBe(true);
    if (dropped || noFields) {
      expect(track.frames.some((frame) => frame.params.F1 === 600)).toBe(false);
    } else {
      expect(timesFor(segments[0].id)).toContain(
        (policy.timeline.initial_silence_ms.value + Math.max(edgeMs, 10)) / 1000,
      );
      expect(timesFor(segments[1].id)).toContain(
        (policy.timeline.initial_silence_ms.value + 100 + Math.min(90, 100 - edgeMs)) / 1000,
      );
      expect(track.frames.some((frame) => frame.params.F1 === 600)).toBe(true);
    }
  });
});
