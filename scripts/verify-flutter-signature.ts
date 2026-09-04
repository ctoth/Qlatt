/**
 * F1 FLUTTER feature-signature verification.
 *
 * Drives the COMPILED oversampled-glottal-source.wasm directly with a constant
 * F0 and AV, once with FL=0 (control) and once with FL=50, and measures the
 * resulting F0 contour via autocorrelation. It then runs a DFT of the F0
 * contour to show the wander energy concentrates at the three Klatt & Klatt
 * 1990 (eq. 1) flutter frequencies 12.7 / 7.1 / 4.7 Hz.
 *
 * This exercises the real DSP path (the same .wasm the node/browser runtimes
 * load), not a JS reimplementation of the formula.
 *
 * Reference: Klatt & Klatt 1990, "Analysis, synthesis, and perception of voice
 * quality variations among female and male talkers", JASA 87(2), eq. 1.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const wasmPath = path.join(repoRoot, "public", "worklets", "oversampled-glottal-source.wasm");

const SAMPLE_RATE = 22050;
const DURATION_S = 1.5;
const F0_HZ = 120;
const AV_DB = 60;

interface Exports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  oversampled_glottal_source_new(sampleRate: number): number;
  oversampled_glottal_source_process(
    state: number,
    f0Ptr: number,
    f0Len: number,
    avPtr: number,
    avLen: number,
    aturbPtr: number,
    aturbLen: number,
    tiltPtr: number,
    tiltLen: number,
    oqPtr: number,
    oqLen: number,
    skewPtr: number,
    skewLen: number,
    asymPtr: number,
    asymLen: number,
    sourcePtr: number,
    sourceLen: number,
    seedPtr: number,
    seedLen: number,
    flutterPtr: number,
    flutterLen: number,
    voicePtr: number,
    noisePtr: number,
    blockSize: number,
  ): void;
}

function instantiate(): Exports {
  const bytes = fs.readFileSync(wasmPath);
  const mod = new WebAssembly.Module(bytes);
  const inst = new WebAssembly.Instance(mod, {});
  return inst.exports as unknown as Exports;
}

/** Allocate an f32 scalar buffer holding `value`. */
function allocScalar(ex: Exports, value: number): number {
  const ptr = ex.alloc_f32(1);
  new Float32Array(ex.memory.buffer, ptr, 1)[0] = value;
  return ptr;
}

/** Render the source for `numSamples` with a constant flutter value. */
function render(ex: Exports, flutter: number, numSamples: number): Float32Array {
  const state = ex.oversampled_glottal_source_new(SAMPLE_RATE);
  const f0 = allocScalar(ex, F0_HZ);
  const av = allocScalar(ex, AV_DB);
  const aturb = allocScalar(ex, 0);
  const tilt = allocScalar(ex, 0);
  const oq = allocScalar(ex, 50);
  const skew = allocScalar(ex, 0);
  const asym = allocScalar(ex, 50);
  const source = allocScalar(ex, 2);
  const seed = allocScalar(ex, 1);
  const fl = allocScalar(ex, flutter);

  const block = 512;
  const voicePtr = ex.alloc_f32(block);
  const noisePtr = ex.alloc_f32(block);
  const out = new Float32Array(numSamples);

  let written = 0;
  while (written < numSamples) {
    const n = Math.min(block, numSamples - written);
    ex.oversampled_glottal_source_process(
      state,
      f0,
      1,
      av,
      1,
      aturb,
      1,
      tilt,
      1,
      oq,
      1,
      skew,
      1,
      asym,
      1,
      source,
      1,
      seed,
      1,
      fl,
      1,
      voicePtr,
      noisePtr,
      n,
    );
    // memory.buffer may have grown; build a fresh view each block.
    const view = new Float32Array(ex.memory.buffer, voicePtr, n);
    out.set(view, written);
    written += n;
  }
  return out;
}

/**
 * Estimate F0 contour via short-time autocorrelation with parabolic peak
 * interpolation. Returns { times[], f0[] } in seconds / Hz.
 */
function f0Contour(signal: Float32Array): { times: number[]; f0: number[] } {
  const win = 2048;
  const hop = 256;
  const minLag = Math.floor(SAMPLE_RATE / 200); // 200 Hz ceiling
  const maxLag = Math.floor(SAMPLE_RATE / 80); // 80 Hz floor
  const times: number[] = [];
  const f0: number[] = [];

  for (let start = 0; start + win <= signal.length; start += hop) {
    // Mean-remove the window.
    let mean = 0;
    for (let i = 0; i < win; i++) mean += signal[start + i];
    mean /= win;
    const w = new Float32Array(win);
    for (let i = 0; i < win; i++) w[i] = signal[start + i] - mean;

    let bestLag = -1;
    let bestVal = -Infinity;
    const ac: number[] = new Array(maxLag + 1).fill(0);
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0;
      for (let i = 0; i < win - lag; i++) s += w[i] * w[i + lag];
      ac[lag] = s;
      if (s > bestVal) {
        bestVal = s;
        bestLag = lag;
      }
    }
    if (bestLag <= minLag || bestLag >= maxLag) {
      times.push((start + win / 2) / SAMPLE_RATE);
      f0.push(SAMPLE_RATE / bestLag);
      continue;
    }
    // Parabolic interpolation around the peak for sub-sample lag.
    const y0 = ac[bestLag - 1];
    const y1 = ac[bestLag];
    const y2 = ac[bestLag + 1];
    const denom = y0 - 2 * y1 + y2;
    const delta = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
    const lag = bestLag + delta;
    times.push((start + win / 2) / SAMPLE_RATE);
    f0.push(SAMPLE_RATE / lag);
  }
  return { times, f0 };
}

