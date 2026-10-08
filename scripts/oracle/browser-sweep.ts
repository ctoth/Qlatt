#!/usr/bin/env node

/**
 * browser-sweep.ts
 * ================
 * A corpus of say.exe WAVs (default: the sweep gate's 101 texts, nine voices,
 * four rates) rendered from text in a real browser and compared with those
 * WAVs: the frontend, the F0 kernel, the dectalk-vtm worklet and its WASM as
 * Chrome or Edge runs them from a production build, where every other
 * measurement goes through Node.
 *
 * What is rendered. scripts/rendering/browser-session.ts builds the app for
 * production with the offline render page as a second entry, serves it with
 * `vite preview` on its own port, and drives the page in a headless browser.
 * Each text is one OfflineAudioContext with a fresh runtime, scheduled 50 ms
 * in as the page's Speak does. It is NOT the page's own AudioContext: that
 * one runs in real time, keeps one runtime from utterance to utterance and
 * has spoken a warm-up phrase first; none of that is measured here.
 *
 * What is compared, for each context rate:
 *   11025 Hz  DECtalk's own rate: the node does not resample. Every sample of
 *             the WAV against the render's, after the node's delay.
 *   other     The node resamples (windowed sinc), and an output instant that
 *             falls on a DECtalk sample returns that sample
 *             (crates/dectalk-vtm/src/resample.rs). At 48000 Hz that is every
 *             640th output sample, DECtalk's every 147th. Those are compared;
 *             the samples between them have no reference.
 * A text is exact when all of those are equal, the render has the WAV's
 * number of packets, and the node reported no warning or error.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/browser-sweep.ts [--corpus <list.json>] [--fixture-dir <dir>]
 *       [--rates 11025,48000] [--port 8817] [--server build|dev] [--base-f0 <Hz>]
 *       [--id <entry id>]... [--limit <n>] [--out <report.json>] [--verbose]
 *
 *   --port     the preview server's port on 127.0.0.1 (default 8817; 0 = any free)
 *   --server   "build" (default) or "dev", Vite's dev server
 *   --base-f0  a base F0 for the frontend, as a number in the page's "Base F0"
 *              box gives one (the box starts empty; it used to start at 110).
 *              Default: none, each voice's own.
 *
 * A text the browser does not render exactly is rendered again through Node
 * (scripts/oracle/dectalk-voice-compare.ts) so the table says whether the
 * browser differs from Node or both differ from say.exe.
 *
 * Needs Chrome or Edge (CHROME_PATH to name one). Exit code 0 whatever the
 * result: this measures, it does not gate.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DECTALK_SAMPLE_RATE, FRAME_SAMPLES } from "../../src/dectalk-vtm-track.ts";
import { openBrowserSession, payloadSamples } from "../rendering/browser-session.ts";
import {
  compareVoiceEntry,
  experimentFor,
  isExact,
  NEUTRAL_RATE_WPM,
  PAGE_START_DELAY_SEC,
  readVoiceCorpus,
} from "./dectalk-voice-compare.ts";
import { readWavInt16 } from "./dectalk-vtm-fixture.ts";
import { SWEEP_GATE_FIXTURE_DIR, SWEEP_GATE_LIST_PATH } from "./sweep-gate-list.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flags = (name: string): string[] =>
  argv.flatMap((arg, index) => (arg === `--${name}` ? [argv[index + 1] ?? ""] : []));
const flag = (name: string): string | undefined => flags(name)[0];

const corpusPath = path.resolve(flag("corpus") ?? path.join(repoRoot, SWEEP_GATE_LIST_PATH));
const fixtureDir = path.resolve(flag("fixture-dir") ?? path.join(repoRoot, SWEEP_GATE_FIXTURE_DIR));
const rates = (flag("rates") ?? "11025,48000").split(",").map(Number);
const port = Number(flag("port") ?? 8817);
const server = (flag("server") ?? "build") as "build" | "dev";
const verbose = argv.includes("--verbose");
// The frontend's base F0: none, so each voice keeps its own, as say.exe's
// voices have theirs and as the Node comparison renders; or a number of hertz.
// The page's Speak passes its "Base F0" box, 110 unless changed, and that
// replaces the voice's own (Paul's is 122): --base-f0 110 measures that.
const baseF0 = flag("base-f0") === undefined ? null : Number(flag("base-f0"));
const corpus = readVoiceCorpus(corpusPath);
const ids = flags("id");
const limit = flag("limit") ? Number(flag("limit")) : undefined;
const entries = corpus.entries
  .filter((entry) => ids.length === 0 || ids.includes(entry.id))
  .slice(0, limit);

/** Greatest common divisor, for the grid a rate shares with DECtalk's. */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

