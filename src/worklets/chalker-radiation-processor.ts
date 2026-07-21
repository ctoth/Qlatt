/**
 * Chalker 1985 two-term radiation filter.
 *
 * Implements the improved radiation impedance approximation from:
 *   Chalker & Mackerras (1985) "Models for Representing the Acoustic
 *   Radiation Impedance of the Mouth", IEEE Trans. ASSP-33(6), pp. 1606-1609.
 *
 * Transfer function (z-domain):
 *   H(z) = c1 * (1 - z^-1) + c2 * (1 - 2*z^-1 + z^-2)
 *
 * Term 1: first-difference (standard +6 dB/octave radiation characteristic).
 * Term 2: second-difference (curvature correction reducing high-frequency
 *          error from 13.4 ohms (Flanagan) to 1.22 ohms at 5 kHz).
 *
 * The coefficients are derived via bilinear transform from the continuous-time
 * piston-in-baffle radiation impedance, keeping the first two terms of the
 * Morse & Ingard series expansion. They are sample-rate adaptive: the existing
 * differentiator scales by SR/10000 (Klatt 80 reference rate); the Chalker
 * correction term scales with (SR/10000)^2 to maintain the same frequency
 * response shape across sample rates.
 *
 * c2Weight controls the relative strength of the second-order correction.
 * At the Klatt 80 reference rate of 10 kHz, the correction is modest; at
 * 44.1/48 kHz the bilinear warp pushes the Nyquist much higher, so the
 * correction matters more for the 3-5 kHz region that speech occupies.
 */
import { computeRmsPeak, BaseProcessorOptions } from "./wasm-utils.js";

interface ChalkerMetricsMessage {
  type: "metrics";
  node: string;
  rms: number;
  peak: number;
  inRms?: number;
  inPeak?: number;
}

/**
 * The second-order correction weight.
 *
 * Derived from the ratio of the second to first term in the piston-in-baffle
 * resistance series: θ₀ = y²/8 - y⁴/192, so the second term is -(1/24) of
 * the first term evaluated at y=1. For the discrete-time approximation via
 * bilinear transform, this maps to a second-difference weighted by
 * -(1/24) * (T/2) where T = 1/SR. We fold the constant into c2Weight and
 * let the SR scaling handle the rest.
 *
 * The value 0.04167 ≈ 1/24 matches the series ratio from Chalker 1985 eq. (3).
 */
const C2_WEIGHT = 1 / 24;

class ChalkerRadiationProcessor extends AudioWorkletProcessor {
  private disposed = false;
  prev1: number[];
  prev2: number[];
  debug: boolean;
  nodeId: string;
  c1: number;
  c2: number;
  reportInterval: number;
  _reportCountdown: number;

  constructor(options?: unknown) {
    super(options);
    const opts = options as BaseProcessorOptions | undefined;
    this.prev1 = [];
    this.prev2 = [];
    this.debug = Boolean(opts?.processorOptions?.debug);
    this.nodeId = opts?.processorOptions?.nodeId || "chalker-rad";

    // Klatt 80 reference rate is 10 kHz. Scale so amplitude matches at any SR.
    const srRatio = sampleRate / 10000;

    // c1: first-difference gain (same as existing differentiator)
    this.c1 = srRatio;

    // c2: second-difference correction (Chalker 1985 two-term improvement)
    // Scales as srRatio^2 because the second difference is a second-order
    // discrete derivative.
    this.c2 = -C2_WEIGHT * srRatio * srRatio;

    this.reportInterval = opts?.processorOptions?.reportInterval || 50;
    this._reportCountdown = this.reportInterval;
    this.port.onmessage = (event: MessageEvent<{ type?: string }>) => {
      if (event?.data?.type === "dispose") {
        this.disposed = true;
        this.port.close();
        return;
      }
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
    if (this.disposed) return false;
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !output) {
      return true;
    }

    for (let ch = 0; ch < output.length; ch += 1) {
      const inCh = input[ch];
      const outCh = output[ch];
      if (!inCh || !outCh) continue;

      let p1 = this.prev1[ch] || 0;
      let p2 = this.prev2[ch] || 0;
      for (let i = 0; i < outCh.length; i += 1) {
        const x = inCh[i] ?? 0;
        // y[n] = c1*(x[n] - x[n-1]) + c2*(x[n] - 2*x[n-1] + x[n-2])
        outCh[i] = this.c1 * (x - p1) + this.c2 * (x - 2 * p1 + p2);
        p2 = p1;
        p1 = x;
      }
      this.prev1[ch] = p1;
      this.prev2[ch] = p2;
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
    const payload: ChalkerMetricsMessage = {
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

registerProcessor("chalker-radiation-processor", ChalkerRadiationProcessor);
