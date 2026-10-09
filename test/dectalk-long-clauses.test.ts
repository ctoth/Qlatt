/**
 * Two rules of the dectalk-english frontend that long clauses showed:
 *
 *   - geminate deletion reads DECtalk's obstruent feature, which /w/ carries
 *     (phases/postlexical.yaml dectalk_geminate_delete);
 *   - duration Rule 9 indexes the feature table by clause position, past the
 *     table's end in a clause of more than 100 allophones
 *     (phases/duration.yaml position_reads_syllabic).
 *
 * The expected values were measured on DECtalk 4.63 say.exe (its duration
 * routine's own numbers); the same texts are in
 * test/oracle-corpora/dectalk-us-long-clauses-v1.json against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Row = { phone: string; word: string; frames: number; percent: unknown; position: unknown };

/** The frontend's Segments for a text, a stop's pieces counted as one phone. */
function rows(text: string): Row[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const out: Row[] = [];
  for (const segment of utterance.relation("Segment").listItems()) {
    if (segment.get("active") === false) continue;
    const frames = Math.round(Number(segment.get("duration")) / 6.4);
    if (["stop_release", "stop_aspiration"].includes(String(segment.get("type")))) {
      (out.at(-1) as Row).frames += frames;
      continue;
    }
    out.push({
      phone: String(segment.get("phoneme")),
      word: String(segment.get("word") ?? ""),
      frames,
      percent: segment.get("timing_percent"),
      position: segment.get("clause_position"),
    });
  }
  return out;
}

describe("two /w/ across a word boundary", () => {
  it("are one, as two of any DECtalk obstruent are", () => {
    // The dictionary writes "new" N UW W; DECtalk: AX 17, N 14, UW 29, W 8, AH 18, N 17.
    const spoken = rows("A new one.").filter((row) => row.phone !== "SIL");
    expect(spoken.map((row) => `${row.phone}:${row.frames.toString()}`).join(" ")).toBe(
      "AX:17 N:14 UW:29 W:8 AH:18 N:17",
    );
  });

  it("is kept before another consonant", () => {
    const spoken = rows("A new car.").filter((row) => row.phone !== "SIL");
    expect(spoken.map((row) => row.phone).join(" ")).toBe("AX N UW W K AR");
  });
});

describe("duration Rule 9 at a clause position past the feature table", () => {
  const long =
    "The boy ran down the hill and across the yard and through the gate and along the lane " +
    "and over the bridge and past the church and round the pond and up the steps and into " +
    "the kitchen where his mother was baking bread.";

  it("shortens the vowel at position 118 as DECtalk's data after the table has it", () => {
    // DECtalk: the AH of "was" is allophone 118 of 130, prcnt 51, 16 frames.
    const vowel = rows(long).find((row) => row.word === "was" && row.phone === "AH") as Row;
    expect(vowel.position).toBe(118);
    expect(vowel.percent).toBe(51);
    expect(vowel.frames).toBe(16);
  });

  it("gives the same vowel the same duration in a short clause", () => {
    const vowel = rows("Into the kitchen where his mother was baking bread.").find(
      (row) => row.word === "was" && row.phone === "AH",
    ) as Row;
    expect(vowel.position).toBe(22);
    expect(vowel.percent).toBe(51);
    expect(vowel.frames).toBe(16);
  });
});
