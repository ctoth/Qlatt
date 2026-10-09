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
 * run started. A text that was meant to be cut short (another Speak, or Stop,
 * came while it was speaking) is compared up to the packet at which its run
 * ended, and is exact when it is DECtalk's that far and its run did end early.
 *
 * Where a run started. The node reports its start in samples it has produced
 * (`startFrame`), which is the context frame less a constant K, the frame at
 * which the node began. Speak schedules a run a lead after the context's
 * time; a run that starts on time has `scheduled frame - startFrame` equal to
 * K, and one that starts late has less. K is taken as the largest such
 * difference among the runs of a page, and a run's lateness is K less its
 * own. (If every run of a page were late, K and every lateness would be
 * understated by the least of them.) Runs are compared at the frame they
 * really started.
 *
 * From the click to the first sample. The page notes `performance.now()` in
 * the Speak button's click event; when the run has ended the context's time
 * and `performance.now()` are read together, which places the run's first
 * DECtalk sample on the same clock. The context's time moves a render block
 * at a time, so the figure is good to a few milliseconds.
 *
 * Real-time capture. The tap posts every 128-frame block with the context
 * frame it starts at, and each block is placed at its frame. A block that is
 * missing or repeated is a step that is not 128; such steps are counted, the
 * ones inside a run's samples apart from the rest, and a run with one inside
 * it is not called exact.
 *
 * Known, not explained (2026-10-08): in about one live run of ten the row
 * "the text spoken over, up to where it was cut" was not exact, with 122 of
 * 123 grid samples equal, the difference in the last packets before the cut,
 * and one such step inside the run. The page holds its context when the
 * second Speak arrives, so the step may be the capture losing a block there
 * and not a wrong sample; that has not been established. If it recurs, look
 * at the step's frame against the run's last frames before anything else.
 *
 * The Base F0 box. A number in it replaces the voice's own base F0; the box
 * starts empty, and the driver leaves it as the page has it, so each voice
 * speaks at its own.
 *
 * The rate slider moves in steps of 0.05 and cannot be set to 100, 140 or 260
 * words a minute; every text here is at 180.
 */

import path from "node:path";
import type { Page } from "playwright-core";
import { DECTALK_SAMPLE_RATE, FRAME_SAMPLES } from "../../src/dectalk-vtm-track.ts";
import { openServedBrowser } from "../rendering/browser-session.ts";
import { readVoiceCorpus } from "./dectalk-voice-compare.ts";
import { readWavInt16 } from "./dectalk-vtm-fixture.ts";
import type { OracleCorpusDocument, OracleCorpusEntry } from "./types.ts";

/** A text too long for the gate's budget, with its say.exe WAV: 33 s. */
export const LIVE_PAGE_LIST_PATH = path.join(
  "test",
  "oracle-corpora",
  "dectalk-us-live-page-v1.json",
);
export const LIVE_PAGE_FIXTURE_DIR = path.join("test", "fixtures", "dectalk-live-page");

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
/** `performance.now()` at the click, and the context's time read with `performance.now()` later. */
type Clock = {
  clickAt: number | null;
  contextTime: number;
  performanceTime: number;
  /** The page's own stage times for the Speak (test/harness/runtime.js, stageTimer). */
  stagesMs: Record<string, number> | null;
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
  /** True for a text that was meant to be cut short; compared up to `packetsRun`. */
  cut: boolean;
  endReason: string;
  /** Context frames the run started after the frame Speak scheduled; null if no run. */
  lateFrames: number | null;
  /** Milliseconds from the Speak click to the run's first DECtalk sample; null if not timed. */
  clickToFirstSampleMs: number | null;
  /** Where the page says the Speak spent its time before the run was scheduled; null if not timed. */
  stagesMs: Record<string, number> | null;
  /** Steps that are not 128 between recorded blocks: inside the run's samples, and elsewhere. */
  gapsInRun: number;
  gapsElsewhere: number;
  problems: string[];
  exact: boolean;
  note?: string;
};

