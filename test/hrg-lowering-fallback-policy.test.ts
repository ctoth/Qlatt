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

  it.each([20, 80])("uses a configured %i ms floor at both transition edges", (edgeMs) => {
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
          keys: ["F1"],
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
    expect(timesFor(segments[0].id)).toContain(
      (policy.timeline.initial_silence_ms.value + edgeMs) / 1000,
    );
    expect(timesFor(segments[1].id)).toContain(
      (policy.timeline.initial_silence_ms.value + 200 - edgeMs) / 1000,
    );
  });
});
