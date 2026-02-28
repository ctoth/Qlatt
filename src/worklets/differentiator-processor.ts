import { computeRmsPeak, BaseProcessorOptions } from "./wasm-utils";

interface DifferentiatorMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  inRms?: number;
  inPeak?: number;
}

class DifferentiatorProcessor extends AudioWorkletProcessor {
  prev: number[];
  debug: boolean;
  nodeId: string;
  scale: number;
  reportInterval: number;
  _reportCountdown: number;

  constructor(options?: unknown) {
    super(options);
    const opts = options as BaseProcessorOptions | undefined;
    this.prev = [];
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "diff";
    // Klatt80 uses SR=10kHz; scale first-difference so UGLOT amplitude
    // matches the 10kHz reference when running at higher sample rates.
    this.scale = sampleRate / 10000;
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
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output) {
      return true;
    }

    for (let ch = 0; ch < output.length; ch += 1) {
      const inCh = input[ch];
      const outCh = output[ch];
      if (!inCh || !outCh) continue;

      let prev = this.prev[ch] || 0;
      for (let i = 0; i < outCh.length; i += 1) {
        const x = inCh[i] ?? 0;
        outCh[i] = (x - prev) * this.scale;
        prev = x;
      }
      this.prev[ch] = prev;
    }
    this._reportMetrics(output[0], input[0]);
    return true;
  }

  _reportMetrics(buffer?: Float32Array, inputBuffer?: Float32Array): void {
    if (!this.debug || !buffer) return;
    this._reportCountdown -= 1;
    if (this._reportCountdown > 0) return;
    this._reportCountdown = this.reportInterval;
    const { rms, peak } = computeRmsPeak(buffer);
    const payload: DifferentiatorMetricsMessage = {
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

registerProcessor("differentiator-processor", DifferentiatorProcessor);
