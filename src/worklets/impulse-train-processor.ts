interface ImpulseTrainProcessorOptions {
  processorOptions?: {
    debug?: boolean;
    nodeId?: string;
    reportInterval?: number;
  };
}

interface ImpulseTrainMetricsParams {
  gainAvg: number;
  gainPeak: number;
}

interface ImpulseTrainMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  gainAvg?: number;
  gainPeak?: number;
}

class ImpulseTrainProcessor extends AudioWorkletProcessor {
  periodLength: number;
  openPhaseLength: number;
  positionInPeriod: number;
  a: number;
  b: number;
  c: number;
  y1: number;
  y2: number;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "f0", defaultValue: 0, minValue: 0, maxValue: 2000, automationRate: "a-rate" as const },
      { name: "gain", defaultValue: 1, minValue: 0, maxValue: 1, automationRate: "a-rate" as const },
      { name: "openPhaseRatio", defaultValue: 0.7, minValue: 0, maxValue: 1, automationRate: "k-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as ImpulseTrainProcessorOptions | undefined;
    this.periodLength = 0;
    this.openPhaseLength = 0;
    this.positionInPeriod = 0;
    this.a = 0;
    this.b = 0;
    this.c = 0;
    this.y1 = 0;
    this.y2 = 0;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "impulse";
    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "ping") {
        this.port.postMessage({ type: "ready", node: this.nodeId });
      }
    };
    this.port.postMessage({ type: "ready", node: this.nodeId });
  }

  process(
    _inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const output = outputs[0];
    if (!output || !output[0]) return true;
    const outputChannel = output[0];
    const blockSize = outputChannel.length;
    const f0Values = parameters.f0 ?? new Float32Array([0]);
    const gainValues = parameters.gain ?? new Float32Array([0]);
    const openPhaseValues = parameters.openPhaseRatio ?? new Float32Array([0.7]);
    const openPhaseRatio = openPhaseValues[0] ?? 0.7;
    const sr = sampleRate || 48000;

    let gainSum = 0;
    let gainPeak = 0;
    for (let i = 0; i < blockSize; i += 1) {
      const f0 = f0Values.length > 1 ? (f0Values[i] ?? f0Values[0] ?? 0) : (f0Values[0] ?? 0);
      const gain = gainValues.length > 1 ? (gainValues[i] ?? gainValues[0] ?? 0) : (gainValues[0] ?? 0);
      gainSum += gain;
      if (gain > gainPeak) gainPeak = gain;

      if (!Number.isFinite(f0) || f0 <= 0) {
        outputChannel[i] = 0;
        continue;
      }

      const periodLength = Math.max(1, Math.round(sr / f0));
      if (periodLength !== this.periodLength) {
        this.periodLength = periodLength;
        this.openPhaseLength = Math.max(
          0,
          Math.round(this.periodLength * Math.max(0, Math.min(1, openPhaseRatio)))
        );
        this.positionInPeriod = 0;
        this._setImpulseResonator(sr);
      }

      if (this.openPhaseLength <= 0) {
        outputChannel[i] = 0;
        continue;
      }

      const pulse = (this.positionInPeriod === 1)
        ? 1
        : (this.positionInPeriod === 2) ? -1 : 0;
      this.positionInPeriod += 1;
      if (this.positionInPeriod >= this.periodLength) {
        this.positionInPeriod = 0;
      }

      const y = this.a * pulse + this.b * this.y1 + this.c * this.y2;
      this.y2 = this.y1;
      this.y1 = y;
      outputChannel[i] = y * gain;
    }

    this._reportMetrics(outputChannel, {
      gainAvg: gainSum / blockSize,
      gainPeak,
    });
    return true;
  }

  _setImpulseResonator(sr: number): void {
    const bw = this.openPhaseLength > 0 ? sr / this.openPhaseLength : 0;
    if (!Number.isFinite(bw) || bw <= 0) {
      this.a = 0;
      this.b = 0;
      this.c = 0;
      this.y1 = 0;
      this.y2 = 0;
      return;
    }
    const r = Math.exp(-Math.PI * bw / sr);
    const w = 0;
    this.c = -(r ** 2);
    this.b = 2 * r * Math.cos(w);
    this.a = 1; // match KlattSyn adjustImpulseGain(1)
    this.y1 = 0;
    this.y2 = 0;
  }

  _reportMetrics(buffer: Float32Array, params?: ImpulseTrainMetricsParams): void {
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
    const payload: ImpulseTrainMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
    };
    if (params) {
      payload.gainAvg = params.gainAvg;
      payload.gainPeak = params.gainPeak;
    }
    this.port.postMessage(payload);
  }
}

registerProcessor("impulse-train-processor", ImpulseTrainProcessor);
