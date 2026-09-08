import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";

it("initializes the compiled frication source and reports readiness", async () => {
  let construct: new (options: unknown) => unknown;
  let receive: (message: { type: string; message?: string }) => void;
  const ready = new Promise<{ type: string; message?: string }>((resolve) => {
    receive = resolve;
  });
  class Processor {
    port = {
      onmessage: null,
      postMessage(message: { type: string; message?: string }) {
        receive(message);
      },
    };
  }
  vi.stubGlobal("AudioWorkletProcessor", Processor);
  vi.stubGlobal("registerProcessor", (_name: string, ctor: typeof construct) => {
    construct = ctor;
  });
  vi.stubGlobal("sampleRate", 22000);
  try {
    await import("../src/worklets/frication-source-processor.ts");
    const moduleBytes = readFileSync("public/worklets/frication-source.wasm");
    const storage = new Uint8Array(moduleBytes.byteLength + 16);
    storage.fill(0xff);
    storage.set(moduleBytes, 8);
    const wasmBytes = storage.subarray(8, 8 + moduleBytes.byteLength);
    new construct!({ processorOptions: { wasmBytes, seed: 51, nodeId: "probe" } });
    expect(await ready).toEqual({ type: "ready", node: "probe" });
  } finally {
    vi.unstubAllGlobals();
  }
});
