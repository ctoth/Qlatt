import { describe, expect, it, vi } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { Item } from "../src/declarative-frontend/hrg";

/**
 * Break-index tier — declarative port of the prosodic-annotator
 * assignBreakIndices + applyLongPhraseBreaking passes (Phase 5.3).
 */
function activeSegments(result: ReturnType<typeof textToKlattTrackDetailed>): Item[] {
  return result.utterance.relation("Segment").listItems().filter((s) => s.get("active") !== false);
}

describe("prosody: declarative break-index assignment", () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  it("assigns breakIndex=4 on terminal-punctuation SILs and 3 on clause SILs", () => {
    const result = textToKlattTrackDetailed("Gag, gang.", 110);
    const sils = activeSegments(result).filter((s) => s.get("phoneme") === "SIL" && s.get("punctuationSymbol") != null);
    const comma = sils.find((s) => s.get("punctuationSymbol") === ",");
    const period = sils.find((s) => s.get("punctuationSymbol") === ".");
    expect(comma?.get("breakIndex")).toBe(3);
    expect(period?.get("breakIndex")).toBe(4);
  });

  it("marks the last phone of each word run with breakIndex=1", () => {
    const result = textToKlattTrackDetailed("big cat.", 110);
    const bigLast = activeSegments(result).filter((s) => s.get("word") === "big").at(-1);
    expect(bigLast?.get("breakIndex")).toBe(1);
  });

  it("does not stamp a spurious word-internal break across a suppressed mid-word SIL", () => {
    // "dog." ends in a G stop; a suppressed period-SIL is wedged between the
    // closure and release. The declarative word-boundary rule ignores it, so the
    // closure keeps breakIndex 0/unset (only the run's final phone gets 1) — the
    // imperative pass used to stamp a spurious word-internal 1 on the closure.
    const result = textToKlattTrackDetailed("The quick brown fox jumps over the lazy dog.", 110);
    const dog = activeSegments(result).filter((s) => s.get("word") === "dog");
    const ones = dog.filter((s) => s.get("breakIndex") === 1);
    expect(ones.length).toBe(1);
    expect(dog.at(-1)?.get("breakIndex")).toBe(1);
  });

  it("inserts a breakIndex=2 midpoint break only in phrases with >=7 content words", () => {
    // Short phrase -> no long-phrase break.
    const short = textToKlattTrackDetailed("big cat.", 110);
    expect(activeSegments(short).some((s) => s.get("breakIndex") === 2)).toBe(false);
    // Seven content words in one phrase -> exactly one midpoint break=2.
    const long = textToKlattTrackDetailed("Big red cats chase small brown mice.", 110);
    const twos = activeSegments(long).filter((s) => s.get("breakIndex") === 2);
    expect(twos.length).toBe(1);
  });

  afterAll(() => warnSpy.mockRestore());
});
