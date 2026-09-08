// Klatt (1980), COEWAV.FOR. DSP authority: crates/differentiator/src/lib.rs.
import { WasmSampleProcessor } from "./sample-processor.js";
import { computeRmsPeak } from "./wasm-utils.js";

class DifferentiatorProcessor extends WasmSampleProcessor {
  constructor(options?: unknown) {
    super(options, "differentiator", "diff");
  }
  protected render(input: Float32Array[], output: Float32Array[]): Record<string, number> {
    for (let ch = 0; ch < output.length; ch++) {
      const source = input[ch];
      if (!source) continue;
      for (let i = 0; i < output[ch].length; i++) output[ch][i] = this.sample(ch, source[i] ?? 0);
    }
    const metrics = input[0] ? computeRmsPeak(input[0]) : null;
    return metrics ? { inRms: metrics.rms, inPeak: metrics.peak } : {};
  }
}
registerProcessor("differentiator-processor", DifferentiatorProcessor);
