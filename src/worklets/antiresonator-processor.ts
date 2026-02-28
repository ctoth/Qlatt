import { initWasmModule, WasmBuffer } from "./wasm-utils.js";

interface AntiResonatorWasmExports {
  memory: WebAssembly.Memory;
  alloc_f32(len: number): number;
  dealloc_f32(ptr: number, len: number): void;
  antiresonator_new(): number;
  antiresonator_set_params(state: number, frequency: number, bandwidth: number, sampleRate: number): void;
  antiresonator_set_gain(state: number, gain: number): void;
  antiresonator_process(state: number, inputPtr: number, outputPtr: number, blockSize: number): void;
}

interface AntiResonatorProcessorOptions {
  processorOptions?: {
    debug?: boolean;
    nodeId?: string;
    bypassAtZero?: boolean;
    reportInterval?: number;
    wasmBytes?: ArrayBuffer | ArrayBufferView;
  };
}

interface AntiResonatorMetricsParams {
  freq: number;
  bw: number;
  gain: number;
}

interface AntiResonatorMetricsMessage {
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

const wasmUrl =
  typeof URL === "function"
    ? new URL("./antiresonator.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}antiresonator.wasm`;

class AntiResonatorProcessor extends AudioWorkletProcessor {
  wasm: AntiResonatorWasmExports | null;
  state: number;
  inputBuffer: WasmBuffer | null;
  outputBuffer: WasmBuffer | null;
  ready: boolean;
  debug: boolean;
  nodeId: string;
  bypassAtZero: boolean;
  reportInterval: number;
  _reportCountdown: number;
  _explosionLogged: boolean;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "frequency", defaultValue: 500, minValue: 0, maxValue: 20000, automationRate: "k-rate" as const },
      { name: "bandwidth", defaultValue: 60, minValue: 0, maxValue: 10000, automationRate: "k-rate" as const },
      { name: "gain", defaultValue: 1, minValue: 0, maxValue: 4, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as AntiResonatorProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.inputBuffer = null;
    this.outputBuffer = null;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "antiresonator";
    this.bypassAtZero = Boolean(opts?.processorOptions?.bypassAtZero);
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this._explosionLogged = false;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as AntiResonatorWasmExports;
      this.state = this.wasm.antiresonator_new();
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

    this.wasm.antiresonator_set_params(this.state, freq, bw, sampleRate);
    this.wasm.antiresonator_set_gain(this.state, gain);
    this.wasm.antiresonator_process(
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

    // INSTRUMENTATION: detect explosion
    if (!this._explosionLogged) {
      let outSum = 0;
      for (let i = 0; i < outputChannel.length; i++) {
        outSum += outputChannel[i] * outputChannel[i];
      }
      const outRms = Math.sqrt(outSum / outputChannel.length);
      if (outRms > 100) {
        this._explosionLogged = true;
        let inSum = 0;
        if (inputChannel) {
          for (let i = 0; i < inputChannel.length; i++) {
            inSum += inputChannel[i] * inputChannel[i];
          }
        }
        const inRms = Math.sqrt(inSum / (inputChannel?.length || 1));
        console.error(
          `[ANTIRESONATOR EXPLOSION] node=${this.nodeId} outRms=${outRms.toFixed(1)} inRms=${inRms.toFixed(4)} freq=${freq} bw=${bw} gain=${gain} bypassAtZero=${this.bypassAtZero} sampleRate=${sampleRate}`
        );
        this.port.postMessage({
          type: "explosion",
          node: this.nodeId,
          outRms, inRms, freq, bw, gain,
          bypassAtZero: this.bypassAtZero,
          sampleRate,
        });
      }
    }

    this._reportMetrics(outputChannel, inputChannel, { freq, bw, gain });
    return true;
  }

  _reportMetrics(
    buffer: Float32Array,
    inputBuffer?: Float32Array | null,
    params?: AntiResonatorMetricsParams
  ): void {
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
    const payload: AntiResonatorMetricsMessage = { type: "metrics", node: this.nodeId, rms, peak };
    if (inputBuffer) {
      let inSum = 0;
      let inPeak = 0;
      for (let i = 0; i < inputBuffer.length; i += 1) {
        const v = inputBuffer[i];
        inSum += v * v;
        const av = Math.abs(v);
        if (av > inPeak) inPeak = av;
      }
      payload.inRms = Math.sqrt(inSum / inputBuffer.length);
      payload.inPeak = inPeak;
    }
    if (params) {
      payload.freq = params.freq;
      payload.bw = params.bw;
      payload.gain = params.gain;
    }
    this.port.postMessage(payload);
  }
}

registerProcessor("antiresonator-processor", AntiResonatorProcessor);
