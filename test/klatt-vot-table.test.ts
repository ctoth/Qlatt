import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function firstVot(text: string, frontendId = "qlatt-english") {
  const result = textToKlattTrackDetailed(text, 110, 30, { frontendId });
  const segments = result.utterance.segments
    .listItems()
    .filter((item) => item.get("active") !== false);
  const closure = segments.findIndex((item) =>
    ["P_CL", "T_CL", "K_CL"].includes(String(item.get("phoneme"))),
  );
  if (closure < 0) throw new Error("Missing voiceless closure in fixture");
  const release = segments[closure + 1];
  const aspiration = segments[closure + 2];
  expect(release.get("type")).toBe("stop_release");
  expect(aspiration.get("type")).toBe("stop_aspiration");
  return {
    ms: Number(release.get("duration")) + Number(aspiration.get("duration")),
    release,
    aspiration,
    result,
  };
}

describe("Klatt 1975 Table I prestressed word-initial VOT", () => {
  it.each([
    ["pea", 47],
    ["tea", 65],
    ["key", 70],
    ["pry", 59],
    ["try", 93],
    ["cry", 84],
    ["play", 61],
    ["clay", 77],
    ["twin", 102],
    ["queen", 94],
    ["spy", 12],
    ["sty", 23],
    ["sky", 30],
    ["spry", 18],
    ["stray", 37],
    ["scream", 35],
    ["splay", 16],
    ["squeal", 39],
  ] as const)("uses the measured burst-plus-aspiration interval for %s", (word, ms) => {
    const vot = firstVot(word);
    expect(vot.ms).toBe(ms);
    expect(Number(vot.release.get("duration"))).toBeGreaterThanOrEqual(5);
    expect(Number(vot.aspiration.get("duration"))).toBeGreaterThanOrEqual(5);
  });

  it("uses the same table in the inherited frontend", () => {
    expect(firstVot("spy", "qlatt-beauty").ms).toBe(12);
    expect(firstVot("try", "qlatt-beauty").ms).toBe(93);
  });

  it("recognizes distinct word identities when adjacent words have the same spelling", () => {
    for (const phrase of ["pea pea", "spy spy"]) {
      const segments = textToKlattTrackDetailed(phrase).utterance.segments.listItems();
      const releases = segments.filter((segment) => segment.get("type") === "stop_release");
      expect(releases).toHaveLength(2);
      expect(releases.map((segment) => segment.get("vot_from_table"))).toEqual([true, true]);
    }
  });

  it("keeps /s/ onset membership within a word and preserves medial controls", () => {
    expect(firstVot("this pea").ms).toBe(47);
    expect(firstVot("a spy").ms).toBe(12);
  });

  it("keeps an unmeasured medial control and an unstressed onset on the existing policy", () => {
    // Existing release floor/rounding makes the unchanged 34ms policy render 36ms.
    expect(firstVot("apart").ms).toBe(36);
    expect(firstVot("apart").release.get("vot_from_table")).not.toBe(true);
    expect(firstVot("potato").release.get("vot_from_table")).not.toBe(true);
    const atlas = textToKlattTrackDetailed("atlas").utterance.segments.listItems();
    expect(atlas.some((segment) => segment.get("phoneme") === "GS")).toBe(true);
  });

  it("traces table selection to Klatt and the cross-language context to Cho", () => {
    const { result } = firstVot("spy");
    const writes = result.utterance.provenance
      .getDecisions()
      .filter((d) => d.reason.includes("insert_mapped_voiceless_release_and_aspiration"));
    expect(writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          citations: expect.arrayContaining([
            expect.stringContaining("Klatt 1975 Table I"),
            expect.stringContaining("Cho & Ladefoged 1999"),
          ]),
        }),
      ]),
    );
  });
});
