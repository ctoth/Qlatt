/**
 * TRACHEAL POLE-ZERO (FTP/BTP/FTZ/BTZ) feature-signature verification.
 *
 * Drives the COMPILED antiresonator.wasm (tracheal ZERO, FTZ/BTZ) and
 * resonator.wasm (tracheal POLE, FTP/BTP) directly — the same .wasm the
 * node/browser klsyn88 cascade loads — chained zero->pole exactly as the
 * graph wires `tz -> tp`. White noise is pushed through the pair and the
 * magnitude spectrum is measured with a Goertzel sweep.
 *
 * Two cases:
 *   1. COINCIDENT defaults (FTP=FTZ=2150, BTP=BTZ=180): the pole and zero
 *      cancel -> the output spectrum is essentially flat relative to the input
 *      (transparent no-op). (In the klsyn88 graph this case is additionally
 *      short-circuited to an exact passthrough via the coincidence bypass; here
 *      we run the raw filters to show they still cancel to within a small dB
 *      ripple even without the bypass.)
 *   2. SEPARATED (FTZ=1500, FTP=2150): a spectral NOTCH appears near FTZ=1500
 *      Hz and a resonant PEAK near FTP=2150 Hz — the breathy-voice subglottal
 *      coupling signature.
 *
 * Reference: Klatt & Klatt 1990, "Analysis, synthesis, and perception of voice
 * quality variations among female and male talkers", JASA 87(2), Table XII +
 * "New Features" (tracheal pole-zero); cascade pole/zero convention from
 * Klatt 1980 (setabc / setzeroabc).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const workletsDir = path.join(repoRoot, "public", "worklets");

const SAMPLE_RATE = 22050;
const NUM_SAMPLES = 1 << 16; // 65536

interface AntiExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  antiresonator_new(): number;
  antiresonator_set_params(ptr: number, freq: number, bw: number, sr: number): void;
  antiresonator_process(ptr: number, inPtr: number, outPtr: number, len: number): void;
}

interface ResExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  resonator_new(): number;
  resonator_set_params(ptr: number, freq: number, bw: number, sr: number): void;
  resonator_process(ptr: number, inPtr: number, outPtr: number, len: number): void;
}

function instantiate<T>(file: string): T {
  const bytes = fs.readFileSync(path.join(workletsDir, file));
  const mod = new WebAssembly.Module(bytes);
  const inst = new WebAssembly.Instance(mod, {});
  return inst.exports as unknown as T;
}

/** Deterministic white noise (mulberry32). */
function whiteNoise(n: number, seed: number): Float32Array {
  const out = new Float32Array(n);
  let s = seed >>> 0;
  for (let i = 0; i < n; i++) {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    out[i] = (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  return out;
}

/** Run input through antiresonator(zeroF,zeroBw) -> resonator(poleF,poleBw). */
function runPair(
  anti: AntiExports,
  res: ResExports,
  input: Float32Array,
  zeroF: number,
  zeroBw: number,
  poleF: number,
  poleBw: number,
): Float32Array {
  const n = input.length;
  // antiresonator stage
  const az = anti.antiresonator_new();
  anti.antiresonator_set_params(az, zeroF, zeroBw, SAMPLE_RATE);
  const aIn = anti.alloc_f32(n);
  const aOut = anti.alloc_f32(n);
  new Float32Array(anti.memory.buffer, aIn, n).set(input);
  anti.antiresonator_process(az, aIn, aOut, n);
  const mid = new Float32Array(n);
  mid.set(new Float32Array(anti.memory.buffer, aOut, n));

  // resonator stage
  const rp = res.resonator_new();
  res.resonator_set_params(rp, poleF, poleBw, SAMPLE_RATE);
  const rIn = res.alloc_f32(n);
  const rOut = res.alloc_f32(n);
  new Float32Array(res.memory.buffer, rIn, n).set(mid);
  res.resonator_process(rp, rIn, rOut, n);
  const out = new Float32Array(n);
  out.set(new Float32Array(res.memory.buffer, rOut, n));
  return out;
}

/** Goertzel power at a single frequency. */
function goertzelPower(signal: Float32Array, freqHz: number): number {
  const k = (freqHz / SAMPLE_RATE) * signal.length;
  const w = (2 * Math.PI * k) / signal.length;
  const cw = Math.cos(w);
  const coeff = 2 * cw;
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < signal.length; i++) {
    s0 = signal[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const power = s1 * s1 + s2 * s2 - coeff * s1 * s2;
  return power / (signal.length * signal.length);
}

/** Magnitude response in dB at freqHz: 10*log10(P_out / P_in). */
function gainDb(input: Float32Array, output: Float32Array, freqHz: number): number {
  const pin = goertzelPower(input, freqHz);
  const pout = goertzelPower(output, freqHz);
  return 10 * Math.log10((pout + 1e-30) / (pin + 1e-30));
}

function main(): void {
  const anti = instantiate<AntiExports>("antiresonator.wasm");
  const res = instantiate<ResExports>("resonator.wasm");
  const input = whiteNoise(NUM_SAMPLES, 0x51a7f00d);

  // Frequency grid (Hz) for the response sweep.
  const freqs: number[] = [];
  for (let f = 200; f <= 4000; f += 50) freqs.push(f);

  // --- Case 1: coincident default (no-op) ---
  const coincident = runPair(anti, res, input, 2150, 180, 2150, 180);
  let maxRipple = 0;
  for (const f of freqs) {
    const g = Math.abs(gainDb(input, coincident, f));
    if (g > maxRipple) maxRipple = g;
  }

  // --- Case 2: separated zero (FTZ=1500, FTP=2150) ---
  const FTZ = 1500;
  const FTP = 2150;
  const separated = runPair(anti, res, input, FTZ, 180, FTP, 180);
  const sweep = freqs.map((f) => ({ f, db: gainDb(input, separated, f) }));

  // Locate the notch (deepest dip) and the pole (highest peak).
  let notch = sweep[0];
  let peak = sweep[0];
  for (const p of sweep) {
    if (p.db < notch.db) notch = p;
    if (p.db > peak.db) peak = p;
  }

  // dB at exactly the notch and pole target frequencies vs a far reference (200 Hz).
  const refDb = gainDb(input, separated, 200);
  const atFtz = gainDb(input, separated, FTZ);
  const atFtp = gainDb(input, separated, FTP);

  console.log("=== TRACHEAL pole-zero (FTP/BTP/FTZ/BTZ) signature verification ===");
  console.log(`white noise ${NUM_SAMPLES} samples @ ${SAMPLE_RATE} Hz, zero->pole chain (antiresonator.wasm -> resonator.wasm)`);
  console.log("");
  console.log("Case 1 COINCIDENT (FTP=FTZ=2150, BTP=BTZ=180):");
  console.log(`  max |gain| ripple over 200..4000 Hz = ${maxRipple.toFixed(3)} dB (should be ~0 -> transparent)`);
  console.log("");
  console.log("Case 2 SEPARATED (FTZ=1500, FTP=2150, BW=180):");
  console.log(`  notch: ${notch.f} Hz @ ${notch.db.toFixed(2)} dB`);
  console.log(`  peak : ${peak.f} Hz @ ${peak.db.toFixed(2)} dB`);
  console.log(`  ref(200Hz)=${refDb.toFixed(2)} dB  gain@FTZ(1500)=${atFtz.toFixed(2)} dB  gain@FTP(2150)=${atFtp.toFixed(2)} dB`);
  console.log("");

  const checks: Array<[string, boolean]> = [
    ["COINCIDENT pair is transparent (ripple < 0.5 dB)", maxRipple < 0.5],
    ["SEPARATED notch lands near FTZ=1500 (within 150 Hz)", Math.abs(notch.f - FTZ) <= 150],
    ["SEPARATED peak lands near FTP=2150 (within 150 Hz)", Math.abs(peak.f - FTP) <= 150],
    ["notch is a real dip below reference (< -3 dB)", atFtz - refDb < -3],
    ["pole is a real rise above reference (> +3 dB)", atFtp - refDb > 3],
    ["peak is above notch by > 10 dB", peak.db - notch.db > 10],
  ];

  let allPass = true;
  console.log("Checks:");
  for (const [name, ok] of checks) {
    console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}`);
    if (!ok) allPass = false;
  }

  if (!allPass) {
    console.error("\nTRACHEAL signature verification FAILED");
    process.exitCode = 1;
    return;
  }
  console.log("\nTRACHEAL signature verification PASSED");
}

main();
