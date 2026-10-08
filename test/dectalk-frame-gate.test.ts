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
 *   A2_AMPLITUDE
 *             the OUT_A2 word where it is not a code, which the synthesizer
 *             does not use; A2_CODE is the word where it is one
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
 * Voices. Three corpora are Paul's. The others are spoken by another voice
 * (the corpus's `defaults.voiceId`): Betty, a female voice; Harry, a male one
 * with another head size; and, five sentences each, Frank (setspdef()'s own
 * block), Dennis (no fifth formant) and Ursula (a female voice with one).
 * In them F1, F2, F3, B2 and B3 match on every packet, through the voice rule
 * fields `sex` and `fnscale`. F0 of the male voices takes its floor, range,
 * hat rise and stress scale from the voice. The female voices go through
 * DECtalk's second copy of its F0 routine (Ph_drwt02.c:2445 on; its own
 * baselines, stress and segmental tables, filter shift and pivot), which is
 * ported: their F0 matches on every packet. Their corpora have no question,
 * exclamation or second comma clause, so those female cases are not checked
 * against DECtalk.
 * AG, PS, CNK and F4 are still computed from Paul's values; the reasons
 * below were written for Paul's corpora and do not explain those.
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

// No list holds length, segments, F0, F1, F2, F3, B2, B3, PH or any word of
// phases/articulation.yaml (AG, PS, CNK, AL, ABLADE, ATB, AREA_N, DC, UE,
// A2_CODE) any more: every phrase of every corpus matches DECtalk on them, so
// they have no reason here and a new gap in one of them fails this test.
// That includes the clause with no phone that DECtalk speaks for an initial's
// second period (dectalk-us-letters-v1: "A.", "A. B. C.").
const B1_REASON =
  "lowering blends Segment targets; DECtalk draws B1 from ph_setar.c and p_us_st1.c targets " +
  "with ph_draw.c:343-460's forward and backward smoothing, then delays it one frame " +
  "(ph_claus.c:754-757). DECtalk's synthesizer does not read this word (VTM/vtmiont.c:1300-1319)";
const AMPLITUDE_REASON =
  "the frontend's stop and fricative Segments carry their own source and noise levels, not " +
  "ph_draw.c's amplitude loop with p_us_st1.c's special rules. In this build DECtalk's " +
  "synthesizer never reads these packet values: it recomputes them from area parameters the " +
  "packets do not record (VTM/vtmiont.c:660-683, 1300-1319)";

// OUT_A2 is compared in two rows (scripts/oracle/frame-parameters.ts). Its
// codes (A2_CODE) are ported (ph_draw.c:2037-2394) and match everywhere.
const A2_AMPLITUDE_REASON =
  "where no frication code applies, PH leaves the generic A2 amplitude in OUT_A2 (a small " +
  "number ramping across a phone boundary) and the track has 0. It is not ported, and it " +
  "cannot be heard: DECtalk's synthesizer only compares the incoming word with its eleven " +
  "codes (VTM/vtmiont.c:797-1147) and then overwrites it (1303), as the port does " +
  "(crates/dectalk-vtm/src/vtmio.rs:354-509, 554); test/dectalk-a2-word.test.ts renders " +
  "DECtalk's packets with amplitudes put in every non-code A2 word and gets DECtalk's samples";

const GAP_REASONS: Readonly<Record<string, string>> = {
  B1: B1_REASON,
  AV: AMPLITUDE_REASON,
  AP: AMPLITUDE_REASON,
  A2: AMPLITUDE_REASON,
  A3: AMPLITUDE_REASON,
  A4: AMPLITUDE_REASON,
  A5: AMPLITUDE_REASON,
  A6: AMPLITUDE_REASON,
  AB: AMPLITUDE_REASON,
  A2_AMPLITUDE: A2_AMPLITUDE_REASON,
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
