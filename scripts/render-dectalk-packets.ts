/**
 * Render DECtalk's recorded packets through the `dectalk-vtm` experiment and
 * compare the result with DECtalk's own WAV.
 *
 * Input is a fixture as `scripts/oracle/export-dectalk-vtm-fixture.ts` writes
 * it (`<id>.hl.txt`, `<id>.frames.txt`, `<id>.wav`). The packets become a
 * frame track (`src/dectalk-vtm-track.ts`), the interpreter schedules it onto
 * the node's AudioParams, and an OfflineAudioContext renders it: the path a
 * frontend's track takes.
 *
 * For each fixture it reports
 *
 *   - at 11025 Hz, where the node does not resample: how many samples equal
 *     the stock say.exe WAV (all of them, or the run fails);
 *   - at each other rate: the difference between the node's output and
 *     (a) DECtalk's samples at the output instants that fall on an input
 *     sample, where band-limited interpolation must return the sample itself,
 *     and (b) a reference band-limited interpolation of DECtalk's WAV computed
 *     here in double precision with a kernel 32 times longer than the node's.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/render-dectalk-packets.ts \
 *     [--fixture-dir crates/dectalk-vtm/tests/fixtures] [--id paul-cat] \
 *     [--rates 44100,48000] [--out-dir <dir>] [--json <file>]
 *
 * `--out-dir` receives `<id>.<rate>.wav` for every render. `--json` receives
 * the measurements with each render's diagnostics and provenance decisions.
 * Exit code 1 if an 11025 Hz render is not exact or a render reported a
 * warning or an error.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DECTALK_SAMPLE_RATE, vtmEventsToTrack } from "../src/dectalk-vtm-track.ts";
import { createProvenanceCollector } from "../src/provenance.ts";
import { listVtmFixtures, readVtmFixture } from "./oracle/dectalk-vtm-fixture.ts";
import { renderDectalkVtmTrack, renderToInt16 } from "./rendering/dectalk-vtm-render.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};

const fixtureDir = path.resolve(
  flag("fixture-dir") ?? path.join(repoRoot, "crates", "dectalk-vtm", "tests", "fixtures"),
);
const onlyId = flag("id");
const rates = (flag("rates") ?? "44100,48000").split(",").map(Number);
const outDir = flag("out-dir") ? path.resolve(flag("out-dir") as string) : undefined;
const jsonFile = flag("json") ? path.resolve(flag("json") as string) : undefined;

function writeWavInt16(file: string, samples: Int16Array, sampleRate: number): void {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) buffer.writeInt16LE(samples[i], 44 + 2 * i);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buffer);
}

/** I0 by its power series, as in crates/dectalk-vtm/src/resample.rs. */
function besselI0(x: number): number {
  let sum = 1;
  let term = 1;
  for (let k = 1; ; k += 1) {
    const factor = x / 2 / k;
    term *= factor * factor;
    if (sum + term === sum) return sum;
    sum += term;
  }
}

// The reference interpolation: the same construction as the node's kernel
// (Kaiser-windowed sinc with zero crossings at the input samples) but 512
// input samples on each side instead of 16, designed for 120 dB instead of
// 80 dB, and summed in double precision. Both numbers are this script's
// choice of "much longer than the node's"; they are not from a source.
const REFERENCE_HALF_WIDTH = 512;
const REFERENCE_BETA = 0.1102 * (120 - 8.7); // Kaiser 1974
const REFERENCE_I0_BETA = besselI0(REFERENCE_BETA);

/**
 * The reference kernel for an output instant `remainder / rate` of a sample
 * past an input sample: coefficients of input samples `q - 511 .. q + 512`.
 * An output rate has only `rate / gcd(rate, 11025)` such instants, so the rows
 * are computed once per rate.
 */
