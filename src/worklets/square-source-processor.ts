/**
 * Square glottal source AudioWorklet processor
 * Wraps the square-source WASM primitive
 */
import { initWasmModule, computeRmsPeak, resolveWasmUrl, BaseProcessorOptions } from "./wasm-utils.js";

interface SquareSourceWasmExports {
  square_source_new(sampleRate: number): number;
  square_source_process(state: number, f0: number, openQuotient: number): number;
  square_source_reset?: (state: number) => void;
}

type SquareSourceProcessorOptions = BaseProcessorOptions;

interface SquareSourceMetricsParams {
  f0: number;
  oq: number;
}

interface SquareSourceMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  f0: number;
  openQuotient: number;
}

const wasmUrl = resolveWasmUrl("./square-source.wasm");

class SquareSourceProcessor extends AudioWorkletProcessor {
  private disposed = false;
  wasm: SquareSourceWasmExports | null;
  state: number;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "f0", defaultValue: 100, minValue: 20, maxValue: 500, automationRate: "a-rate" as const },
      {
        name: "openQuotient",
        defaultValue: 0.5,
        minValue: 0.01,
        maxValue: 0.99,
        automationRate: "a-rate" as const,
      },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as SquareSourceProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "square-source";
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "dispose") {
        this.disposed = true;
        this.port.close();
        return;
      }
      if (event?.data?.type === "ping" && this.ready) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.square_source_reset) {
          this.wasm.square_source_reset(this.state);
        }
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as SquareSourceWasmExports;
      this.state = this.wasm.square_source_new(sampleRate);
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    if (this.disposed) return false;
    const output = outputs[0];
    if (!output || !output[0]) {
      return true;
    }
    const outputChannel = output[0];
    const blockSize = outputChannel.length;

    if (!this.ready || !this.wasm) {
      outputChannel.fill(0);
      return true;
    }

    const f0 = parameters.f0 ?? new Float32Array([100]);
    const oq = parameters.openQuotient ?? new Float32Array([0.5]);
    const firstF0 = f0[0] ?? 100;
    const firstOq = oq[0] ?? 0.5;

    for (let i = 0; i < blockSize; i += 1) {
      const f0Val = f0.length > 1 ? (f0[i] ?? firstF0) : firstF0;
      const oqVal = oq.length > 1 ? (oq[i] ?? firstOq) : firstOq;

      outputChannel[i] = this.wasm.square_source_process(
        this.state,
        f0Val,
        oqVal
      );
    }

    this._reportMetrics(outputChannel, { f0: firstF0, oq: firstOq });
    return true;
  }

  _reportMetrics(buffer: Float32Array, params: SquareSourceMetricsParams): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    const { rms, peak } = computeRmsPeak(buffer);

    const payload: SquareSourceMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      f0: params.f0,
      openQuotient: params.oq,
    };
    this.port.postMessage(payload);
  }
}

registerProcessor("square-source-processor", SquareSourceProcessor);
