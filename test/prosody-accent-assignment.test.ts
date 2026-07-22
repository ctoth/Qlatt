import { describe, expect, it, vi } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { Item } from "../src/declarative-frontend/hrg";

/**
 * Pass 3 (assign_accent) — declarative port of the prosodic-annotator
 * assignAccent word-grouping pass.
 *
 * Accent is assigned by the `assign_accent` annotation-phase rule using the
 * contiguous word-run CEL helpers (word_run_has_primary_stress,
 * is_first_primary_stress_in_word_run). These tests lock:
 *  - a content word with primary stress carries accent on its first primary-
 *    stressed phone, and every phone of the word is isAccented;
 *  - function words are never accented;
 *  - two ADJACENT identical words merge into one accent run (byte-identical to
 *    the old imperative contiguous-string grouping);
 *  - a SUPPRESSED SIL sitting mid-word no longer splits the accent run (the
 *    intended behaviour; the old imperative flushed the run on the suppressed
 *    SIL's phoneme=='SIL' branch, spuriously de-accenting the trailing phone).
 */

function activeSegments(result: ReturnType<typeof textToKlattTrackDetailed>): Item[] {
  return result.utterance
    .relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false);
}

describe("prosody pass 3: declarative accent assignment", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  it("carries accent on the first primary-stressed phone of a content word", () => {
    const result = textToKlattTrackDetailed("the cat sat.", 120);
    const segs = activeSegments(result).filter((s) => s.get("word") === "cat");
    const carriers = segs.filter((s) => s.get("isAccentCarrier") === true);
    expect(carriers.length).toBe(1);
    expect(carriers[0].get("stress")).toBe(1);
    // Every phone of the accented word is isAccented.
    expect(segs.every((s) => s.get("isAccented") === true)).toBe(true);
  });

  it("does not accent function words", () => {
    const result = textToKlattTrackDetailed("the cat sat.", 120);
    const theSegs = activeSegments(result).filter((s) => s.get("word") === "the");
    expect(theSegs.length).toBeGreaterThan(0);
    expect(theSegs.every((s) => s.get("isAccented") !== true)).toBe(true);
    expect(theSegs.every((s) => s.get("isAccentCarrier") !== true)).toBe(true);
  });

  it("merges two adjacent identical words into one accent run", () => {
    // Contiguous same-word grouping: "sip sip" is one run, so only the FIRST
    // sip's vowel is the carrier (matches the old imperative string grouping).
    const result = textToKlattTrackDetailed("sip sip.", 120);
    const sipVowelCarriers = activeSegments(result).filter(
      (s) => s.get("word") === "sip" && s.get("isAccentCarrier") === true,
    );
    expect(sipVowelCarriers.length).toBe(1);
  });

  it("keeps a whole word accented across a suppressed mid-word SIL", () => {
    // "Gag," expands with a suppressed comma-SIL wedged inside the word run.
    // The declarative rule ignores the suppressed token, so every active phone
    // of "gag" is accented (the old imperative left the trailing release
    // unaccented because the suppressed SIL flushed its word group).
    const result = textToKlattTrackDetailed("Gag, gang, and gunk go together.", 110);
    const gagSegs = activeSegments(result).filter((s) => s.get("word") === "gag");
    expect(gagSegs.length).toBeGreaterThan(1);
    expect(gagSegs.every((s) => s.get("isAccented") === true)).toBe(true);
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });
});
