import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";

/**
 * Snapshot tests for textToKlattTrack.
 *
 * These capture the full KlattFrame[] output for 6 representative inputs.
 * They serve as a regression safety net during refactoring of tts-frontend.ts.
 * If any refactor changes the output shape or parameter values, these tests
 * will fail and require explicit snapshot updates (--update).
 */

const SNAPSHOT_INPUTS = [
  { name: "simple word", text: "hello" },
  { name: "question intonation", text: "hello world?" },
  { name: "multi-word sentence", text: "the quick brown fox." },
  { name: "stop closure + release", text: "pat" },
  { name: "diagnostic symbol", text: "/b/" },
  { name: "silence only", text: "." },
];

describe("tts-frontend snapshot regression", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  afterAll(() => {
    warnSpy.mockRestore();
  });

  for (const { name, text } of SNAPSHOT_INPUTS) {
    it(`${name}: "${text}"`, () => {
      const track = textToKlattTrack(text, 120, 30);
      expect(track).toMatchSnapshot();
    });
  }
});
