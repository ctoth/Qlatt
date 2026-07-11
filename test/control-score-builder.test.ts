import { describe, expect, it, vi } from "vitest";
import {
  textToControlScore,
  textToKlattTrackDetailed,
} from "../src/tts-frontend";
import {
  buildDeclarativeControlScore,
  validateDeclarativeControlScore,
} from "../src/control-score";
import { createProvenanceCollector } from "../src/provenance";

describe("declarative control score builder", () => {
  it("emits a score artifact from the real frontend pipeline", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const score = textToControlScore("the quick brown fox jumps over the lazy dog.", 120);
      expect(score.version).toBe("v2");
      expect(score.frontend_id).toBe("qlatt-english");
      expect(score.segments.length).toBeGreaterThan(0);
      expect(Array.isArray(score.timeline_marks)).toBe(true);
      expect(score.f0_points.length).toBeGreaterThan(0);
      expect(score.lowering_refs.spec_id).toBe("qlatt-english-track-lowering");

      const firstPhone = score.segments.find((token) => token.phoneme !== "SIL");
      expect(firstPhone).toBeDefined();
      expect(firstPhone?.id.length).toBeGreaterThan(0);
      expect(firstPhone?.duration.realized_target_ms).toBeGreaterThan(0);
      expect(firstPhone?.prosody).toBeDefined();
      expect(Array.isArray(firstPhone?.filter?.formants ?? [])).toBe(true);
      expect(firstPhone?.params).toBeDefined();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("is returned alongside the existing detailed track result", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const result = textToKlattTrackDetailed("hello world.", 110);
      expect(result.track.length).toBeGreaterThan(0);
      expect(result.frontendPhones.length).toBeGreaterThan(0);
      expect(result.controlScore.segments.length).toBe(result.frontendPhones.length);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("records a provenance decision when the control score is created", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const provenance = createProvenanceCollector();
      textToKlattTrackDetailed("hello world.", 110, 30, { provenance });
      const decisions = provenance.getDecisions();
      const decision = decisions.find((entry) => entry.type === "control_score_created");
      expect(decision).toBeDefined();
      expect(decision?.stage).toBe("frontend");
      expect(decision?.citations).toContain("/rules/control-score.yaml");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("resolves nasal tagged control windows into timed controls", () => {
    const score = buildDeclarativeControlScore("test", [
      {
        id: "ph_0",
        relation: "phone",
        status: 1,
        phoneme: "AE",
        type: "vowel",
        duration: 100,
        params: { F1: 700, B1: 80, AV: 60 },
      },
      {
        id: "ph_1",
        relation: "phone",
        status: 1,
        phoneme: "N",
        type: "nasal",
        duration: 80,
        params: { F1: 300, B1: 100, AV: 50 },
        control_windows: [
          {
            target: "'prev'",
            suffix_ms: 25,
            fields: {
              nasalCoupling: { op: "'set'", value: 0.75 },
            },
            tag: "'nasal_coupling'",
          },
        ],
      },
    ]);

    expect(score.timed_controls).toEqual([
      {
        id: "ph_1:control_window:0",
        target_segment_id: "ph_0",
        start_offset_ms: 75,
        end_offset_ms: 100,
        fields: {
          nasalCoupling: { op: "set", value: 0.75 },
        },
        tag: "nasal_coupling",
      },
    ]);
    validateDeclarativeControlScore(score);
  });

  it("projects all numeric formant pairs present on the token params", () => {
    const score = buildDeclarativeControlScore("test", [
      {
        id: "ph_0",
        relation: "phone",
        status: 1,
        phoneme: "AA",
        type: "vowel",
        duration: 100,
        params: {
          F1: 700,
          B1: 80,
          F11: 10500,
          B11: 5250,
          AV: 60,
        },
      },
    ]);

    expect(score.segments[0].filter?.formants).toEqual([
      { index: 1, frequency_hz: 700, bandwidth_hz: 80 },
      { index: 11, frequency_hz: 10500, bandwidth_hz: 5250 },
    ]);
    validateDeclarativeControlScore(score);
  });

  it("emits F0 points and layered F0 commands with resolved timing", () => {
    const score = buildDeclarativeControlScore("test", [
      {
        id: "ph_0",
        relation: "phone",
        status: 1,
        phoneme: "AA",
        type: "vowel",
        duration: 100,
        sync_left: "m0",
        sync_right: "m1",
        params: { F1: 700, AV: 60 },
      },
      {
        id: "f0_0",
        relation: "f0",
        status: 1,
        anchor_left: "m0",
        anchor_right: "m1",
        ratio: 0.5,
        value: 140,
        tag: "f0_h_star",
        accentType: "H*",
      },
      {
        id: "f0_layer_0",
        relation: "f0_layer",
        status: 1,
        layer: "stress",
        anchor_left: "m0",
        anchor_right: "m1",
        ratio: 1,
        value: 40,
        duration_frames: 20,
        tag: "stress",
      },
    ]);

    expect(score.f0_points[0]).toMatchObject({
      id: "f0_0",
      timing: { kind: "anchored", anchor_left: "m0", anchor_right: "m1", ratio: 0.5 },
      value_hz: 140,
      tag: "f0_h_star",
      accent_type: "H*",
    });
    expect(score.f0_layer_commands[0]).toMatchObject({
      id: "f0_layer_0",
      timing: { kind: "anchored", anchor_left: "m0", anchor_right: "m1", ratio: 1 },
      layer: "stress",
      value: 40,
      duration_frames: 20,
      tag: "stress",
    });
    expect(score.timeline_marks).toEqual([
      { id: "m0", segment_id: "ph_0", edge: "onset" },
      { id: "m1", segment_id: "ph_0", edge: "release" },
    ]);
    validateDeclarativeControlScore(score);
  });

  it("records voice quality overlays, transition overrides, lowering refs, and deleted token filtering", () => {
    const score = buildDeclarativeControlScore(
      "test",
      [
        {
          id: "ph_0",
          relation: "phone",
          status: 1,
          phoneme: "AA",
          type: "vowel",
          duration: 100,
          transition_ms: 45,
          params: { F1: 700, AV: 60 },
        },
        {
          id: "ph_deleted",
          relation: "phone",
          status: 2,
          phoneme: "SIL",
          type: "silence",
          duration: 100,
          params: { AV: 0 },
        },
      ],
      {
        loweringSpecId: "test-lowering",
        policyPaths: ["/rules/control-score.yaml", "/rules/frontends/test/frontend.yaml"],
        voiceQuality: {
          rd: 2,
          oq: 0,
          tl: 10,
          flutter: 5,
          jitter: 2,
          ah_offset_db: 12,
        },
      },
    );

    expect(score.segments.map((segment) => segment.id)).toEqual(["ph_0"]);
    expect(score.segments[0].alignment.transition_ms).toBe(45);
    expect(score.lowering_refs).toEqual({
      spec_id: "test-lowering",
      policy_paths: ["/rules/control-score.yaml", "/rules/frontends/test/frontend.yaml"],
    });
    expect(score.global_overlays[0]).toEqual({
      id: "voice_quality",
      fields: {
        Rd: { op: "set", value: 2 },
        TL: { op: "add", value: 10 },
        flutter: { op: "set", value: 5 },
        jitter: { op: "set", value: 2 },
        AH: { op: "add", value: 12 },
      },
      tag: "voice_quality",
    });
    validateDeclarativeControlScore(score);
  });
});
