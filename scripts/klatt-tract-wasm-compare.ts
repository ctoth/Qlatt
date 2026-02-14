import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initWasmModule, WasmBuffer, type WasmAllocExports } from "../src/worklets/wasm-utils";

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");
const goldenPath = path.join(repoRoot, "test", "golden", "klatt_paper.json");

const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
const sampleRate = Number(golden.sampleRate);

interface ResonatorExports extends WasmAllocExports {
  resonator_new(): number;
  resonator_set_params(state: number, frequency: number, bandwidth: number, sampleRate: number): void;
  resonator_set_gain(state: number, gain: number): void;
  resonator_process(state: number, inputPtr: number, outputPtr: number, len: number): void;
}

interface AntiresonatorExports extends WasmAllocExports {
  antiresonator_new(): number;
  antiresonator_set_params(state: number, frequency: number, bandwidth: number, sampleRate: number): void;
  antiresonator_set_gain(state: number, gain: number): void;
  antiresonator_process(state: number, inputPtr: number, outputPtr: number, len: number): void;
}

function requireView(buffer: WasmBuffer): Float32Array {
  if (!buffer.view) {
    throw new Error("WasmBuffer view was not initialized.");
  }
  return buffer.view;
}

function rmsError(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = actual[i] - expected[i];
    sum += delta * delta;
  }
  return expected.length ? Math.sqrt(sum / expected.length) : 0;
}

function maxDelta(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  let max = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = Math.abs(actual[i] - expected[i]);
    if (delta > max) max = delta;
  }
  return max;
}

function maxAbs(values: ArrayLike<number>): number {
  let max = 0;
  for (let i = 0; i < values.length; i += 1) {
    const v = Math.abs(values[i]);
    if (v > max) max = v;
  }
  return max;
}

async function compareResonator() {
  const wasmPath = path.join(repoRoot, "public", "worklets", "resonator.wasm");
  const wasmBytes = fs.readFileSync(wasmPath);
  const moduleResult = await initWasmModule(null, {}, wasmBytes);
  const instance = "instance" in moduleResult ? moduleResult.instance : moduleResult;
  const wasm = instance.exports as unknown as ResonatorExports;

  const target = golden.resonator;
  const expected = target.impulse as number[];
  const length = expected.length;
  const freq = Number(target.params.frequency);
  const bw = Number(target.params.bandwidth);
  const gain = Number(target.params.gain);

  const state = wasm.resonator_new();
  wasm.resonator_set_params(state, freq, bw, sampleRate);
  wasm.resonator_set_gain(state, gain);

  const inputBuffer = new WasmBuffer(wasm);
  const outputBuffer = new WasmBuffer(wasm);
  inputBuffer.ensure(length);
  outputBuffer.ensure(length);
  const inputView = requireView(inputBuffer);
  inputView.fill(0);
  inputView[0] = 1.0;

  wasm.resonator_process(state, inputBuffer.ptr, outputBuffer.ptr, length);
  outputBuffer.refresh();

  const outputView = requireView(outputBuffer);
  return {
    name: "resonator",
    length,
    maxDelta: maxDelta(outputView, expected),
    rmsError: rmsError(outputView, expected),
    maxAbsExpected: maxAbs(expected),
  };
}

async function compareAntiresonator() {
  const wasmPath = path.join(repoRoot, "public", "worklets", "antiresonator.wasm");
  const wasmBytes = fs.readFileSync(wasmPath);
  const moduleResult = await initWasmModule(null, {}, wasmBytes);
  const instance = "instance" in moduleResult ? moduleResult.instance : moduleResult;
  const wasm = instance.exports as unknown as AntiresonatorExports;

  const target = golden.antiresonator;
  const expected = target.impulse as number[];
  const length = expected.length;
  const freq = Number(target.params.frequency);
  const bw = Number(target.params.bandwidth);
  const gain = Number(target.params.gain);

  const state = wasm.antiresonator_new();
  wasm.antiresonator_set_params(state, freq, bw, sampleRate);
  wasm.antiresonator_set_gain(state, gain);

  const inputBuffer = new WasmBuffer(wasm);
  const outputBuffer = new WasmBuffer(wasm);
  inputBuffer.ensure(length);
  outputBuffer.ensure(length);
  const inputView = requireView(inputBuffer);
  inputView.fill(0);
  inputView[0] = 1.0;

  wasm.antiresonator_process(state, inputBuffer.ptr, outputBuffer.ptr, length);
  outputBuffer.refresh();

  const outputView = requireView(outputBuffer);
  return {
    name: "antiresonator",
    length,
    maxDelta: maxDelta(outputView, expected),
    rmsError: rmsError(outputView, expected),
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
