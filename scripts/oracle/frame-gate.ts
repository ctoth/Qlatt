// What the frame gate compares, shared by test/dectalk-frame-gate.test.ts and
// compare-frame-fixture.ts so the checked-in gap list and the test cannot
// disagree about what a gap is.
//
// For one corpus phrase: the dectalk-english track against DECtalk's packets
// (test/fixtures/dectalk-oracle/<corpus>.frames.json), each packet at its own
// start time. A phrase's gaps are the names of what does not match:
//   length    the track does not end where DECtalk's last packet ends
//   segments  some packet lies in a Segment that is not DECtalk's phone
//   F0 ... TLT  that parameter differs on some packet (frame-parameters.ts)
import fs from "node:fs";
import path from "node:path";
import { textToKlattTrackDetailed } from "../../src/tts-frontend";
import { DECTALK_NATIVE_SAMPLE_RATE_HZ, DECTALK_SAMPLES_PER_FRAME } from "./dectalk-trace";
import { decodeFrameFixtureEntry, type FrameFixture } from "./frame-fixture";
import {
  compareTrackToFrames,
  FRAME_PARAMETERS,
  type TrackComparison,
  type TrackEvent,
} from "./frame-parameters";
import type { OracleCorpusDocument } from "./types";

export const FRAME_GAP_NAMES: readonly string[] = [
  "length",
  "segments",
  ...FRAME_PARAMETERS.map((parameter) => parameter.label),
];

/** Phrase id to the sorted names of what does not match DECtalk yet. */
export type FrameGapList = Record<string, string[]>;

export type PhraseFrameResult = {
  comparison: TrackComparison;
  trackPackets: number;
  gaps: string[];
};

export function fixtureDirectory(repoRoot: string): string {
  return path.join(repoRoot, "test", "fixtures", "dectalk-oracle");
}

export function loadFrameFixture(repoRoot: string, corpusId: string): FrameFixture {
  return JSON.parse(
    fs.readFileSync(path.join(fixtureDirectory(repoRoot), `${corpusId}.frames.json`), "utf8"),
  ) as FrameFixture;
}

export function frameGapListPath(repoRoot: string, corpusId: string): string {
  return path.join(fixtureDirectory(repoRoot), `${corpusId}.frame-gaps.json`);
}

export function loadFrameGapList(repoRoot: string, corpusId: string): FrameGapList {
  return JSON.parse(fs.readFileSync(frameGapListPath(repoRoot, corpusId), "utf8")) as FrameGapList;
}

/**
 * dectalk-english's policy.rate.words_per_minute.unit: the frontend takes a
 * rate as a multiple of this many words per minute, a corpus entry names
 * words per minute.
 */
export const FRAME_GATE_REFERENCE_WPM = 180;

export function comparePhraseFrames(
  corpus: OracleCorpusDocument,
  fixture: FrameFixture,
  id: string,
  text: string,
): PhraseFrameResult {
  const recorded = fixture.entries[id];
  if (!recorded) throw new Error(`E_FRAME_FIXTURE_MISSING: ${id}`);
  if (recorded.text !== text) {
    throw new Error(`E_FRAME_FIXTURE_STALE: ${id} fixture text '${recorded.text}' != '${text}'`);
  }
  // The corpus's voice; without one the frontend's default, Paul. An entry
  // that names a speaking rate is spoken at it (the fixture was recorded with
  // `[:ra <rate>]`, export-frame-fixture.ts). The frontend takes a rate as a
  // multiple of its reference, 180 words per minute.
  const wordsPerMinute = corpus.entries.find((entry) => entry.id === id)?.rate;
  const { track } = textToKlattTrackDetailed(text, undefined, corpus.defaults?.transitionMs ?? 30, {
    frontendId: "dectalk-english",
    ...(corpus.defaults?.voiceId ? { speaker: corpus.defaults.voiceId } : {}),
    ...(wordsPerMinute === undefined ? {} : { rate: wordsPerMinute / FRAME_GATE_REFERENCE_WPM }),
  });
  const frames = decodeFrameFixtureEntry(recorded);
  const comparison = compareTrackToFrames(frames, track as readonly TrackEvent[]);
  const packetSec = DECTALK_SAMPLES_PER_FRAME / DECTALK_NATIVE_SAMPLE_RATE_HZ;
  const trackPackets = (track[track.length - 1]?.time ?? 0) / packetSec;
  const gaps: string[] = [];
  if (Math.abs(trackPackets - frames.length) > 1e-6) gaps.push("length");
  if (comparison.segmentLabelsDiffer > 0) gaps.push("segments");
  for (const parameter of FRAME_PARAMETERS) {
    if ((comparison.parameters[parameter.label]?.mismatched ?? 0) > 0) gaps.push(parameter.label);
  }
  return { comparison, trackPackets, gaps };
}
