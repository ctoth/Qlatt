import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import {
  assembleKlattTrack,
  buildF0ContourFromDeclarative,
  compareAxisMark,
  parseTrailingInteger,
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
  });
});
