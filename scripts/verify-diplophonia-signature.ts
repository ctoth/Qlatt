/**
 * F2 DIPLOPHONIA (DI) feature-signature verification.
 *
 * Drives the COMPILED oversampled-glottal-source.wasm directly with a constant
 * F0 and AV, once with DI=0 (control) and once with DI=50, and verifies the two
 * acoustic signatures of diplophonia (Klatt & Klatt 1990, §3):
 *
 *   1. ALTERNATE-PERIOD amplitude/timing modulation. With DI>0 the signal
 *      repeats every TWO pitch periods, not every one (period doubling). We show
 *      this in the time domain by comparing the normalized autocorrelation at a
 *      one-period lag (r1) versus a two-period lag (r2): DI=50 makes r2 >> r1,
 *      whereas DI=0 keeps r1 ~ r2 (single-period periodicity). We also report the
 *      per-period peak amplitudes, which alternate full / attenuated (~0.5) for
 *      DI=50 and stay uniform for DI=0.
 *   2. A SUBHARMONIC near F0/2. We take the DFT magnitude of the steady-state
 *      voice waveform at F0/2 and at F0: DI=50 raises the F0/2 bin far above the
 *      DI=0 control (which has ~no energy at F0/2, only at F0 and its harmonics).
 *
 * This exercises the real DSP path (the same .wasm the node/browser runtimes
 * load), not a JS reimplementation of the formula.
 *
 * Reference: Klatt & Klatt 1990, "Analysis, synthesis, and perception of voice
 * quality variations among female and male talkers", JASA 87(2), §3.
 *   delay      = (DI/100)*(1 - OQ/100)*T0   (alternate pulse delayed)
 *   amp_factor = 1 - DI/100                 (alternate pulse attenuated; DI=50 -> -6 dB)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const wasmPath = path.join(repoRoot, "public", "worklets", "oversampled-glottal-source.wasm");

const SAMPLE_RATE = 22050;
const DURATION_S = 1.0;
const F0_HZ = 120;
const AV_DB = 60;
const OQ = 50;

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
    diplophoniaPtr: number,
    diplophoniaLen: number,
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

/** Render the source for `numSamples` with a constant diplophonia value. */
function render(ex: Exports, diplophonia: number, numSamples: number): Float32Array {
  const state = ex.oversampled_glottal_source_new(SAMPLE_RATE);
  const f0 = allocScalar(ex, F0_HZ);
  const av = allocScalar(ex, AV_DB);
  const aturb = allocScalar(ex, 0);
  const tilt = allocScalar(ex, 0);
  const oq = allocScalar(ex, OQ);
  const skew = allocScalar(ex, 0);
  const asym = allocScalar(ex, 50);
  const source = allocScalar(ex, 2);
  const seed = allocScalar(ex, 1);
  const fl = allocScalar(ex, 0);
  const di = allocScalar(ex, diplophonia);

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
      di,
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

/** Magnitude of a DFT bin at `freqHz` over a signal sampled at `fsHz`. */
function dftMag(values: Float32Array, fsHz: number, freqHz: number): number {
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

/**
 * Normalized autocorrelation of `sig` at integer lag `lag`
 * (mean-removed, divided by zero-lag energy).
 */
function normAutocorr(sig: Float32Array, lag: number): number {
  let mean = 0;
  for (const v of sig) mean += v;
  mean /= sig.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < sig.length; i++) {
    const a = sig[i] - mean;
    den += a * a;
  }
  for (let i = 0; i + lag < sig.length; i++) {
    num += (sig[i] - mean) * (sig[i + lag] - mean);
  }
  return den !== 0 ? num / den : 0;
}

/** Best normalized autocorrelation within +-`win` samples of `lag`. */
function bestAutocorrNear(sig: Float32Array, lag: number, win: number): number {
  let best = -Infinity;
  for (let l = lag - win; l <= lag + win; l++) {
    if (l <= 0) continue;
    const r = normAutocorr(sig, l);
    if (r > best) best = r;
  }
  return best;
}

/**
 * Peak |amplitude| within each successive pitch period of length `period`
 * (samples). Returns the per-period peaks for the first `count` periods.
 */
function perPeriodPeaks(sig: Float32Array, period: number, count: number): number[] {
  const peaks: number[] = [];
  for (let p = 0; p < count; p++) {
    const start = Math.round(p * period);
    const end = Math.round((p + 1) * period);
    if (end > sig.length) break;
    let mx = 0;
    for (let i = start; i < end; i++) {
      const a = Math.abs(sig[i]);
      if (a > mx) mx = a;
    }
    peaks.push(mx);
  }
  return peaks;
}

function main(): void {
  const ex = instantiate();
  const numSamples = Math.round(DURATION_S * SAMPLE_RATE);

  const control = render(ex, 0, numSamples);
  const dipl = render(ex, 50, numSamples);

  // Trim the first 0.15 s (filter / period warm-up) before measuring.
  const trim = Math.round(0.15 * SAMPLE_RATE);
  const cSig = control.subarray(trim);
  const dSig = dipl.subarray(trim);

  const T0 = SAMPLE_RATE / F0_HZ; // output samples per pitch period
  const lag1 = Math.round(T0);
  const lag2 = Math.round(2 * T0);
  const win = Math.round(0.15 * T0);

  // --- Time domain: period-doubling autocorrelation ---
  const cR1 = bestAutocorrNear(cSig, lag1, win);
  const cR2 = bestAutocorrNear(cSig, lag2, win);
  const dR1 = bestAutocorrNear(dSig, lag1, win);
  const dR2 = bestAutocorrNear(dSig, lag2, win);

  // --- Time domain: alternating per-period peak amplitudes ---
  const cPeaks = perPeriodPeaks(cSig, T0, 12);
  const dPeaks = perPeriodPeaks(dSig, T0, 12);
  const meanEven = (a: number[]) =>
    a.filter((_, i) => i % 2 === 0).reduce((s, v) => s + v, 0) / Math.ceil(a.length / 2);
  const meanOdd = (a: number[]) =>
    a.filter((_, i) => i % 2 === 1).reduce((s, v) => s + v, 0) / Math.floor(a.length / 2);
  const cAltRatio = meanOdd(cPeaks) / meanEven(cPeaks);
  const dAltRatio = meanOdd(dPeaks) / meanEven(dPeaks);

  // --- Frequency domain: subharmonic near F0/2 ---
  const fHalf = F0_HZ / 2;
  const cHalf = dftMag(cSig, SAMPLE_RATE, fHalf);
  const cFund = dftMag(cSig, SAMPLE_RATE, F0_HZ);
  const dHalf = dftMag(dSig, SAMPLE_RATE, fHalf);
  const dFund = dftMag(dSig, SAMPLE_RATE, F0_HZ);

  console.log("=== DIPLOPHONIA (DI) signature verification ===");
  console.log(
    `source params: F0=${F0_HZ} Hz, AV=${AV_DB} dB, OQ=${OQ}%, source=2 (natural), ${DURATION_S}s @ ${SAMPLE_RATE} Hz`,
  );
  console.log(`T0 = ${T0.toFixed(2)} samples (lag1=${lag1}, lag2=${lag2})`);
  console.log("");
  console.log("Period-doubling autocorrelation (normalized, peak near lag):");
  console.log(
    `  DI=0  : r(1 period)=${cR1.toFixed(4)}  r(2 periods)=${cR2.toFixed(4)}  r2/r1=${(cR2 / cR1).toFixed(4)}`,
  );
  console.log(
    `  DI=50 : r(1 period)=${dR1.toFixed(4)}  r(2 periods)=${dR2.toFixed(4)}  r2/r1=${(dR2 / dR1).toFixed(4)}`,
  );
  console.log("");
  console.log("Per-period peak |amplitude| (first 12 periods):");
  console.log(`  DI=0  : ${cPeaks.map((v) => v.toFixed(3)).join(", ")}`);
  console.log(`  DI=50 : ${dPeaks.map((v) => v.toFixed(3)).join(", ")}`);
  console.log(
    `  odd/even peak ratio  DI=0=${cAltRatio.toFixed(3)}  DI=50=${dAltRatio.toFixed(3)} (DI=50 expected ~0.5 from amp=1-DI/100)`,
  );
  console.log("");
  console.log("Spectrum DFT magnitude:");
  console.log(
    `  DI=0  : @F0/2(${fHalf}Hz)=${cHalf.toFixed(2)}  @F0(${F0_HZ}Hz)=${cFund.toFixed(2)}  ratio(half/fund)=${(cHalf / cFund).toFixed(4)}`,
  );
  console.log(
    `  DI=50 : @F0/2(${fHalf}Hz)=${dHalf.toFixed(2)}  @F0(${F0_HZ}Hz)=${dFund.toFixed(2)}  ratio(half/fund)=${(dHalf / dFund).toFixed(4)}`,
  );
  console.log("");

  // Assertions.
  const checks: Array<[string, boolean]> = [
    ["DI=0 is single-period (r2/r1 ~ 1, < 1.05)", cR2 / cR1 < 1.05],
    ["DI=50 shows period doubling (r2 > r1, r2/r1 > 1.1)", dR2 / dR1 > 1.1],
    ["DI=0 per-period peaks uniform (odd/even in [0.9,1.1])", cAltRatio > 0.9 && cAltRatio < 1.1],
    ["DI=50 per-period peaks alternate (odd/even < 0.7)", dAltRatio < 0.7],
    ["DI=0 has ~no F0/2 subharmonic (half/fund < 0.05)", cHalf / cFund < 0.05],
    ["DI=50 has strong F0/2 subharmonic (half/fund > 0.2)", dHalf / dFund > 0.2],
    ["DI=50 F0/2 energy >> DI=0 F0/2 energy (>10x)", dHalf > 10 * cHalf],
  ];

  let allPass = true;
  console.log("Checks:");
  for (const [name, ok] of checks) {
    console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}`);
    if (!ok) allPass = false;
  }

  if (!allPass) {
    console.error("\nDIPLOPHONIA signature verification FAILED");
    process.exitCode = 1;
    return;
  }
  console.log("\nDIPLOPHONIA signature verification PASSED");
}

main();
