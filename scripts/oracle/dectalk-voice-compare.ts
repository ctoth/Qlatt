/**
 * Text to samples the way the page does it, compared with the stock say.exe:
 * the dectalk-english frontend's track for a voice, scheduled onto the
 * experiment the frontend is paired with and started the page's lead in, against the WAV
 * say.exe wrote for `[:n<voice>] [:ra <rate>] <text>`
 * (scripts/oracle/export-dectalk-vtm-fixture.ts --corpus).
 *
 * Shared by scripts/oracle/compare-dectalk-voices.ts, which reports, and
 * test/dectalk-voices-exact.test.ts, which asserts.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FRAME_SAMPLES } from "../../src/dectalk-vtm-track.ts";
import {
  defaultExperimentFor,
  type FrontendManifest,
} from "../../src/experiments/frontend-pairing.ts";
import { PLAYBACK_LEAD_SEC } from "../../src/track-playback.ts";
import { textToKlattTrack } from "../../src/tts-frontend.ts";
import { renderDectalkVtmTrack, renderToInt16 } from "../rendering/dectalk-vtm-render.ts";
import { readWavInt16 } from "./dectalk-vtm-fixture.ts";
import type { OracleCorpusDocument, OracleCorpusEntry } from "./types.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The page starts a track this long after the time its context is held at (src/track-playback.ts). */
export const PAGE_START_DELAY_SEC = PLAYBACK_LEAD_SEC;
/**
 * say.exe's `[:ra 180]` is DECtalk's default rate and the frontend's rate 1
 * (test/dectalk-vtm-frontend.test.ts). Another rate is given to the frontend
 * as words per minute over 180, which is how the frontend's rate is defined
 * (a multiplier of the neutral rate; dectalk-english frontend.yaml,
 * `rate_reference`). Whether the frontend then does what DECtalk does at that
 * rate is what the comparison measures.
 */
export const NEUTRAL_RATE_WPM = 180;

export interface VoiceResult {
  id: string;
  voice: string;
  rate: number;
  text: string;
  /** Packets (71-sample frames) in the say.exe WAV and in the render. */
  packetsOracle: number;
  packetsRender: number;
  samplesOracle: number;
  /** Samples equal, over the samples both have. */
  samplesEqual: number;
  /** Whole packets with every sample equal. */
  packetsEqual: number;
  firstMismatch: number;
  maxAbsDifference: number;
  /** Warnings and errors the render reported. */
  problems: string[];
  error?: string;
}

/** Every sample of the say.exe WAV reproduced, in a render of the same length, without complaint. */
export function isExact(result: VoiceResult): boolean {
  return (
    !result.error &&
    result.problems.length === 0 &&
    result.packetsRender === result.packetsOracle &&
    result.samplesEqual === result.samplesOracle
  );
}

export function readVoiceCorpus(corpusPath: string): OracleCorpusDocument {
  return JSON.parse(fs.readFileSync(corpusPath, "utf8")) as OracleCorpusDocument;
}

let pairing: { manifest: FrontendManifest; experimentIds: string[] } | undefined;

/** The experiment the page pairs a frontend with. */
export function experimentFor(frontendId: string): string {
  pairing ??= {
    manifest: JSON.parse(
      fs.readFileSync(path.join(repoRoot, "public", "rules", "frontends", "manifest.json"), "utf8"),
    ) as FrontendManifest,
    experimentIds: (
      JSON.parse(
        fs.readFileSync(path.join(repoRoot, "public", "experiments", "manifest.json"), "utf8"),
      ) as { experiments: { id: string }[] }
    ).experiments.map((experiment) => experiment.id),
  };
  const experimentId = defaultExperimentFor(frontendId, pairing.manifest, pairing.experimentIds);
  if (!experimentId) throw new Error(`frontend '${frontendId}' is paired with no experiment`);
  return experimentId;
}

/** Render one corpus entry from text and count the samples equal to `<fixtureDir>/<id>.wav`. */
export async function compareVoiceEntry(
  entry: OracleCorpusEntry,
  defaults: OracleCorpusDocument["defaults"],
  fixtureDir: string,
): Promise<VoiceResult> {
  const voice = entry.voiceId ?? defaults?.voiceId ?? "paul";
  const rate = entry.rate ?? defaults?.rate ?? NEUTRAL_RATE_WPM;
  const frontendId = entry.frontendId ?? defaults?.frontendId ?? "dectalk-english";
  const oracle = readWavInt16(path.join(fixtureDir, `${entry.id}.wav`));
  const result: VoiceResult = {
    id: entry.id,
    voice,
    rate,
    text: entry.text,
    packetsOracle: oracle.samples.length / FRAME_SAMPLES,
    packetsRender: 0,
    samplesOracle: oracle.samples.length,
    samplesEqual: 0,
    packetsEqual: 0,
    firstMismatch: -1,
    maxAbsDifference: 0,
    problems: [],
  };
  try {
    // test/harness/runtime.js speak(): the rate multiplier and the selected voice.
    const track = textToKlattTrack(
      entry.text,
      undefined,
      entry.transitionMs ?? defaults?.transitionMs ?? 30,
      { frontendId, rate: rate / NEUTRAL_RATE_WPM, speaker: voice },
    );
    const render = await renderDectalkVtmTrack({
      repoRoot,
      track,
      sampleRate: oracle.sampleRate,
      frontendId,
      experimentId: experimentFor(frontendId),
      startTime: PAGE_START_DELAY_SEC,
    });
    result.problems = render.diagnostics
      .filter((diagnostic) => diagnostic.level !== "info")
      .map((diagnostic) => `${diagnostic.level}: ${diagnostic.message}`);
    result.packetsRender = render.frames;
    const samples = renderToInt16(render);
    const shared = Math.min(samples.length, oracle.samples.length);
    let packetEqual = true;
    for (let i = 0; i < shared; i += 1) {
      const difference = Math.abs(samples[i] - oracle.samples[i]);
      if (difference === 0) result.samplesEqual += 1;
      else {
        packetEqual = false;
        if (result.firstMismatch < 0) result.firstMismatch = i;
        if (difference > result.maxAbsDifference) result.maxAbsDifference = difference;
      }
      if ((i + 1) % FRAME_SAMPLES === 0) {
        if (packetEqual) result.packetsEqual += 1;
        packetEqual = true;
      }
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  return result;
}
