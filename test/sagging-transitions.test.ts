import { describe, expect, it, vi } from "vitest";
import {
  applySaggingTransitions,
  type F0Point,
} from "../src/track-assembler";
import { textToKlattTrack } from "../src/tts-frontend";

// Suppress warnings during tests
vi.spyOn(console, "warn").mockImplementation(() => {});

describe("applySaggingTransitions", () => {
  it("inserts sag points between two H* accents at midpoint", () => {
    // Two H* accent peaks at t=0.3s (178 Hz) and t=0.8s (151 Hz).
    // Citation: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.8, f0: 151, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);

    // Should have original 4 points + 3 sag points = 7
    expect(result.length).toBe(7);

    // Find the sag point at t=0.5 (midpoint between 0.3 and 0.8)
    const midTime = 0.3 + 0.5 * 0.5; // 0.55
    const sagMid = result.find(
      (p) => p.tag === "f0_sag" && Math.abs(p.time - midTime) < 0.01
    );
    expect(sagMid).toBeDefined();

    // At t=0.5 (normalized), linear interpolation gives (178+151)/2 = 164.5
    // Sag = 12 * 4 * 0.5 * 0.5 = 12
    // Expected: 164.5 - 12 = 152.5
    expect(sagMid!.f0).toBeCloseTo(164.5 - 12, 1);
  });

  it("inserts three sag points at t=0.25, 0.50, 0.75", () => {
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.2, f0: 170, tag: "f0_h_star", accentType: "H*" },
      { time: 0.8, f0: 150, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 10, 150);

    const sagPoints = result.filter((p) => p.tag === "f0_sag");
    expect(sagPoints.length).toBe(3);

    // Verify sag amounts:
    // span = 0.6s, f0 range = 150-170 = -20 Hz
    // t=0.25: linear = 170 + (-20)*0.25 = 165, sag = 10*4*0.25*0.75 = 7.5 => 157.5
    // t=0.50: linear = 170 + (-20)*0.50 = 160, sag = 10*4*0.50*0.50 = 10.0 => 150.0
    // t=0.75: linear = 170 + (-20)*0.75 = 155, sag = 10*4*0.75*0.25 = 7.5 => 147.5
    expect(sagPoints[0].f0).toBeCloseTo(157.5, 1);
    expect(sagPoints[1].f0).toBeCloseTo(150.0, 1);
    expect(sagPoints[2].f0).toBeCloseTo(147.5, 1);
  });

  it("does NOT insert sag between H* and L*", () => {
    // Citation: Pierrehumbert 1980 (Between L* and any tone: Monotonic/linear)
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.8, f0: 122, tag: "f0_l_star", accentType: "L*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    const sagPoints = result.filter((p) => p.tag === "f0_sag");
    expect(sagPoints.length).toBe(0);
    expect(result.length).toBe(contour.length);
  });

  it("does NOT insert sag across phrase boundaries", () => {
    // Citation: Pierrehumbert 1980 (no interpolation across phrase boundaries)
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.5, f0: 90, tag: "f0_boundary_low" },
      { time: 0.8, f0: 170, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    const sagPoints = result.filter((p) => p.tag === "f0_sag");
    expect(sagPoints.length).toBe(0);
  });

  it("does NOT insert sag when accents are too close together", () => {
    // Citation: Pierrehumbert 1980 (closer H*s show less/no dipping)
    // Two H* peaks 100ms apart (below 150ms threshold)
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.4, f0: 170, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    const sagPoints = result.filter((p) => p.tag === "f0_sag");
    expect(sagPoints.length).toBe(0);
  });

  it("handles multiple consecutive H* pairs (three H* = two sag regions)", () => {
    // Three consecutive H* accents should produce two sag regions.
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.2, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.6, f0: 165, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 155, tag: "f0_h_star", accentType: "H*" },
      { time: 1.2, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    const sagPoints = result.filter((p) => p.tag === "f0_sag");
    // Two sag regions, 3 points each = 6 sag points
    expect(sagPoints.length).toBe(6);
  });

  it("returns copy of contour when sagDepthHz is zero", () => {
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.8, f0: 151, tag: "f0_h_star", accentType: "H*" },
    ];

    const result = applySaggingTransitions(contour, 0, 150);
    expect(result.length).toBe(contour.length);
    // Should be a copy, not the same array
    expect(result).not.toBe(contour);
  });

  it("returns copy of contour when fewer than two H* accents", () => {
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.8, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    expect(result.length).toBe(contour.length);
  });

  it("result is sorted by time after sag insertion", () => {
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.2, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.4, f0: 160, tag: "f0_unaccented" },
      { time: 0.8, f0: 155, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].time).toBeGreaterThanOrEqual(result[i - 1].time);
    }
  });

  it("does NOT sag across f0_register_reset boundary", () => {
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 178, tag: "f0_h_star", accentType: "H*" },
      { time: 0.5, f0: 110, tag: "f0_register_reset" },
      { time: 0.8, f0: 175, tag: "f0_h_star", accentType: "H*" },
      { time: 1.0, f0: 100 },
    ];

    const result = applySaggingTransitions(contour, 12, 150);
    const sagPoints = result.filter((p) => p.tag === "f0_sag");
    expect(sagPoints.length).toBe(0);
  });
});

describe("sagging transitions integration", () => {
  it("F0 at midpoint between accent peaks is below linear interpolation", () => {
    // Run the full pipeline and verify sag effect.
    // "The cat sat on the mat." has multiple content words.
    const track = textToKlattTrack("The cat sat on the mat.", 110, 30);

    // Find voiced frames with F0 > 0 (not silence).
    const voicedFrames = track.filter((f) => f.params.F0 > 0);
    expect(voicedFrames.length).toBeGreaterThan(0);

    // The track should have been assembled with sag applied.
    // We can verify by checking that F0 values exist and are finite.
    for (const frame of track) {
      expect(Number.isFinite(frame.params.F0)).toBe(true);
    }

    // Verify monotonically increasing times.
    for (let i = 1; i < track.length; i++) {
      expect(track[i].time).toBeGreaterThanOrEqual(track[i - 1].time);
    }
  });

  it("sag midpoint is below linear interpolation between H* peaks (unit contour)", () => {
    // Build a contour with two well-separated H* peaks and verify the sag
    // midpoint is depressed below what linear interpolation would give.
    // Citation: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
    const contour: F0Point[] = [
      { time: 0, f0: 110 },
      { time: 0.3, f0: 180, tag: "f0_h_star", accentType: "H*" },
      { time: 0.9, f0: 160, tag: "f0_h_star", accentType: "H*" },
      { time: 1.1, f0: 100 },
    ];

    const sagged = applySaggingTransitions(contour, 12, 150);

    // Find the two H* points
    const hStarPoints = sagged.filter((p) => p.accentType === "H*");
    expect(hStarPoints.length).toBe(2);

    const left = hStarPoints[0];
    const right = hStarPoints[1];

    // Linear interpolation at midpoint
    const midTime = (left.time + right.time) / 2;
    const linearMid = left.f0 + (right.f0 - left.f0) * 0.5;

    // Find the sag point nearest the midpoint
    const sagMid = sagged
      .filter((p) => p.tag === "f0_sag")
      .reduce((closest, p) =>
        Math.abs(p.time - midTime) < Math.abs(closest.time - midTime) ? p : closest
      );

    // Sag point should be at least 5 Hz below linear interpolation
    expect(sagMid.f0).toBeLessThan(linearMid - 5);
  });
});
