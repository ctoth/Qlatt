/**
 * F3 LF GLOTTAL SOURCE (SS=3) feature-signature verification.
 *
 * Drives the COMPILED lf-source.wasm directly (the same .wasm the node/browser
 * runtimes load) the way the klsyn88 SS=3 path drives it: a Klatt OQ override
 * plus an Rd derived from the Klatt speed quotient SQ via
 *   Rk = 100/SQ ,  Rd = (10000/SQ - 22.4)/11.8  (clamped to [0.3, 2.7])
 * (Fant 1988 normalized R-params; Fant 1997 Eq. A1 Rd<->Rk inversion). It then
 * measures the source spectrum at harmonics of F0 and shows that:
 *   1. the source is voiced (non-silent, periodic at F0), and
 *   2. the spectral slope / H1-H2 varies sensibly with SQ (sweep 120 vs 300)
 *      and with OQ.
 *
 * Why this is the right instrument: H1-H2 (level of the 1st vs 2nd harmonic) and
 * overall spectral tilt are the canonical acoustic correlates of glottal source
 * shape. A steeper closing phase (higher SQ -> smaller Rk -> more modal/pressed)
 * flattens the spectrum and shrinks H1-H2; a softer source (lower SQ -> larger
 * Rk -> breathier) emphasises the fundamental and steepens the rolloff.
 *
 * References: Fant, Liljencrants & Lin 1985 (LF model); Fant 1988 (R-params);
 * Fant 1997 (Rd); Klatt & Klatt 1990 Tables XI/XII (SS=3, OQ, SQ).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const wasmPath = path.join(repoRoot, "public", "worklets", "lf-source.wasm");

const SAMPLE_RATE = 22050;
const DURATION_S = 1.0;
const F0_HZ = 120;

interface Exports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  lf_source_new(sampleRate: number): number;
  lf_source_set_mode(state: number, mode: number): void;
  lf_source_process(
    state: number,
    f0Ptr: number, f0Len: number,
    rdPtr: number, rdLen: number,
    oqPtr: number, oqLen: number,
    tlPtr: number, tlLen: number,
    flutter: number, jitter: number, di: number,
    outPtr: number, len: number,
  ): void;
}

function instantiate(): Exports {
  const bytes = fs.readFileSync(wasmPath);
  const inst = new WebAssembly.Instance(new WebAssembly.Module(bytes), {});
  return inst.exports as unknown as Exports;
}

function allocScalar(ex: Exports, value: number): number {
  const ptr = ex.alloc_f32(1);
  new Float32Array(ex.memory.buffer, ptr, 1)[0] = value;
  return ptr;
}

/** Map Klatt SQ -> crate Rd, exactly as klsyn88 semantics.yaml `lfRd`. */
function rdFromSq(sq: number): number {
  return Math.min(2.7, Math.max(0.3, (10000 / sq - 22.4) / 11.8));
}

/** Render the LF source with a Klatt OQ override and SQ-derived Rd. */
function render(ex: Exports, oq: number, sq: number, numSamples: number): Float32Array {
  const state = ex.lf_source_new(SAMPLE_RATE);
  ex.lf_source_set_mode(state, 1); // LFLM (matches klsyn88 lfModeVal)
  const f0 = allocScalar(ex, F0_HZ);
  const rd = allocScalar(ex, rdFromSq(sq));
  const oqp = allocScalar(ex, oq);
  const tlp = allocScalar(ex, 0); // tilt derived from Rd
  const block = 512;
  const outPtr = ex.alloc_f32(block);
  const out = new Float32Array(numSamples);
  let written = 0;
  while (written < numSamples) {
    const n = Math.min(block, numSamples - written);
    ex.lf_source_process(state, f0, 1, rd, 1, oqp, 1, tlp, 1, 0, 0, 0, outPtr, n);
    out.set(new Float32Array(ex.memory.buffer, outPtr, n), written);
    written += n;
  }
  return out;
}

/** Magnitude of the DFT at an exact frequency (Goertzel-style). */
function dftMag(sig: Float32Array, fsHz: number, freqHz: number): number {
  let re = 0, im = 0;
  for (let n = 0; n < sig.length; n++) {
    const phase = (-2 * Math.PI * freqHz * n) / fsHz;
    re += sig[n] * Math.cos(phase);
    im += sig[n] * Math.sin(phase);
  }
  return (2 / sig.length) * Math.sqrt(re * re + im * im);
}

