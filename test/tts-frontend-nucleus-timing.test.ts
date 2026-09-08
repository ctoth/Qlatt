import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function nucleus(word: string) {
  const result = textToKlattTrackDetailed(word, 110);
  const segments = result.utterance.segments
    .listItems()
    .filter((item) => item.get("active") !== false);
  const start = segments.findIndex((item) => item.get("type") === "vowel");
  if (start < 0) throw new Error("fixture has no vowel");
  return { result, vowel: segments[start], tail: segments[start + 1] };
}

describe("Hertz nucleus timing", () => {
  it.each([
    ["tie", 145],
    ["tied", 200],
    ["pint", 145],
    ["her", 160],
  ] as const)("allocates the cited nucleus budget for %s", (word, expectedMs) => {
    const { vowel, tail } = nucleus(word);
    expect(tail).toBeDefined();
    expect(Number(vowel.get("duration")) + Number(tail.get("duration"))).toBeCloseTo(expectedMs, 5);
    expect(vowel.get("nucleus_duration_ms")).toBe(expectedMs);
  });

  it("retains an explainable duration decision", () => {
    const { result } = nucleus("tied");
    expect(
      result.utterance.provenance
        .getDecisions()
        .some(
          (decision) =>
            decision.citations.some((citation) => citation.includes("Hertz")) &&
            decision.reason.includes("hertz_nucleus_timing"),
        ),
    ).toBe(true);
  });
});
