import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import { PHONEME_TARGETS, fillDefaultParams } from "../src/tts-frontend-rules";

describe("tts frontend output contract", () => {
  it("returns KlattFrame[] with stable key schema and finite params", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const track = textToKlattTrack("the quick brown fox jumps over the lazy dog.", 120);
      const expectedParamKeys = Object.keys(fillDefaultParams(PHONEME_TARGETS.SIL)).sort();
      const allowedFrameKeys = new Set(["time", "params", "phoneme", "word"]);

      expect(Array.isArray(track)).toBe(true);
      expect(track.length).toBeGreaterThan(2);

      let prevTime = -1;
      for (const frame of track) {
        expect(Number.isFinite(frame.time)).toBe(true);
        expect(frame.time).toBeGreaterThanOrEqual(prevTime);
        prevTime = frame.time;

        expect(frame.params && typeof frame.params === "object").toBe(true);
        const keys = Object.keys(frame.params).sort();
        expect(keys).toEqual(expectedParamKeys);

        for (const key of keys) {
          expect(Number.isFinite(frame.params[key])).toBe(true);
        }

        for (const key of Object.keys(frame)) {
          expect(allowedFrameKeys.has(key)).toBe(true);
        }
      }
    } finally {
      warnSpy.mockRestore();
    }
  });
});
