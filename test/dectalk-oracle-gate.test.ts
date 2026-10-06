/**
 * DECtalk oracle gate (layer L0 of goal.md, plus track well-formedness).
 *
 * For every phrase of every oracle corpus, without rendering audio and without
 * say.exe:
 *   1. the dectalk-english frontend produces a track,
 *   2. its phoneme sequence equals DECtalk 4.63's own phoneme log for the
 *      phrase (fixtures: test/fixtures/dectalk-oracle/, regenerate with
 *      scripts/oracle/export-phoneme-fixture.ts),
 *   3. no frame belongs to a Segment that has already ended.
 *
 * dectalk-us-v1 is the corpus the rules were developed against.
 * dectalk-us-heldout-v1 holds neighbours of its words that no rule was fitted
 * to; a rule that only works for the first corpus shows up as a gap here.
 *
 * KNOWN_GAPS is a ratchet, not an allow-list: each listed phrase must still
 * fail, so fixing one forces its removal here. A phrase may never be added to
 * make a regression in a rule pass. The one legitimate way in is the removal
 * of a hardcoded exception that was making the phrase pass for the wrong
 * reason; the entry then names the general rule that is missing.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractQlattSymbolic, parseDectalkUsPhonemeLog } from "../scripts/oracle/symbolic";
import type { OracleCorpusDocument } from "../scripts/oracle/types";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

type PhonemeFixture = { entries: Record<string, { text: string; phonemeLog: string }> };

const repoRoot = path.resolve(__dirname, "..");
const CORPUS_FILES = ["dectalk-us-v1.json", "dectalk-us-heldout-v1.json"];

const KNOWN_GAPS: Readonly<Record<string, string>> = {
  "stops-pat-tapped": "the /t t/ across 'Pat tapped' is not merged into one stop",
  "held-cape": "silent e: 'cape' gives AE, DECtalk EY",
  "held-coke": "silent e: 'coke' gives AA, DECtalk OW",
  // The next four passed only through whole-word letter-to-sound entries
  // copied from DECtalk's log for these exact phrases. Those entries are gone.
  "stops-big-dog": "'-ed' after voiceless /k/: 'barked' ends in D, DECtalk T",
  "fric-safe-zone": "silent e before plural '-s': 'zones' gives AA N EH Z, DECtalk OW N Z",
  "liquid-red-lorry": "plural '-ies': 'lorries' ends in R Z, DECtalk IY Z",
  "glide-young-yard": "'-s' after voiceless /k/ ('yaks' Z, DECtalk S); doubled 'll' in 'yelled'",
};

function loadCorpus(fileName: string): { corpus: OracleCorpusDocument; fixture: PhonemeFixture } {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", fileName), "utf8"),
  ) as OracleCorpusDocument;
  const fixture = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "test", "fixtures", "dectalk-oracle", `${corpus.corpusId}.phonemes.json`),
      "utf8",
    ),
  ) as PhonemeFixture;
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
  fixture: PhonemeFixture,
  id: string,
  text: string,
): void {
  const oracle = fixture.entries[id];
  if (!oracle) throw new Error(`E_ORACLE_FIXTURE_MISSING: ${id}`);
  if (oracle.text !== text) {
    throw new Error(`E_ORACLE_FIXTURE_STALE: ${id} fixture text '${oracle.text}' != '${text}'`);
  }
  const { track } = textToKlattTrackDetailed(text, undefined, corpus.defaults?.transitionMs ?? 30, {
    frontendId: "dectalk-english",
  });
  expect(track.length).toBeGreaterThan(0);
  expect(framesOfLeftSegments(track)).toEqual([]);
  expect(extractQlattSymbolic({ track }).comparisonTokens).toEqual(
    parseDectalkUsPhonemeLog(oracle.phonemeLog).comparisonTokens,
  );
}

const loaded = CORPUS_FILES.map(loadCorpus);

describe("DECtalk oracle gate", () => {
  it("lists only corpus entries as known gaps", () => {
    const ids = new Set(loaded.flatMap(({ corpus }) => corpus.entries.map((entry) => entry.id)));
    expect(Object.keys(KNOWN_GAPS).filter((id) => !ids.has(id))).toEqual([]);
  });

  for (const { corpus, fixture } of loaded) {
    describe(corpus.corpusId, () => {
      it("has a DECtalk phoneme log for every corpus entry and no strays", () => {
        expect(Object.keys(fixture.entries).sort()).toEqual(
          corpus.entries.map((entry) => entry.id).sort(),
        );
      });

      for (const entry of corpus.entries) {
        const gap = KNOWN_GAPS[entry.id];
        if (gap == null) {
          it(`${entry.id}: "${entry.text}" matches DECtalk's phonemes with ordered frames`, () => {
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
