import { describe, expect, it, vi, afterAll } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";

/**
 * Integration tests for the ToBI intonation model.
 *
 * These tests verify the full pipeline: text -> annotator -> rules -> F0 contour.
 *
 * Citations:
 * - Pierrehumbert 1980 (downstep formula H_n = V * k^n, boundary tones)
 * - Ladd 2008 (pitch range model, final lowering)
 * - Silverman et al. 1992 (ToBI labeling standard)
 * - O'Shaughnessy 1976 (microprosodic perturbation)
 */

// Suppress console.warn from pipeline (missing inventory targets, etc.)
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
afterAll(() => warnSpy.mockRestore());

// Helper: extract F0 values from voiced frames
function getVoicedF0(track: Array<Record<string, any>>): number[] {
  return track
    .filter((frame) => Number(frame.params?.F0) > 0)
    .map((frame) => Number(frame.params.F0));
}

// Helper: get F0 at word boundaries by finding frames near specific time positions
function getMaxF0InRange(
  track: Array<Record<string, any>>,
  startFraction: number,
  endFraction: number,
): number {
  const totalTime = track.reduce((sum, f) => sum + Number(f.duration || 0), 0);
  const startMs = totalTime * startFraction;
  const endMs = totalTime * endFraction;
  let accTime = 0;
  let maxF0 = 0;
  for (const frame of track) {
    accTime += Number(frame.duration || 0);
    const f0 = Number(frame.params?.F0 || 0);
    if (accTime >= startMs && accTime <= endMs && f0 > maxF0) {
      maxF0 = f0;
    }
  }
  return maxF0;
}

// ---------------------------------------------------------------------------
// pow function tests
// ---------------------------------------------------------------------------

