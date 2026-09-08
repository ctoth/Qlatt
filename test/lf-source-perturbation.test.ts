import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

interface Processor {
  ready: boolean;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}
interface Constructor {
  new (options: { processorOptions: { wasmBytes: ArrayBuffer } }): Processor;
  parameterDescriptors: {
    name: string;
    defaultValue: number;
    minValue: number;
    maxValue: number;
  }[];
}
let Source: Constructor;
beforeAll(async () => {
  vi.stubGlobal("sampleRate", 44100);
  vi.stubGlobal(
    "AudioWorkletProcessor",
    class {
      port = { postMessage() {}, close() {}, onmessage: null };
    },
  );
  vi.stubGlobal("registerProcessor", (_name: string, ctor: Constructor) => {
    Source = ctor;
  });
  await import("../src/worklets/lf-source-processor");
});
afterAll(() => vi.unstubAllGlobals());

it("declares percent CV controls from semantics through worklet", () => {
  for (const name of ["jitter", "shimmer"]) {
    expect(Source.parameterDescriptors.find((p) => p.name === name)).toMatchObject({
      defaultValue: 0,
      minValue: 0,
      maxValue: 10,
    });
    for (const experiment of ["klatt80-baseline", "qlatt-beauty", "klsyn88"]) {
      const semantics = load(
        readFileSync(`public/experiments/${experiment}/semantics.yaml`, "utf8"),
      ) as {
        params: Record<string, unknown>;
      };
      expect(semantics.params[name]).toMatchObject({ default: 0, range: [0, 10], unit: "%" });
    }
    for (const experiment of ["klatt80-baseline", "qlatt-beauty", "klsyn88", "dectalk-english"]) {
      const graph = load(readFileSync(`public/experiments/${experiment}/graph.yaml`, "utf8")) as {
        nodes: Record<string, { type: string; params: Record<string, unknown> }>;
      };
      const source = Object.values(graph.nodes).find((node) => node.type === "lf-source");
      expect(source?.params[name]).toEqual({ bind: name });
    }
  }
});

it("routes shimmer to WASM, preserves cycle timing, and is deterministic across block sizes", async () => {
  const wasmBytes = Uint8Array.from(readFileSync("public/worklets/lf-source.wasm")).buffer;
  async function render(shimmer: number, blockSize: number) {
    const source = new Source({ processorOptions: { wasmBytes } });
    await vi.waitFor(() => expect(source.ready).toBe(true));
    const result = new Float32Array(128 * 317);
    for (let start = 0; start < result.length; start += blockSize) {
      const out = result.subarray(start, Math.min(start + blockSize, result.length));
      source.process([], [[out]], {
        f0: new Float32Array([100]),
        rd: new Float32Array([1]),
        shimmer: new Float32Array([shimmer]),
      });
    }
    return result;
  }
  const neutral = await render(0, 128);
  const shimmer = await render(1, 128);
  expect(await render(1, 317)).toEqual(shimmer);
  let changed = false;
  for (let start = 441; start + 441 <= neutral.length; start += 441) {
    // Shimmer multiplies the waveform by one gain for each entire cycle.
    const gain = shimmer[start] / neutral[start];
    for (let i = start; i < start + 441; i++) {
      expect(shimmer[i]).toBeCloseTo(neutral[i] * gain, 6);
    }
    changed ||= Math.abs(gain - 1) > 0.001;
  }
  expect(changed).toBe(true);
});
