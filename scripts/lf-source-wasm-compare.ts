import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initWasmModule, WasmBuffer, type WasmAllocExports } from "../src/worklets/wasm-utils";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const wasmPath = path.join(repoRoot, "public", "worklets", "lf-source.wasm");
const goldenPath = path.join(repoRoot, "test", "golden", "klatt_paper.json");

const wasmBytes = fs.readFileSync(wasmPath);
const moduleResult = await initWasmModule(null, {}, wasmBytes);
const instance = "instance" in moduleResult ? moduleResult.instance : moduleResult;
interface LfSourceExports extends WasmAllocExports {
  lf_source_new(sampleRate: number): number;
  lf_source_set_mode?(state: number, mode: number): void;
  lf_source_process(
    state: number,
    f0Ptr: number,
    f0Len: number,
    rdPtr: number,
    rdLen: number,
    oqPtr: number,
    oqLen: number,
    tlPtr: number,
    tlLen: number,
    flutter: number,
    jitter: number,
    di: number,
    outPtr: number,
    len: number
  ): void;
}

const wasm = instance.exports as unknown as LfSourceExports;

const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const target = golden.lfLm;
const expected = target.samples as number[];

const sampleRate = Number(golden.sampleRate);
const f0 = Number(target.params.f0);
const rd = Number(target.params.rd);
const length = expected.length;

const state = wasm.lf_source_new(sampleRate);
if (wasm.lf_source_set_mode) {
  wasm.lf_source_set_mode(state, 1);
}

const outputBuffer = new WasmBuffer(wasm);
const f0Buffer = new WasmBuffer(wasm);
const rdBuffer = new WasmBuffer(wasm);

outputBuffer.ensure(length);
f0Buffer.ensure(1);
rdBuffer.ensure(1);

if (!f0Buffer.view || !rdBuffer.view) {
  throw new Error("Failed to initialize f0/rd buffers.");
}
f0Buffer.view[0] = f0;
rdBuffer.view[0] = rd;

// 14-arg ABI: oq/tl overrides (0 = derive from Rd) and flutter/jitter/di all
// disabled so this golden exercises the pure Rd-driven LFLM path.
wasm.lf_source_process(
  state,
  f0Buffer.ptr,
  1,
  rdBuffer.ptr,
  1,
  0, // oqPtr (null -> derive OQ from Rd)
  0, // oqLen
  0, // tlPtr (null -> derive tilt from Rd)
  0, // tlLen
  0, // flutter
  0, // jitter
  0, // di
  outputBuffer.ptr,
  length
);

outputBuffer.refresh();
if (!outputBuffer.view) {
  throw new Error("Output buffer view was not initialized.");
}
const outputView = outputBuffer.view;

let maxDelta = 0;
let rmsError = 0;
for (let i = 0; i < length; i += 1) {
  const delta = outputView[i] - expected[i];
  const ad = Math.abs(delta);
  if (ad > maxDelta) maxDelta = ad;
  rmsError += delta * delta;
}
rmsError = length ? Math.sqrt(rmsError / length) : 0;

console.log(
  JSON.stringify(
    {
      sampleRate,
      length,
      maxDelta,
      rmsError,
    },
    null,
    2
  )
);

const maxAllowed = 1e-5;
if (maxDelta > maxAllowed) {
  process.exitCode = 1;
}
