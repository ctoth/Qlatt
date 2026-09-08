import { readFileSync } from "node:fs";
import { load } from "js-yaml";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

interface Processor {
  ready: boolean;
  port: { postMessage(message: unknown): void };
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

it("exposes analytic source modes through the worklet and selectable experiments", () => {
  expect(Source.parameterDescriptors.find((p) => p.name === "lfMode")?.maxValue).toBe(4);
  for (const experiment of ["klatt80-baseline", "qlatt-beauty", "dectalk-english"]) {
    const semantics = load(
      readFileSync(`public/experiments/${experiment}/semantics.yaml`, "utf8"),
    ) as {
      params: Record<string, { range: number[] }>;
    };
    expect(semantics.params.lfMode.range).toEqual([0, 4]);
  }
});

it("renders both analytic modes through WASM and reports R++ projection without debug telemetry", async () => {
  const wasmBytes = Uint8Array.from(readFileSync("public/worklets/lf-source.wasm")).buffer;
  const render = async (mode: number, rd: number) => {
    const source = new Source({ processorOptions: { wasmBytes } });
    await vi.waitFor(() => expect(source.ready).toBe(true));
    const messages = vi.spyOn(source.port, "postMessage");
    const output = new Float32Array(882);
    const params = {
      f0: new Float32Array([100]),
      rd: new Float32Array([rd]),
      lfMode: new Float32Array([mode]),
    };
    source.process([], [[output]], params);
    expect(output.every(Number.isFinite)).toBe(true);
    expect(output.some((x) => Math.abs(x) > 0.1)).toBe(true);
    expect(output.slice(0, 441)).toEqual(output.slice(441));
    source.process([], [[new Float32Array(882)]], params);
    return { output, messages: messages.mock.calls.map(([message]) => message) };
  };
  const rpp = await render(3, 1);
  const rosenberg = await render(4, 1);
  expect(rpp.output).not.toEqual(rosenberg.output);
  expect(rpp.messages).toEqual([]);
  expect(rosenberg.messages).toEqual([]);
  const projected = await render(3, 0.3);
  expect(projected.messages).toEqual([
    expect.objectContaining({ type: "source-domain-projection" }),
  ]);
});

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

it("keeps bundled nonzero jitter presets within the percent range", () => {
  for (const file of [
    "policy/source-contour.yaml",
    "frontends/dectalk-english/source-contour.yaml",
  ]) {
    const policy = load(readFileSync(`public/rules/${file}`, "utf8")) as {
      voice_quality_presets: Record<string, { jitter: number }>;
    };
    for (const preset of Object.values(policy.voice_quality_presets)) {
      expect(preset.jitter).toBeGreaterThanOrEqual(0);
      expect(preset.jitter).toBeLessThanOrEqual(10);
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
