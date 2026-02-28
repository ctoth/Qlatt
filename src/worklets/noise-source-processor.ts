import { computeRmsPeak, BaseProcessorOptions } from "./wasm-utils.js";

interface NoiseProcessorOptions extends Omit<BaseProcessorOptions, "processorOptions"> {
  processorOptions?: Omit<NonNullable<BaseProcessorOptions["processorOptions"]>, "wasmBytes"> & {
    seed?: number;
  };
}

interface NoiseMetricsParams {
  gainAvg: number;
  gainPeak: number;
  cutoff: number;
}

interface NoiseMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  gainAvg?: number;
  gainPeak?: number;
  cutoff?: number;
}

class NoiseSourceProcessor extends AudioWorkletProcessor {
  y1: number;
  alpha: number;
  _lastCutoff: number;
  _useSeededNoise: boolean;
  _prngState: number;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "gain", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" as const },
      { name: "cutoff", defaultValue: 1000, minValue: 50, maxValue: 20000, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as NoiseProcessorOptions | undefined;
    this.y1 = 0;
    this.alpha = 0.0;
    this._lastCutoff = -1;
    const requestedSeed = opts?.processorOptions?.seed;
    const hasSeed = Number.isFinite(requestedSeed);
    this._useSeededNoise = hasSeed;
    if (hasSeed) {
      const normalized = (Math.trunc(Number(requestedSeed)) >>> 0) || 1;
      this._prngState = normalized;
    } else {
      this._prngState = 0;
    }
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "noise";
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };
    this.port.postMessage({ type: "ready", node: this.nodeId });
  }

  _nextUniform() {
    // Deterministic 32-bit LCG for reproducible offline golden rendering.
    this._prngState = (1664525 * this._prngState + 1013904223) >>> 0;
    return this._prngState / 0x100000000;
  }

  _nextWhiteNoiseSample() {
    if (!this._useSeededNoise) {
      return Math.random() * 2 - 1;
    }
    return this._nextUniform() * 2 - 1;
  }

  _updateFilter(cutoff: number): void {
    const clamped = Math.max(1, Math.min(cutoff, sampleRate * 0.45));
    this.alpha = Math.exp(-2 * Math.PI * clamped / sampleRate);
    this._lastCutoff = clamped;
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
    const modInput = inputs[0];
    const modChannel = modInput && modInput[0] ? modInput[0] : null;
    const gainValues = parameters.gain ?? new Float32Array([0]);
    const cutoffValues = parameters.cutoff ?? new Float32Array([1000]);
    const cutoff = cutoffValues[0] ?? 1000;

    if (cutoff !== this._lastCutoff) {
      this._updateFilter(cutoff);
    }

    let gainSum = 0;
    let gainPeak = 0;
    for (let i = 0; i < blockSize; i += 1) {
      const gain = gainValues.length > 1 ? (gainValues[i] ?? gainValues[0] ?? 0) : (gainValues[0] ?? 0);
      const mod = modChannel ? modChannel[i] : 1;
      gainSum += gain;
      if (gain > gainPeak) gainPeak = gain;
      const white = this._nextWhiteNoiseSample();
      const y = (1 - this.alpha) * white + this.alpha * this.y1;
      this.y1 = y;
      outputChannel[i] = y * gain * mod;
    }

    this._reportMetrics(outputChannel, {
      gainAvg: gainSum / blockSize,
      gainPeak,
      cutoff: this._lastCutoff,
    });
    return true;
  }

  _reportMetrics(buffer: Float32Array, params?: NoiseMetricsParams): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;
    const { rms, peak } = computeRmsPeak(buffer);
    const payload: NoiseMetricsMessage = { type: "metrics", node: this.nodeId, rms, peak };
    if (params) {
      payload.gainAvg = params.gainAvg;
      payload.gainPeak = params.gainPeak;
      payload.cutoff = params.cutoff;
    }
    this.port.postMessage(payload);
  }
}

registerProcessor("noise-source-processor", NoiseSourceProcessor);
