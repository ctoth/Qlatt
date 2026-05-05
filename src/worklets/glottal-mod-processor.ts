/**
 * Glottal modulation processor — shapes aspiration noise with a sinusoidal
 * envelope synchronized to the glottal cycle.
 *
 * During the open phase (phase < OQ * period), modulation follows:
 *   0.5 + 0.5 * sin(pi * phase / (OQ * period))
 * During the closed phase, modulation is a constant 0.5 (half amplitude).
 *
 * This replaces the original 50% duty-cycle square wave with a smooth
 * pulsatile envelope shaped by the open quotient (OQ) parameter.
 *
 * OQ is supplied by semantics.yaml. The default qlatt path derives it by
 * interpolating Fant 1997 Table 1 OQi values from Rd, with explicit Klatt
 * percent OQ overrides allowed.
 *
 * Citations:
 *   - Klatt 1980 COEWAV.FOR lines 116-122 (aspiration modulation)
 *   - Gobl 1988 (voice source dynamics in connected speech)
 *   - Fant 1997 Table 1 (Rd-to-OQi values)
 *   - Klatt & Klatt 1990 (Klatt OQ definition and override parameter)
 */
import { computeRmsPeak, BaseProcessorOptions } from "./wasm-utils.js";

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
      { name: "oq", defaultValue: 0.5, minValue: 0.1, maxValue: 1.0, automationRate: "k-rate" as const },
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

    // OQ is k-rate: use first value for the entire block
    const oqValues = parameters.oq ?? new Float32Array([0.5]);
    const oq = Math.min(1.0, Math.max(0.1, oqValues[0] ?? 0.5));

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
        // Pulsatile aspiration envelope shaped by OQ (Klatt 1980; Gobl 1988; Fant 1997 Table 1)
        const openDuration = oq * period;
        if (this.phase < openDuration) {
          // Open phase: sinusoidal modulation peaking at 1.0
          out[i] = 0.5 + 0.5 * Math.sin(Math.PI * this.phase / openDuration);
        } else {
          // Closed phase: constant half-amplitude
          out[i] = 0.5;
        }
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