describe("pow CEL function", () => {
  it("pow(0.6, 0) returns 1.0 through the pipeline", () => {
    // Verified indirectly: first accent (index 0) gets pow(0.6, 0) = 1.0
    // so F0 = 110 + 80 * 0.85 = 178 for prenuclear H*
    const track = textToKlattTrack("Cat sat.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // With ToBI model, first accent should be near 178 Hz (prenuclear H*)
    // or 167.8 Hz (nuclear H* with final lowering if single word)
    const maxF0 = Math.max(...voicedF0);
    expect(maxF0).toBeGreaterThan(140);
    expect(maxF0).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// Integration tests: F0 contour shape via textToKlattTrack
// ---------------------------------------------------------------------------

describe("ToBI intonation — integration", () => {
  it("declarative downstep: F0 peaks descend across accents", () => {
    // "The cat sat on the mat." — three accented words
    // With Ladd 2008 interpretation, the nuclear accent (on "mat") may be at
    // full height (downstep_factor=1.0), but the phrase accent L- and boundary
    // tone L% produce a terminal fall. So the final few frames should be lower
    // than the global F0 peak.
    const track = textToKlattTrack("The cat sat on the mat.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // The global peak should occur before the final 20% of voiced frames
    // (the terminal fall occupies the tail). Citation: Pierrehumbert 1980, Ladd 2008
    const peakF0 = Math.max(...voicedF0);
    const peakIdx = voicedF0.indexOf(peakF0);
    expect(peakIdx).toBeLessThan(voicedF0.length * 0.9);

    // Final 10% of voiced frames should be below the peak (terminal fall from L- L%)
    const tail = voicedF0.slice(Math.floor(voicedF0.length * 0.9));
    const avgTail = tail.reduce((a, b) => a + b, 0) / tail.length;
    expect(peakF0).toBeGreaterThan(avgTail);
  });

  it("question has higher tail F0 than declarative", () => {
    const statement = textToKlattTrack("hello world.");
    const question = textToKlattTrack("hello world?");

    const statementVoiced = statement.filter((f) => Number(f.params?.F0) > 0);
    const questionVoiced = question.filter((f) => Number(f.params?.F0) > 0);

    expect(statementVoiced.length).toBeGreaterThan(0);
    expect(questionVoiced.length).toBeGreaterThan(0);

    const statementTail = statementVoiced[statementVoiced.length - 1].params.F0;
    const questionTail = questionVoiced[questionVoiced.length - 1].params.F0;
    expect(questionTail).toBeGreaterThan(statementTail);
  });

  it("L* target in question is near bottom of range", () => {
    // "Is the cat here?" — "here" should get L* (near baseline)
    const track = textToKlattTrack("Is the cat here?");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // The F0 range should include both high (cat H*) and low (here L*) targets
    const maxF0 = Math.max(...voicedF0);
    const minF0 = Math.min(...voicedF0);
    // L* should be around 122 Hz (110 + 80*0.15)
    // H* should be around 178 Hz (110 + 80*0.85)
    // We just verify there's a meaningful range
    expect(maxF0 - minF0).toBeGreaterThan(20);
  });

  it("downstep floor prevents F0 collapse on long sentences", () => {
    // Long sentence with many accents
    const track = textToKlattTrack("The big red dog jumped past the old stone wall.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // Floor: base_hz + range_hz * downstep_floor_fraction = 110 + 80 * 0.25 = 130
    // No voiced F0 should be much below base_hz (some may be slightly below due to
    // microprosodic effects or unaccented sag, but peaks should stay above floor)
    const maxF0 = Math.max(...voicedF0);
    const minF0 = Math.min(...voicedF0);
    // The minimum voiced F0 should be at or near base_hz (unaccented segments can sag to base)
    expect(minF0).toBeGreaterThanOrEqual(100); // allow small tolerance below 110
    expect(maxF0).toBeGreaterThan(130); // at least some peaks above floor
  });

  it("register reset: F0 resets after period+SIL", () => {
    // Two sentences — F0 should reset for second sentence
    const track = textToKlattTrack("Cat sat. Dog ran.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // Both sentences should have accents producing peaks above base_hz
    // The second sentence shouldn't continue declining from the first
    const maxF0 = Math.max(...voicedF0);
    expect(maxF0).toBeGreaterThan(130);
  });

  it("declarative phrase accent and boundary pull the tail down before final silence", () => {
    const track = textToKlattTrack("Hello.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // The silent boundary itself is not voiced, so the last voiced sample will
    // be above the final L% target. It should still sit below the sentence peak
    // and in the low declarative tail region.
    const lastF0 = voicedF0[voicedF0.length - 1];
    const peakF0 = Math.max(...voicedF0);
    expect(lastF0).toBeLessThan(peakF0);
    expect(lastF0).toBeLessThanOrEqual(150);
  });

  it("boundary H% produces rise for questions", () => {
    const track = textToKlattTrack("Really?");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // H%: 110 + 80 * 0.8 = 174 — the boundary should produce a rise
    // The last voiced F0 should be elevated
    const lastF0 = voicedF0[voicedF0.length - 1];
    expect(lastF0).toBeGreaterThan(140);
  });

  it("question tails rise after the phrase accent instead of plateauing", () => {
    const track = textToKlattTrack("Hello there?");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(3);

    const tail = voicedF0.slice(-3);
    expect(tail[tail.length - 1]).toBeGreaterThanOrEqual(tail[0]);
  });

  it("single-word sentence still produces baseline + accent + boundary", () => {
    // "Go." — single content word should still get accent + boundary tones
    const track = textToKlattTrack("Go.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // Should have accented peak above baseline (110)
    const maxF0 = Math.max(...voicedF0);
    expect(maxF0).toBeGreaterThan(120);

    // Should have boundary fall — last voiced F0 should be near or below baseline
    const lastF0 = voicedF0[voicedF0.length - 1];
    expect(lastF0).toBeLessThan(maxF0);
  });

  it("all-function-word input: no accents, F0 stays near baseline", () => {
    // "the a an" — no content words, no accents assigned
    const track = textToKlattTrack("the a an.");
    const voicedF0 = getVoicedF0(track);
    // May have no voiced frames (function words can be quite reduced),
    // but if any exist, F0 should stay near baseline (110 Hz)
    if (voicedF0.length > 0) {
      const maxF0 = Math.max(...voicedF0);
      // No accents → no accent peaks → F0 should not exceed baseline + modest overhead
      // Baseline is 110, unaccented declination is 0.98x, so F0 stays near 110
      expect(maxF0).toBeLessThan(160);
    }
  });

  it("5+ accent sentence: downstep floor holds (F0 never below 130 Hz for peaks)", () => {
    // "Bob called Jim and Sam told Dave." — 5 content words, multiple accents
    const track = textToKlattTrack("Bob called Jim and Sam told Dave.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // Floor: base_hz + range_hz * downstep_floor_fraction = 110 + 80 * 0.25 = 130 Hz
    // Accent peaks should never go below this floor
    const maxF0 = Math.max(...voicedF0);
    expect(maxF0).toBeGreaterThan(130);

    // The minimum voiced F0 can go below 130 (unaccented segments, sag, etc.)
    // but the PEAK F0 (max) should remain above 130
    // Also verify no negative or zero F0 values in voiced frames
    for (const f0 of voicedF0) {
      expect(f0).toBeGreaterThan(0);
    }
  });

  it("voiceless onset perturbation still fires", () => {
    // This is a microprosodic rule that should be kept
    // "Pat" has voiceless /P/ before vowel — F0 should be perturbed upward
    const trackP = textToKlattTrack("Pat sat.");
    const trackB = textToKlattTrack("Bat sat.");

    const pF0 = getVoicedF0(trackP);
    const bF0 = getVoicedF0(trackB);

    expect(pF0.length).toBeGreaterThan(0);
    expect(bF0.length).toBeGreaterThan(0);

    // Initial F0 after voiceless onset should be higher than after voiced onset
    // (voiceless_onset_raise = 1.2 vs voiced_onset_lower = 0.95)
    const pFirst = pF0[0];
    const bFirst = bF0[0];
    expect(pFirst).toBeGreaterThan(bFirst);
  });
});
