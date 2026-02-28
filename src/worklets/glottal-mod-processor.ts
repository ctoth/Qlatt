import { computeRmsPeak, BaseProcessorOptions } from "./wasm-utils";

interface GlottalModMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  f0: number;
}

class GlottalModProcessor extends AudioWorkletProcessor {
  phase: number;
  lastF0: number;
  debug: boolean;
  nodeId: string;
  reportInterval: number;
  _reportCountdown: number;

  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "f0", defaultValue: 110, minValue: 0, maxValue: 500, automationRate: "a-rate" as const },
    ];
  }

  constructor(options?: unknown) {
    super(options);
    const opts = options as BaseProcessorOptions | undefined;
    this.phase = 0;
    this.lastF0 = 0;
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "glottal-mod";
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
    if (!output || !output[0]) {
      return true;
    }
    const out = output[0];
    const f0Values = parameters.f0 ?? new Float32Array([0]);
    const hasF0 = f0Values && f0Values.length > 0;
    const blockSize = out.length;

    let f0Sum = 0;
    if (hasF0) {
      for (let i = 0; i < f0Values.length; i += 1) {
        f0Sum += f0Values[i] ?? 0;
      }
      this.lastF0 = f0Sum / f0Values.length;
    }

    for (let i = 0; i < blockSize; i += 1) {
      const f0 = hasF0
        ? (f0Values.length > 1 ? (f0Values[i] ?? f0Values[0] ?? 0) : (f0Values[0] ?? 0))
        : 0;
      if (!f0 || f0 <= 0) {
        out[i] = 0.5;
        continue;
      }
      const period = sampleRate / f0;
      if (period > 1) {
        if (this.phase >= period) {
          this.phase %= period;
        }
        out[i] = this.phase < period * 0.5 ? 1.0 : 0.5;
        this.phase += 1;
      } else {
        out[i] = 1.0;
      }
    }

    this._reportMetrics(out);
    return true;
  }

  _reportMetrics(buffer: Float32Array): void {
    if (!this.debug) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;
    const { rms, peak } = computeRmsPeak(buffer);
    const payload: GlottalModMetricsMessage = {
      type: "metrics",
      node: this.nodeId,
      rms,
      peak,
      f0: this.lastF0,
    };
    this.port.postMessage(payload);
  }
}

registerProcessor("glottal-mod-processor", GlottalModProcessor);
