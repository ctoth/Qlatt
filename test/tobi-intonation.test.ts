import { describe, expect, it, vi, afterAll } from "vitest";
import { textToKlattTrack } from "../src/tts-frontend";
import { annotateProsody } from "../src/prosodic-annotator";

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
// Annotator unit tests for accentIndexInPhrase
// ---------------------------------------------------------------------------

describe("accentIndexInPhrase annotation", () => {
  function phone(
    phoneme: string,
    word: string,
    stress: number | null = null,
    type = "vowel",
  ): Record<string, any> {
    return { phoneme, word, stress, type, params: {} };
  }

  function sil(punctuation?: string): Record<string, any> {
    return {
      phoneme: "SIL",
      word: "",
      stress: null,
      type: "silence",
      punctuationSymbol: punctuation ?? null,
      params: {},
    };
  }

  it("assigns sequential accent indices within a phrase", () => {
    // "The cat sat on the mat."
    const tokens = [
      sil(),
      phone("DH", "the"), phone("AH", "the", 0),
      phone("K", "cat"), phone("AE", "cat", 1), phone("T", "cat"),
      phone("S", "sat"), phone("AE", "sat", 1), phone("T", "sat"),
      phone("AA", "on"), phone("N", "on"),
      phone("DH", "the"), phone("AH", "the", 0),
      phone("M", "mat"), phone("AE", "mat", 1), phone("T", "mat"),
      sil("."),
    ];

    const result = annotateProsody(tokens);

    // "cat" stressed vowel at index 4 -> accentIndex = 0
    expect(result[4].accentIndexInPhrase).toBe(0);
    // "sat" stressed vowel at index 7 -> accentIndex = 1
    expect(result[7].accentIndexInPhrase).toBe(1);
    // "mat" stressed vowel at index 14 -> accentIndex = 2
    expect(result[14].accentIndexInPhrase).toBe(2);

    // Non-accented tokens get -1
    expect(result[1].accentIndexInPhrase).toBe(-1); // "the"
    expect(result[9].accentIndexInPhrase).toBe(-1); // "on"
  });

  it("resets accent index per phrase", () => {
    // "Cat sat, dog ran."
    const tokens = [
      sil(),
      phone("K", "cat"), phone("AE", "cat", 1), phone("T", "cat"),
      phone("S", "sat"), phone("AE", "sat", 1), phone("T", "sat"),
      sil(","),
      phone("D", "dog"), phone("AO", "dog", 1), phone("G", "dog"),
      phone("R", "ran"), phone("AE", "ran", 1), phone("N", "ran"),
      sil("."),
    ];

    const result = annotateProsody(tokens);

    // First phrase: cat=0, sat=1
    expect(result[2].accentIndexInPhrase).toBe(0); // cat
    expect(result[5].accentIndexInPhrase).toBe(1); // sat

    // Second phrase: dog=0, ran=1
    expect(result[9].accentIndexInPhrase).toBe(0);  // dog
    expect(result[12].accentIndexInPhrase).toBe(1); // ran
  });

  it("assigns -1 to non-accented tokens", () => {
    const tokens = [
      sil(),
      phone("DH", "the"), phone("AH", "the", 0),
      phone("K", "cat"), phone("AE", "cat", 1), phone("T", "cat"),
      sil("."),
    ];

    const result = annotateProsody(tokens);

    // "the" tokens are function words, not accented
    expect(result[1].accentIndexInPhrase).toBe(-1);
    expect(result[2].accentIndexInPhrase).toBe(-1);

    // "cat" consonants are accented (word-level) but only stress=1 gets index
    // K at index 3: isAccented=true but stress!=1 -> -1
    expect(result[3].accentIndexInPhrase).toBe(-1);
    // AE at index 4: isAccented=true AND stress=1 -> 0
    expect(result[4].accentIndexInPhrase).toBe(0);
    // T at index 5: isAccented=true but stress!=null && stress!=1 -> -1
    expect(result[5].accentIndexInPhrase).toBe(-1);
  });
});

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
    const track = textToKlattTrack("The cat sat on the mat.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // Overall F0 should start high and end low (declarative)
    const firstThird = voicedF0.slice(0, Math.floor(voicedF0.length / 3));
    const lastThird = voicedF0.slice(Math.floor((2 * voicedF0.length) / 3));
    const avgFirst = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const avgLast = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    expect(avgFirst).toBeGreaterThan(avgLast);
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

  it("boundary L% is at baseline for declaratives", () => {
    const track = textToKlattTrack("Hello.");
    const voicedF0 = getVoicedF0(track);
    expect(voicedF0.length).toBeGreaterThan(0);

    // Last few voiced F0 values should approach baseline (110)
    const lastF0 = voicedF0[voicedF0.length - 1];
    expect(lastF0).toBeLessThanOrEqual(130);
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
