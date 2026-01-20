import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initWasmModule, WasmBuffer } from "../worklets/wasm-utils.js";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const goldenPath = path.join(repoRoot, "test", "golden", "klatt_paper.json");

const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const sampleRate = golden.sampleRate;

function rmsError(actual, expected) {
  let sum = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = actual[i] - expected[i];
    sum += delta * delta;
  }
  return expected.length ? Math.sqrt(sum / expected.length) : 0;
}

function maxDelta(actual, expected) {
  let max = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = Math.abs(actual[i] - expected[i]);
    if (delta > max) max = delta;
  }
  return max;
}

function maxAbs(values) {
  let max = 0;
  for (let i = 0; i < values.length; i += 1) {
    const v = Math.abs(values[i]);
    if (v > max) max = v;
  }
  return max;
}

async function compareResonator() {
  const wasmPath = path.join(repoRoot, "worklets", "resonator.wasm");
  const wasmBytes = fs.readFileSync(wasmPath);
  const { instance } = await initWasmModule(null, {}, wasmBytes);
  const wasm = instance.exports;

  const target = golden.resonator;
  const expected = target.impulse;
  const length = expected.length;
  const freq = target.params.frequency;
  const bw = target.params.bandwidth;
  const gain = target.params.gain;

  const state = wasm.resonator_new();
  wasm.resonator_set_params(state, freq, bw, sampleRate);
  wasm.resonator_set_gain(state, gain);

  const inputBuffer = new WasmBuffer(wasm);
  const outputBuffer = new WasmBuffer(wasm);
  inputBuffer.ensure(length);
  outputBuffer.ensure(length);
  inputBuffer.view.fill(0);
  inputBuffer.view[0] = 1.0;

  wasm.resonator_process(state, inputBuffer.ptr, outputBuffer.ptr, length);
  outputBuffer.refresh();

  return {
    name: "resonator",
    length,
    maxDelta: maxDelta(outputBuffer.view, expected),
    rmsError: rmsError(outputBuffer.view, expected),
    maxAbsExpected: maxAbs(expected),
  };
}

async function compareAntiresonator() {
  const wasmPath = path.join(repoRoot, "worklets", "antiresonator.wasm");
  const wasmBytes = fs.readFileSync(wasmPath);
  const { instance } = await initWasmModule(null, {}, wasmBytes);
  const wasm = instance.exports;

  const target = golden.antiresonator;
  const expected = target.impulse;
  const length = expected.length;
  const freq = target.params.frequency;
  const bw = target.params.bandwidth;
  const gain = target.params.gain;

  const state = wasm.antiresonator_new();
  wasm.antiresonator_set_params(state, freq, bw, sampleRate);
  wasm.antiresonator_set_gain(state, gain);

  const inputBuffer = new WasmBuffer(wasm);
  const outputBuffer = new WasmBuffer(wasm);
  inputBuffer.ensure(length);
  outputBuffer.ensure(length);
  inputBuffer.view.fill(0);
  inputBuffer.view[0] = 1.0;

  wasm.antiresonator_process(state, inputBuffer.ptr, outputBuffer.ptr, length);
  outputBuffer.refresh();

  return {
    name: "antiresonator",
    length,
    maxDelta: maxDelta(outputBuffer.view, expected),
    rmsError: rmsError(outputBuffer.view, expected),
    maxAbsExpected: maxAbs(expected),
  };
}

const results = await Promise.all([compareResonator(), compareAntiresonator()]);
const payload = {
  sampleRate,
  results: results.map((result) => ({
    ...result,
    maxRelError: result.maxAbsExpected
      ? result.maxDelta / result.maxAbsExpected
      : 0,
  })),
};

console.log(JSON.stringify(payload, null, 2));

const maxAllowed = 1e-3;
const relAllowed = 1e-4;
for (const result of payload.results) {
  if (result.maxDelta > maxAllowed && result.maxRelError > relAllowed) {
    process.exitCode = 1;
    break;
  }
}