type Outcome = {
  id: string;
  voice: string;
  wpm: number;
  contextRate: number;
  /** Samples of the WAV that have a reference at this rate, and how many matched. */
  compared: number;
  equal: number;
  /** DECtalk sample index of the first difference, or -1. */
  firstMismatch: number;
  maxAbsDifference: number;
  packetsOracle: number;
  packetsRender: number;
  problems: string[];
  error?: string;
  renderMs: number;
  /** Set for a text that is not exact here: what Node makes of it. */
  node?: { exact: boolean; firstMismatch: number; packetsRender: number; error?: string };
};

const exact = (outcome: Outcome): boolean =>
  !outcome.error &&
  outcome.problems.length === 0 &&
  outcome.equal === outcome.compared &&
  outcome.packetsRender === outcome.packetsOracle;

const started = Date.now();
const log = (line: string) => {
  if (verbose) process.stderr.write(`${line}\n`);
};
const session = await openBrowserSession({
  repoRoot,
  engine: "runtime",
  server,
  ...(port > 0 ? { port } : {}),
  log,
});
const setupMs = Date.now() - started;
console.log(
  `${session.browserVersion}, ${server === "build" ? "production build" : "dev server"} at ${session.url}`,
);
console.log(
  `${path.relative(repoRoot, corpusPath)}: ${entries.length} texts against ${path.relative(repoRoot, fixtureDir)}`,
);

