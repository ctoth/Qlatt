import {
  type BaseProcessorOptions,
  computeRmsPeak,
  initWasmModule,
  resolveWasmUrl,
  WasmBuffer,
} from "./wasm-utils.js";

interface ResonatorWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  resonator_new(): number;
  resonator_set_params(
    state: number,
    frequency: number,
    bandwidth: number,
    sampleRate: number,
  ): void;
  resonator_set_gain(state: number, gain: number): void;
  resonator_process(state: number, inputPtr: number, outputPtr: number, blockSize: number): void;
}

interface ResonatorProcessorOptions extends BaseProcessorOptions {
  processorOptions?: BaseProcessorOptions["processorOptions"] & {
    bypassAtZero?: boolean;
  };
}

interface ResonatorMetricsParams {
  freq: number;
  bw: number;
  gain: number;
}

interface ResonatorMetricsMessage {
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

const wasmUrl = resolveWasmUrl("./resonator.wasm");

class ResonatorProcessor extends AudioWorkletProcessor {
  private disposed = false;
  wasm: ResonatorWasmExports | null;
  state: number;
  inputBuffer: WasmBuffer | null;
  outputBuffer: WasmBuffer | null;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  bypassAtZero: boolean;
  reportInterval: number;
  _reportCountdown: number;
  lastFrequency: number;
  lastBandwidth: number;
  lastGain: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      {
        name: "frequency",
        defaultValue: 500,
        minValue: 0,
        maxValue: 20000,
        automationRate: "k-rate" as const,
      },
      {
        name: "bandwidth",
        defaultValue: 60,
        minValue: 0,
        maxValue: 10000,
        automationRate: "k-rate" as const,
      },
      {
        name: "gain",
        defaultValue: 1,
        minValue: 0,
        maxValue: 4,
        automationRate: "k-rate" as const,
      },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as ResonatorProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.inputBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "resonator";
    this.bypassAtZero = Boolean(opts?.processorOptions?.bypassAtZero);
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.lastFrequency = Number.NaN;
    this.lastBandwidth = Number.NaN;
    this.lastGain = Number.NaN;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "dispose") {
        this.disposed = true;
        this.port.close();
        return;
      }
      if (event?.data?.type === "ping" && this.ready) {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as ResonatorWasmExports;
      this.state = this.wasm.resonator_new();
      this.inputBuffer = new WasmBuffer(this.wasm);
      this.outputBuffer = new WasmBuffer(this.wasm);
      this.ready = true;
      this.port.postMessage({ type: "ready", node: this.nodeId });
    });
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
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
    const freq = parameters.frequency?.[0] ?? 500;
    const bw = parameters.bandwidth?.[0] ?? 60;
    const gain = parameters.gain?.[0] ?? 1;

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

    if (this.bypassAtZero && freq <= 0) {
      const scale = Number.isFinite(gain) ? gain : 1;
      for (let i = 0; i < blockSize; i += 1) {
        outputView[i] = (inputView[i] || 0) * scale;
      }
    } else {
      if (
        !Number.isFinite(freq) ||
        !Number.isFinite(bw) ||
        !Object.is(freq, this.lastFrequency) ||
        !Object.is(bw, this.lastBandwidth)
      ) {
        this.wasm.resonator_set_params(this.state, freq, bw, sampleRate);
        this.lastFrequency = freq;
        this.lastBandwidth = bw;
      }
      if (!Object.is(gain, this.lastGain)) {
        this.wasm.resonator_set_gain(this.state, gain);
        this.lastGain = gain;
      }
      this.wasm.resonator_process(
        this.state,
        this.inputBuffer.ptr,
        this.outputBuffer.ptr,
        blockSize,
      );
    }

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
    params?: ResonatorMetricsParams,
  ): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;
    const { rms, peak } = computeRmsPeak(buffer);
    const payload: ResonatorMetricsMessage = { type: "metrics", node: this.nodeId, rms, peak };
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

registerProcessor("resonator-processor", ResonatorProcessor);
