import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";

const BLOCK_SIZE = 128;
const SAMPLE_RATE = 48_000;

const FILTERS = [
  "resonator",
  "antiresonator",
  "biquad-notch",
  "tilt-filter",
  "pitch-sync-mod",
  "fujisaki-resonator",
  "reconstruction-filter",
  "f0-filters",
];

const FILES = {
  resonator: ["resonator.wasm"],
  antiresonator: ["antiresonator.wasm"],
  "biquad-notch": ["biquad_notch.wasm", "biquad-notch.wasm"],
  "tilt-filter": ["tilt_filter.wasm", "tilt-filter.wasm"],
  "pitch-sync-mod": ["pitch_sync_mod.wasm", "pitch-sync-mod.wasm"],
  "fujisaki-resonator": ["fujisaki_resonator.wasm", "fujisaki-resonator.wasm"],
  "reconstruction-filter": ["reconstruction_filter.wasm", "reconstruction-filter.wasm"],
  "f0-filters": ["f0_filters.wasm", "f0-filters.wasm"],
};

const ITERATIONS = {
  resonator: 20_000,
  antiresonator: 20_000,
  "biquad-notch": 20_000,
  "tilt-filter": 10_000,
  "pitch-sync-mod": 2_000,
  "fujisaki-resonator": 20_000,
  "reconstruction-filter": 250,
  "f0-filters": 1_000,
};

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const baselineArg = argument("--baseline");
const candidateArg = argument("--candidate");
if (!baselineArg || !candidateArg) {
  console.error(
    "Usage: node scripts/filter-perf/harness.mjs --baseline <artifacts> --candidate <artifacts>",
  );
  process.exit(2);
}

const baselineDir = resolve(baselineArg);
const candidateDir = resolve(candidateArg);

function deterministicInput(blockIndex = 0) {
  let state = (0x9e3779b9 ^ blockIndex) >>> 0;
  const input = new Float32Array(BLOCK_SIZE);
  for (let index = 0; index < input.length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    input[index] = Math.fround(((state >>> 0) / 0xffff_ffff) * 2 - 1);
  }
  if (blockIndex === 0) input[0] = 1;
  if (blockIndex === 7) {
    input[0] = -0;
    input[1] = Number.NaN;
    input[2] = 0;
  }
  return input;
}

async function instantiate(directory, filter) {
  const artifact = FILES[filter]
    .map((name) => resolve(directory, name))
    .find((path) => existsSync(path));
  if (!artifact) throw new Error(`${filter}: no WASM artifact found under ${directory}`);
  const bytes = readFileSync(artifact);
  const { instance } = await WebAssembly.instantiate(bytes, {});
  return instance.exports;
}

function allocF32(wasm, length) {
  const ptr = wasm.alloc_f32(length);
  return {
    ptr,
    length,
    view: () => new Float32Array(wasm.memory.buffer, ptr, length),
  };
}

function allocF64(wasm, valuesOrLength) {
  const values = typeof valuesOrLength === "number" ? null : Float64Array.from(valuesOrLength);
  const length = values?.length ?? valuesOrLength;
  const allocationLength = length * 2;
  const ptr = wasm.alloc_f32(allocationLength);
  const buffer = {
    ptr,
    length,
    allocationLength,
    view: () => new Float64Array(wasm.memory.buffer, ptr, length),
  };
  if (values) buffer.view().set(values);
  return buffer;
}

function bitsOfF32(values) {
  const copy = Float32Array.from(values);
  return new Uint32Array(copy.buffer).slice();
}

function bitsOfF64(values) {
  const copy = Float64Array.from(values);
  return new BigUint64Array(copy.buffer).slice();
}

function append(target, values) {
  for (const value of values) target.push(value);
}

function assertBitIdentical(filter, baseline, candidate) {
  if (baseline.length !== candidate.length) {
    throw new Error(`${filter}: output lengths differ (${baseline.length} != ${candidate.length})`);
  }
  for (let index = 0; index < baseline.length; index += 1) {
    if (baseline[index] !== candidate[index]) {
      throw new Error(
        `${filter}: first bit mismatch at output ${index}: 0x${baseline[index].toString(16)} != 0x${candidate[index].toString(16)}`,
      );
    }
  }
}

