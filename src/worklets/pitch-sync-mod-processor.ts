/**
 * Pitch-synchronous F1 resonator AudioWorklet processor
 * Wraps the pitch-sync-mod WASM primitive
 * F1/B1 modulation synchronized to glottal cycle
 */
import { initWasmModule } from "./wasm-utils.js";

interface PitchSyncModWasmExports {
  pitch_sync_resonator_new(sampleRate: number): number;
  pitch_sync_resonator_process(
    state: number,
    input: number,
    f0: number,
    openQuotient: number,
    f1: number,
    b1: number,
    dF1: number,
    dB1: number,
    skew: number,
    source: number
  ): number;
  pitch_sync_resonator_reset?: (state: number) => void;
}

interface PitchSyncModProcessorOptions {
  processorOptions?: {
    debug?: boolean;
    nodeId?: string;
    reportInterval?: number;
    wasmBytes?: ArrayBuffer | ArrayBufferView;
  };
}

interface PitchSyncModMetricsParams {
  f0: number;
  f1: number;
  b1: number;
}

interface PitchSyncModMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  f0: number;
  f1: number;
  b1: number;
}

const wasmUrl =
  typeof URL === "function"
    ? new URL("./pitch-sync-mod.wasm", import.meta.url).toString()
    : `${import.meta.url.replace(/[^/]*$/, "")}pitch-sync-mod.wasm`;

class PitchSyncModProcessor extends AudioWorkletProcessor {
  wasm: PitchSyncModWasmExports | null;
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
        defaultValue: 50,
        minValue: 0,
        maxValue: 100,
        automationRate: "k-rate" as const,
      },
      { name: "f1", defaultValue: 500, minValue: 100, maxValue: 1500, automationRate: "a-rate" as const },
      { name: "b1", defaultValue: 80, minValue: 30, maxValue: 500, automationRate: "a-rate" as const },
      { name: "dF1", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "a-rate" as const },
      { name: "dB1", defaultValue: 0, minValue: 0, maxValue: 500, automationRate: "a-rate" as const },
      { name: "skew", defaultValue: 0, minValue: 0, maxValue: 200, automationRate: "k-rate" as const },
      { name: "source", defaultValue: 2, minValue: 1, maxValue: 4, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as PitchSyncModProcessorOptions | undefined;
    this.wasm = null;
    this.state = 0;
    this.ready = false;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "pitch-sync-mod";
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;

    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      } else if (event?.data?.type === "reset") {
        if (this.ready && this.wasm?.pitch_sync_resonator_reset) {
          this.wasm.pitch_sync_resonator_reset(this.state);
        }
      }
    };

    const wasmBytes = opts?.processorOptions?.wasmBytes;
    initWasmModule(wasmUrl, {}, wasmBytes).then((instantiated) => {
      const instance =
        instantiated instanceof WebAssembly.Instance ? instantiated : instantiated.instance;
      this.wasm = instance.exports as unknown as PitchSyncModWasmExports;
      this.state = this.wasm.pitch_sync_resonator_new(sampleRate);
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

    const f0 = parameters.f0 ?? new Float32Array([100]);
    const oq = parameters.openQuotient ?? new Float32Array([50]);
    const f1 = parameters.f1 ?? new Float32Array([500]);
    const b1 = parameters.b1 ?? new Float32Array([80]);
    const dF1 = parameters.dF1 ?? new Float32Array([0]);
    const dB1 = parameters.dB1 ?? new Float32Array([0]);
    const skew = parameters.skew ?? new Float32Array([0]);
    const source = parameters.source ?? new Float32Array([2]);
    const firstF0 = f0[0] ?? 100;
    const firstOq = oq[0] ?? 50;
    const firstF1 = f1[0] ?? 500;
    const firstB1 = b1[0] ?? 80;
    const firstDF1 = dF1[0] ?? 0;
    const firstDB1 = dB1[0] ?? 0;
    const firstSkew = skew[0] ?? 0;
    const firstSource = source[0] ?? 2;

    for (let i = 0; i < blockSize; i += 1) {
      const f0Val = f0.length > 1 ? (f0[i] ?? firstF0) : firstF0;
      const oqVal = oq.length > 1 ? (oq[i] ?? firstOq) : firstOq;
      const f1Val = f1.length > 1 ? (f1[i] ?? firstF1) : firstF1;
      const b1Val = b1.length > 1 ? (b1[i] ?? firstB1) : firstB1;
      const dF1Val = dF1.length > 1 ? (dF1[i] ?? firstDF1) : firstDF1;
      const dB1Val = dB1.length > 1 ? (dB1[i] ?? firstDB1) : firstDB1;
      const skewVal = skew.length > 1 ? (skew[i] ?? firstSkew) : firstSkew;
      const sourceVal = source.length > 1 ? (source[i] ?? firstSource) : firstSource;

      outputChannel[i] = this.wasm.pitch_sync_resonator_process(
        this.state,
        inputChannel[i] || 0,
        f0Val,
        oqVal,
        f1Val,
        b1Val,
        dF1Val,
        dB1Val,
        skewVal,
        sourceVal
      );
    }

    this._reportMetrics(outputChannel, { f0: firstF0, f1: firstF1, b1: firstB1 });
    return true;
  }

  _reportMetrics(buffer: Float32Array, params: PitchSyncModMetricsParams): void {
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

    const payload: PitchSyncModMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      f0: params.f0,
      f1: params.f1,
      b1: params.b1,
    };
    this.port.postMessage(payload);
  }
}

registerProcessor("pitch-sync-mod-processor", PitchSyncModProcessor);