function rms(sig: Float32Array): number {
  let s = 0;
  for (let i = 0; i < sig.length; i++) s += sig[i] * sig[i];
  return Math.sqrt(s / sig.length);
}

interface Spectrum {
  rms: number;
  h1: number;
  h2: number;
  h1h2Db: number;   // 20*log10(H1/H2): + = fundamental-dominant (softer source)
  tiltDb: number;   // low-band(1-5 harm) over high-band(11-20 harm), dB: higher = steeper rolloff
}

function analyze(sig: Float32Array): Spectrum {
  // Skip warm-up.
  const trimmed = sig.subarray(Math.round(0.1 * SAMPLE_RATE));
  const h: number[] = [];
  for (let k = 1; k <= 20; k++) h[k] = dftMag(trimmed, SAMPLE_RATE, k * F0_HZ);
  let low = 0, high = 0;
  for (let k = 1; k <= 5; k++) low += h[k] * h[k];
  for (let k = 11; k <= 20; k++) high += h[k] * h[k];
  const tiltDb = 10 * Math.log10(low / Math.max(high, 1e-12));
  return {
    rms: rms(trimmed),
    h1: h[1],
    h2: h[2],
    h1h2Db: 20 * Math.log10(h[1] / Math.max(h[2], 1e-12)),
    tiltDb,
  };
}

function fmt(s: Spectrum): string {
  return `rms=${s.rms.toFixed(4)} H1=${s.h1.toFixed(4)} H2=${s.h2.toFixed(4)} ` +
    `H1-H2=${s.h1h2Db.toFixed(2)}dB tilt(low/high)=${s.tiltDb.toFixed(2)}dB`;
}

function main(): void {
  const ex = instantiate();
  const N = Math.round(DURATION_S * SAMPLE_RATE);

  // SQ sweep at fixed OQ=50.
  const sqLow = analyze(render(ex, 50, 120, N));  // SQ=120 -> Rd=2.70 (softer)
  const sqHigh = analyze(render(ex, 50, 300, N)); // SQ=300 -> Rd=0.93 (more modal)
  // OQ sweep at fixed SQ=200.
  const oqLow = analyze(render(ex, 30, 200, N));
  const oqHigh = analyze(render(ex, 70, 200, N));

  console.log("=== LF SOURCE (SS=3) signature verification ===");
  console.log(`params: F0=${F0_HZ} Hz, LFLM mode, ${DURATION_S}s @ ${SAMPLE_RATE} Hz`);
  console.log(`SQ->Rd: 120->${rdFromSq(120).toFixed(3)}  200->${rdFromSq(200).toFixed(3)}  300->${rdFromSq(300).toFixed(3)}`);
  console.log("");
  console.log("SQ sweep (OQ=50 fixed):");
  console.log(`  SQ=120 (Rd=2.70): ${fmt(sqLow)}`);
  console.log(`  SQ=300 (Rd=0.93): ${fmt(sqHigh)}`);
  console.log("OQ sweep (SQ=200 fixed):");
  console.log(`  OQ=30: ${fmt(oqLow)}`);
  console.log(`  OQ=70: ${fmt(oqHigh)}`);
  console.log("");

  const checks: Array<[string, boolean]> = [
    ["LF source is voiced (rms > 0.01) at SQ=120", sqLow.rms > 0.01],
    ["LF source is voiced (rms > 0.01) at SQ=300", sqHigh.rms > 0.01],
    ["fundamental present (H1 > 0.01) both SQ", sqLow.h1 > 0.01 && sqHigh.h1 > 0.01],
    // Softer source (SQ=120/Rd=2.70) emphasises fundamental & rolls off faster:
    ["SQ=120 has larger H1-H2 than SQ=300 (softer source)", sqLow.h1h2Db > sqHigh.h1h2Db + 1.0],
    ["SQ=120 has steeper tilt than SQ=300", sqLow.tiltDb > sqHigh.tiltDb + 1.0],
    // OQ moves the glottal formant -> measurable H1-H2 change:
    ["OQ change moves H1-H2 by > 1 dB", Math.abs(oqLow.h1h2Db - oqHigh.h1h2Db) > 1.0],
  ];

  let allPass = true;
  console.log("Checks:");
  for (const [name, ok] of checks) {
    console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}`);
    if (!ok) allPass = false;
  }

  if (!allPass) {
    console.error("\nLF SOURCE signature verification FAILED");
    process.exitCode = 1;
    return;
  }
  console.log("\nLF SOURCE signature verification PASSED");
}

main();
