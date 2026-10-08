#!/usr/bin/env node

/**
 * compare-dectalk-voices.ts
 * =========================
 * For every entry of a voice corpus: text to samples the way the page does it
 * (the dectalk-english frontend's track for the entry's voice, scheduled onto
 * the experiment the frontend is paired with, started 50 ms in), compared
 * sample for sample with the WAV the stock say.exe wrote for the same text
 * and voice. This is test/dectalk-vtm-frontend.test.ts's comparison, run over
 * a corpus and reported instead of asserted.
 *
 * The WAVs come from scripts/oracle/export-dectalk-vtm-fixture.ts:
 *   ... export-dectalk-vtm-fixture.ts \
 *     --corpus test/oracle-corpora/dectalk-us-voices-v1.json --out-dir <dir>
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-dectalk-voices.ts --fixture-dir <dir> \
 *     [--corpus test/oracle-corpora/dectalk-us-voices-v1.json] [--out report.json]
 *
 * Exit code 0 whatever the result: this measures, it does not gate.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FRAME_SAMPLES } from "../../src/dectalk-vtm-track.ts";
import {
  defaultExperimentFor,
  type FrontendManifest,
} from "../../src/experiments/frontend-pairing.ts";
import { textToKlattTrack } from "../../src/tts-frontend.ts";
import { renderDectalkVtmTrack, renderToInt16 } from "../rendering/dectalk-vtm-render.ts";
import { readWavInt16 } from "./dectalk-vtm-fixture.ts";
import type { OracleCorpusDocument } from "./types.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};

/** test/harness/runtime.js: `state.ctx.currentTime + 0.05`. */
const PAGE_START_DELAY_SEC = 0.05;
/**
 * say.exe's `[:ra 180]` is DECtalk's default rate, which is the frontend's
 * rate 1 (test/dectalk-vtm-frontend.test.ts). No other rate is mapped here.
 */
const DEFAULT_RATE_WPM = 180;

interface VoiceResult {
  id: string;
  voice: string;
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

const fixtureDirFlag = flag("fixture-dir");
if (!fixtureDirFlag) throw new Error("--fixture-dir is required");
const fixtureDir = path.resolve(fixtureDirFlag);
const corpusPath = path.resolve(
  flag("corpus") ?? path.join(repoRoot, "test", "oracle-corpora", "dectalk-us-voices-v1.json"),
);
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as OracleCorpusDocument;

const frontendManifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "public", "rules", "frontends", "manifest.json"), "utf8"),
) as FrontendManifest;
const experimentIds = (
  JSON.parse(
    fs.readFileSync(path.join(repoRoot, "public", "experiments", "manifest.json"), "utf8"),
  ) as { experiments: { id: string }[] }
).experiments.map((experiment) => experiment.id);

async function compare(entry: OracleCorpusDocument["entries"][number]): Promise<VoiceResult> {
  const voice = entry.voiceId ?? corpus.defaults?.voiceId ?? "paul";
  const frontendId = entry.frontendId ?? corpus.defaults?.frontendId ?? "dectalk-english";
  const oracle = readWavInt16(path.join(fixtureDir, `${entry.id}.wav`));
  const result: VoiceResult = {
    id: entry.id,
    voice,
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
    const rate = entry.rate ?? corpus.defaults?.rate ?? DEFAULT_RATE_WPM;
    if (rate !== DEFAULT_RATE_WPM) {
      throw new Error(`rate ${rate} is not ${DEFAULT_RATE_WPM}; no other rate is mapped`);
    }
    const experimentId = defaultExperimentFor(frontendId, frontendManifest, experimentIds);
    if (!experimentId) throw new Error(`frontend '${frontendId}' is paired with no experiment`);
    // test/harness/runtime.js speak(): rate 1, the selected voice.
    const track = textToKlattTrack(
      entry.text,
      undefined,
      entry.transitionMs ?? corpus.defaults?.transitionMs ?? 30,
      { frontendId, rate: 1, speaker: voice },
    );
    const render = await renderDectalkVtmTrack({
      repoRoot,
      track,
      sampleRate: oracle.sampleRate,
      frontendId,
      experimentId,
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

const results: VoiceResult[] = [];
for (const entry of corpus.entries) {
  const result = await compare(entry);
  results.push(result);
  const exact =
    !result.error &&
    result.samplesEqual === result.samplesOracle &&
    result.packetsRender === result.packetsOracle;
  console.log(
    `${result.id.padEnd(12)} ${result.voice.padEnd(7)} ` +
      `samples ${String(result.samplesEqual).padStart(6)}/${String(result.samplesOracle).padEnd(6)} ` +
      `packets ${String(result.packetsEqual).padStart(4)}/${String(result.packetsOracle).padEnd(4)} ` +
      `rendered ${String(result.packetsRender).padEnd(4)} ` +
      `first ${String(result.firstMismatch).padStart(6)} maxdiff ${String(result.maxAbsDifference).padStart(5)} ` +
      (exact ? "EXACT" : (result.error ?? "differs")) +
      (result.problems.length > 0 ? ` (${result.problems.length} render problems)` : ""),
  );
}

const outFlag = flag("out");
if (outFlag) {
  fs.writeFileSync(
    path.resolve(outFlag),
    `${JSON.stringify({ corpus: corpus.corpusId, fixtureDir, results }, null, 2)}\n`,
  );
}
