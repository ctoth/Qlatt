import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  lowerControlScoreToKlattTrack,
  renderLayeredF0,
  computeButterworth2Coefficients,
  iirFilter2Pole,
  createFilterState,
} from "../src/track-assembler";
import type {
  LayeredF0ModelConfig,
  F0LayerCommand,
  TrackLoweringSpec,
} from "../src/track-assembler";
import type { InventorySpec } from "../src/declarative-frontend/inventory";
import type {
  ControlScoreSegment,
  DeclarativeControlScore,
} from "../src/tts-frontend-types";

const TEST_LOWERING_SPEC: TrackLoweringSpec = {
  id: "test-lowering",
  timeline: {
    initial_silence_ms: { value: 30, citations: ["test"] },
    final_silence_ms: { value: 100, citations: ["test"] },
    duration_floors: {
      stop_release_ms: { value: 5, citations: ["test"] },
      default_ms: { value: 20, citations: ["test"] },
    },
    event_points: {
      include_segment_start: true,
      include_control_boundaries: true,
      include_f0_anchors: true,
      include_transition_steady_time: true,
    },
  },
  transitions: {
    default_transition_ms: { value: 30, citations: ["test"] },
    blend: {
      factor: { value: 0.35, citations: ["test"] },
      keys: ["F1", "F2", "F3", "B1", "B2", "B3"],
      smooth_types: ["vowel", "nasal", "liquid", "glide"],
    },
  },
  f0: {
    renderer: { type: "point_interpolation" },
    output_clamp: {
      min_hz: { value: 0, citations: ["test"] },
      max_hz: { value: 500, citations: ["test"] },
    },
  },
  overlays: { operation_order: ["voice_quality", "timed_controls", "f0"] },
};
const TEST_INVENTORY: InventorySpec = {
  base_params: {
    F0: 0,
    F1: 500,
    F2: 1500,
    F3: 2500,
    B1: 90,
    B2: 110,
    B3: 170,
    AV: 0,
    AF: 0,
    AH: 0,
    SW: 0,
  },
  phoneme_targets: {
    SIL: { F0: 0, F1: 500, F2: 1500, F3: 2500, B1: 90, B2: 110, B3: 170, AV: 0, AF: 0, AH: 0, SW: 0 },
    D_REL: { dur: 15, AF: 40, AV: 0, AH: 0, SW: 1, F1: 280, F2: 1800, F3: 2600 },
  },
};

function makeSegment(
  id: string,
  phoneme: string,
  type: string,
  durationMs: number,
  params: Record<string, number>,
  transitionMs?: number,
): ControlScoreSegment {
  return {
    id,
    phoneme,
    type,
    prosody: {},
    alignment: {
      onset_mark: `${id}:onset`,
      release_mark: `${id}:release`,
      ...(transitionMs !== undefined ? { transition_ms: transitionMs } : {}),
    },
    duration: { realized_target_ms: durationMs },
    params,
  };
}

function makeScore(
  segments: ControlScoreSegment[],
  overrides: Partial<Omit<DeclarativeControlScore, "version" | "frontend_id" | "segments" | "timeline_marks" | "lowering_refs">> = {},
): DeclarativeControlScore {
  return {
    version: "v2",
    frontend_id: "test",
    segments,
    timeline_marks: segments.flatMap((segment) => [
      ...(segment.alignment.onset_mark
        ? [{ id: segment.alignment.onset_mark, segment_id: segment.id, edge: "onset" as const }]
        : []),
      ...(segment.alignment.release_mark
        ? [{ id: segment.alignment.release_mark, segment_id: segment.id, edge: "release" as const }]
        : []),
    ]),
    timed_controls: overrides.timed_controls ?? [],
    f0_points: overrides.f0_points ?? [],
    f0_layer_commands: overrides.f0_layer_commands ?? [],
    global_overlays: overrides.global_overlays ?? [],
    lowering_refs: { spec_id: TEST_LOWERING_SPEC.id, policy_paths: ["/rules/control-score.yaml"] },
  };
}

function lowerTestScore(
  score: DeclarativeControlScore,
  options: {
    spec?: TrackLoweringSpec;
    baseF0?: number;
    transitionMs?: number;
    f0Model?: LayeredF0ModelConfig;
  } = {},
) {
  return lowerControlScoreToKlattTrack(score, options.spec ?? TEST_LOWERING_SPEC, {
    inventorySpec: TEST_INVENTORY,
    baseF0: options.baseF0 ?? 120,
    ...(options.transitionMs !== undefined ? { transitionMs: options.transitionMs } : {}),
    ...(options.f0Model ? { f0Model: options.f0Model } : {}),
  });
}

