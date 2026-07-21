/**
 * Reconstruction filter AudioWorklet processor
 * Wraps the reconstruction-filter WASM primitive.
 *
 * Klatt (1980) sends playback through an external 5 kHz analog low-pass after
 * the D/A converter (Fig. 1; Appendix A). The `bypass` option keeps that
 * output-stage filter declarative for experiments that intentionally render
 * higher-frequency fricative energy above the Klatt 1980 playback bandwidth.
 */
import { initWasmModule, WasmBuffer, computeRmsPeak, resolveWasmUrl, BaseProcessorOptions } from "./wasm-utils.js";

interface ReconstructionFilterWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  reconstruction_filter_new(sampleRate: number): number;
  reconstruction_filter_reset?: (state: number) => void;
  reconstruction_filter_process(state: number, inputPtr: number, outputPtr: number, blockSize: number): void;
}

interface ReconstructionFilterProcessorOptions extends BaseProcessorOptions {
  processorOptions?: BaseProcessorOptions["processorOptions"] & {
    bypass?: boolean;
  };
}

interface ReconstructionFilterMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  inRms?: number;
  inPeak?: number;
}

const wasmUrl = resolveWasmUrl("./reconstruction-filter.wasm");

class ReconstructionFilterProcessor extends AudioWorkletProcessor {
  private disposed = false;
  wasm: ReconstructionFilterWasmExports | null;
  state: number;
  inputBuffer: WasmBuffer | null;
  outputBuffer: WasmBuffer | null;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  bypass: boolean;
  reportInterval: number;
  _reportCountdown: number;

  constructor(options?: unknown) {
    super(options);
    const opts = options as ReconstructionFilterProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.inputBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "reconstruction-filter";
    this.bypass = Boolean(opts?.processorOptions?.bypass);
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
        if (this.ready && this.wasm?.reconstruction_filter_reset) {
          this.wasm.reconstruction_filter_reset(this.state);
        }
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as ReconstructionFilterWasmExports;
      this.state = this.wasm.reconstruction_filter_new(sampleRate);
      this.inputBuffer = new WasmBuffer(this.wasm);
      this.outputBuffer = new WasmBuffer(this.wasm);
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    if (this.disposed) return false;
    const output = outputs[0];
    if (!output || !output[0]) {
      return true;
    }

    const outputChannel = output[0];
    const blockSize = outputChannel.length;

    if (!this.ready || !this.wasm || !this.inputBuffer || !this.outputBuffer) {
      outputChannel.fill(0);
      return true;
    }

    const input = inputs[0];
    const inputChannel = input && input[0] ? input[0] : null;

    this.inputBuffer.ensure(blockSize);
    this.outputBuffer.ensure(blockSize);

    const inputView = this.inputBuffer.view;
    const outputView = this.outputBuffer.view;
    if (!inputView || !outputView) {
      outputChannel.fill(0);
      return true;
    }

    if (inputChannel) {
      inputView.set(inputChannel);
    } else {
      inputView.fill(0);
    }

    let renderedView = outputView;
    if (this.bypass) {
      outputView.set(inputView);
    } else {
      this.wasm.reconstruction_filter_process(
        this.state,
        this.inputBuffer.ptr,
        this.outputBuffer.ptr,
        blockSize
      );

      this.outputBuffer.refresh();
      const refreshedOutputView = this.outputBuffer.view;
      if (!refreshedOutputView) {
        outputChannel.fill(0);
        return true;
      }
      renderedView = refreshedOutputView;
    }

    outputChannel.set(renderedView);
    this._reportMetrics(outputChannel, inputChannel);
    return true;
  }

  _reportMetrics(buffer: Float32Array, inputBuffer?: Float32Array | null): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;

    const { rms, peak } = computeRmsPeak(buffer);

    const payload: ReconstructionFilterMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
    };

    if (inputBuffer) {
      const inMetrics = computeRmsPeak(inputBuffer);
      payload.inRms = inMetrics.rms;
      payload.inPeak = inMetrics.peak;
    }

    this.port.postMessage(payload);
  }
}

registerProcessor("reconstruction-filter-processor", ReconstructionFilterProcessor);