const referenceRows = new Map<string, Float64Array>();
function referenceRow(remainder: number, rate: number): Float64Array {
  const key = `${rate}:${remainder}`;
  let row = referenceRows.get(key);
  if (!row) {
    row = new Float64Array(2 * REFERENCE_HALF_WIDTH);
    for (let tap = 0; tap < row.length; tap += 1) {
      const t = tap - REFERENCE_HALF_WIDTH + 1 - remainder / rate;
      const ratio = t / REFERENCE_HALF_WIDTH;
      const inside = 1 - ratio * ratio;
      if (inside <= 0) continue;
      const window = besselI0(REFERENCE_BETA * Math.sqrt(inside)) / REFERENCE_I0_BETA;
      row[tap] = (Math.sin(Math.PI * t) / (Math.PI * t)) * window;
    }
    referenceRows.set(key, row);
  }
  return row;
}

/** DECtalk's samples (scaled to +-1) interpolated at `j * 11025 / rate`. */
function referenceInterpolation(input: Int16Array, rate: number, count: number): Float64Array {
  const out = new Float64Array(count);
  for (let j = 0; j < count; j += 1) {
    const remainder = (j * DECTALK_SAMPLE_RATE) % rate;
    const q = (j * DECTALK_SAMPLE_RATE - remainder) / rate;
    if (remainder === 0) {
      out[j] = q < input.length ? input[q] / 32768 : 0;
      continue;
    }
    const row = referenceRow(remainder, rate);
    const base = q - REFERENCE_HALF_WIDTH + 1;
    const first = Math.max(0, base);
    const last = Math.min(input.length - 1, q + REFERENCE_HALF_WIDTH);
    let sum = 0;
    for (let i = first; i <= last; i += 1) sum += (input[i] / 32768) * row[i - base];
    out[j] = sum;
  }
  return out;
}

const decibels = (ratio: number): number | null =>
  ratio > 0 ? Number((20 * Math.log10(ratio)).toFixed(2)) : null;

interface ExactResult {
  rate: number;
  samples: number;
  oracleSamples: number;
  exactSamples: number;
  firstMismatch: number | null;
  maxAbsDiff: number;
}

interface ResampledResult {
  rate: number;
  delaySamples: number;
  outputSamples: number;
  /** Output instants that fall on an input sample, and the largest |difference| there (x 32768). */
  onGridInstants: number;
  onGridMaxAbsDiff: number;
  /** Against the reference interpolation, over the whole run. */
  signalRms: number;
  errorRms: number;
  errorMaxAbs: number;
  errorRmsDbReSignal: number | null;
  errorMaxDbReFullScale: number | null;
  peak: number;
}

const fixtures = listVtmFixtures(fixtureDir).filter((id) => !onlyId || id === onlyId);
if (fixtures.length === 0) {
  console.error(`No fixtures${onlyId ? ` named ${onlyId}` : ""} in ${fixtureDir}`);
  process.exit(2);
}

