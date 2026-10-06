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
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DECTALK_CORPUS_FILES } from "../scripts/oracle/allophones";
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
  "4040-4130); Rule 4's question gestures as Ph_inton2.c:1251-1263 issues them, and the " +
  "question, exclamation and comma baselines (Ph_drwt02.c:1657-1700); the restart of every " +
  "F0 state at each clause (Ph_drwt02.c:1652-1810). prosody.yaml still issues comma rises, " +
  "which the live routine never does in English (Ph_inton2.c:1251, 1272)";
const FORMANT_REASON =
  "lowering blends Segment targets; DECtalk draws each parameter from ph_setar.c and p_us_st1.c " +
  "targets with ph_draw.c:343-460's forward and backward smoothing, then delays it one frame " +
  "(ph_claus.c:754-757)";
const AMPLITUDE_REASON =
  "the frontend's stop and fricative Segments carry their own source and noise levels, not " +
  "ph_draw.c's amplitude loop with p_us_st1.c's special rules. In this build DECtalk's " +
  "synthesizer never reads these packet values: it recomputes them from area parameters the " +
  "packets do not record (VTM/vtmiont.c:660-683, 1300-1319)";

const GAP_REASONS: Readonly<Record<string, string>> = {
  length: TIMING_REASON,
  segments: TIMING_REASON,
  F0: F0_REASON,
  F1: FORMANT_REASON,
  F2: FORMANT_REASON,
  F3: FORMANT_REASON,
  B1: FORMANT_REASON,
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
};

const loaded = DECTALK_CORPUS_FILES.map((fileName) => {
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
