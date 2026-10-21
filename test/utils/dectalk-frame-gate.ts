/**
 * The frame gate's corpora, reason tables and per-phrase comparison. The
 * phrases of every corpus are dealt across several test files
 * (test/dectalk-frame-gate-<n>.test.ts) so vitest runs them side by side; the
 * per-corpus fixture checks are in test/dectalk-frame-gate.test.ts, whose
 * header says what the gate compares.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DECTALK_FRAME_CORPUS_FILES } from "../../scripts/oracle/allophones";
import {
  comparePhraseFrames,
  loadFrameFixture,
  loadFrameGapList,
} from "../../scripts/oracle/frame-gate";
import type { OracleCorpusDocument } from "../../scripts/oracle/types";

const repoRoot = path.resolve(__dirname, "..", "..");

/** How many test files the gate's phrases are dealt across. */
export const FRAME_GATE_PARTS = 8;

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

export const GAP_REASONS: Readonly<Record<string, string>> = {
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

/**
 * Corpora recorded ahead of the port that will speak them: one reason covers
 * every name on such a corpus's list, the ratchet still holds each phrase to
 * exactly the names listed, and the entry goes when the lists hold nothing but
 * the names of GAP_REASONS. dectalk-us-parser-words-v1 was here until
 * DECtalk's command-stage text parser was wired in (frontend.yaml
 * text_parser); its 24 phrases then left every name but those of GAP_REASONS.
 * dectalk-us-empty-clause-ahead-v1 and its Betty twin were here until the
 * text stage kept a period before a question mark in its word and took a
 * question mark or a comma after a stripped parenthesis as the word's
 * delimiter (recognition.yaml tn_period_before_mark_source and
 * tn_stripped_parenthesis_mark_source); their 7 phrases left the same way.
 */
export const CORPUS_GAP_REASONS: Readonly<Record<string, string>> = {};

export const FRAME_GATE_CORPORA = DECTALK_FRAME_CORPUS_FILES.map((fileName) => {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", fileName), "utf8"),
  ) as OracleCorpusDocument;
  return {
    corpus,
    fixture: loadFrameFixture(repoRoot, corpus.corpusId),
    gaps: loadFrameGapList(repoRoot, corpus.corpusId),
  };
});

export function describeFrameGatePart(part: number): void {
  // Entries are dealt by their index in one list over all corpora, so the
  // parts take similar time.
  let index = 0;
  const dealt = FRAME_GATE_CORPORA.map(({ corpus, fixture, gaps }) => ({
    corpus,
    fixture,
    gaps,
    entries: corpus.entries.filter(() => index++ % FRAME_GATE_PARTS === part),
  }));

  describe(`DECtalk frame gate, part ${(part + 1).toString()} of ${FRAME_GATE_PARTS.toString()}`, () => {
    it("has entries", () => {
      expect(dealt.reduce((sum, { entries }) => sum + entries.length, 0)).toBeGreaterThan(0);
    });

    for (const { corpus, fixture, gaps, entries } of dealt) {
      if (entries.length === 0) continue;
      describe(corpus.corpusId, () => {
        for (const entry of entries) {
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
}
