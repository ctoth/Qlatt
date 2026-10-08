/**
 * DECtalk frame gate: the dectalk-english track against the parameter packets
 * DECtalk 4.63's phonetic stage emits, packet by packet, for every phrase of
 * every oracle corpus. No audio, no say.exe.
 *
 * DECtalk's packets are test/fixtures/dectalk-oracle/<corpus>.frames.json
 * (regenerate with scripts/oracle/export-frame-fixture.ts). One packet is 71
 * samples at 11025 Hz; the track is read at each packet's start time. What a
 * packet holds is set out in scripts/oracle/frame-parameters.ts.
 *
 * Compared for each phrase (scripts/oracle/frame-gate.ts):
 *   length    the track ends where DECtalk's last packet ends
 *   segments  every packet lies in the Segment of DECtalk's phone
 *   F0, F1-F3, B1-B3, AV, AP, A2-A6, AB, TLT
 *             the track's value rounds to the integer DECtalk sent (F0 to the
 *             tenth of a hertz)
 *   AG, PS, CNK, AL, ABLADE, ATB, AREA_N, DC, UE, PLACE, A2_CODE, F4
 *             the same for the words DECtalk's synthesizer reads; a packet
 *             where the track has no such value differs
 *
 * What does not match yet is listed per phrase in
 * test/fixtures/dectalk-oracle/<corpus>.frame-gaps.json, and that list is a
 * ratchet in both directions: a phrase must differ from DECtalk in exactly the
 * listed names. A name that starts matching fails the test until it is taken
 * off the list; a name that is not listed fails as a regression. After a rule
 * change, `scripts/oracle/compare-frame-fixture.ts --write-gaps` rewrites the
 * lists; a name that APPEARS in that diff is something the change broke.
 *
 * Why each name is still on the lists is GAP_REASONS below. Read the last
 * entry before spending effort on the amplitudes.
 *
 * Voices. Three corpora are Paul's. dectalk-us-betty-v1 and
 * dectalk-us-harry-v1 are spoken by Betty and by Harry (the corpus's
 * `defaults.voiceId`): a female voice, and a male one with another head size.
 * In them F1, F2, F3, B2 and B3 match on every packet, through the voice rule
 * fields `sex` and `fnscale`. The words that do not (F0, AG, PS, CNK, F4 among
 * them) are computed from values the frontend still takes from Paul; the
 * reasons below were written for Paul's corpora and do not explain those.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DECTALK_FRAME_CORPUS_FILES } from "../scripts/oracle/allophones";
import {
  decodeFrameFixtureAreaColumn,
  FRAME_FIXTURE_AREA_COLUMNS,
} from "../scripts/oracle/frame-fixture";
import {
  comparePhraseFrames,
  FRAME_GAP_NAMES,
  loadFrameFixture,
  loadFrameGapList,
} from "../scripts/oracle/frame-gate";
import type { OracleCorpusDocument } from "../scripts/oracle/types";

const repoRoot = path.resolve(__dirname, "..");

const TIMING_REASON =
  "the phrase's allophones or their durations are not DECtalk's (KNOWN_GAPS in dectalk-oracle-gate.test.ts)";
const F0_REASON =
  "not ported: the glottalization dip before a word-initial vowel (Ph_drwt02.c:2264-2275, " +
  "4040-4130). Not every remaining phrase has been traced to it";
// phases/formant-drawing.yaml draws F1, F2, F3, B2 and B3 as phsettar() and
// phdraw() do. The one phrase that still differs, carry-be-late, is the one
// whose allophone durations are not DECtalk's.
const FORMANT_REASON =
  "the phrase's durations are not DECtalk's (its `length` and `segments` gaps), and every " +
  "ramp is computed from them";
const B1_REASON =
  "lowering blends Segment targets; DECtalk draws B1 from ph_setar.c and p_us_st1.c targets " +
  "with ph_draw.c:343-460's forward and backward smoothing, then delays it one frame " +
  "(ph_claus.c:754-757). DECtalk's synthesizer does not read this word (VTM/vtmiont.c:1300-1319)";
const AMPLITUDE_REASON =
  "the frontend's stop and fricative Segments carry their own source and noise levels, not " +
  "ph_draw.c's amplitude loop with p_us_st1.c's special rules. In this build DECtalk's " +
  "synthesizer never reads these packet values: it recomputes them from area parameters the " +
  "packets do not record (VTM/vtmiont.c:660-683, 1300-1319)";

const AREA_REASON =
  "not emitted: the frontend has no port yet of the area, pressure and control-code words " +
  "ph_draw.c:908-4193 computes (the words DECtalk's synthesizer actually reads, " +
  "VTM/vtmiont.c:660-683)";
// phases/articulation.yaml ports the pressure rules of ph_draw.c. Where PS
// still differs, by what dump-frame-columns.ts shows, none of it explained
// further than this:
const PS_REASON =
  "the slope of the final fall (ph_draw.c:3795-3887) comes out steeper than DECtalk's in " +
  "some phrases and is applied in some questions where DECtalk applies none, so its tcumdur, " +
  "nframb or boundary inputs are not all DECtalk's; and the emphasis pulse (1509-1552) and " +
  "the end-of-clause drop (3929-3969) are not ported";
// The glottal rules are ported and "cat." is exact. What is known of the rest:
const AG_REASON =
  "not ported: the early exits of the end-of-clause spread (ph_draw.c:3604-3624) and the " +
  "nasal case of the initial silence (1146-1190); and differences inside phrases that have " +
  "not been traced to a rule yet";
// The lips, blade and tongue body rules are ported (ph_draw.c:740-886,
// 931-1220, 1239-1296, 1565-1945, 2807-2930, 3113-3553) and "cat." is exact.
const CONSTRICTION_REASON =
  "the phrases that still differ have not been traced. Known to be untested against DECtalk: " +
  "the flap (ph_draw.c:3312 shifts by a negative count, which C leaves undefined)";

const GAP_REASONS: Readonly<Record<string, string>> = {
  length: TIMING_REASON,
  segments: TIMING_REASON,
  F0: F0_REASON,
  F1: FORMANT_REASON,
  F2: FORMANT_REASON,
  F3: FORMANT_REASON,
  B1: B1_REASON,
  B2: FORMANT_REASON,
  B3: FORMANT_REASON,
  AV: AMPLITUDE_REASON,
  AP: AMPLITUDE_REASON,
  A2: AMPLITUDE_REASON,
  A3: AMPLITUDE_REASON,
  A4: AMPLITUDE_REASON,
  A5: AMPLITUDE_REASON,
  A6: AMPLITUDE_REASON,
  AB: AMPLITUDE_REASON,
  AG: AG_REASON,
  PS: PS_REASON,
  CNK: TIMING_REASON,
  AL: CONSTRICTION_REASON,
  ABLADE: CONSTRICTION_REASON,
  ATB: CONSTRICTION_REASON,
  AREA_N: AREA_REASON,
  DC: AREA_REASON,
  UE: AREA_REASON,
  PLACE: AREA_REASON,
  A2_CODE: AREA_REASON,
  PH: TIMING_REASON,
  // Only in the voice corpora: phases/articulation.yaml sends Paul's F4
  // (policy.articulation.voice.f4) for every voice.
  F4: "the frontend sends Paul's fourth formant for every voice",
};

const loaded = DECTALK_FRAME_CORPUS_FILES.map((fileName) => {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", fileName), "utf8"),
  ) as OracleCorpusDocument;
  return {
    corpus,
    fixture: loadFrameFixture(repoRoot, corpus.corpusId),
    gaps: loadFrameGapList(repoRoot, corpus.corpusId),
  };
});

describe("DECtalk frame gate", () => {
  for (const { corpus, fixture, gaps } of loaded) {
    describe(corpus.corpusId, () => {
      const ids = corpus.entries.map((entry) => entry.id);

      it("has DECtalk's packets for every corpus entry and no strays", () => {
        expect(Object.keys(fixture.entries).sort()).toEqual([...ids].sort());
      });

      // AG, AL, AN, ABLADE, PS, CNK, DC, UE, F4, ATB and PLACE are what
      // DECtalk's synthesizer builds voicing and noise from. The phrase tests
      // below compare them; this keeps the oracle complete.
      it("has the synthesizer's area words for every packet", () => {
        for (const id of ids) {
          const recorded = fixture.entries[id];
          if (!recorded) continue;
          for (const column of FRAME_FIXTURE_AREA_COLUMNS) {
            expect(decodeFrameFixtureAreaColumn(recorded, column), `${id} ${column}`).toHaveLength(
              recorded.packets,
            );
          }
        }
      });

      it("lists gaps only for corpus entries, by known names that have a reason", () => {
        expect(Object.keys(gaps).filter((id) => !ids.includes(id))).toEqual([]);
        const names = [...new Set(Object.values(gaps).flat())];
        expect(names.filter((name) => !FRAME_GAP_NAMES.includes(name))).toEqual([]);
        expect(names.filter((name) => !(name in GAP_REASONS))).toEqual([]);
      });

      for (const entry of corpus.entries) {
        const listed = gaps[entry.id] ?? [];
        const title =
          listed.length === 0
            ? `${entry.id}: "${entry.text}" matches DECtalk's packets`
            : `${entry.id}: "${entry.text}" differs from DECtalk's packets only in ${listed.join(" ")}`;
        it(title, () => {
          const { gaps: found } = comparePhraseFrames(corpus, fixture, entry.id, entry.text);
          expect({
            regressed: found.filter((name) => !listed.includes(name)),
            nowMatching: listed.filter((name) => !found.includes(name)),
          }).toEqual({ regressed: [], nowMatching: [] });
        });
      }
    });
  }
});