const outcomes: Outcome[] = [];
const rateMs = new Map<number, number>();
try {
  for (const contextRate of rates) {
    const rateStarted = Date.now();
    // An output sample falls on a DECtalk sample every `outStep` samples,
    // DECtalk's every `inStep`th: 1 and 1 at DECtalk's own rate.
    const common = gcd(contextRate, DECTALK_SAMPLE_RATE);
    const outStep = contextRate / common;
    const inStep = DECTALK_SAMPLE_RATE / common;
    for (const entry of entries) {
      const voice = entry.voiceId ?? corpus.defaults?.voiceId ?? "paul";
      const wpm = entry.rate ?? corpus.defaults?.rate ?? NEUTRAL_RATE_WPM;
      const frontendId = entry.frontendId ?? corpus.defaults?.frontendId ?? "dectalk-english";
      const oracle = readWavInt16(path.join(fixtureDir, `${entry.id}.wav`));
      const outcome: Outcome = {
        id: entry.id,
        voice,
        wpm,
        contextRate,
        compared: Math.ceil(oracle.samples.length / inStep),
        equal: 0,
        firstMismatch: -1,
        maxAbsDifference: 0,
        packetsOracle: oracle.samples.length / FRAME_SAMPLES,
        packetsRender: 0,
        problems: [],
        renderMs: 0,
      };
      const renderStarted = Date.now();
      try {
        const tailTime = 0.1;
        const payload = await session.render({
          phrase: entry.text,
          baseF0,
          frontendId,
          experimentId: experimentFor(frontendId),
          rate: wpm / NEUTRAL_RATE_WPM,
          speaker: voice,
          transitionMs: entry.transitionMs ?? corpus.defaults?.transitionMs ?? 30,
          sampleRate: contextRate,
          leadTime: PAGE_START_DELAY_SEC,
          tailTime,
          encodeSamples: "float32-base64",
        });
        const samples = payloadSamples(payload);
        const diagnostics = payload.diagnostics ?? [];
        outcome.problems = diagnostics
          .filter((diagnostic) => diagnostic.level !== "info")
          .map((diagnostic) => `${diagnostic.level}: ${diagnostic.message}`);
        const run = diagnostics.find((diagnostic) => diagnostic.code === "dectalk-vtm.run_started")
          ?.data as { startFrame?: unknown; delaySamples?: unknown } | undefined;
        if (typeof run?.startFrame !== "number" || typeof run.delaySamples !== "number") {
          throw new Error("The dectalk-vtm node did not report where its run started");
        }
        // The track ends where the run does; the render is that long plus
        // the lead and the tail, rounded up to a sample.
        const trackSec = payload.length / contextRate - PAGE_START_DELAY_SEC - tailTime;
        outcome.packetsRender = Math.round((trackSec * DECTALK_SAMPLE_RATE) / FRAME_SAMPLES);
        const first = run.startFrame + run.delaySamples;
        for (let index = 0; index < outcome.compared; index += 1) {
          const value = (samples[first + index * outStep] ?? Number.NaN) * 32768;
          const difference = Math.abs(value - (oracle.samples[index * inStep] as number));
          if (difference === 0) outcome.equal += 1;
          else {
            if (outcome.firstMismatch < 0) outcome.firstMismatch = index * inStep;
            if (!(difference <= outcome.maxAbsDifference)) outcome.maxAbsDifference = difference;
          }
        }
      } catch (error) {
        outcome.error = error instanceof Error ? error.message.split("\n")[0] : String(error);
      }
      outcome.renderMs = Date.now() - renderStarted;
      if (!exact(outcome)) {
        const node = await compareVoiceEntry(entry, corpus.defaults, fixtureDir);
        outcome.node = {
          exact: isExact(node),
          firstMismatch: node.firstMismatch,
          packetsRender: node.packetsRender,
          ...(node.error ? { error: node.error } : {}),
        };
      }
      outcomes.push(outcome);
      log(
        `${contextRate.toString()} ${entry.id} ${outcome.equal.toString()}/${outcome.compared.toString()} ` +
          `${exact(outcome) ? "EXACT" : "differs"} ${outcome.renderMs.toString()} ms`,
      );
    }
    rateMs.set(contextRate, Date.now() - rateStarted);
  }
} finally {
  await session.close();
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
console.log("");
console.log("context rate  exact  total  samples compared  time");
for (const contextRate of rates) {
  const at = outcomes.filter((outcome) => outcome.contextRate === contextRate);
  const compared = at.reduce((sum, outcome) => sum + outcome.compared, 0);
  console.log(
    `${`${contextRate.toString()} Hz`.padEnd(12)}  ${at.filter(exact).length.toString().padStart(5)}  ` +
      `${at.length.toString().padStart(5)}  ${compared.toString().padStart(16)}  ` +
      seconds(rateMs.get(contextRate) ?? 0),
  );
}
const misses = outcomes.filter((outcome) => !exact(outcome));
if (misses.length > 0) {
  console.log("");
  console.log("not exact in the browser:");
  for (const miss of misses) {
    const node = miss.node
      ? miss.node.exact
        ? "Node: exact"
        : `Node: differs too (first ${miss.node.firstMismatch.toString()}, ${miss.node.packetsRender.toString()} packets${miss.node.error ? `, ${miss.node.error}` : ""})`
      : "";
    console.log(
      `  ${miss.contextRate.toString()} Hz ${miss.id} (${miss.voice}, ${miss.wpm.toString()}): ` +
        `${miss.equal.toString()} of ${miss.compared.toString()} equal, first differing DECtalk sample ` +
        `${miss.firstMismatch.toString()}, largest difference ${miss.maxAbsDifference.toString()}, ` +
        `${miss.packetsRender.toString()} packets against ${miss.packetsOracle.toString()}` +
        `${miss.problems.length > 0 ? `, ${miss.problems.join("; ")}` : ""}` +
        `${miss.error ? `, ${miss.error}` : ""}. ${node}`,
    );
  }
}
console.log("");
console.log(
  `build, server and browser start ${seconds(setupMs)}; whole run ${seconds(Date.now() - started)}`,
);

const out = flag("out");
if (out) {
  fs.writeFileSync(
    path.resolve(out),
    `${JSON.stringify({ corpus: corpus.corpusId, browser: session.browserVersion, server, url: session.url, outcomes }, null, 2)}\n`,
  );
}
