import { describe, expect, it } from "vitest";
import { applyRange, createProvenanceCollector, parseRangeSpec } from "../src/provenance";
import { textToKlattTrack } from "../src/tts-frontend";

describe("provenance range filters", () => {
  it("collects explain decisions from text pipeline", () => {
    const provenance = createProvenanceCollector();
    const track = textToKlattTrack("hello world", 110, 30, { provenance });
    const decisions = provenance.getDecisions();

    expect(track.length).toBeGreaterThan(0);
    expect(decisions.length).toBeGreaterThan(0);
    expect(
      decisions.some((decision) => decision.type === "dictionary_pronunciation_selected"),
    ).toBe(true);
    expect(decisions.some((decision) => decision.type === "feature_overwrite")).toBe(true);
  });

  it("applies seq ranges inclusively", () => {
    const provenance = createProvenanceCollector();
    textToKlattTrack("hello world", 110, 30, { provenance });
    const decisions = provenance.getDecisions();

    const filtered = applyRange(decisions, parseRangeSpec("seq:1-3"));
    expect(filtered.map((decision) => decision.seq)).toEqual([1, 2, 3]);
  });

  it("applies token ranges over token id subjects", () => {
    const provenance = createProvenanceCollector();
    textToKlattTrack("hello world", 110, 30, { provenance });
    const decisions = provenance.getDecisions();

    const filtered = applyRange(decisions, parseRangeSpec("token:segment_1-segment_2"));
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((decision) => decision.seq >= filtered[0].seq)).toBe(true);
    expect(filtered.some((decision) => decision.subject.startsWith("item:segment_1."))).toBe(true);
    expect(filtered.some((decision) => decision.subject.startsWith("item:segment_2."))).toBe(true);
  });

  it("rejects invalid range syntax", () => {
    expect(() => parseRangeSpec("seq:")).toThrow();
    expect(() => parseRangeSpec("foo:1-2")).toThrow();
    expect(() => parseRangeSpec("seq:--")).toThrow();
  });
});
