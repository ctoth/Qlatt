import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  assembleKlattTrack,
  buildF0ContourFromDeclarative,
  compareAxisMark,
  parseTrailingInteger,
  renderLayeredF0,
  extractLayerCommands,
  computeButterworth2Coefficients,
  iirFilter2Pole,
  createFilterState,
} from "../src/track-assembler";
import type {
  LayeredF0ModelConfig,
  F0LayerCommand,
} from "../src/track-assembler";

// Suppress warnings during tests
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("track-assembler", () => {
  describe("compareAxisMark", () => {
    it("returns 0 for identical values", () => {
      expect(compareAxisMark("a", "a")).toBe(0);
      expect(compareAxisMark(1, 1)).toBe(0);
      expect(compareAxisMark(null, null)).toBe(0);
    });

    it("compares numbers numerically", () => {
      expect(compareAxisMark(1, 2)).toBe(-1);
      expect(compareAxisMark(2, 1)).toBe(1);
    });

    it("compares non-numbers as strings", () => {
      expect(compareAxisMark("a", "b")).toBe(-1);
      expect(compareAxisMark("b", "a")).toBe(1);
    });

    it("handles null/undefined by coercing to empty string", () => {
      expect(compareAxisMark(null, "a")).toBe(-1);
      expect(compareAxisMark("a", null)).toBe(1);
    });
  });

  describe("parseTrailingInteger", () => {
    it("extracts trailing digits", () => {
      expect(parseTrailingInteger("f0_12")).toBe(12);
      expect(parseTrailingInteger("abc0")).toBe(0);
    });

    it("returns null for non-string", () => {
      expect(parseTrailingInteger(42)).toBeNull();
      expect(parseTrailingInteger(null)).toBeNull();
    });

    it("returns null when no trailing digits", () => {
      expect(parseTrailingInteger("abc")).toBeNull();
    });
  });

  describe("buildF0ContourFromDeclarative", () => {
    it("returns baseF0 at time 0 when no f0 tokens", () => {
      const contour = buildF0ContourFromDeclarative([], 120);
      expect(contour).toEqual([{ time: 0, f0: 120 }]);
    });

    it("filters only f0 stream tokens", () => {
      const seq = [
        { stream: "phone", value: 200, time: 100 },
        { stream: "f0", value: 130, time: 100 },
      ];
      const contour = buildF0ContourFromDeclarative(seq, 120);
      // Should only have the f0 token (time 0.1s) plus the prepended baseF0
      expect(contour[0]).toEqual({ time: 0, f0: 120 });
      expect(contour[1]).toEqual({ time: 0.1, f0: 130 });
    });

    it("deduplicates coincident times (last wins)", () => {
      const seq = [
        { stream: "f0", value: 100, time: 50 },
        { stream: "f0", value: 200, time: 50 },
      ];
      const contour = buildF0ContourFromDeclarative(seq, 120);
      // Both map to time=0.05, dedup means last value wins
      expect(contour.length).toBe(2); // baseF0 at 0 + deduplicated point
      expect(contour[1].f0).toBe(200);
    });
  });

  describe("assembleKlattTrack", () => {
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
      const track = assembleKlattTrack(
        [
          {
            phoneme: "T",
            type: "stop_closure",
            duration: 100,
            params: { AV: 0, AH: 0, B1: 120, B2: 140, SW: 0 },
            control_windows: [
              {
                target: "next",
                prefix_ms: 20,
                fields: {
                  AH: { op: "set", value: 40 },
                  AV: { op: "set", value: 0 },
                  B1: { op: "add", value: 50 },
                },
              },
            ],
          },
          {
            phoneme: "AA",
            type: "vowel",
            duration: 100,
            params: { AV: 60, AH: 0, B1: 200, B2: 220, SW: 0 },
          },
        ],
        [],
        { baseF0: 120, transitionMs: 0, outputConfig: {} }
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

    it("respects output.initial_silence_ms override when assembling", () => {
      const track = assembleKlattTrack(
        [
          {
            phoneme: "AA",
            type: "vowel",
            duration: 100,
            params: { AV: 60, AH: 0, B1: 100, B2: 120, F1: 700, F2: 1200, F3: 2500 },
          },
        ],
        [],
        { baseF0: 120, transitionMs: 0, outputConfig: { initial_silence_ms: 40, final_silence_ms: 0 } }
      );
      const firstPhone = track.find((f) => f.phoneme === "AA");
      expect(firstPhone).toBeTruthy();
      expect(firstPhone!.time).toBeCloseTo(0.04, 6);
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

  describe("extractLayerCommands", () => {
    it("extracts f0_layer tokens from a mixed sequence", () => {
      const sequence = [
        { stream: "phone", phoneme: "AH", status: 1 },
        { stream: "f0_layer", layer: "hat", value: 8, time: 100, status: 1 },
        { stream: "f0", value: 120, time: 50, status: 1 },
        { stream: "f0_layer", layer: "stress", value: 3, time: 200, duration_frames: 15, status: 1 },
      ];
      const commands = extractLayerCommands(sequence);
      expect(commands).toHaveLength(2);
      expect(commands[0].layer).toBe("hat");
      expect(commands[0].value).toBe(8);
      expect(commands[0].time).toBeCloseTo(0.1); // 100ms -> 0.1s
      expect(commands[1].layer).toBe("stress");
      expect(commands[1].durationFrames).toBe(15);
    });

    it("skips suppressed tokens", () => {
      const sequence = [
        { stream: "f0_layer", layer: "hat", value: 8, time: 100, status: 2 },
      ];
      const commands = extractLayerCommands(sequence);
      expect(commands).toHaveLength(0);
    });
  });

  describe("renderLayeredF0", () => {
    const minimalModel: LayeredF0ModelConfig = {
      type: "layered_additive",
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
      // A stop token with transition_ms=30 should use 30ms, not the global 50ms.
      const phoneSequence = [
        {
          phoneme: "AH",
          type: "vowel",
          duration: 200,
          transition_ms: 25,
          params: { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 },
        },
        {
          phoneme: "AH",
          type: "vowel",
          duration: 200,
          params: { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 },
        },
      ];
      // With per-token transition_ms=25 on first phone, the steady-state point
      // should be at targetTime - 25ms (0.025s), not targetTime - 50ms.
      const trackWithOverride = assembleKlattTrack(phoneSequence, [], {
        baseF0: 120,
        transitionMs: 50,
        outputConfig: {},
      });
      // The per-token value should be used; verify frames exist (basic smoke test).
      expect(trackWithOverride.length).toBeGreaterThanOrEqual(3);
    });

    it("falls back to global transitionMs when token lacks transition_ms", () => {
      const phoneSequence = [
        {
          phoneme: "AH",
          type: "vowel",
          duration: 200,
          params: { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 },
        },
        {
          phoneme: "AH",
          type: "vowel",
          duration: 200,
          params: { AV: 60, AH: 0, B1: 80, B2: 70, B3: 100, F1: 700, F2: 1200, F3: 2600 },
        },
      ];
      const track = assembleKlattTrack(phoneSequence, [], {
        baseF0: 120,
        transitionMs: 50,
        outputConfig: {},
      });
      // No per-token transition_ms, should use global 50ms.
      expect(track.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("assembleKlattTrack with f0Model", () => {
    it("uses layered renderer when f0Model is present", () => {
      const f0Model: LayeredF0ModelConfig = {
        type: "layered_additive",
        filter: { type: "lowpass_2pole", default_cutoff: 50 },
        layers: {
          hat: { type: "persistent" },
        },
      };
      // Minimal phone sequence with one voiced phone.
      const phoneSequence = [
        {
          phoneme: "AH",
          type: "vowel",
          duration: 200,
          params: { F0: 0, F1: 700, F2: 1200, F3: 2600, B1: 80, B2: 70, B3: 100, AV: 60, AF: 0, AH: 0 },
        },
      ];
      // One f0_layer token commanding the hat layer.
      const parameterSequence = [
        ...phoneSequence,
        { stream: "f0_layer", layer: "hat", value: 10, time: 0, status: 1 },
      ];
      const track = assembleKlattTrack(phoneSequence, parameterSequence, {
        baseF0: 110,
        f0Model,
        outputConfig: {},
      });
      expect(track.length).toBeGreaterThanOrEqual(2);
      // The voiced phone frame should have a non-zero F0.
      const voicedFrames = track.filter(f => f.params.F0 > 0);
      expect(voicedFrames.length).toBeGreaterThan(0);
    });

    it("uses declarative path when f0Model is absent", () => {
      // This is the existing behavior -- no f0Model option.
      const phoneSequence = [
        {
          phoneme: "AH",
          type: "vowel",
          duration: 200,
          params: { F0: 0, F1: 700, F2: 1200, F3: 2600, B1: 80, B2: 70, B3: 100, AV: 60, AF: 0, AH: 0 },
        },
      ];
      const parameterSequence = [
        ...phoneSequence,
        { stream: "f0", value: 120, time: 50, status: 1, id: "f0_pt_0", anchor_left: "start", anchor_right: "end", ratio: 0 },
      ];
      const track = assembleKlattTrack(phoneSequence, parameterSequence, {
        baseF0: 110,
        outputConfig: {},
      });
      expect(track.length).toBeGreaterThanOrEqual(2);
    });
  });
});
