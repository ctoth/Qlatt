import { describe, expect, it } from "vitest";
import { normalizeText, textToKlattTrack, transcribeText } from "../src/tts-frontend";
import { PHONOLOGY_PROBE_CASES } from "./fixtures/phonology-probes";
import {
  averageTrackParam,
  getTrackFramesForWordPhoneme,
  getTrackWordOccurrence,
  getTranscriptionWordOccurrence,
  maxTrackParam,
} from "./utils/phonology-conformance";

describe("phonology probe suite", () => {
  for (const probe of PHONOLOGY_PROBE_CASES) {
    it(probe.name, () => {
      const normalized = normalizeText(probe.phrase);
      const transcription = transcribeText(normalized);
      const track = textToKlattTrack(probe.phrase, 110);

      for (const wordCase of probe.words ?? []) {
        const occurrence = wordCase.occurrence ?? 0;
        const trackPhonemes = getTrackWordOccurrence(track, wordCase.word, occurrence);
        expect(trackPhonemes.length).toBeGreaterThan(0);

        if (wordCase.track?.transcriptionExact) {
          expect(
            getTranscriptionWordOccurrence(transcription, wordCase.word, occurrence)
          ).toEqual(wordCase.track.transcriptionExact);
        }

        for (const phoneme of wordCase.track?.mustContain ?? []) {
          expect(trackPhonemes).toContain(phoneme);
        }

        for (const phoneme of wordCase.track?.mustNotContain ?? []) {
          expect(trackPhonemes).not.toContain(phoneme);
        }

        for (const [param, minimum] of Object.entries(wordCase.track?.minMaxParam ?? {})) {
          const matchingFrames = track.filter(
            (frame) =>
              frame.word === wordCase.word &&
              trackPhonemes.includes(String(frame.phoneme ?? ""))
          );
          expect(maxTrackParam(matchingFrames, param)).toBeGreaterThanOrEqual(minimum);
        }

        if (wordCase.rhotic) {
          const erFrames = getTrackFramesForWordPhoneme(
            track,
            wordCase.word,
            wordCase.rhotic.erPhoneme
          );
          const tailFrames = getTrackFramesForWordPhoneme(
            track,
            wordCase.word,
            wordCase.rhotic.tailPhoneme
          );

          expect(erFrames.length).toBeGreaterThan(0);
          expect(tailFrames.length).toBeGreaterThan(0);

          for (const param of wordCase.rhotic.tailLowerParams) {
            expect(averageTrackParam(tailFrames, param)).toBeLessThan(
              averageTrackParam(erFrames, param)
            );
          }
        }
      }
    });
  }
});
