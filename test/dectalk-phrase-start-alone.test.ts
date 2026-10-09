/**
 * A prepositional-phrase start with no word boundary before it, in the
 * dectalk-english frontend: "and" or "for" after the text parser's phonemic
 * text, which is sent with no word boundary after it ("...and then").
 *
 * DECtalk's phone sort then gives the phone before the word the phrase
 * start's boundary alone, and no boundary to the rest of that rime; the
 * SPECIALWORD symbol ahead of the phrase start reads as a syllabic, so the
 * rime's vowel is a first syllable (phases/annotation.yaml
 * dectalk_syllable_type and dectalk_rime_boundary, phases/postlexical.yaml
 * dectalk_pp_start_state).
 *
 * The expected values are DECtalk 4.63 say.exe's own (its duration routine's
 * structure words and frames); the same texts are in
 * test/oracle-corpora/dectalk-us-phrase-start-alone-v1.json against its packets.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

type Row = { phone: string; word: string; frames: number; boundary: unknown; syllable: unknown };

/** `wordsPerMinute` as DECtalk's rate; the API's rate 1 is 180 words per minute. */
function rows(text: string, wordsPerMinute?: number): Row[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    ...(wordsPerMinute === undefined ? {} : { rate: wordsPerMinute / 180 }),
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
      boundary: segment.get("rime_boundary") ?? null,
      syllable: segment.get("syllable_type") ?? null,
    });
  }
  return out;
}

/** The vowel and the last phone of the phonemic "dot". */
function dot(text: string, rate?: number): [Row, Row] {
  const all = rows(text, rate);
  const vowel = all.findIndex((row) => row.phone === "AA");
  return [all[vowel] as Row, all[vowel + 1] as Row];
}

describe("a phrase start after phonemic text", () => {
  it("leaves its own boundary on the last phone and none on the vowel", () => {
    // DECtalk: AA structure word 521 (first syllable, no boundary), 21 frames; T boundary 128.
    const [vowel, last] = dot("...and then it rained.");
    expect(vowel).toMatchObject({ boundary: null, syllable: "first", frames: 21 });
    expect(last.boundary).toBe("pp");
  });

  it("does so before for, and inside a sentence", () => {
    // DECtalk: AA 20 frames before "for", 21 in "He waited ...and then left."
    expect(dot("...for now it works.")[0]).toMatchObject({ boundary: null, frames: 20 });
    expect(dot("...for now it works.")[1].boundary).toBe("pp");
    expect(dot("He waited ...and then left.")[0]).toMatchObject({ boundary: null, frames: 21 });
  });

  it("is a verb-phrase start at 140 words per minute and slower", () => {
    // DECtalk: the T has boundary 160 at rate 140 and 128 at 141.
    expect(dot("...and then it rained.", 140)[1].boundary).toBe("vp");
    expect(dot("...and then it rained.", 141)[1].boundary).toBe("pp");
  });

  it("has the word boundary's value too when the word before is written", () => {
    // DECtalk: AA boundary 96, T 224, AA 22 frames.
    const [vowel, last] = dot("Dot and then it rained.");
    expect(vowel).toMatchObject({ boundary: "word", syllable: "only", frames: 22 });
    expect(last.boundary).toBe("comma");
  });
});
