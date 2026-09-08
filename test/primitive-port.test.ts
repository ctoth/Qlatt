import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { afterEach, expect, it, vi } from "vitest";
import { KlattSynth } from "../src/klatt-synth";
import reference from "./fixtures/primitive-port-reference.json";

interface Processor {
  messages: { type: string }[];
  port: { onmessage: (event: { data: { type: string } }) => void };
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    params: Record<string, Float32Array>,
  ): boolean;
}
afterEach(() => vi.unstubAllGlobals());

it("the standalone synth supplies WASM bytes to every ported worklet", async () => {
  const bytes = new Map<string, ArrayBuffer>();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const file = url.split("/").pop()!.split("?")[0];
      const buffer = new ArrayBuffer(8);
      bytes.set(file, buffer);
      return { arrayBuffer: async () => buffer };
    }),
  );
  const created: { name: string; options: AudioWorkletNodeOptions }[] = [];
  vi.stubGlobal(
    "AudioWorkletNode",
    class {
      port = { onmessage: null };
      constructor(_ctx: unknown, name: string, options: AudioWorkletNodeOptions) {
        created.push({ name, options });
      }
    },
  );
  const ctx = {
    createGain: () => ({ gain: { value: 0 } }),
    createConstantSource: () => ({ offset: { value: 0 }, start() {} }),
  } as unknown as AudioContext;
  const synth = new KlattSynth(ctx, { noiseSeed: 51 });
  await synth._loadWasmBytes("/worklets/");
  synth._createNodes();
  for (const name of [
    "impulse-train",
    "noise-source",
    "differentiator",
    "chalker-radiation",
    "glottal-mod",
  ]) {
    expect(bytes.has(`${name}.wasm`)).toBe(true);
    const nodes = created.filter((entry) => entry.name === `${name}-processor`);
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes)
      expect(node.options.processorOptions.wasmBytes).toBe(bytes.get(`${name}.wasm`));
  }
  const noise = created.filter((entry) => entry.name === "noise-source-processor");
  expect(noise[0].options.processorOptions.seed).not.toBe(noise[1].options.processorOptions.seed);
});

async function loadProcessor(name: string) {
  vi.resetModules();
  let Constructor!: new (options: unknown) => Processor;
  vi.stubGlobal(
    "AudioWorkletProcessor",
    class {
      messages: { type: string }[] = [];
      port = {
        onmessage: null,
        close() {},
        postMessage: (message: { type: string }) => this.messages.push(message),
      };
    },
  );
  vi.stubGlobal("sampleRate", 48000);
  vi.stubGlobal("registerProcessor", (_name: string, ctor: typeof Constructor) => {
    Constructor = ctor;
  });
  await import(`../src/worklets/${name}-processor.ts`);
  return (seed = 51) =>
    new Constructor({
      processorOptions: { seed, wasmBytes: readFileSync(`public/worklets/${name}.wasm`) },
    });
}

it("replays explicit seeds, preserves disconnected modulation, and resets the Rust noise state", async () => {
  const create = await loadProcessor("noise-source");
  const processors = [create(51), create(51), create(52), create(0), create(1)];
  for (const processor of processors)
    await vi.waitFor(() =>
      expect(processor.messages).toContainEqual(expect.objectContaining({ type: "ready" })),
    );
  const params = { gain: new Float32Array([1]), cutoff: new Float32Array([1000]) };
  const outputs = processors.map(() => new Float32Array(1024));
  processors[0].process([], [[outputs[0]]], params);
  for (let offset = 0; offset < 1024; offset += 128) {
    processors[1].process(
      [[new Float32Array(128).fill(1)]],
      [[outputs[1].subarray(offset, offset + 128)]],
      params,
    );
  }
  for (let i = 2; i < processors.length; i++) processors[i].process([], [[outputs[i]]], params);
  expect(outputs[0]).toEqual(outputs[1]);
  expect(outputs[0]).not.toEqual(outputs[2]);
  expect(outputs[3]).toEqual(outputs[4]);
  processors[0].port.onmessage({ data: { type: "reset" } });
  const reset = new Float32Array(1024);
  processors[0].process([], [[reset]], params);
  expect(reset).toEqual(outputs[0]);
  for (const processor of processors) processor.port.onmessage({ data: { type: "dispose" } });
});