function simpleIirRunner(wasm, prefix, scenarios, cacheSetters) {
  const state = wasm[`${prefix}_new`]();
  const input = allocF32(wasm, BLOCK_SIZE);
  const output = allocF32(wasm, BLOCK_SIZE);
  let blockIndex = 0;
  let lastFrequency = Number.NaN;
  let lastBandwidth = Number.NaN;
  let lastGain = Number.NaN;

  function setScenario(scenario) {
    const [frequency, bandwidth] = scenario.params;
    if (
      !cacheSetters ||
      !Number.isFinite(frequency) ||
      !Number.isFinite(bandwidth) ||
      !Object.is(frequency, lastFrequency) ||
      !Object.is(bandwidth, lastBandwidth)
    ) {
      wasm[`${prefix}_set_params`](state, ...scenario.params);
      lastFrequency = frequency;
      lastBandwidth = bandwidth;
    }
    if (wasm[`${prefix}_set_gain`] && (!cacheSetters || !Object.is(scenario.gain, lastGain))) {
      wasm[`${prefix}_set_gain`](state, scenario.gain);
      lastGain = scenario.gain;
    }
  }

  function runScenario(scenario) {
    setScenario(scenario);
    input.view().set(deterministicInput(blockIndex));
    wasm[`${prefix}_process`](state, input.ptr, output.ptr, BLOCK_SIZE);
    blockIndex += 1;
    return output.view();
  }

  return {
    capture() {
      const values = [];
      for (const scenario of scenarios) append(values, runScenario(scenario));
      return bitsOfF32(values);
    },
    run(iterations) {
      const scenario = scenarios[0];
      input.view().set(deterministicInput(99));
      for (let index = 0; index < iterations; index += 1) {
        setScenario(scenario);
        wasm[`${prefix}_process`](state, input.ptr, output.ptr, BLOCK_SIZE);
      }
      return output.view()[BLOCK_SIZE - 1];
    },
    samplesPerIteration: BLOCK_SIZE,
  };
}

function tiltRunner(wasm) {
  const state = wasm.tilt_filter_new();
  const input = allocF32(wasm, BLOCK_SIZE);
  const output = allocF32(wasm, BLOCK_SIZE);
  const rendered = new Float32Array(BLOCK_SIZE);
  const hasBlock = typeof wasm.tilt_filter_process_block === "function";

  function processBlock(block, tilt) {
    wasm.tilt_filter_set_tilt(state, tilt);
    input.view().set(block);
    if (hasBlock) {
      wasm.tilt_filter_process_block(state, input.ptr, output.ptr, BLOCK_SIZE);
      rendered.set(output.view());
    } else {
      for (let index = 0; index < BLOCK_SIZE; index += 1) {
        rendered[index] = wasm.tilt_filter_process(state, block[index] || 0);
      }
    }
    return rendered;
  }

  return {
    capture() {
      const values = [];
      for (const [blockIndex, tilt] of [
        [0, 0],
        [1, 17],
        [2, 34],
        [3, -20],
        [7, 17],
      ]) {
        append(values, processBlock(deterministicInput(blockIndex), tilt));
      }
      return bitsOfF32(values);
    },
    run(iterations) {
      const block = deterministicInput(99);
      wasm.tilt_filter_set_tilt(state, 17);
      input.view().set(block);
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        if (hasBlock) {
          input.view().set(block);
          wasm.tilt_filter_process_block(state, input.ptr, output.ptr, BLOCK_SIZE);
          rendered.set(output.view());
        } else {
          for (let index = 0; index < BLOCK_SIZE; index += 1) {
            rendered[index] = wasm.tilt_filter_process(state, block[index] || 0);
          }
        }
      }
      return rendered[BLOCK_SIZE - 1];
    },
    samplesPerIteration: BLOCK_SIZE,
  };
}