let failed = false;
const report: Record<string, unknown>[] = [];
for (const id of fixtures) {
  const fixture = readVtmFixture(fixtureDir, id);
  const track = vtmEventsToTrack(fixture.events);
  const renders: Record<string, unknown>[] = [];

  for (const rate of [DECTALK_SAMPLE_RATE, ...rates.filter((r) => r !== DECTALK_SAMPLE_RATE)]) {
    const provenance = createProvenanceCollector();
    const render = await renderDectalkVtmTrack({ repoRoot, track, sampleRate: rate, provenance });
    const problems = render.diagnostics.filter((entry) => entry.level !== "info");
    if (problems.length > 0) failed = true;
    for (const entry of problems) {
      console.error(`${id} @ ${rate}: ${entry.level} ${entry.code}: ${entry.message}`);
    }

    let result: ExactResult | ResampledResult;
    if (rate === DECTALK_SAMPLE_RATE) {
      const samples = renderToInt16(render);
      let exactSamples = 0;
      let firstMismatch: number | null = null;
      let maxAbsDiff = 0;
      for (let i = 0; i < Math.min(samples.length, fixture.samples.length); i += 1) {
        const diff = Math.abs(samples[i] - fixture.samples[i]);
        if (diff === 0) exactSamples += 1;
        else firstMismatch ??= i;
        maxAbsDiff = Math.max(maxAbsDiff, diff);
      }
      result = {
        rate,
        samples: samples.length,
        oracleSamples: fixture.samples.length,
        exactSamples,
        firstMismatch,
        maxAbsDiff,
      };
      if (samples.length !== fixture.samples.length || exactSamples !== samples.length) {
        failed = true;
      }
      console.log(
        `${id} @ ${rate} Hz: samples=${result.samples} oracle=${result.oracleSamples} exact=${exactSamples} firstMismatch=${firstMismatch ?? "none"} maxAbsDiff=${maxAbsDiff}`,
      );
      if (outDir) writeWavInt16(path.join(outDir, `${id}.${rate}.wav`), samples, rate);
    } else {
      const count = render.samples.length - render.delaySamples;
      const node = render.samples.subarray(render.delaySamples);
      const reference = referenceInterpolation(fixture.samples, rate, count);
      let onGridInstants = 0;
      let onGridMaxAbsDiff = 0;
      let signal = 0;
      let error = 0;
      let errorMaxAbs = 0;
      let peak = 0;
      for (let j = 0; j < count; j += 1) {
        const diff = node[j] - reference[j];
        signal += reference[j] * reference[j];
        error += diff * diff;
        errorMaxAbs = Math.max(errorMaxAbs, Math.abs(diff));
        peak = Math.max(peak, Math.abs(node[j]));
        if ((j * DECTALK_SAMPLE_RATE) % rate === 0) {
          const q = (j * DECTALK_SAMPLE_RATE) / rate;
          if (q < fixture.samples.length) {
            onGridInstants += 1;
            onGridMaxAbsDiff = Math.max(
              onGridMaxAbsDiff,
              Math.abs(node[j] * 32768 - fixture.samples[q]),
            );
          }
        }
      }
      const signalRms = Math.sqrt(signal / count);
      const errorRms = Math.sqrt(error / count);
      result = {
        rate,
        delaySamples: render.delaySamples,
        outputSamples: count,
        onGridInstants,
        onGridMaxAbsDiff,
        signalRms,
        errorRms,
        errorMaxAbs,
        errorRmsDbReSignal: decibels(errorRms / signalRms),
        errorMaxDbReFullScale: decibels(errorMaxAbs),
        peak,
      };
      console.log(
        `${id} @ ${rate} Hz: delay=${render.delaySamples} out=${count} onGrid=${onGridInstants} onGridMaxAbsDiff=${onGridMaxAbsDiff} errRms=${errorRms.toExponential(3)} (${result.errorRmsDbReSignal} dB re signal rms ${signalRms.toFixed(5)}) errMax=${errorMaxAbs.toExponential(3)} (${result.errorMaxDbReFullScale} dBFS) peak=${peak.toFixed(5)}`,
      );
      if (outDir) {
        const pcm = new Int16Array(count);
        for (let j = 0; j < count; j += 1) {
          pcm[j] = Math.max(-32768, Math.min(32767, Math.round(node[j] * 32768)));
        }
        writeWavInt16(path.join(outDir, `${id}.${rate}.wav`), pcm, rate);
      }
    }
    renders.push({
      ...result,
      diagnostics: render.diagnostics.map(({ level, code, message, data }) => ({
        level,
        code,
        message,
        data,
      })),
      decisions: provenance.getDecisions(),
    });
  }
  report.push({ id, frames: track.length - 1, renders });
}

if (jsonFile) {
  fs.mkdirSync(path.dirname(jsonFile), { recursive: true });
  fs.writeFileSync(jsonFile, `${JSON.stringify(report, null, 2)}\n`);
}
process.exit(failed ? 1 : 0);
