// Klatt (1980). DSP and seeded PRNG authority: crates/noise-source/src/lib.rs.
import { paramAt, WasmSampleProcessor } from "./sample-processor.js";

class NoiseSourceProcessor extends WasmSampleProcessor {
  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "gain", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      {
        name: "cutoff",
        defaultValue: 1000,
        minValue: 50,
        maxValue: 20000,
        automationRate: "k-rate",
      },
    ];
  }
  constructor(options?: unknown) {
    super(options, "noise-source", "noise");
  }
  protected render(
    input: Float32Array[],
    output: Float32Array[],
    parameters: Record<string, Float32Array>,
  ): Record<string, number> {
    const out = output[0];
    const cutoff = parameters.cutoff?.[0] ?? 1000;
    let gainSum = 0;
    let gainPeak = 0;
    for (let i = 0; i < out.length; i++) {
      const gain = paramAt(parameters.gain, i, 0);
      gainSum += gain;
      gainPeak = Math.max(gainPeak, gain);
      out[i] = this.sample(0, input[0] ? input[0][i] : 1, gain, cutoff);
    }
    return {
      gainAvg: gainSum / out.length,
      gainPeak,
      cutoff: Math.max(1, Math.min(cutoff, sampleRate * 0.45)),
    };
  }
}
registerProcessor("noise-source-processor", NoiseSourceProcessor);
