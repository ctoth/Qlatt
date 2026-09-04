import { describe, expect, it, vi } from "vitest";
import { normalizeText, textToKlattTrack, transcribeText } from "../src/tts-frontend";
import {
  FULL_PIPELINE_WORD_CASES,
  NORMALIZATION_CONFORMANCE_CASES,
} from "./fixtures/phonology-conformance";
import {
  countPrimaryStressVowels,
  getTrackWordOccurrence,
  getTranscriptionWordOccurrence,
} from "./utils/phonology-conformance";

describe("phonology conformance", () => {
  describe("normalization", () => {
    for (const testCase of NORMALIZATION_CONFORMANCE_CASES) {
      it(testCase.name, () => {
        expect(normalizeText(testCase.input)).toBe(testCase.expected);
      });
    }
  });

  describe("full pipeline word identity", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    afterAll(() => {
      warnSpy.mockRestore();
    });

    for (const testCase of FULL_PIPELINE_WORD_CASES) {
      it(testCase.name, () => {
        const normalized = normalizeText(testCase.input);
        const transcription = transcribeText(normalized);
        const track = textToKlattTrack(testCase.input, 110);
        const occurrence = testCase.occurrence ?? 0;

        if (testCase.transcribe?.exactPhonemes) {
          expect(getTranscriptionWordOccurrence(transcription, testCase.word, occurrence)).toEqual(
            testCase.transcribe.exactPhonemes,
          );
        }

        const trackPhonemes = getTrackWordOccurrence(track, testCase.word, occurrence);
        expect(trackPhonemes.length).toBeGreaterThan(0);

        if (testCase.track?.exactPhonemes) {
          expect(trackPhonemes).toEqual(testCase.track.exactPhonemes);
        }
        for (const phoneme of testCase.track?.mustContain ?? []) {
          expect(trackPhonemes).toContain(phoneme);
        }
        for (const phoneme of testCase.track?.mustNotContain ?? []) {
          expect(trackPhonemes).not.toContain(phoneme);
        }
        if (testCase.track?.primaryStressCount !== undefined) {
          expect(countPrimaryStressVowels(trackPhonemes)).toBe(testCase.track.primaryStressCount);
        }
      });
    }
  });
});
