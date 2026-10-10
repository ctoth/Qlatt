/**
 * A word right after bracketed phonemic text, from text, against the stock
 * say.exe's audio sample for sample
 * (test/oracle-corpora/dectalk-us-bracket-word-class-v1.json and
 * dectalk-us-bracket-word-class-joined-v1.json, each written before its
 * export), through the page's path (scripts/oracle/dectalk-voice-compare.ts).
 *
 * Phonemic text has no word boundary after it (CMD/cm_text.c:1118-1144), and
 * DECtalk's phone sort puts one at the clause's second place without moving
 * the word classes with the symbols (PH/ph_sort.c:460-463, 1774-1790). So a
 * word's class begins one symbol before the word, which after phonemic text
 * is that text's last phone:
 *
 *   - a vowel there takes the secondary stress of a function-word verb that
 *     is its clause's only verb ("and", "do", "have": PH/ph_sort.c:1283-1302)
 *     and loses the duration and the pitch written on it; the word's own
 *     vowel gets nothing;
 *   - a phone there that is no syllabic, before "and", has the stress mark
 *     right after it and takes it too; the phones before it do not;
 *   - the SPECIALWORD symbol of "and" stands first after the phonemic text
 *     and reads as a syllabic past the feature table's end, also when the
 *     phrase start after it has become a word boundary at the clause's end:
 *     the phones before the last one have no boundary, and the word counts
 *     as one word;
 *   - the class a comma sends a second time is the first word's that
 *     letter-to-sound read, not the phonemic text's.
 *
 * NOT_EXACT lists the sentences that are not DECtalk's samples, each with
 * what is missing. A sentence there that becomes exact fails its test, so
 * that it is taken off the list.
 *
 * The fixtures are the say.exe WAVs alone. Regenerate with the instrumented
 * and stock builds (scripts/oracle/export-dectalk-vtm-fixture.ts header):
 *
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-bracket-word-class-v1.json \
 *     --out-dir test/fixtures/dectalk-bracket-word-class --wav-only
 *   ... scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-bracket-word-class-joined-v1.json \
 *     --out-dir test/fixtures/dectalk-bracket-word-class-joined --wav-only
 */

import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  compareVoiceEntry,
  isExact,
  readVoiceCorpus,
} from "../scripts/oracle/dectalk-voice-compare";
import { createDiagnostics } from "../src/diagnostics";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const CORPORA = [
  {
    fixtureDir: path.join("test", "fixtures", "dectalk-bracket-word-class"),
    corpus: readVoiceCorpus(
      path.join("test", "oracle-corpora", "dectalk-us-bracket-word-class-v1.json"),
    ),
  },
  {
    fixtureDir: path.join("test", "fixtures", "dectalk-bracket-word-class-joined"),
    corpus: readVoiceCorpus(
      path.join("test", "oracle-corpora", "dectalk-us-bracket-word-class-joined-v1.json"),
    ),
  },
] as const;

const NO_COMMAND =
  "the vowel's pitch is dropped and no other phone of the clause has one, so the clause is in " +
  "a user-pitch mode with no pitch command at all. DECtalk's F0 is then flat for the whole " +
  "clause (51.1 Hz in its packets when the number was a note, 50.0 Hz when it was a target " +
  "in hertz); the frontend's F0 model draws its user-target layer only where a command " +
  "stands and draws the ordinary contour here. F0 is the only packet column that differs";

/** Not DECtalk's samples yet. */
const NOT_EXACT: Readonly<Record<string, string>> = {
  "bw-07": NO_COMMAND,
  "bw-08": NO_COMMAND,
  "bj-06": NO_COMMAND,
};

const PHONEME_MODE = "[:phoneme arpabet speak on]";

const run = (text: string) => {
  const provenance = createProvenanceCollector();
  const diagnostics = createDiagnostics();
  const result = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
    provenance,
    diagnostics,
  });
  return { result, decisions: provenance.getDecisions() };
};

/** The phones of the text with the stress each ended with, silences left out. */
const stresses = (text: string): string[] =>
  run(PHONEME_MODE + text)
    .result.utterance.relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false && item.get("phoneme") !== "SIL")
    .filter((item) => !String(item.get("phoneme")).endsWith("_REL"))
    .map((item) => `${String(item.get("phoneme"))}${Number(item.get("stress") ?? 0)}`);

/** The frames the duration rules gave each `phone` of the text. */
const framesOf = (text: string, phone: string): number[] =>
  run(PHONEME_MODE + text)
    .result.utterance.relation("Segment")
    .listItems()
    .filter((item) => item.get("active") !== false && item.get("phoneme") === phone)
    .map((item) => Number(item.get("timing_frames")));

