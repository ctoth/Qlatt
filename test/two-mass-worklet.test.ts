import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";

interface Processor {
  port: { onmessage: ((event: { data: { type: string } }) => void) | null; close(): void };
  messages: { type: string; message?: string }[];
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    params: Record<string, Float32Array>,
  ): boolean;
}

it("drives compiled two-mass WASM from the aerodynamic pressure port and handles lifecycle", async () => {
  const constructors = new Map<string, new (options: unknown) => Processor>();
  class MockProcessor {
    messages: { type: string; message?: string }[] = [];
    port = {
      onmessage: null,
      postMessage: (message: { type: string; message?: string }) => this.messages.push(message),
      close: vi.fn(),
    };
  }
  vi.stubGlobal("AudioWorkletProcessor", MockProcessor);
  vi.stubGlobal("registerProcessor", (name: string, ctor: new (options: unknown) => Processor) =>
    constructors.set(name, ctor),
  );
  vi.stubGlobal("sampleRate", 48000);
  const live: Processor[] = [];
  try {
    await import("../src/worklets/two-mass-source-processor.ts");
    await import("../src/worklets/aerodynamic-model-processor.ts");
    async function create(name: string) {
      const Constructor = constructors.get(`${name}-processor`);
      if (!Constructor) throw new Error(`Missing ${name}`);
      const processor = new Constructor({
        processorOptions: { wasmBytes: readFileSync(`public/worklets/${name}.wasm`) },
      });
      live.push(processor);
      await vi.waitFor(() =>
        expect(processor.messages).toContainEqual(expect.objectContaining({ type: "ready" })),
      );
      return processor;
    }
    const aero = await create("aerodynamic-model");
    const source = await create("two-mass-source");
    const control = await create("two-mass-source");
    const parameters = { asymmetry: new Float32Array([1]), enable: new Float32Array([1]) };
    const out = [new Float32Array(128)];
    const pressures = Array.from({ length: 9 }, () => [new Float32Array(128)]);
    const ps = new Float32Array([8]);
    let minimum = Infinity;
    let maximum = -Infinity;
    for (let block = 0; block < 400; block++) {
      // Ps is available even with legacy amplitude mapping (enable=0).
      aero.process([], pressures, { ps, enable: new Float32Array([0]) });
      expect(pressures[8][0][0]).toBe(8);
      source.process([pressures[8]], [out], parameters);
      if (block > 300)
        for (const value of out[0]) {
          minimum = Math.min(minimum, value);
          maximum = Math.max(maximum, value);
        }
    }
    expect(maximum - minimum).toBeGreaterThan(0.1);
    expect(minimum).toBeGreaterThanOrEqual(0);
    expect(maximum).toBeLessThan(2);
    source.process([], [out], parameters);
    expect(out[0].every((value) => value === 0)).toBe(true);
    source.process([pressures[8]], [out], { ...parameters, enable: new Float32Array([0]) });
    expect(out[0].every((value) => value === 0)).toBe(true);

    // Reset source matches a new source; growing buffers and partitioning
    // samples into worklet blocks must not alter the physical trajectory.
    const large = [new Float32Array(4096)];
    control.process([[new Float32Array(4096).fill(8)]], [large], parameters);
    const small = new Float32Array(4096);
    for (let offset = 0; offset < small.length; offset += 128) {
      source.process([pressures[8]], [out], parameters);
      small.set(out[0], offset);
    }
    expect(small).toEqual(large[0]);
    source.process([[new Float32Array(128).fill(Number.NaN)]], [out], parameters);
    expect(out[0].every((value) => value === 0)).toBe(true);
    expect(source.messages).toContainEqual(
      expect.objectContaining({
        type: "error",
        message: expect.stringContaining("Invalid two-mass"),
      }),
    );
    source.process([pressures[8]], [out], parameters);
    expect(out[0].some((value) => value > 0)).toBe(true);
    expect(out[0].every(Number.isFinite)).toBe(true);
    source.port.onmessage?.({ data: { type: "dispose" } });
    expect(source.process([pressures[8]], [out], parameters)).toBe(false);
  } finally {
    for (const processor of live) processor.port.onmessage?.({ data: { type: "dispose" } });
    vi.unstubAllGlobals();
  }
});