type Item = { entry: OracleCorpusEntry; fixtureDir: string; cut?: boolean };
type Pending = {
  scene: string;
  steps: string[];
  items: Item[];
  /** Context time Speak scheduled each item at. */
  starts: number[];
  tap: Tap;
  /** For the first item only. */
  clock?: Clock;
  note?: string;
};

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function tapSamples(tap: Tap): Float32Array {
  const bytes = Uint8Array.from(Buffer.from(tap.samplesBase64, "base64"));
  return new Float32Array(bytes.buffer, 0, bytes.byteLength / 4);
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
  const item = (id: string): Item => {
    const found = corpus.entries.find((candidate) => candidate.id === id);
    if (!found) throw new Error(`The corpus has no entry ${id}`);
    if ((found.rate ?? corpus.defaults?.rate ?? 180) !== 180) {
      throw new Error(`${id} is not at 180 words a minute, the only rate the page's slider gives`);
    }
    return { entry: found, fixtureDir };
  };
  // Texts of the gate list at 180 words a minute: a word, a sentence, a
  // Betty sentence, and a paragraph whose clauses carry state to one another.
  const word = item("v1--one-word-003");
  const sentence = item("v1--repo-003");
  const bettyEntry = corpus.entries.find(
    (candidate) => candidate.voiceId === "betty" && (candidate.rate ?? 180) === 180,
  );
  const paragraphEntry = corpus.entries.find((candidate) => candidate.id.startsWith("para--"));
  if (!bettyEntry || !paragraphEntry) {
    throw new Error("The corpus lacks a Betty entry or a paragraph at 180");
  }
  const betty: Item = { entry: bettyEntry, fixtureDir };
  const paragraph: Item = { entry: paragraphEntry, fixtureDir };
  // And one long text of the live page's own list.
  const longEntry = readVoiceCorpus(path.join(repoRoot, LIVE_PAGE_LIST_PATH)).entries[0];
  if (!longEntry) throw new Error(`${LIVE_PAGE_LIST_PATH} has no entry`);
  const long: Item = { entry: longEntry, fixtureDir: path.join(repoRoot, LIVE_PAGE_FIXTURE_DIR) };

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
  const oracleOf = (spoken: Item) =>
    readWavInt16(path.join(spoken.fixtureDir, `${spoken.entry.id}.wav`)).samples;
  const seconds = (spoken: Item) => oracleOf(spoken).length / DECTALK_SAMPLE_RATE;

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
      record.items.forEach((spoken, index) => {
        const oracle = oracleOf(spoken);
        const oneEach = runs.length === record.items.length;
        // The k-th Speak is the k-th run the node started, when it started one
        // for each. With fewer runs, the first Speak has the first run and
        // the later ones have none of their own.
        const run = oneEach ? runs[index] : index === 0 ? runs[0] : undefined;
        const end = oneEach ? ends[index] : ends[ends.length - 1];
        const nodeStart = Number(run?.data?.startFrame);
        const delay = Number(run?.data?.delaySamples);
        const scheduled = scheduledFrameOf(record.starts[index] as number, tap.sampleRate);
        const packetsOracle = oracle.length / FRAME_SAMPLES;
        const packetsRun = Number(end?.data?.frames ?? -1);
        const cut = spoken.cut === true;
        // A cut text is DECtalk's up to the packet its run ended at.
        const limit = cut ? Math.max(0, packetsRun) * FRAME_SAMPLES : oracle.length;
        const compared = Math.ceil(Math.min(limit, oracle.length) / inStep);
        let equal = 0;
        let firstMismatch = -1;
        let lateFrames: number | null = null;
        let clickToFirstSampleMs: number | null = null;
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
          if (index === 0 && record.clock?.clickAt != null) {
            const firstSampleSec = (startFrame + delay) / tap.sampleRate;
            clickToFirstSampleMs =
              record.clock.performanceTime -
              (record.clock.contextTime - firstSampleSec) * 1000 -
              record.clock.clickAt;
          }
        } else {
          firstMismatch = 0;
        }
        rows.push({
          scene: record.scene,
          step: record.steps[index] as string,
          id: spoken.entry.id,
          voice: spoken.entry.voiceId ?? "paul",
          contextRate: tap.sampleRate,
          compared,
          equal,
          firstMismatch,
          packetsOracle,
          packetsRun,
          cut,
          endReason: String(end?.data?.reason ?? "no run_ended"),
          lateFrames,
          clickToFirstSampleMs,
          stagesMs: index === 0 ? (record.clock?.stagesMs ?? null) : null,
          gapsInRun,
          gapsElsewhere: tap.gaps.length - gapsInRun,
          problems,
          exact:
            run !== undefined &&
            compared > 0 &&
            equal === compared &&
            (cut ? packetsRun > 0 && packetsRun < packetsOracle : packetsRun === packetsOracle) &&
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
    const setUp = async (page: Page, spoken: Item) => {
      const voice = spoken.entry.voiceId ?? "paul";
      await page.selectOption("#speakerSelect", voice);
      await page.fill("#phrase", spoken.entry.text);
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
    /** Start recording, and note the time of the next click on Speak. */
    const begin = (page: Page) =>
      page.evaluate(() => {
        const scope = window as unknown as {
          __qlattTap: { begin(): void };
          __qlattClickAt: number | null;
        };
        scope.__qlattClickAt = null;
        document.getElementById("speakBtn")?.addEventListener(
          "click",
          () => {
            scope.__qlattClickAt = performance.now();
          },
          { capture: true, once: true },
        );
        scope.__qlattTap.begin();
      });
    const readClock = (page: Page): Promise<Clock> =>
      page.evaluate(() => {
        const scope = window as unknown as {
          __qlatt: {
            ctx: { currentTime: number };
            lastSpeakTimings?: Record<string, number>;
          };
          __qlattClickAt: number | null;
        };
        return {
          stagesMs: scope.__qlatt.lastSpeakTimings ?? null,
          clickAt: scope.__qlattClickAt,
          contextTime: scope.__qlatt.ctx.currentTime,
          performanceTime: performance.now(),
        };
      });

    /** One Speak, recorded from the click to the node's run_ended. */
    const speakOnce = async (page: Page, scene: string, step: string, spoken: Item) => {
      await setUp(page, spoken);
      await begin(page);
      await page.click("#speakBtn");
      const ended = await waitFor(page, "dectalk-vtm.run_ended", 1, seconds(spoken) * 1000 + 30000);
      const start = await scheduledStart(page);
      const clock = await readClock(page);
      pending.push({
        scene,
        steps: [step],
        items: [spoken],
        starts: [start],
        tap: await take(page),
        clock,
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
      // The second Speak has scheduled its run when a second one has started.
      await waitFor(page, "dectalk-vtm.run_started", 2, 5000);
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
        items: [{ ...sentence, cut: true }, word],
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
    await speakOnce(page, sequence, "(3) a 33 s text", long);
    await speakOnce(page, sequence, "(4) another voice", betty);
    await speakOnce(page, sequence, "(4) back to the first voice", word);
    judgePage();
    await page.close();

    // Scene 2: Speak pressed again while speaking.
    await speakTwice(
      "Speak again while speaking",
      ["(5) the text spoken over, up to where it was cut", "(5) the text spoken over it"],
      async () => {},
    );
    // Scene 3: Stop Audio while speaking, then Speak.
    await speakTwice(
      "Stop Audio while speaking, then Speak",
      ["(5) the stopped text, up to where it was cut", "(5) the text spoken after Stop"],
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
