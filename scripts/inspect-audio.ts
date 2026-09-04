// Reusable audio-render inspector. Reads a render-phrase JSON payload
// ({ samples: number[], sampleRate }) and reports health stats — so audio
// verification uses a real script, never a `node -e` one-liner
// (AGENTS.md Principle 4).
//
// Usage:
//   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
//     scripts/inspect-audio.ts <render.json> [<render2.json> ...]
//
// Produce the JSON with:
//   scripts/render-phrase.ts --phrase "..." --frontend-id dectalk-english \
//     --experiment-id dectalk-english --host node --compare-golden 0 \
//     --out-wav <tmp>.wav --out-json <render.json>
// (the --out-wav flag is REQUIRED: without it persistWav=false selects the
//  track-only backend and you get 0 audio samples — looks broken but isn't.)
import { readFileSync } from "node:fs";

type Payload = { samples?: number[]; sampleRate?: number };

/** Discrete band energy above `cutoffHz` via a crude one-pole high-pass, as a
 *  fraction of total energy — enough to see spectral tilt (low-pass) reduce
 *  high-frequency content. Not a spectrum analyzer, just a monotone proxy. */
function highFreqFraction(samples: number[], sampleRate: number, cutoffHz: number): number {
  if (samples.length === 0) return 0;
  const rc = 1 / (2 * Math.PI * cutoffHz);
  const dt = 1 / sampleRate;
  const alpha = rc / (rc + dt);
  let prevIn = samples[0];
  let prevOut = 0;
  let hpEnergy = 0;
  let totalEnergy = 0;
  for (let i = 1; i < samples.length; i++) {
    const x = samples[i];
    const y = alpha * (prevOut + x - prevIn);
    hpEnergy += y * y;
    totalEnergy += x * x;
    prevIn = x;
    prevOut = y;
  }
  return totalEnergy > 0 ? hpEnergy / totalEnergy : 0;
}

/** In-place iterative radix-2 Cooley-Tukey FFT (re/im arrays, length power of 2). */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1;
      let cwi = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k];
        const ui = im[i + k];
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi;
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr;
        re[i + k] = ur + vr;
        im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;
        im[i + k + len / 2] = ui - vi;
        const ncwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr;
        cwr = ncwr;
      }
    }
  }
}

/** Spectral band-energy fraction above cutoffHz, via a real FFT over the largest
 *  power-of-2 prefix of the (Hann-windowed) signal. Trustworthy spectral measure
 *  of low-pass tilt, unlike the time-domain one-pole proxy. */
function spectralHighFraction(
  samples: number[],
  sampleRate: number,
  cutoffHz: number,
): { aboveAbs: number; fraction: number } {
  if (samples.length < 2) return { aboveAbs: 0, fraction: 0 };
  let n = 1;
  while (n * 2 <= samples.length) n *= 2;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); // Hann
    re[i] = samples[i] * w;
  }
  fft(re, im);
  const half = n / 2;
  const binHz = sampleRate / n;
  let above = 0;
  let total = 0;
  for (let k = 1; k < half; k++) {
    const mag2 = re[k] * re[k] + im[k] * im[k];
    total += mag2;
    if (k * binHz > cutoffHz) above += mag2;
  }
  return { aboveAbs: above, fraction: total > 0 ? above / total : 0 };
}

export function inspect(path: string): Record<string, unknown> {
  const payload = JSON.parse(readFileSync(path, "utf8")) as Payload;
  const samples = payload.samples ?? [];
  const sampleRate = payload.sampleRate ?? 22050;
  let nan = 0;
  let peak = 0;
  let sumSq = 0;
  let nonZero = 0;
  for (const x of samples) {
    if (!Number.isFinite(x)) {
      nan++;
      continue;
    }
    const a = Math.abs(x);
    if (a > peak) peak = a;
    if (a > 1e-6) nonZero++;
    sumSq += x * x;
  }
  const rms = samples.length ? Math.sqrt(sumSq / samples.length) : 0;
  const spec3k = spectralHighFraction(samples, sampleRate, 3000);
  const flags: string[] = [];
  if (samples.length === 0) flags.push("EMPTY");
  if (nonZero === 0) flags.push("SILENT");
  if (nan > 0) flags.push(`NaN/Inf=${nan}`);
  if (peak > 1.0) flags.push(`CLIP(peak=${peak.toFixed(3)})`);
  return {
    path,
    samples: samples.length,
    durationSec: +(samples.length / sampleRate).toFixed(3),
    nonZero,
    rms: +rms.toFixed(5),
    peak: +peak.toFixed(4),
    nanInf: nan,
    highFreqFraction3k: +highFreqFraction(samples, sampleRate, 3000).toFixed(4),
    specHighFraction3k: +spec3k.fraction.toFixed(5),
    specHighEnergyAbs3k: +spec3k.aboveAbs.toExponential(4),
    flags: flags.length ? flags : ["OK"],
  };
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("usage: inspect-audio.ts <render.json> [...]");
  process.exit(2);
}
for (const p of paths) console.log(JSON.stringify(inspect(p), null, 2));