describe("a word right after bracketed phonemic text", () => {
  it("gives the bracket's last vowel the stress of the only verb, and the word's none", () => {
    // say.exe's duration routine: UW 2, AE 0, M 1, IY 1.
    expect(stresses("[uw] and me.")).toEqual(["UW2", "AE0", "N0", "D0", "M1", "IY1"]);
    // One word with the bracket: UW 2, D 1, UW 1.
    expect(stresses("[uw]do it.").slice(0, 3)).toEqual(["UW2", "D1", "UW1"]);
  });

  it("leaves the stress with the word after a consonant, and marks the consonant", () => {
    // say.exe: T 2, AE 2; with two consonants only the last one (S 0, T 2;
    // T 0, R 2).
    expect(stresses("[uwt] and me.").slice(0, 3)).toEqual(["UW0", "T2", "AE2"]);
    expect(stresses("[uwst] and me.").slice(0, 4)).toEqual(["UW0", "S0", "T2", "AE2"]);
    expect(stresses("[uwtr] and me.").slice(0, 4)).toEqual(["UW0", "T0", "R2", "AE2"]);
    // One word with the bracket: the search goes on to the word's vowel.
    expect(stresses("[uwt]do it.").slice(0, 4)).toEqual(["UW0", "T0", "D2", "UW3"]);
  });

  it("gives a consonant before that vowel what the vowel had without the promotion", () => {
    // say.exe: K 0, UW 2; B 1, UW 3.
    expect(stresses("[kuw] and me.").slice(0, 2)).toEqual(["K0", "UW2"]);
    expect(stresses("[b'uw] and me.").slice(0, 2)).toEqual(["B1", "UW3"]);
  });

  it("promotes nothing when the clause has a second verb", () => {
    expect(stresses("[uw] and go.").slice(0, 2)).toEqual(["UW0", "AE0"]);
    // The comma sends the class of "and" again: two verbs.
    expect(stresses("[uw] and, go.").slice(0, 2)).toEqual(["UW0", "AE1"]);
  });

  it("drops the duration written on the promoted vowel, and keeps it otherwise", () => {
    // mstofr(400 + 4) is 63 frames (PH/ph_task.c:1380-1387); say.exe has 28
    // frames from the rules for the promoted vowel.
    expect(framesOf("[uw<400>] and me.", "UW")).toEqual([28]);
    expect(framesOf("[uw<400>] and go.", "UW")).toEqual([63]);
  });

  it("drops the pitch written on the promoted vowel and keeps the clause's mode", () => {
    const segments = run(`${PHONEME_MODE}[uw<400,30>] and [uw<400,10>].`)
      .result.utterance.relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false && item.get("phoneme") === "UW");
    expect(segments.map((item) => item.get("pitch_command"))).toEqual([0, 10]);
    expect(segments.map((item) => item.get("pitch_mode"))).toEqual(["singing", "singing"]);
    // say.exe: 22 frames from the rules, then the 63 written on the second.
    expect(segments.map((item) => Number(item.get("timing_frames")))).toEqual([22, 63]);
  });

  it('keeps a /t/ before the bracket\'s last sonorant when "and" follows', () => {
    // The SPECIALWORD symbol stops the scan for a boundary: say.exe has T 9
    // frames and N 10 in "[uwtn] and go.", no glottalized TX.
    expect(stresses("[uwtn] and go.").slice(0, 3)).toEqual(["UW0", "T0", "N0"]);
  });

  it("says why, with DECtalk's source lines", () => {
    const { decisions } = run(`${PHONEME_MODE}[uw] and me.`);
    const cited = decisions.filter((decision) =>
      decision.citations.some((citation) => citation.includes("ph_sort.c:460-463")),
    );
    expect(cited.length).toBeGreaterThan(0);
    expect(decisions.filter((decision) => decision.citations.length === 0)).toEqual([]);
  });

  it("lists only sentences of the corpora as not exact", () => {
    const ids = CORPORA.flatMap(({ corpus }) => corpus.entries.map((entry) => entry.id));
    expect(Object.keys(NOT_EXACT).filter((id) => !ids.includes(id))).toEqual([]);
  });

  for (const { fixtureDir, corpus } of CORPORA) {
    it.each(corpus.entries.map((entry) => [entry.id, entry] as const))(
      "%s against the say.exe WAV, sample for sample",
      async (id, entry) => {
        const result = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
        expect(result.error).toBeUndefined();
        expect(result.problems).toEqual([]);
        expect(result.samplesOracle).toBeGreaterThan(0);
        if (id in NOT_EXACT) {
          expect(isExact(result), `${id} is exact now: take it off NOT_EXACT`).toBe(false);
          return;
        }
        expect(result.packetsRender).toBe(result.packetsOracle);
        expect(result.firstMismatch).toBe(-1);
        expect(isExact(result)).toBe(true);
      },
      120000,
    );
  }
});