function pitchSyncRunner(wasm) {
  const state = wasm.pitch_sync_resonator_new(SAMPLE_RATE);
  const input = allocF32(wasm, BLOCK_SIZE);
  const output = allocF32(wasm, BLOCK_SIZE);
  const f0 = allocF32(wasm, BLOCK_SIZE);
  const f1 = allocF32(wasm, BLOCK_SIZE);
  const b1 = allocF32(wasm, BLOCK_SIZE);
  const dF1 = allocF32(wasm, BLOCK_SIZE);
  const dB1 = allocF32(wasm, BLOCK_SIZE);
  const rendered = new Float32Array(BLOCK_SIZE);
  const parameterValues = Array.from({ length: 5 }, () => new Float32Array(BLOCK_SIZE));
  const hasBlock = typeof wasm.pitch_sync_resonator_process_block === "function";

  function fillParams(blockIndex, automated) {
    const bases = [110, 500, 80, 90, 40];
    for (let parameter = 0; parameter < parameterValues.length; parameter += 1) {
      const view = parameterValues[parameter];
      for (let index = 0; index < BLOCK_SIZE; index += 1) {
        const modulation = automated ? ((index + blockIndex * 7) % 23) - 11 : 0;
        view[index] = Math.fround(bases[parameter] + modulation);
      }
    }
  }

  function processBlock(blockIndex, automated) {
    const block = deterministicInput(blockIndex);
    fillParams(blockIndex, automated);
    const lengths = automated ? BLOCK_SIZE : 1;
    if (hasBlock) {
      input.view().set(block);
      for (const [buffer, values] of [
        [f0, parameterValues[0]],
        [f1, parameterValues[1]],
        [b1, parameterValues[2]],
        [dF1, parameterValues[3]],
        [dB1, parameterValues[4]],
      ]) {
        buffer.view().set(values.subarray(0, lengths));
      }
      wasm.pitch_sync_resonator_process_block(
        state,
        input.ptr,
        output.ptr,
        BLOCK_SIZE,
        f0.ptr,
        lengths,
        50,
        f1.ptr,
        lengths,
        b1.ptr,
        lengths,
        dF1.ptr,
        lengths,
        dB1.ptr,
        lengths,
        0,
        2,
      );
      rendered.set(output.view());
    } else {
      const [f0v, f1v, b1v, dF1v, dB1v] = parameterValues;
      for (let index = 0; index < BLOCK_SIZE; index += 1) {
        const parameterIndex = automated ? index : 0;
        rendered[index] = wasm.pitch_sync_resonator_process(
          state,
          block[index] || 0,
          f0v[parameterIndex],
          50,
          f1v[parameterIndex],
          b1v[parameterIndex],
          dF1v[parameterIndex],
          dB1v[parameterIndex],
          0,
          2,
        );
      }
    }
    return rendered;
  }

  return {
    capture() {
      const values = [];
      append(values, processBlock(0, false));
      append(values, processBlock(1, true));
      append(values, processBlock(2, false));
      append(values, processBlock(7, true));
      return bitsOfF32(values);
    },
    run(iterations) {
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        processBlock(99, true);
      }
      return rendered[BLOCK_SIZE - 1];
    },
    samplesPerIteration: BLOCK_SIZE,
  };
}

function reconstructionRunner(wasm) {
  const state = wasm.reconstruction_filter_new(SAMPLE_RATE);
  const input = allocF32(wasm, BLOCK_SIZE);
  const output = allocF32(wasm, BLOCK_SIZE);

  function processBlock(blockIndex) {
    input.view().set(deterministicInput(blockIndex));
    wasm.reconstruction_filter_process(state, input.ptr, output.ptr, BLOCK_SIZE);
    return output.view();
  }

  return {
    capture() {
      const values = [];
      for (let block = 0; block < 8; block += 1) append(values, processBlock(block));
      return bitsOfF32(values);
    },
    run(iterations) {
      input.view().set(deterministicInput(99));
      for (let index = 0; index < iterations; index += 1) {
        wasm.reconstruction_filter_process(state, input.ptr, output.ptr, BLOCK_SIZE);
      }
      return output.view()[BLOCK_SIZE - 1];
    },
    samplesPerIteration: BLOCK_SIZE,
  };
}

function f0Runner(wasm) {
  const frameCount = 256;
  const scalars = allocF64(wasm, [
    0.005,
    frameCount * 0.005,
    1,
    0.15,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    4096,
    0.1,
    -1e9,
    1e9,
    0,
    0,
  ]);
  const layers = allocF64(wasm, [1, 0, 4, 0.01, 0.9, 0, 2]);
  const commands = allocF64(wasm, [0, 100, 0, 0, 0, 0.5, -30, 0, 0, 0]);
  const output = allocF64(wasm, frameCount);

  function render() {
    const status = wasm.render_f0(
      scalars.ptr,
      scalars.length,
      layers.ptr,
      1,
      commands.ptr,
      2,
      0,
      0,
      output.ptr,
      frameCount,
    );
    if (status !== 0) throw new Error(`f0-filters: render_f0 returned ${status}`);
  }

  return {
    capture() {
      const values = [];

      // One-pole control filter.
      render();
      append(values, output.view());

      // Generic two-pole IIR control filter.
      const scalarView = scalars.view();
      scalarView[2] = 0;
      scalarView[4] = 0.01;
      scalarView[5] = 0.02;
      scalarView[6] = 0.01;
      scalarView[7] = -1.7;
      scalarView[8] = 0.72;
      render();
      append(values, output.view());

      // DECtalk signed-Q14 coefficient filter.
      scalarView[2] = 2;
      scalarView[3] = 2100 / 16384;
      scalarView[4] = 0;
      scalarView[5] = 0;
      scalarView[6] = 0;
      scalarView[7] = 0;
      scalarView[8] = 0;
      scalarView[16] = 100;
      render();
      append(values, output.view());

      // Restore the benchmark's representative one-pole setup.
      scalarView[2] = 1;
      scalarView[3] = 0.15;
      scalarView[16] = 0;
      return bitsOfF64(values);
    },
    run(iterations) {
      for (let index = 0; index < iterations; index += 1) render();
      return output.view()[frameCount - 1];
    },
    samplesPerIteration: frameCount,
  };
}

