/**
 * Tilt filter AudioWorklet processor
 * Wraps the tilt-filter WASM primitive
 * One-pole lowpass for spectral tilt control
 */
import { initWasmModule } from "./wasm-utils.js";

interface TiltFilterWasmExports {
  tilt_filter_new(): number;
  tilt_filter_set_tilt(state: number, tilt: number): void;
  tilt_filter_process(state: number, sample: number): number;
  tilt_filter_reset?: (state: number) => void;
}

interface TiltFilterProcessorOptions {
  processorOptions?: {
    debug?: boolean;
    nodeId?: string;
    reportInterval?: number;
    wasmBytes?: ArrayBuffer | ArrayBufferView;
  };
}

interface TiltFilterMetricsParams {
  tilt: number;
}

interface TiltFilterMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  tilt: number;
}

const wasmUrl =
  typeof URL === "function"
    ? new URL("./tilt-filter.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}tilt-filter.wasm`;

class TiltFilterProcessor extends AudioWorkletProcessor {
  wasm: TiltFilterWasmExports | null;
  state: number;
  ready: boolean;
  lastTilt: number;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "tilt", defaultValue: 0, minValue: 0, maxValue: 34, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as TiltFilterProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.lastTilt = -1;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "tilt-filter";
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.tilt_filter_reset) {
          this.wasm.tilt_filter_reset(this.state);
        }
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as TiltFilterWasmExports;
      this.state = this.wasm.tilt_filter_new();
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = outputChannel.length;

    if (!this.ready || !this.wasm) {
      outputChannel.fill(0);
      return true;
    }

    // Update tilt parameter (k-rate, once per block)
    const tilt = Math.round(parameters.tilt?.[0] ?? 0);
    if (tilt !== this.lastTilt) {
      this.wasm.tilt_filter_set_tilt(this.state, tilt);
      this.lastTilt = tilt;
    }

    // Process samples
    for (let i = 0; i < blockSize; i += 1) {
      outputChannel[i] = this.wasm.tilt_filter_process(
        this.state,
        inputChannel[i] || 0
      );
    }

    this._reportMetrics(outputChannel, { tilt });
    return true;
  }

  _reportMetrics(buffer: Float32Array, params: TiltFilterMetricsParams): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    let sum = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const v = buffer[i];
      sum += v * v;
      const av = Math.abs(v);
      if (av > peak) peak = av;
    }
    const rms = Math.sqrt(sum / buffer.length);

    const payload: TiltFilterMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      tilt: params.tilt,
    };
    this.port.postMessage(payload);
  }
}

registerProcessor("tilt-filter-processor", TiltFilterProcessor);
