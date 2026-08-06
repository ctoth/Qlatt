/**
 * Tilt filter AudioWorklet processor
 * Wraps the tilt-filter WASM primitive
 * One-pole lowpass for spectral tilt control
 */
import { initWasmModule, WasmBuffer, computeRmsPeak, resolveWasmUrl, BaseProcessorOptions } from "./wasm-utils.js";

interface TiltFilterWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  tilt_filter_new(): number;
  tilt_filter_set_tilt(state: number, tilt: number): void;
  tilt_filter_process(state: number, sample: number): number;
  tilt_filter_process_block(state: number, inputPtr: number, outputPtr: number, len: number): void;
  tilt_filter_reset?: (state: number) => void;
}

type TiltFilterProcessorOptions = BaseProcessorOptions;

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

const wasmUrl = resolveWasmUrl("./tilt-filter.wasm");

class TiltFilterProcessor extends AudioWorkletProcessor {
  private disposed = false;
  wasm: TiltFilterWasmExports | null;
  state: number;
  inputBuffer: WasmBuffer | null;
  outputBuffer: WasmBuffer | null;
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
    this.inputBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.lastTilt = -1;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "tilt-filter";
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
      this.inputBuffer = new WasmBuffer(this.wasm);
      this.outputBuffer = new WasmBuffer(this.wasm);
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    if (this.disposed) return false;
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockSize = outputChannel.length;

    if (!this.ready || !this.wasm || !this.inputBuffer || !this.outputBuffer) {
      outputChannel.fill(0);
      return true;
    }

    // Update tilt parameter (k-rate, once per block)
    const tilt = Math.round(parameters.tilt?.[0] ?? 0);
    if (tilt !== this.lastTilt) {
      this.wasm.tilt_filter_set_tilt(this.state, tilt);
      this.lastTilt = tilt;
    }

    this.inputBuffer.ensure(blockSize);
    this.outputBuffer.ensure(blockSize);
    const inputView = this.inputBuffer.view;
    if (!inputView || !this.outputBuffer.view) {
      outputChannel.fill(0);
      return true;
    }

    inputView.set(inputChannel);
    this.wasm.tilt_filter_process_block(
      this.state,
      this.inputBuffer.ptr,
      this.outputBuffer.ptr,
      blockSize,
    );
    this.outputBuffer.refresh();
    if (!this.outputBuffer.view) {
      outputChannel.fill(0);
      return true;
    }
    outputChannel.set(this.outputBuffer.view);

    this._reportMetrics(outputChannel, { tilt });
    return true;
  }

  _reportMetrics(buffer: Float32Array, params: TiltFilterMetricsParams): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    const { rms, peak } = computeRmsPeak(buffer);

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
