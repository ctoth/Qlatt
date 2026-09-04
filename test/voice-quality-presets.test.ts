import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

/**
 * Voice quality presets integration tests.
 *
 * Verifies that voice quality presets (modal, breathy, pressed, creaky,
 * whispery, falsetto) correctly flow through the TTS pipeline into
 * track frames.
 *
 * Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009
 */

/** Helper: generate a track with given voice quality */
function generateTrack(
  text: string,
  voiceQuality?: "modal" | "breathy" | "pressed" | "creaky" | "whispery" | "falsetto",
  baseF0 = 110,
): KlattFrame[] {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    return textToKlattTrack(text, baseF0, 30, { voiceQuality });
  } finally {
    warnSpy.mockRestore();
  }
}

/** Find frames that correspond to actual phonemes (not initial/final SIL) */
function phonemeFrames(track: KlattFrame[]): KlattFrame[] {
  return track.filter((f) => f.phoneme !== undefined && f.phoneme !== "SIL");
}

describe("voice quality presets", () => {
  describe("modal identity", () => {
    it("voiceQuality='modal' produces identical output to no voiceQuality", () => {
      const noPreset = generateTrack("hello");
      const modalPreset = generateTrack("hello", "modal");

      // Frame counts should match
      expect(noPreset.length).toBe(modalPreset.length);

      // Every frame's params should be identical
      for (let i = 0; i < noPreset.length; i++) {
        expect(noPreset[i].time).toBeCloseTo(modalPreset[i].time, 6);
        const noParams = noPreset[i].params;
        const modalParams = modalPreset[i].params;
        for (const key of Object.keys(noParams)) {
          expect(modalParams[key]).toBeCloseTo(noParams[key], 6);
        }
      }
    });
  });

  describe("breathy preset", () => {
    it("voiceQuality='breathy' sets Rd=2.0 on track frames", () => {
      // Fant 1997 Table 1: Rd=2.0 maps to OQ~78% (breathy)
      const track = generateTrack("hello", "breathy");
      const frames = phonemeFrames(track);
      expect(frames.length).toBeGreaterThan(0);

      for (const frame of frames) {
        expect(frame.params.Rd).toBe(2.0);
      }
    });

    it("voiceQuality='breathy' adds 20 dB AH offset to frames", () => {
      // Klatt & Klatt 1990: AH is the most important cue for breathiness
      // Gobl 2003: breathy AH=35-50 (additive offset of +20 on typical values)
      const noPreset = generateTrack("hello");
      const breathy = generateTrack("hello", "breathy");
      const noFrames = phonemeFrames(noPreset);
      const breathyFrames = phonemeFrames(breathy);

      // Same number of phoneme frames
      expect(breathyFrames.length).toBe(noFrames.length);

      for (let i = 0; i < noFrames.length; i++) {
        const baseAH = noFrames[i].params.AH;
        const breathyAH = breathyFrames[i].params.AH;
        // Breathy AH = base AH + 20 dB
        expect(breathyAH).toBeCloseTo(baseAH + 20, 1);
      }
    });
  });

  describe("pressed preset", () => {
    it("voiceQuality='pressed' sets Rd=0.5 on track frames", () => {
      // Fant 1997 Table 1: Rd=0.5 maps to OQ~47% (slightly pressed)
      const track = generateTrack("hello", "pressed");
      const frames = phonemeFrames(track);
      expect(frames.length).toBeGreaterThan(0);

      for (const frame of frames) {
        expect(frame.params.Rd).toBe(0.5);
      }
    });
  });

  describe("falsetto preset", () => {
    it("voiceQuality='falsetto' scales F0 by 1.5x", () => {
      // Burkhardt 2009: F0 increase for falsetto; conservative 1.5x multiplier
      const baseF0 = 110;
      const _expectedF0 = Math.round(baseF0 * 1.5); // 165 Hz

      const noPreset = generateTrack("hello", undefined, baseF0);
      const falsetto = generateTrack("hello", "falsetto", baseF0);

      // Find voiced frames (F0 > 0) in both tracks
      const noVoicedFrames = phonemeFrames(noPreset).filter((f) => f.params.F0 > 0);
      const falsettoVoicedFrames = phonemeFrames(falsetto).filter((f) => f.params.F0 > 0);

      expect(noVoicedFrames.length).toBeGreaterThan(0);
      expect(falsettoVoicedFrames.length).toBeGreaterThan(0);

      // The average F0 for falsetto should be approximately 1.5x the no-preset average
      const avgNoPresetF0 =
        noVoicedFrames.reduce((sum, f) => sum + f.params.F0, 0) / noVoicedFrames.length;
      const avgFalsettoF0 =
        falsettoVoicedFrames.reduce((sum, f) => sum + f.params.F0, 0) / falsettoVoicedFrames.length;

      // Allow 10% tolerance because prosody rules modify F0 around the base
      const ratio = avgFalsettoF0 / avgNoPresetF0;
      expect(ratio).toBeGreaterThan(1.3);
      expect(ratio).toBeLessThan(1.7);
    });

    it("voiceQuality='falsetto' sets flutter=50 and Rd=2.5", () => {
      // Burkhardt 2009: high flutter for falsetto instability
      // Fant 1997 Table 1: Rd=2.5 very breathy; Childers 1991: OQ=0.99
      const track = generateTrack("hello", "falsetto");
      const frames = phonemeFrames(track);
      expect(frames.length).toBeGreaterThan(0);

      for (const frame of frames) {
        expect(frame.params.Rd).toBe(2.5);
        expect(frame.params.flutter).toBe(50);
      }
    });
  });

  describe("whispery preset", () => {
    it("voiceQuality='whispery' sets TL=10, jitter=5, AH offset=30", () => {
      // Gobl 2003: whispery TL=22-30 (conservative 10 dB explicit override)
      // Gobl 2003: whispery DI=5% (jitter approximation)
      // Gobl 2003: whispery AH=45-55 (30 dB additive offset)
      const noPreset = generateTrack("hello");
      const whispery = generateTrack("hello", "whispery");
      const noFrames = phonemeFrames(noPreset);
      const whisperyFrames = phonemeFrames(whispery);

      expect(whisperyFrames.length).toBe(noFrames.length);

      for (let i = 0; i < whisperyFrames.length; i++) {
        expect(whisperyFrames[i].params.TL).toBe(10);
        expect(whisperyFrames[i].params.jitter).toBe(5);
        expect(whisperyFrames[i].params.AH).toBeCloseTo(noFrames[i].params.AH + 30, 1);
      }
    });
  });

  describe("creaky preset", () => {
    it("voiceQuality='creaky' sets Rd=0.8 and jitter=20", () => {
      // Gobl 2003: creaky OQ similar to modal; jitter approximation for DI
      // Burkhardt 2009: DI=rate for creaky voice
      const track = generateTrack("hello", "creaky");
      const frames = phonemeFrames(track);
      expect(frames.length).toBeGreaterThan(0);

      for (const frame of frames) {
        expect(frame.params.Rd).toBe(0.8);
        expect(frame.params.jitter).toBe(20);
      }
    });
  });

  describe("voice quality params present in frames", () => {
    it("breathy frames contain Rd, OQ, TL, flutter, jitter keys", () => {
      const track = generateTrack("hello", "breathy");
      const frames = phonemeFrames(track);
      expect(frames.length).toBeGreaterThan(0);

      for (const frame of frames) {
        expect(frame.params).toHaveProperty("Rd");
        expect(frame.params).toHaveProperty("OQ");
        expect(frame.params).toHaveProperty("TL");
        expect(frame.params).toHaveProperty("flutter");
        expect(frame.params).toHaveProperty("jitter");
      }
    });
  });
});
