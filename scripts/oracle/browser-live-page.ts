/**
 * browser-live-page.ts
 * ====================
 * The page itself, driven as a user drives it, compared with say.exe's WAVs:
 * scripts/oracle/browser-sweep.ts --live.
 *
 * The app's own page (index.html, from a production build) is opened with
 * `?tap=1` in a headless Chrome or Edge. Playwright selects the frontend and
 * the voice, types the text and clicks Speak, as real input events; the
 * page's diagnostic tap (test/harness/tap.js) records what leaves the graph's
 * output in the page's real-time AudioContext, and the dectalk-vtm node's own
 * reports say when a run started and ended.
 *
 * What is compared. The context runs at the device's rate, so the node
 * resamples; an output instant that falls on a DECtalk sample returns that
 * sample (crates/dectalk-vtm/src/resample.rs), and those are compared with the
 * WAV (at 48000 Hz every 640th output sample, DECtalk's every 147th). A run's
 * first DECtalk sample is `delaySamples` after the context frame at which the
 * run started.
 *
 * Where a run started. The node reports its start in samples it has produced
 * (`startFrame`), which is the context frame less a constant K, the frame at
 * which the node began. Speak schedules a run at `ctx.currentTime + 0.05`; a
 * run that starts on time has `scheduled frame - startFrame` equal to K, and
 * one that starts late has less. K is taken as the largest such difference
 * among the runs of a page, and a run's lateness is K less its own. (If every
 * run of a page were late, K and every lateness would be understated by the
 * least of them.) Runs are compared at the frame they really started.
 *
 * Real-time capture. The tap posts every 128-frame block with the context
 * frame it starts at, and each block is placed at its frame. A block that is
 * missing or repeated is a step that is not 128; such steps are counted, the
 * ones inside a run's samples apart from the rest, and a run with one inside
 * it is not called exact.
 *
 * The Base F0 box. Speak passes it to the frontend, where it replaces the
 * voice's own base F0, and an empty box is 110 Hz. The driver therefore sets
 * the box to the selected voice's own base F0 (speakers/<voice>.yaml), which
 * gives the frontend's track for that voice unchanged.
 *
 * The rate slider moves in steps of 0.05 and cannot be set to 100, 140 or 260
 * words a minute; every text here is at 180.
 */

import fs from "node:fs";
import path from "node:path";
import type { Page } from "playwright-core";
import { DECTALK_SAMPLE_RATE, FRAME_SAMPLES } from "../../src/dectalk-vtm-track.ts";
import { openServedBrowser } from "../rendering/browser-session.ts";
import { readWavInt16 } from "./dectalk-vtm-fixture.ts";
import type { OracleCorpusDocument, OracleCorpusEntry } from "./types.ts";

type TapEvent = {
  level: string;
  code?: string;
  message: string;
  data?: Record<string, unknown>;
  contextTime: number;
};
type Tap = {
  sampleRate: number;
  firstFrame: number | null;
  frames: number;
  gaps: { block: number; after: number; frame: number }[];
  samplesBase64: string;
  events: TapEvent[];
};

export type LiveRow = {
  scene: string;
  step: string;
  id: string;
  voice: string;
  contextRate: number;
  compared: number;
  equal: number;
  /** DECtalk sample index of the first difference, or -1. */
  firstMismatch: number;
  packetsOracle: number;
  /** Frames the node said the run had when it ended, or -1 if it reported none. */
  packetsRun: number;
  endReason: string;
  /** Context frames the run started after the frame Speak scheduled; null if no run. */
  lateFrames: number | null;
  /** Steps that are not 128 between recorded blocks: inside the run's samples, and elsewhere. */
  gapsInRun: number;
  gapsElsewhere: number;
  problems: string[];
  exact: boolean;
  note?: string;
};