/** Magnitude of a DFT bin at `freqHz` over a contour sampled at `fsHz`. */
function dftMag(values: number[], fsHz: number, freqHz: number): number {
  let mean = 0;
  for (const v of values) mean += v;
  mean /= values.length;
  let re = 0;
  let im = 0;
  for (let n = 0; n < values.length; n++) {
    const phase = (-2 * Math.PI * freqHz * n) / fsHz;
    const x = values[n] - mean;
    re += x * Math.cos(phase);
    im += x * Math.sin(phase);
  }
  return (2 / values.length) * Math.sqrt(re * re + im * im);
}

function stats(values: number[]): { mean: number; min: number; max: number; ptp: number } {
  let mean = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    mean += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  mean /= values.length;
  return { mean, min, max, ptp: max - min };
}

function main(): void {
  const ex = instantiate();
  const numSamples = Math.round(DURATION_S * SAMPLE_RATE);

  const control = render(ex, 0, numSamples);
  const flutter = render(ex, 50, numSamples);

  // Trim the first 0.15 s (filter / period warm-up) before measuring.
  const trim = Math.round(0.15 * SAMPLE_RATE);
  const cTrack = f0Contour(control.subarray(trim));
  const fTrack = f0Contour(flutter.subarray(trim));

  const fsContour = SAMPLE_RATE / 256; // contour frame rate (Hz)
  const cStat = stats(cTrack.f0);
  const fStat = stats(fTrack.f0);

  const targets = [4.7, 7.1, 12.7];
  const controls = [1.5, 3.0, 9.5, 16.0, 20.0];
  const fTarget = targets.map((hz) => ({ hz, mag: dftMag(fTrack.f0, fsContour, hz) }));
  const fControl = controls.map((hz) => ({ hz, mag: dftMag(fTrack.f0, fsContour, hz) }));
  const cTarget = targets.map((hz) => ({ hz, mag: dftMag(cTrack.f0, fsContour, hz) }));

  const maxControlMag = Math.max(...fControl.map((c) => c.mag));
  const minTargetMag = Math.min(...fTarget.map((t) => t.mag));

  console.log("=== FLUTTER (FL) signature verification ===");
  console.log(
    `source params: F0=${F0_HZ} Hz, AV=${AV_DB} dB, source=2 (natural), ${DURATION_S}s @ ${SAMPLE_RATE} Hz`,
  );
  console.log(
    `contour frame rate: ${fsContour.toFixed(2)} Hz, frames: control=${cTrack.f0.length} flutter=${fTrack.f0.length}`,
  );
  console.log("");
  console.log("F0 contour stats (Hz):");
  console.log(
    `  FL=0  (control): mean=${cStat.mean.toFixed(2)} min=${cStat.min.toFixed(2)} max=${cStat.max.toFixed(2)} ptp=${cStat.ptp.toFixed(3)}`,
  );
  console.log(
    `  FL=50          : mean=${fStat.mean.toFixed(2)} min=${fStat.min.toFixed(2)} max=${fStat.max.toFixed(2)} ptp=${fStat.ptp.toFixed(3)}`,
  );
  console.log("");
  console.log("FL=50 F0-contour DFT magnitude at flutter target freqs (Hz -> mag):");
  for (const t of fTarget) console.log(`  ${t.hz.toFixed(1).padStart(5)} Hz : ${t.mag.toFixed(4)}`);
  console.log("FL=50 F0-contour DFT magnitude at off-target control freqs:");
  for (const c of fControl)
    console.log(`  ${c.hz.toFixed(1).padStart(5)} Hz : ${c.mag.toFixed(4)}`);
  console.log("FL=0 F0-contour DFT magnitude at the same target freqs (should be ~0):");
  for (const t of cTarget) console.log(`  ${t.hz.toFixed(1).padStart(5)} Hz : ${t.mag.toFixed(4)}`);
  console.log("");

  // Expected ptp upper bound from eq. 1: (FL/50)*(F0/100)*[3 sines in [-3,3]] -> +-3.6 Hz.
  const expectedAmp = (50 / 50) * (F0_HZ / 100) * 3; // max single-side amplitude
  console.log(
    `eq.1 max |Δf0| bound at FL=50,F0=120: ${expectedAmp.toFixed(2)} Hz (ptp up to ${(2 * expectedAmp).toFixed(2)} Hz)`,
  );

  // Assertions.
  const checks: Array<[string, boolean]> = [
    ["FL=0 contour is ~flat (ptp < 1 Hz)", cStat.ptp < 1.0],
    ["FL=50 shows several-Hz wander (ptp > 2 Hz)", fStat.ptp > 2.0],
    ["FL=50 wander within eq.1 bound (ptp < 9 Hz)", fStat.ptp < 9.0],
    ["all 3 flutter freqs dominate every control bin", minTargetMag > maxControlMag],
    [
      "FL=0 has no energy at flutter freqs (< 0.1 Hz)",
      Math.max(...cTarget.map((t) => t.mag)) < 0.1,
    ],
  ];

  let allPass = true;
  console.log("Checks:");
  for (const [name, ok] of checks) {
    console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}`);
    if (!ok) allPass = false;
  }

  if (!allPass) {
    console.error("\nFLUTTER signature verification FAILED");
    process.exitCode = 1;
    return;
  }
  console.log("\nFLUTTER signature verification PASSED");
}

main();
