import { describe, expect, it, vi } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";

/**
 * Integration tests for postlexical rules wired into tts-frontend.ts.
 *
 * These test that postlexical rules (t_flapping, the_prevocalic_reduction)
 * are actually invoked during the full textToKlattTrack pipeline.
 *
 * The unit tests in g2p-postlexical.test.ts verify rule logic in isolation;
 * these tests verify the wiring from text input through the full pipeline.
 *
 * Citation: Miller 1998, Pronunciation Modeling in Speech Synthesis
 */

describe("postlexical integration via textToKlattTrack", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  afterAll(() => {
    warnSpy.mockRestore();
  });

  describe('"the" prevocalic reduction', () => {
    it('reduces "the" vowel to IH before vowel-initial word', () => {
      // "the apple" — "the" is DH AH, "apple" starts with AE (vowel).
      // the_prevocalic_reduction should change AH → IH in "the".
      // Pipeline phoneme names do NOT include stress suffix (stress is a separate field).
      const track = textToKlattTrack("the apple", 110);

      // After reduction, the track should contain IH (not AH) for "the"
      const theFrames = track.filter(
        (frame) => frame.word === "the" && frame.phoneme !== "DH"
      );
      const vowelPhonemes = [...new Set(theFrames.map((f) => f.phoneme))];

      // IH should appear (the reduced vowel)
      expect(vowelPhonemes).toContain("IH");
      // AH should NOT appear (it was replaced)
      expect(vowelPhonemes).not.toContain("AH");
    });

    it('does NOT reduce "the" before consonant-initial word', () => {
      // "the dog" — "dog" starts with D (consonant).
      // the_prevocalic_reduction should NOT apply; AH stays.
      const track = textToKlattTrack("the dog", 110);

      const theFrames = track.filter(
        (frame) => frame.word === "the" && frame.phoneme !== "DH"
      );
      const vowelPhonemes = [...new Set(theFrames.map((f) => f.phoneme))];

      // AH should remain (no reduction)
      expect(vowelPhonemes).toContain("AH");
      // IH should NOT appear
      expect(vowelPhonemes).not.toContain("IH");
    });
  });

  describe("t-flapping", () => {
    it('flaps intervocalic T in "butter" (stressed AH + T + unstressed ER)', () => {
      // "butter" = B AH1 T ER0 — T between stressed AH1 and unstressed ER0
      // Postlexical runs before structural, so t_flapping sees raw T with
      // prev=vowel(stressed) and next=vowel(unstressed) → replaces T with DX.
      const track = textToKlattTrack("butter", 110);

      const phonemes = track.map((f) => f.phoneme).filter(Boolean);
      // DX should be present (T was flapped)
      expect(phonemes).toContain("DX");
      // T_CL should NOT be present (T was replaced before structural ran)
      expect(phonemes).not.toContain("T_CL");
      // Plain T should also not remain
      expect(phonemes).not.toContain("T");
    });

    it('flaps intervocalic T in "water" (stressed AO + T + unstressed ER)', () => {
      const track = textToKlattTrack("water", 110);

      const phonemes = track.map((f) => f.phoneme).filter(Boolean);
      expect(phonemes).toContain("DX");
      expect(phonemes).not.toContain("T_CL");
    });

    it('does NOT flap word-initial T in "top"', () => {
      const track = textToKlattTrack("top", 110);

      const phonemes = track.map((f) => f.phoneme).filter(Boolean);
      // T at word start is not between vowels → no flapping
      expect(phonemes).not.toContain("DX");
      expect(phonemes).toContain("T_CL");
    });

    it('does NOT flap word-final T in "pat"', () => {
      const track = textToKlattTrack("pat", 110);

      const phonemes = track.map((f) => f.phoneme).filter(Boolean);
      // T at word end is not between vowels → no flapping
      expect(phonemes).not.toContain("DX");
      expect(phonemes).toContain("T_CL");
    });
  });
});