async function makeRunner(directory, filter, cacheSetters = false) {
  const wasm = await instantiate(directory, filter);
  switch (filter) {
    case "resonator":
      return simpleIirRunner(
        wasm,
        "resonator",
        [
          { params: [500, 80, SAMPLE_RATE], gain: 0.75 },
          { params: [500, 80, SAMPLE_RATE], gain: 0.75 },
          { params: [2_500, 160, SAMPLE_RATE], gain: -1.25 },
          { params: [-1, 80, SAMPLE_RATE], gain: 1 },
        ],
        cacheSetters,
      );
    case "antiresonator":
      return simpleIirRunner(
        wasm,
        "antiresonator",
        [
          { params: [300, 90, SAMPLE_RATE], gain: 0.75 },
          { params: [300, 90, SAMPLE_RATE], gain: 0.75 },
          { params: [2_500, 160, SAMPLE_RATE], gain: -1.25 },
          { params: [0, 80, SAMPLE_RATE], gain: 1 },
        ],
        cacheSetters,
      );
    case "biquad-notch":
      return simpleIirRunner(
        wasm,
        "biquad_notch",
        [
          { params: [480, 100, SAMPLE_RATE], gain: 0.75 },
          { params: [480, 100, SAMPLE_RATE], gain: 0.75 },
          { params: [2_500, 160, SAMPLE_RATE], gain: -1.25 },
          { params: [0, 80, SAMPLE_RATE], gain: 1 },
        ],
        cacheSetters,
      );
    case "fujisaki-resonator":
      return simpleIirRunner(
        wasm,
        "fujisaki_resonator",
        [
          { params: [700, 80, SAMPLE_RATE], gain: 1 },
          { params: [700, 80, SAMPLE_RATE], gain: 1 },
          { params: [300, 90, SAMPLE_RATE], gain: 1 },
          { params: [900, 110, SAMPLE_RATE], gain: 1 },
        ],
        cacheSetters,
      );
    case "tilt-filter":
      return tiltRunner(wasm);
    case "pitch-sync-mod":
      return pitchSyncRunner(wasm);
    case "reconstruction-filter":
      return reconstructionRunner(wasm);
    case "f0-filters":
      return f0Runner(wasm);
    default:
      throw new Error(`unknown filter: ${filter}`);
  }
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

async function benchmarkPair(filter) {
  const baseline = await makeRunner(baselineDir, filter, false);
  const candidate = await makeRunner(candidateDir, filter, true);
  const iterations = ITERATIONS[filter];
  const warmIterations = Math.max(1, Math.floor(iterations / 20));
  baseline.run(warmIterations);
  candidate.run(warmIterations);
  const samples = iterations * baseline.samplesPerIteration;
  const timings = { baseline: [], candidate: [] };
  const checksums = { baseline: 0, candidate: 0 };

  function time(label, runner) {
    const start = performance.now();
    checksums[label] += runner.run(iterations);
    timings[label].push(((performance.now() - start) * 1e6) / samples);
  }

  for (let round = 0; round < 7; round += 1) {
    if (round % 2 === 0) {
      time("baseline", baseline);
      time("candidate", candidate);
    } else {
      time("candidate", candidate);
      time("baseline", baseline);
    }
  }
  if (Number.isNaN(checksums.baseline) || Number.isNaN(checksums.candidate)) {
    throw new Error(`${filter}: benchmark checksum is NaN`);
  }
  return {
    baseline: median(timings.baseline),
    candidate: median(timings.candidate),
  };
}

const rows = [];
for (const filter of FILTERS) {
  const baselineCorrectness = await makeRunner(baselineDir, filter, false);
  const candidateCorrectness = await makeRunner(candidateDir, filter, true);
  assertBitIdentical(filter, baselineCorrectness.capture(), candidateCorrectness.capture());

  const timing = await benchmarkPair(filter);
  const baselineNs = timing.baseline;
  const candidateNs = timing.candidate;
  rows.push({
    filter,
    bitIdentical: "yes",
    baselineNs: baselineNs.toFixed(2),
    candidateNs: candidateNs.toFixed(2),
    speedup: (baselineNs / candidateNs).toFixed(2),
  });
}

console.table(rows);
