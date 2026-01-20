import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initWasmModule, WasmBuffer } from "../worklets/wasm-utils.js";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const wasmPath = path.join(repoRoot, "worklets", "lf-source.wasm");
const goldenPath = path.join(repoRoot, "test", "golden", "klatt_paper.json");

const wasmBytes = fs.readFileSync(wasmPath);
const { instance } = await initWasmModule(null, {}, wasmBytes);
const wasm = instance.exports;

const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const target = golden.lfLm;
const expected = target.samples;

const sampleRate = golden.sampleRate;
const f0 = target.params.f0;
const rd = target.params.rd;
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

f0Buffer.view[0] = f0;
rdBuffer.view[0] = rd;

wasm.lf_source_process(
  state,
  f0Buffer.ptr,
  1,
  rdBuffer.ptr,
  1,
  outputBuffer.ptr,
  length
);

outputBuffer.refresh();

let maxDelta = 0;
let rmsError = 0;
for (let i = 0; i < length; i += 1) {
  const delta = outputBuffer.view[i] - expected[i];
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
