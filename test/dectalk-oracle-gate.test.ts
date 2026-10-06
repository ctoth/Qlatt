/**
 * DECtalk oracle gate (layer L0 of goal.md, plus track well-formedness).
 *
 * For every phrase of every oracle corpus, without rendering audio and without
 * say.exe:
 *   1. the dectalk-english frontend produces a track,
 *   2. its allophone sequence, clause by clause, equals the one DECtalk 4.63
 *      timed for the phrase (fixtures: test/fixtures/dectalk-oracle/
 *      <corpus>.durations.json, regenerate with
 *      scripts/oracle/export-duration-fixture.ts),
 *   3. no frame belongs to a Segment that has already ended.
 *
 * The comparison is at the allophone level because that is what the frontend's
 * Segments are. DECtalk's phoneme log is written before its allophone rules,
 * so it shows two [t] in "Pat tapped" and [z] in "these shoes" where DECtalk
 * goes on to say one [t] and [zh].
 *
 * dectalk-us-v1 is the corpus the rules were developed against.
 * dectalk-us-heldout-v1 holds neighbours of its words that no rule was fitted
 * to; a rule that only works for the first corpus shows up as a gap here.
 *
 * KNOWN_GAPS is a ratchet, not an allow-list: each listed phrase must still
 * fail, so fixing one forces its removal here. A phrase may never be added to
 * make a regression in a rule pass. The legitimate ways in are the removal of
 * a hardcoded exception that was making the phrase pass for the wrong reason,
 * and a stricter comparison; the entry then names what is missing.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { qlattAllophoneClauses, recordedAllophoneClauses } from "../scripts/oracle/allophones";
import type { OracleCorpusDocument } from "../scripts/oracle/types";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

type AllophoneFixture = {
  entries: Record<string, { text: string; clauses: Array<Array<{ kind: string; ph?: number }>> }>;
};

const repoRoot = path.resolve(__dirname, "..");
const CORPUS_FILES = ["dectalk-us-v1.json", "dectalk-us-heldout-v1.json"];

const KNOWN_GAPS: Readonly<Record<string, string>> = {
  // Letter-to-sound and morphology.
  "held-cape": "silent e: 'cape' gives AE, DECtalk EY",
  "held-coke": "silent e: 'coke' gives AA, DECtalk OW",
  "stops-big-dog": "'-ed' after voiceless /k/: 'barked' ends in D, DECtalk T",
  "fric-safe-zone": "silent e before plural '-s': 'zones' gives AA N EH Z, DECtalk OW N Z",
  "liquid-red-lorry": "plural '-ies': 'lorries' ends in RX Z, DECtalk IY Z",
  "glide-young-yard": "'-s' after voiceless /k/ ('yaks' Z, DECtalk S); doubled 'll' in 'yelled'",
  // Allophones the comparison with DECtalk's phoneme log could not see.
  "prosody-how-are-you": "'you' is DECtalk's one allophone YU; here Y UW",
  "function-for-you": "'you' is DECtalk's one allophone YU; here Y UW",
  "punct-question": "'you' is DECtalk's one allophone YU; here Y UW",
  "fric-vision": "'usual' has YU; the reduced vowel of 'vision' is IX in DECtalk, IH here",
  "g2p-yellow": "the dictionary marks 'yellow' to skip allophone rules (LL stays); here LX",
  "numbers-room-101": "'hundred': DECtalk keeps R and flaps the final D; here RR and D",
};

function loadCorpus(fileName: string): { corpus: OracleCorpusDocument; fixture: AllophoneFixture } {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", fileName), "utf8"),
  ) as OracleCorpusDocument;
  const fixture = JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        "test",
        "fixtures",
        "dectalk-oracle",
        `${corpus.corpusId}.durations.json`,
      ),
      "utf8",
    ),
  ) as AllophoneFixture;
  return { corpus, fixture };
}

function framesOfLeftSegments(track: readonly KlattFrame[]): string[] {
  const ordinals = new Map<string, number>();
  const violations: string[] = [];
  let latest = -1;
  let seenSegment = false;
  for (const frame of track) {
    if (frame.segmentId) seenSegment = true;
    const key = frame.segmentId ?? (seenSegment ? "edge:final" : "edge:initial");
    if (!ordinals.has(key)) ordinals.set(key, ordinals.size);
    const ordinal = ordinals.get(key) as number;
    if (ordinal < latest) {
      violations.push(`${(frame.time * 1000).toFixed(4)} ms ${frame.phoneme ?? "?"} (${key})`);
    } else {
      latest = ordinal;
    }
  }
  return violations;
}

function checkPhrase(
  corpus: OracleCorpusDocument,
  fixture: AllophoneFixture,
  id: string,
  text: string,
): void {
  const oracle = fixture.entries[id];
  if (!oracle) throw new Error(`E_ORACLE_FIXTURE_MISSING: ${id}`);
  if (oracle.text !== text) {
    throw new Error(`E_ORACLE_FIXTURE_STALE: ${id} fixture text '${oracle.text}' != '${text}'`);
  }
  const { track, utterance } = textToKlattTrackDetailed(
    text,
    undefined,
    corpus.defaults?.transitionMs ?? 30,
    { frontendId: "dectalk-english" },
  );
  expect(track.length).toBeGreaterThan(0);
  expect(framesOfLeftSegments(track)).toEqual([]);
  expect(qlattAllophoneClauses(utterance)).toEqual(recordedAllophoneClauses(oracle));
}

const loaded = CORPUS_FILES.map(loadCorpus);

describe("DECtalk oracle gate", () => {
  it("lists only corpus entries as known gaps", () => {
    const ids = new Set(loaded.flatMap(({ corpus }) => corpus.entries.map((entry) => entry.id)));
    expect(Object.keys(KNOWN_GAPS).filter((id) => !ids.has(id))).toEqual([]);
  });

  for (const { corpus, fixture } of loaded) {
    describe(corpus.corpusId, () => {
      it("has DECtalk's allophone record for every corpus entry and no strays", () => {
        expect(Object.keys(fixture.entries).sort()).toEqual(
          corpus.entries.map((entry) => entry.id).sort(),
        );
      });

      for (const entry of corpus.entries) {
        const gap = KNOWN_GAPS[entry.id];
        if (gap == null) {
          it(`${entry.id}: "${entry.text}" matches DECtalk's allophones with ordered frames`, () => {
            checkPhrase(corpus, fixture, entry.id, entry.text);
          });
        } else {
          it(`${entry.id}: "${entry.text}" is still a known gap (${gap})`, () => {
            expect(() => checkPhrase(corpus, fixture, entry.id, entry.text)).toThrow();
          });
        }
      }
    });
  }
});
