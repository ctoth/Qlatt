import {
  type BaseProcessorOptions,
  computeRmsPeak,
  initWasmModule,
  resolveWasmUrl,
} from "./wasm-utils.js";

interface SampleExports {
  processor_new(rate: number, seed: number): number;
  processor_sample(state: number, input: number, a: number, b: number, c: number): number;
  processor_free(state: number): void;
}
interface SampleOptions extends BaseProcessorOptions {
  processorOptions?: NonNullable<BaseProcessorOptions["processorOptions"]> & { seed?: number };
}

/** Lifecycle and channel ownership for the Rust sample ABI; no DSP lives here. */
export abstract class WasmSampleProcessor extends AudioWorkletProcessor {
  private wasm: SampleExports | null = null;
  private states: number[] = [];
  private disposed = false;
  private readonly seed: number;
  private readonly nodeId: string;
  private readonly debug: boolean;
  private readonly interval: number;
  private countdown: number;

  constructor(options: unknown, primitive: string, defaultNodeId: string) {
    super(options);
    const settings = (options as SampleOptions | undefined)?.processorOptions;
    this.nodeId = settings?.nodeId || defaultNodeId;
    this.debug = Boolean(settings?.debug);
    this.interval = settings?.reportInterval || 50;
    this.countdown = this.interval;
    // Rust always receives an explicit u32 seed. Preserve the old seeded
    // path's truncation and zero mapping; choose fresh streams when omitted.
    const requested = settings?.seed;
    this.seed =
      (Number.isFinite(requested)
        ? Math.trunc(Number(requested)) >>> 0
        : primitive === "noise-source"
          ? Math.floor(Math.random() * 0x100000000)
          : 1) || 1;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "dispose") {
        this.disposed = true;
        this.release();
        this.wasm = null;
        this.port.close();
      } else if (event.data?.type === "reset") {
        this.release();
      } else if (event.data?.type === "ping" && this.wasm) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };
    const wasmUrl = resolveWasmUrl(`./${primitive}.wasm`);
    initWasmModule(wasmUrl, {}, settings?.wasmBytes)
      .then((loaded) => {
        if (this.disposed) return;
        const instance = loaded instanceof WebAssembly.Instance ? loaded : loaded.instance;
        const prefix = primitive.replaceAll("-", "_");
        this.wasm = {
          processor_new: instance.exports[`${prefix}_new`] as SampleExports["processor_new"],
          processor_sample: instance.exports[
            `${prefix}_sample`
          ] as SampleExports["processor_sample"],
          processor_free: instance.exports[`${prefix}_free`] as SampleExports["processor_free"],
        };
        this.port.postMessage({ type: "ready", node: this.nodeId });
      })
      .catch((error: unknown) => {
        if (!this.disposed)
          this.port.postMessage({ type: "error", node: this.nodeId, message: String(error) });
      });
  }

  private release(): void {
    for (const state of this.states) this.wasm?.processor_free(state);
    this.states = [];
  }

  protected sample(channel: number, input = 0, a = 0, b = 0, c = 0): number {
    if (!this.wasm) return 0;
    this.states[channel] ??= this.wasm.processor_new(sampleRate, this.seed);
    return this.wasm.processor_sample(this.states[channel], input, a, b, c);
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean {
    if (this.disposed) return false;
    const output = outputs[0];
    if (!output?.[0]) return true;
    if (!this.wasm) {
      for (const channel of output) channel.fill(0);
      return true;
    }
    const metrics = this.render(inputs[0] ?? [], output, parameters);
    if (this.debug && --this.countdown <= 0) {
      this.countdown = this.interval;
      this.port.postMessage({
        type: "metrics",
        node: this.nodeId,
        ...computeRmsPeak(output[0]),
        ...metrics,
      });
    }
    return true;
  }

  protected abstract render(
    input: Float32Array[],
    output: Float32Array[],
    parameters: Record<string, Float32Array>,
  ): Record<string, number>;
}

export function paramAt(values: Float32Array | undefined, index: number, fallback: number): number {
  return values?.[index] ?? values?.[0] ?? fallback;
}
