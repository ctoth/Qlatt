/**
 * Compare two WAV renders: peak, RMS, best-alignment lag, and post-alignment
 * residual. For A/B verification when swapping a DSP stage (e.g. replacing the
 * native DynamicsCompressorNode with the dynamics-compressor worklet), where
 * the outputs should be similar in level/shape but may differ in latency.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/compare-wav-levels.ts a.wav b.wav
 *
 * Prints metrics for each file, the estimated lag of B relative to A (positive
 * = B is delayed), and RMS/max error after alignment. Exit 0 always — this is
 * a measurement tool, not a gate.
 */
import { alignByLag, estimateLag, maxAbsError, readWav, rmsError } from "./oracle/wav.ts";

function stats(samples: Float64Array): { peak: number; rms: number } {
  let peak = 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i += 1) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
    sum += samples[i] * samples[i];
  }
  return { peak, rms: samples.length ? Math.sqrt(sum / samples.length) : 0 };
}

function db(x: number): string {
  return x > 0 ? (20 * Math.log10(x)).toFixed(2) + " dBFS" : "-inf";
}

const [pathA, pathB] = process.argv.slice(2);
if (!pathA || !pathB) {
  console.error("usage: compare-wav-levels.ts <a.wav> <b.wav>");
  process.exit(2);
}

const a = readWav(pathA);
const b = readWav(pathB);
if (a.sampleRate !== b.sampleRate) {
  console.error(`sample rate mismatch: ${a.sampleRate} vs ${b.sampleRate}`);
  process.exit(2);
}

const sa = stats(a.samples);
const sb = stats(b.samples);
console.log(`A: ${pathA}`);
console.log(
  `   samples=${a.samples.length} peak=${sa.peak.toFixed(5)} (${db(sa.peak)}) rms=${sa.rms.toFixed(5)} (${db(sa.rms)})`,
);
console.log(`B: ${pathB}`);
console.log(
  `   samples=${b.samples.length} peak=${sb.peak.toFixed(5)} (${db(sb.peak)}) rms=${sb.rms.toFixed(5)} (${db(sb.rms)})`,
);

const lag = estimateLag(a.samples, b.samples, a.sampleRate);
console.log(`lag of B vs A: ${lag} samples (${((lag / a.sampleRate) * 1000).toFixed(2)} ms)`);

const { reference, candidate } = alignByLag(a.samples, b.samples, lag);
console.log(
  `aligned rmsError=${rmsError(reference, candidate).toFixed(5)} maxAbsError=${maxAbsError(reference, candidate).toFixed(5)}`,
);
console.log(
  `peak ratio B/A=${(sb.peak / sa.peak).toFixed(3)} rms ratio B/A=${(sb.rms / sa.rms).toFixed(3)}`,
);