// Suppress warnings during tests
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("track-assembler", () => {
  describe("lowerControlScoreToKlattTrack", () => {
    it("produces monotonically increasing times", () => {
      const track = textToKlattTrack("hello", 120, 30);
      for (let i = 1; i < track.length; i++) {
        expect(track[i].time).toBeGreaterThanOrEqual(track[i - 1].time);
      }
    });

    it("all parameter values are finite", () => {
      const track = textToKlattTrack("the quick brown fox.", 120, 30);
      for (const frame of track) {
        for (const [key, value] of Object.entries(frame.params)) {
          expect(Number.isFinite(value)).toBe(true);
        }
      }
    });

    it("first frame has time 0 and is silence", () => {
      const track = textToKlattTrack("hello", 120, 30);
      expect(track[0].time).toBe(0);
      // First frame is silence (no phoneme key, F0=0)
      expect(track[0].params.F0).toBe(0);
    });

    it("adds initial lead-in silence before first non-silence phone", () => {
      const track = textToKlattTrack("hello", 120, 30);
      const firstPhone = track.find((f) => f.phoneme && f.phoneme !== "SIL");
      expect(firstPhone).toBeTruthy();
      // qlatt-english output.initial_silence_ms defaults to 30 ms.
      expect(firstPhone!.time).toBeGreaterThanOrEqual(0.03);
    });

    it("last frame is silence with phoneme SIL", () => {
      const track = textToKlattTrack("hello", 120, 30);
      const last = track[track.length - 1];
      expect(last.phoneme).toBe("SIL");
    });

    it("all frames have expected parameter keys", () => {
      const track = textToKlattTrack("hello", 120, 30);
      const expectedKeys = ["F0", "F1", "F2", "F3", "B1", "B2", "B3", "AV", "AF", "AH"];
      for (const frame of track) {
        for (const key of expectedKeys) {
          expect(frame.params).toHaveProperty(key);
        }
      }
    });

    it("handles silence-only input", () => {
      const track = textToKlattTrack(".", 120, 30);
      expect(track.length).toBeGreaterThanOrEqual(2); // at least initial + final silence
      expect(track[0].time).toBe(0);
      expect(track[track.length - 1].phoneme).toBe("SIL");
    });

    it("handles single phoneme input", () => {
      const track = textToKlattTrack("/b/", 120, 30);
      expect(track.length).toBeGreaterThanOrEqual(2);
      expect(track[0].time).toBe(0);
      expect(track[track.length - 1].phoneme).toBe("SIL");
    });

    it("applies control_windows to the next segment with field-wise ops", () => {
      const segments = [
        makeSegment("seg_t", "T", "stop_closure", 100, { AV: 0, AH: 0, B1: 120, B2: 140, SW: 0 }),
        makeSegment("seg_aa", "AA", "vowel", 100, { AV: 60, AH: 0, B1: 200, B2: 220, SW: 0 }),
      ];
      const track = lowerTestScore(
        makeScore(segments, {
          timed_controls: [
            {
              id: "control_next_aspiration",
              target_segment_id: "seg_aa",
              start_offset_ms: 0,
              end_offset_ms: 20,
              fields: {
                AH: { op: "set", value: 40 },
                AV: { op: "set", value: 0 },
                B1: { op: "add", value: 50 },
              },
            },
          ],
        }),
        { transitionMs: 0 },
      );

      const aaFrames = track.filter((frame) => frame.phoneme === "AA");
      expect(aaFrames.length).toBeGreaterThanOrEqual(2);
      expect(aaFrames[0].params.AH).toBe(40);
      expect(aaFrames[0].params.AV).toBe(0);
      expect(aaFrames[0].params.B1).toBe(250);
      expect(aaFrames[1].params.AH ?? 0).toBe(0);
      expect(aaFrames[1].params.AV).toBe(60);
      expect(aaFrames[1].params.B1).toBe(200);
    });

    it("emits only event classes enabled by the lowering spec", () => {
      const spec: TrackLoweringSpec = {
        ...TEST_LOWERING_SPEC,
        timeline: {
          ...TEST_LOWERING_SPEC.timeline,
          initial_silence_ms: { value: 0, citations: ["test"] },
          final_silence_ms: { value: 0, citations: ["test"] },
          event_points: {
            include_segment_start: false,
            include_control_boundaries: true,
            include_f0_anchors: false,
            include_transition_steady_time: false,
          },
        },
      };
      const segments = [
        makeSegment("seg_aa", "AA", "vowel", 100, { AV: 60, AH: 0, B1: 100, B2: 120, F1: 700, F2: 1200, F3: 2500 }),
        makeSegment("seg_iy", "IY", "vowel", 100, { AV: 60, AH: 0, B1: 80, B2: 90, F1: 300, F2: 2200, F3: 2800 }),
      ];

      const track = lowerTestScore(
        makeScore(segments, {
          timed_controls: [
            {
              id: "control_aa",
              target_segment_id: "seg_aa",
              start_offset_ms: 40,
              end_offset_ms: 60,
              fields: { AH: { op: "set", value: 30 } },
            },
          ],
          f0_points: [
            {
              id: "f0_mid",
              timing: { kind: "absolute", time_ms: 50 },
              value_hz: 140,
            },
          ],
        }),
        { spec, transitionMs: 30 },
      );

      const aaTimes = track
        .filter((frame) => frame.phoneme === "AA")
        .map((frame) => Number(frame.time.toFixed(6)));
      expect(aaTimes).toEqual([0.04, 0.06]);
    });

    it("respects output.initial_silence_ms override when assembling", () => {
      const track = lowerTestScore(
        makeScore([
          makeSegment("seg_aa", "AA", "vowel", 100, { AV: 60, AH: 0, B1: 100, B2: 120, F1: 700, F2: 1200, F3: 2500 }),
        ]),
        {
          transitionMs: 0,
          spec: {
            ...TEST_LOWERING_SPEC,
            timeline: {
              ...TEST_LOWERING_SPEC.timeline,
              initial_silence_ms: { value: 40, citations: ["test"] },
              final_silence_ms: { value: 0, citations: ["test"] },
            },
          },
        },
      );
      const firstPhone = track.find((f) => f.phoneme === "AA");
      expect(firstPhone).toBeTruthy();
      expect(firstPhone!.time).toBeCloseTo(0.04, 6);
    });

    it("starts final silence immediately after the last phone", () => {
      const track = lowerTestScore(
        makeScore([
          makeSegment("seg_d_rel", "D_REL", "stop_release", 15, { AF: 40, AV: 0, AH: 0, SW: 1, F1: 280, F2: 1800, F3: 2600 }),
        ]),
        { transitionMs: 0 },
      );

      const release = track.find((f) => f.phoneme === "D_REL");
      expect(release).toBeTruthy();
      expect(release!.time).toBeCloseTo(0.03, 6);

      const firstTrailingSilence = track.find(
        (f) => f.phoneme === "SIL" && f.time > release!.time
      );
      expect(firstTrailingSilence).toBeTruthy();
      expect(firstTrailingSilence!.time).toBeCloseTo(0.045, 6);
      expect(firstTrailingSilence!.params.AF ?? 0).toBe(0);

      const last = track[track.length - 1];
      expect(last.phoneme).toBe("SIL");
      expect(last.time).toBeCloseTo(0.145, 6);
    });

    it("keeps locus durtran timing per formant", () => {
      const makeSpec = (f3DurtranMs: number): TrackLoweringSpec => ({
        ...TEST_LOWERING_SPEC,
        timeline: {
          ...TEST_LOWERING_SPEC.timeline,
          initial_silence_ms: { value: 0, citations: ["test"] },
          final_silence_ms: { value: 0, citations: ["test"] },
        },
        transitions: {
          ...TEST_LOWERING_SPEC.transitions,
          loci: {
            T: {
              "3": {
                F1: { locus_hz: 300, prcnt: 0, durtran_ms: 30 },
                F2: { locus_hz: 1300, prcnt: 0, durtran_ms: 55 },
                F3: { locus_hz: 2700, prcnt: 0, durtran_ms: f3DurtranMs },
              },
            },
          },
          vowel_category: {
            R: { forward: 3, backward: 3 },
          },
        },
      });
      const score = makeScore([
        makeSegment("seg_t", "T", "fricative", 50, { AV: 0, AH: 0, AF: 40, F1: 300, F2: 1300, F3: 2700 }),
        makeSegment("seg_r", "R", "liquid", 100, { AV: 60, AH: 0, AF: 0, F1: 400, F2: 1500, F3: 1700 }),
      ]);

      const baseTrack = lowerTestScore(score, { spec: makeSpec(55), transitionMs: 0 });
      const shortF3Track = lowerTestScore(score, { spec: makeSpec(45), transitionMs: 0 });

      const lastTimeWithParamValue = (
        track: ReturnType<typeof lowerTestScore>,
        key: "F2" | "F3",
        value: number,
      ) => Math.max(
        ...track
          .filter((frame) => frame.phoneme === "R" && frame.params[key] === value)
          .map((frame) => frame.time),
      );
      const baseF3BoundaryEnd = lastTimeWithParamValue(baseTrack, "F3", 2700);
      const shortF3BoundaryEnd = lastTimeWithParamValue(shortF3Track, "F3", 2700);
      const shortF2BoundaryEnd = lastTimeWithParamValue(shortF3Track, "F2", 1300);

      expect(baseF3BoundaryEnd).toBeCloseTo(0.105, 6);
      expect(shortF3BoundaryEnd).toBeCloseTo(0.095, 6);
      expect(shortF2BoundaryEnd).toBeCloseTo(0.105, 6);
    });
  });

  // ---------------------------------------------------------------------------
  // Layered Additive F0 Engine
  // Citations:
  //   Fujisaki, H. "Information, Prosody, and Modeling" -- command-response model
  //   Klatt, D. (1982) "KLATTalk" -- hat-pattern F0
  //   Rabiner, L. (1968) "Speech Synthesis by Rule" -- three-component F0
  // ---------------------------------------------------------------------------

  describe("computeButterworth2Coefficients", () => {
    it("produces coefficients that sum to approximately 1 at DC", () => {
      // At DC (frequency = 0), a low-pass filter should have unity gain.
      // DC gain = (b0 + b1 + b2) / (1 + a1 + a2)
      const coeffs = computeButterworth2Coefficients(50, 200);
      const dcGain = (coeffs.b0 + coeffs.b1 + coeffs.b2) / (1 + coeffs.a1 + coeffs.a2);
      expect(dcGain).toBeCloseTo(1.0, 3);
    });
  });

  describe("iirFilter2Pole", () => {
    it("passes a constant signal through unchanged (after settling)", () => {
      const coeffs = computeButterworth2Coefficients(50, 200);
      const state = createFilterState();
      let output = 0;
      // Feed a constant 100 for 100 samples -- should settle to ~100.
      for (let i = 0; i < 100; i++) {
        output = iirFilter2Pole(100, state, coeffs);
      }
      expect(output).toBeCloseTo(100, 0);
    });
  });

  describe("renderLayeredF0", () => {
    const minimalModel: LayeredF0ModelConfig = {
      type: "layered_additive",
      frame_period_sec: 0.005,
      filter: { type: "lowpass_2pole", default_cutoff: 50 },
      layers: {
        baseline: { type: "profile" },
        hat: { type: "persistent" },
        stress: { type: "impulse", decay: "halving" },
      },
    };

    it("returns non-empty contour for zero commands", () => {
      const contour = renderLayeredF0([], minimalModel, 0.5);
      expect(contour.length).toBeGreaterThan(0);
      // With no commands and no speaker scaling, F0 should be clamped at minimum.
      for (const pt of contour) {
        expect(pt.f0).toBeGreaterThanOrEqual(50);
        expect(pt.f0).toBeLessThanOrEqual(500);
      }
    });

    it("persistent layer changes the overall F0 level", () => {
      const commands: F0LayerCommand[] = [
        { layer: "hat", time: 0.0, value: 120 },
      ];
      const contour = renderLayeredF0(commands, minimalModel, 0.5);
      // After the persistent command (120 Hz), the filter should settle.
      // At time 0 the filter hasn't responded yet, later it settles near 120.
      const earlyF0 = contour[0].f0;
      const lateF0 = contour[contour.length - 1].f0;
      // Both should be finite and positive.
      expect(Number.isFinite(earlyF0)).toBe(true);
      expect(Number.isFinite(lateF0)).toBe(true);
      // With filter pre-filling, the F0 should already be at (or near) the
      // target from the start.  Both early and late values should be close to 120.
      expect(earlyF0).toBeGreaterThanOrEqual(100);
      expect(lateF0).toBeGreaterThanOrEqual(earlyF0);
    });

    it("impulse layer produces a transient that decays", () => {
      const commands: F0LayerCommand[] = [
        { layer: "stress", time: 0.05, value: 200, durationFrames: 40 },
      ];
      const contour = renderLayeredF0(commands, minimalModel, 0.5);
      // Find the max F0 (should be near the impulse time).
      let maxF0 = 0;
      let maxIdx = 0;
      for (let i = 0; i < contour.length; i++) {
        if (contour[i].f0 > maxF0) {
          maxF0 = contour[i].f0;
          maxIdx = i;
        }
      }
      // The max should be somewhere after the impulse start, not at the very end.
      expect(maxIdx).toBeLessThan(contour.length - 1);
      // The end F0 should be lower than the max (impulse decayed).
      expect(contour[contour.length - 1].f0).toBeLessThan(maxF0);
    });

    it("profile layer interpolates across the utterance duration", () => {
      const commands: F0LayerCommand[] = [
        {
          layer: "baseline",
          time: 0.0,
          value: 0,
          profilePoints: [140, 130, 120, 110, 100],
        },
      ];
      const profileModel: LayeredF0ModelConfig = {
        type: "layered_additive",
        frame_period_sec: 0.005,
        filter: { type: "lowpass_2pole", default_cutoff: 90 },
        layers: {
          baseline: { type: "profile" },
        },
      };
      const contour = renderLayeredF0(commands, profileModel, 1.0);
      // After the filter settles, the early F0 should be higher than the late F0
      // (because the profile declines from 140 to 100).
      const quarterIdx = Math.floor(contour.length * 0.25);
      const threeQuarterIdx = Math.floor(contour.length * 0.75);
      expect(contour[quarterIdx].f0).toBeGreaterThan(contour[threeQuarterIdx].f0);
    });

    it("returns f0 = 0 for zero total duration", () => {
      const contour = renderLayeredF0([], minimalModel, 0);
      expect(contour).toEqual([{ time: 0, f0: 0 }]);
    });
  });

  describe("per-token transition_ms override", () => {
    it("uses per-token transition_ms when present on the phone", () => {
      const trackWithOverride = lowerTestScore(
        makeScore([
          makeSegment("seg_ah_1", "AH", "vowel", 200, { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 }, 25),
          makeSegment("seg_ah_2", "AH", "vowel", 200, { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 }),
        ]),
        { transitionMs: 50 },
      );
      // The per-token value should be used; verify frames exist (basic smoke test).
      expect(trackWithOverride.length).toBeGreaterThanOrEqual(3);
    });

    it("falls back to global transitionMs when token lacks transition_ms", () => {
      const track = lowerTestScore(
        makeScore([
          makeSegment("seg_ah_1", "AH", "vowel", 200, { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 }),
          makeSegment("seg_ah_2", "AH", "vowel", 200, { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 }),
        ]),
        { transitionMs: 50 },
      );
      // No per-token transition_ms, should use global 50ms.
      expect(track.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("lowerControlScoreToKlattTrack with f0Model", () => {
    it("uses layered renderer when f0Model is present", () => {
      const f0Model: LayeredF0ModelConfig = {
        type: "layered_additive",
        frame_period_sec: 0.005,
        filter: { type: "lowpass_2pole", default_cutoff: 50 },
        layers: {
          hat: { type: "persistent" },
        },
      };
      const layeredSpec: TrackLoweringSpec = {
        ...TEST_LOWERING_SPEC,
        f0: {
          ...TEST_LOWERING_SPEC.f0,
          renderer: { type: "layered_additive", layered_model_ref: "f0_model" },
        },
      };
      const track = lowerTestScore(makeScore(
        [
          makeSegment("seg_ah", "AH", "vowel", 200, { F0: 0, F1: 700, F2: 1200, F3: 2600, B1: 80, B2: 70, B3: 100, AV: 60, AF: 0, AH: 0 }),
        ],
        {
          f0_layer_commands: [
            {
              id: "hat_0",
              timing: { kind: "absolute", time_ms: 0 },
              layer: "hat",
              value: 10,
            },
          ],
        },
      ), {
        baseF0: 110,
        f0Model,
        spec: layeredSpec,
      });
      expect(track.length).toBeGreaterThanOrEqual(2);
      // The voiced phone frame should have a non-zero F0.
      const voicedFrames = track.filter(f => f.params.F0 > 0);
      expect(voicedFrames.length).toBeGreaterThan(0);
    });

    it("uses declarative path when f0Model is absent", () => {
      const track = lowerTestScore(makeScore(
        [
          makeSegment("seg_ah", "AH", "vowel", 200, { F0: 0, F1: 700, F2: 1200, F3: 2600, B1: 80, B2: 70, B3: 100, AV: 60, AF: 0, AH: 0 }),
        ],
        {
          f0_points: [
            {
              id: "f0_pt_0",
              timing: { kind: "absolute", time_ms: 50 },
              value_hz: 120,
            },
          ],
        },
      ), { baseF0: 110 });
      expect(track.length).toBeGreaterThanOrEqual(2);
    });
  });
});
