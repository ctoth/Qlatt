/**
 * DECtalk frame gate: the dectalk-english track against the parameter packets
 * DECtalk 4.63's phonetic stage emits, packet by packet, for every phrase of
 * every oracle corpus. No audio, no say.exe.
 *
 * This file checks each corpus's fixtures and gap list; the phrase tests are
 * in test/dectalk-frame-gate-<n>.test.ts, dealt across files to run side by
 * side (test/utils/dectalk-frame-gate.ts has the comparison and the reasons).
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
 * Why each name is still on the lists is GAP_REASONS in
 * test/utils/dectalk-frame-gate.ts. Read the last entry before spending effort
 * on the amplitudes.
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
 * in GAP_REASONS were written for Paul's corpora and do not explain those.
 */

import { describe, expect, it } from "vitest";
import {
  decodeFrameFixtureAreaColumn,
  FRAME_FIXTURE_AREA_COLUMNS,
} from "../scripts/oracle/frame-fixture";
import { FRAME_GAP_NAMES } from "../scripts/oracle/frame-gate";
import { CORPUS_GAP_REASONS, FRAME_GATE_CORPORA, GAP_REASONS } from "./utils/dectalk-frame-gate";

describe("DECtalk frame gate", () => {
  for (const { corpus, fixture, gaps } of FRAME_GATE_CORPORA) {
    describe(corpus.corpusId, () => {
      const ids = corpus.entries.map((entry) => entry.id);

      it("has DECtalk's packets for every corpus entry and no strays", () => {
        expect(Object.keys(fixture.entries).sort()).toEqual([...ids].sort());
      });

      // AG, AL, AN, ABLADE, PS, CNK, DC, UE, F4, ATB and PLACE are what
      // DECtalk's synthesizer builds voicing and noise from. The phrase tests
      // compare them; this keeps the oracle complete.
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
        expect(
          names.filter(
            (name) => !(name in GAP_REASONS) && !(corpus.corpusId in CORPUS_GAP_REASONS),
          ),
        ).toEqual([]);
      });
    });
  }
});