type Pending = {
  scene: string;
  steps: string[];
  items: OracleCorpusEntry[];
  /** Context time Speak scheduled each item at. */
  starts: number[];
  tap: Tap;
  note?: string;
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function tapSamples(tap: Tap): Float32Array {
  const bytes = Uint8Array.from(Buffer.from(tap.samplesBase64, "base64"));
  return new Float32Array(bytes.buffer, 0, bytes.byteLength / 4);
}

function voiceBaseF0(repoRoot: string, voice: string): number {
  const file = path.join(
    repoRoot,
    "public",
    "rules",
    "frontends",
    "dectalk-english",
    "speakers",
    `${voice}.yaml`,
  );
  const match = /^base_f0_hz:\s*(\d+)/mu.exec(fs.readFileSync(file, "utf8"));
  if (!match) throw new Error(`${file}: no base_f0_hz`);
  return Number(match[1]);
}

const scheduledFrameOf = (time: number, sampleRate: number) => Math.ceil(time * sampleRate - 1e-6);
const runsOf = (tap: Tap) => tap.events.filter((event) => event.code === "dectalk-vtm.run_started");

export async function runLivePage(options: {
  repoRoot: string;
  corpus: OracleCorpusDocument;
  fixtureDir: string;
  port: number;
  server: "build" | "dev";
  log: (line: string) => void;
}): Promise<{ rows: LiveRow[]; browserVersion: string; url: string; seconds: number }> {
  const { repoRoot, corpus, fixtureDir, log } = options;
  const started = Date.now();
  const entry = (id: string): OracleCorpusEntry => {
    const found = corpus.entries.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`The corpus has no entry ${id}`);
    if ((found.rate ?? corpus.defaults?.rate ?? 180) !== 180) {
      throw new Error(`${id} is not at 180 words a minute, the only rate the page's slider gives`);
    }
    return found;
  };
  // Texts of the gate list at 180 words a minute: a word, a sentence, a
  // Betty sentence, and a paragraph whose clauses carry state to one another.
  const word = entry("v1--one-word-003");
  const sentence = entry("v1--repo-003");
  const betty = corpus.entries.find(
    (candidate) => candidate.voiceId === "betty" && (candidate.rate ?? 180) === 180,
  );
  const paragraph = corpus.entries.find((candidate) => candidate.id.startsWith("para--"));
  if (!betty || !paragraph) throw new Error("The corpus lacks a Betty entry or a paragraph at 180");

  const served = await openServedBrowser({
    repoRoot,
    engine: "runtime",
    server: options.server,
    ...(options.port > 0 ? { port: options.port } : {}),
    log,
  });
  const url = `${served.origin}/?tap=1`;
  const rows: LiveRow[] = [];
  let pending: Pending[] = [];
  const oracleOf = (item: OracleCorpusEntry) =>
    readWavInt16(path.join(fixtureDir, `${item.id}.wav`)).samples;
  const seconds = (item: OracleCorpusEntry) => oracleOf(item).length / DECTALK_SAMPLE_RATE;

  /** Judge the recordings of one page, once all its runs are known. */
  const judgePage = () => {
    // K: the largest `scheduled frame - startFrame` among the page's runs.
    let k = Number.NEGATIVE_INFINITY;
    for (const record of pending) {
      const runs = runsOf(record.tap);
      // With fewer runs than Speaks only the first run is known to be the first Speak's.
      const known = runs.length === record.items.length ? runs : runs.slice(0, 1);
      known.forEach((run, index) => {
        const nodeStart = Number(run.data?.startFrame);
        const scheduled = scheduledFrameOf(record.starts[index] as number, record.tap.sampleRate);
        if (Number.isFinite(nodeStart)) k = Math.max(k, scheduled - nodeStart);
      });
    }
    for (const record of pending) {
      const { tap } = record;
      const samples = tapSamples(tap);
      const runs = runsOf(tap);
      const ends = tap.events.filter((event) => event.code === "dectalk-vtm.run_ended");
      const problems = tap.events
        .filter((event) => event.level !== "info")
        .map((event) => `${event.level}: ${event.message}`);
      const common = gcd(tap.sampleRate, DECTALK_SAMPLE_RATE);
      const outStep = tap.sampleRate / common;
      const inStep = DECTALK_SAMPLE_RATE / common;
      record.items.forEach((item, index) => {
        const oracle = oracleOf(item);
        const oneEach = runs.length === record.items.length;
        // The k-th Speak is the k-th run the node started, when it started one
        // for each. With fewer runs, the first Speak has the first run and
        // the later ones have none of their own.
        const run = oneEach ? runs[index] : index === 0 ? runs[0] : undefined;
        const end = oneEach ? ends[index] : ends[ends.length - 1];
        const nodeStart = Number(run?.data?.startFrame);
        const delay = Number(run?.data?.delaySamples);
        const scheduled = scheduledFrameOf(record.starts[index] as number, tap.sampleRate);
        const compared = Math.ceil(oracle.length / inStep);
        let equal = 0;
        let firstMismatch = -1;
        let lateFrames: number | null = null;
        let gapsInRun = 0;
        if (run && Number.isFinite(nodeStart) && Number.isFinite(delay) && Number.isFinite(k)) {
          const startFrame = nodeStart + k;
          lateFrames = startFrame - scheduled;
          const first = startFrame + delay - (tap.firstFrame ?? 0);
          for (let i = 0; i < compared; i += 1) {
            const value = (samples[first + i * outStep] ?? Number.NaN) * 32768;
            if (value === oracle[i * inStep]) equal += 1;
            else if (firstMismatch < 0) firstMismatch = i * inStep;
          }
          const lastFrame = startFrame + delay + compared * outStep;
          gapsInRun = tap.gaps.filter(
            (gap) => gap.frame > startFrame && gap.after < lastFrame,
          ).length;
        } else {
          firstMismatch = 0;
        }
        const packetsOracle = oracle.length / FRAME_SAMPLES;
        const packetsRun = Number(end?.data?.frames ?? -1);
        rows.push({
          scene: record.scene,
          step: record.steps[index] as string,
          id: item.id,
          voice: item.voiceId ?? "paul",
          contextRate: tap.sampleRate,
          compared,
          equal,
          firstMismatch,
          packetsOracle,
          packetsRun,
          endReason: String(end?.data?.reason ?? "no run_ended"),
          lateFrames,
          gapsInRun,
          gapsElsewhere: tap.gaps.length - gapsInRun,
          problems,
          exact:
            equal === compared &&
            packetsRun === packetsOracle &&
            gapsInRun === 0 &&
            problems.length === 0,
          note:
            [
              oneEach
                ? ""
                : `the node started ${runs.length.toString()} run(s) for ${record.items.length.toString()} Speak(s), ` +
                  `this one scheduled at frame ${scheduled.toString()}`,
              record.note ?? "",
            ]
              .filter(Boolean)
              .join("; ") || undefined,
        });
      });
    }
    pending = [];
  };

  try {
    const openPage = async (): Promise<Page> => {
      const page = await served.browser.newPage();
      page.setDefaultTimeout(120000);
      page.on("console", (message) => {
        if (message.type() === "error") log(`[page:error] ${message.text()}`);
      });
      page.on("pageerror", (error) => log(`[page:pageerror] ${error.message}`));
      await page.goto(url, { waitUntil: "load" });
      await page.selectOption("#frontendSelect", "dectalk-english");
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll("#speakerSelect option")).some(
            (option) => (option as HTMLOptionElement).value === "paul",
          ),
        { timeout: 120000 },
      );
      return page;
    };
    const setUp = async (page: Page, item: OracleCorpusEntry) => {
      const voice = item.voiceId ?? "paul";
      await page.selectOption("#speakerSelect", voice);
      await page.fill("#baseF0", String(voiceBaseF0(repoRoot, voice)));
      await page.fill("#phrase", item.text);
    };
    const count = (page: Page, code: string): Promise<number> =>
      page.evaluate((wanted) => {
        const tap = (window as unknown as { __qlattTap: { status(): { events: TapEvent[] } } })
          .__qlattTap;
        return tap.status().events.filter((event) => event.code === wanted).length;
      }, code);
    const scheduledStart = (page: Page): Promise<number> =>
      page.evaluate(
        () => (window as unknown as { __qlatt: { runStartTime: number } }).__qlatt.runStartTime,
      );
    const waitFor = async (
      page: Page,
      code: string,
      wanted: number,
      timeoutMs: number,
    ): Promise<boolean> => {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        if ((await count(page, code)) >= wanted) return true;
        await page.waitForTimeout(50);
      }
      return false;
    };
    const take = async (page: Page): Promise<Tap> => {
      // The last blocks are still on their way from the audio thread.
      await page.waitForTimeout(300);
      return page.evaluate(() =>
        (window as unknown as { __qlattTap: { take(): Tap } }).__qlattTap.take(),
      );
    };
    const begin = (page: Page) =>
      page.evaluate(() =>
        (window as unknown as { __qlattTap: { begin(): void } }).__qlattTap.begin(),
      );

    /** One Speak, recorded from the click to the node's run_ended. */
    const speakOnce = async (page: Page, scene: string, step: string, item: OracleCorpusEntry) => {
      await setUp(page, item);
      await begin(page);
      await page.click("#speakBtn");
      const ended = await waitFor(page, "dectalk-vtm.run_ended", 1, seconds(item) * 1000 + 30000);
      const start = await scheduledStart(page);
      pending.push({
        scene,
        steps: [step],
        items: [item],
        starts: [start],
        tap: await take(page),
        ...(ended ? {} : { note: "timed out waiting for run_ended" }),
      });
      log(`${scene}: ${step} done`);
    };

    /** A Speak, something done 600 ms into it, and a second Speak; one recording. */
    const speakTwice = async (
      scene: string,
      steps: string[],
      between: (page: Page) => Promise<void>,
    ) => {
      const page = await openPage();
      await setUp(page, sentence);
      await begin(page);
      await page.click("#speakBtn");
      await waitFor(page, "dectalk-vtm.run_started", 1, 60000);
      const firstStart = await scheduledStart(page);
      await page.waitForTimeout(600);
      await between(page);
      await setUp(page, word);
      await page.click("#speakBtn");
      await page.waitForTimeout(200);
      const secondStart = await scheduledStart(page);
      const ended = await waitFor(
        page,
        "dectalk-vtm.run_ended",
        2,
        (seconds(sentence) + seconds(word)) * 1000 + 8000,
      );
      pending.push({
        scene,
        steps,
        items: [sentence, word],
        starts: [firstStart, secondStart],
        tap: await take(page),
        ...(ended ? {} : { note: "two runs had not ended when the wait ran out" }),
      });
      judgePage();
      await page.close();
      log(`${scene} done`);
    };

    // Scene 1: one page, Speak after Speak.
    const page = await openPage();
    const sequence = "consecutive Speaks";
    await speakOnce(page, sequence, "(1) first Speak after load", word);
    await speakOnce(page, sequence, "(2) the same text again", word);
    await speakOnce(page, sequence, "(3) a different text after it", sentence);
    await speakOnce(page, sequence, "(3) a paragraph after it", paragraph);
    await speakOnce(page, sequence, "(2) the paragraph again", paragraph);
    await speakOnce(page, sequence, "(4) another voice", betty);
    await speakOnce(page, sequence, "(4) back to the first voice", word);
    judgePage();
    await page.close();

    // Scene 2: Speak pressed again while speaking.
    await speakTwice(
      "Speak again while speaking",
      ["(5) the interrupted text", "(5) the text spoken over it"],
      async () => {},
    );
    // Scene 3: Stop Audio while speaking, then Speak.
    await speakTwice(
      "Stop Audio while speaking, then Speak",
      ["(5) the stopped text", "(5) the text spoken after Stop"],
      async (scenePage) => {
        await scenePage.click("#stopBtn");
        await scenePage.waitForTimeout(500);
      },
    );

    return {
      rows,
      browserVersion: served.browser.version(),
      url,
      seconds: (Date.now() - started) / 1000,
    };
  } finally {
    await served.close();
  }
}
