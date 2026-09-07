import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

interface SourceProcessor {
  ready: boolean;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean;
}

type SourceConstructor = new (options: {
  processorOptions: { wasmBytes: ArrayBuffer };
}) => SourceProcessor;

let Source: SourceConstructor;
const wasmBytes = Uint8Array.from(
  readFileSync("public/worklets/oversampled-glottal-source.wasm"),
).buffer;

beforeAll(async () => {
  vi.stubGlobal("sampleRate", 44100);
  vi.stubGlobal(
    "AudioWorkletProcessor",
    class {
      port = { postMessage() {}, close() {}, onmessage: null };
    },
  );
  vi.stubGlobal("registerProcessor", (_name: string, ctor: SourceConstructor) => {
    Source = ctor;
  });
  await import("../src/worklets/oversampled-glottal-source-processor");
});

afterAll(() => vi.unstubAllGlobals());

async function createSource(): Promise<SourceProcessor> {
  const processor = new Source({ processorOptions: { wasmBytes } });
  await vi.waitFor(() => expect(processor.ready).toBe(true));
  return processor;
}

describe("oversampled source output connections", () => {
  // DECtalk's graph consumes voice port 0 and deliberately leaves noise port 1
  // disconnected. The source must still advance and emit its voiced waveform.
  it.each([0, 1])("renders connected port %i when the other port has no channels", async (port) => {
    const reference = await createSource();
    const isolated = await createSource();
    let peak = 0;
    let identical = true;
    for (let block = 0; block < 16; block++) {
      const expected = [[new Float32Array(128)], [new Float32Array(128)]];
      const actual: Float32Array[][] = [[], []];
      const channel = new Float32Array(128);
      actual[port] = [channel];
      expect(reference.process([], expected, {})).toBe(true);
      expect(isolated.process([], actual, {})).toBe(true);
      for (let sample = 0; sample < channel.length; sample++) {
        peak = Math.max(peak, Math.abs(channel[sample]));
        identical &&= channel[sample] === expected[port][0][sample];
      }
    }
    expect(peak).toBeGreaterThan(0);
    expect(identical).toBe(true);
  });
});