for (const name of ["differentiator", "chalker-radiation"]) {
  it(`${name} keeps independent channel histories`, async () => {
    const create = await loadProcessor(name);
    const stereo = create();
    const mono = create();
    for (const processor of [stereo, mono])
      await vi.waitFor(() =>
        expect(processor.messages).toContainEqual(expect.objectContaining({ type: "ready" })),
      );
    for (let block = 0; block < 3; block++) {
      const signal = Float32Array.from({ length: 128 }, (_, i) => Math.sin(block * 128 + i));
      const channels = [new Float32Array(128), new Float32Array(128)];
      const control = new Float32Array(128);
      stereo.process([[signal, new Float32Array(128)]], [channels], {});
      mono.process([[signal]], [[control]], {});
      expect(channels[0]).toEqual(control);
      expect(channels[1].every((x) => x === 0)).toBe(true);
    }
    for (const processor of [stereo, mono]) processor.port.onmessage({ data: { type: "dispose" } });
  });
}

it("outputs silence before initialization and never reports ready after early disposal", async () => {
  const create = await loadProcessor("noise-source");
  const processor = create();
  const out = new Float32Array(128).fill(1);
  expect(processor.process([], [[out]], {})).toBe(true);
  expect(out.every((value) => value === 0)).toBe(true);
  processor.port.onmessage({ data: { type: "dispose" } });
  // Waiting for a second instance also settles the shared module load.
  const control = create();
  await vi.waitFor(() =>
    expect(control.messages).toContainEqual(expect.objectContaining({ type: "ready" })),
  );
  expect(processor.messages).toEqual([]);
  expect(processor.process([], [[out]], {})).toBe(false);
  control.port.onmessage({ data: { type: "dispose" } });
});

it("gives all five primitives a spec-owned WASM binding", () => {
  for (const experiment of ["klatt80-baseline", "qlatt-beauty", "klsyn88"]) {
    const registry = load(
      readFileSync(`public/experiments/${experiment}/registry.yaml`, "utf8"),
    ) as { primitives: Record<string, { wasm?: string }> };
    for (const name of new Set(reference.cases.map((entry) => entry.name))) {
      if (experiment === "klsyn88" && name === "chalker-radiation") continue;
      expect(registry.primitives[name].wasm).toBe(`${name}.wasm`);
    }
  }
});

for (const entry of reference.cases) {
  it(`${entry.name} preserves pre-port samples at ${entry.rate} Hz across blocks and parameter changes`, async () => {
    vi.resetModules();
    let Constructor!: new (options: unknown) => Processor;
    let report!: (value: unknown) => void;
    const ready = new Promise((resolve) => {
      report = resolve;
    });
    vi.stubGlobal(
      "AudioWorkletProcessor",
      class {
        port = { onmessage: null, postMessage: report, close() {} };
      },
    );
    vi.stubGlobal("sampleRate", entry.rate);
    vi.stubGlobal("registerProcessor", (_name: string, ctor: typeof Constructor) => {
      Constructor = ctor;
    });
    await import(`../src/worklets/${entry.name}-processor.ts`);
    const processor = new Constructor({
      processorOptions: {
        seed: 51,
        wasmBytes: readFileSync(`public/worklets/${entry.name}.wasm`),
      },
    });
    expect(await ready).toMatchObject({ type: "ready" });
    const bytes = Buffer.from(entry.samples, "base64");
    const expected = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    for (let block = 0; block < 8; block++) {
      const input = Float32Array.from({ length: 128 }, (_, i) =>
        Math.sin((block * 128 + i) * 0.17),
      );
      const output = new Float32Array(128);
      expect(
        processor.process([[input]], [[output]], {
          f0: Float32Array.from({ length: 128 }, (_, i) =>
            block === 3 ? 0 : 110 + Math.floor((block * 128 + i) / 200) * 20,
          ),
          gain: Float32Array.from({ length: 128 }, (_, i) => i / 128),
          openPhaseRatio: new Float32Array([block < 4 ? 0.7 : 0.4]),
          cutoff: new Float32Array([block < 4 ? 1000 : 4000]),
          oq: new Float32Array([block < 4 ? 0.5 : 0.7]),
        }),
      ).toBe(true);
      for (let i = 0; i < 128; i++) expect(output[i]).toBeCloseTo(expected[block * 128 + i], 6);
    }
    processor.port.onmessage({ data: { type: "dispose" } });
    expect(processor.process([], [[new Float32Array(128)]], {})).toBe(false);
  });
}
