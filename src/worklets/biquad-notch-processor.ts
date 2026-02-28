// Biquad notch (band-reject) filter worklet processor.
// Numerically stable replacement for Klatt FIR antiresonator at high sample rates.
// Reference: Bristow-Johnson, "Audio EQ Cookbook" (2005)

import { initWasmModule, WasmBuffer, computeRmsPeak, resolveWasmUrl, BaseProcessorOptions } from "./wasm-utils.js";

interface BiquadNotchWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  biquad_notch_new(): number;
  biquad_notch_set_params(state: number, frequency: number, bandwidth: number, sampleRate: number): void;
  biquad_notch_set_gain(state: number, gain: number): void;
  biquad_notch_process(state: number, inputPtr: number, outputPtr: number, blockSize: number): void;
}

interface BiquadNotchProcessorOptions extends BaseProcessorOptions {
  processorOptions?: BaseProcessorOptions["processorOptions"] & {
    bypassAtZero?: boolean;
  };
}

interface BiquadNotchMetricsParams {
  freq: number;
  bw: number;
  gain: number;
}

interface BiquadNotchMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  inRms?: number;
  inPeak?: number;
  freq?: number;
  bw?: number;
  gain?: number;
}

const wasmUrl = resolveWasmUrl("./biquad-notch.wasm");

class BiquadNotchProcessor extends AudioWorkletProcessor {
  wasm: BiquadNotchWasmExports | null;
  state: number;
  inputBuffer: WasmBuffer | null;
  outputBuffer: WasmBuffer | null;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  bypassAtZero: boolean;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "frequency", defaultValue: 500, minValue: 0, maxValue: 20000, automationRate: "k-rate" as const },
      { name: "bandwidth", defaultValue: 60, minValue: 0, maxValue: 10000, automationRate: "k-rate" as const },
      { name: "gain", defaultValue: 1, minValue: 0, maxValue: 4, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as BiquadNotchProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.inputBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "biquad-notch";
    this.bypassAtZero = Boolean(opts?.processorOptions?.bypassAtZero);
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping" && this.ready) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as BiquadNotchWasmExports;
      this.state = this.wasm.biquad_notch_new();
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
    const freq = parameters.frequency?.[0] ?? 500;
    const bw = parameters.bandwidth?.[0] ?? 60;
    const gain = parameters.gain?.[0] ?? 1;
    const bypass = this.bypassAtZero && (!Number.isFinite(freq) || !Number.isFinite(bw) || freq <= 0 || bw <= 0);

    if (bypass) {
      if (inputChannel) {
        outputChannel.set(inputChannel);
      } else {
        outputChannel.fill(0);
      }
      this._reportMetrics(outputChannel, inputChannel, { freq, bw, gain });
      return true;
    }

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

    this.wasm.biquad_notch_set_params(this.state, freq, bw, sampleRate);
    this.wasm.biquad_notch_set_gain(this.state, gain);
    this.wasm.biquad_notch_process(
      this.state,
      this.inputBuffer.ptr,
      this.outputBuffer.ptr,
      blockSize
    );

    this.outputBuffer.refresh();
    if (!this.outputBuffer.view) {
      outputChannel.fill(0);
      return true;
    }
    outputChannel.set(this.outputBuffer.view);

    this._reportMetrics(outputChannel, inputChannel, { freq, bw, gain });
    return true;
  }

  _reportMetrics(
    buffer: Float32Array,
    inputBuffer?: Float32Array | null,
    params?: BiquadNotchMetricsParams
  ): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;
    const { rms, peak } = computeRmsPeak(buffer);
    const payload: BiquadNotchMetricsMessage = { type: "metrics", node: this.nodeId, rms, peak };
    if (inputBuffer) {
      const inMetrics = computeRmsPeak(inputBuffer);
      payload.inRms = inMetrics.rms;
      payload.inPeak = inMetrics.peak;
    }
    if (params) {
      payload.freq = params.freq;
      payload.bw = params.bw;
      payload.gain = params.gain;
    }
    this.port.postMessage(payload);
  }
}

registerProcessor("biquad-notch-processor", BiquadNotchProcessor);
