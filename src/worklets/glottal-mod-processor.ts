// Klatt (1980) COEWAV.FOR; Gobl (1988); Fant (1997), Table 1.
// DSP authority: crates/glottal-mod/src/lib.rs.
import { paramAt, WasmSampleProcessor } from "./sample-processor.js";

class GlottalModProcessor extends WasmSampleProcessor {
  static get parameterDescriptors(): AudioParamDescriptor[] {
    return [
      { name: "f0", defaultValue: 110, minValue: 0, maxValue: 500, automationRate: "a-rate" },
      { name: "oq", defaultValue: 0.5, minValue: 0.1, maxValue: 1, automationRate: "k-rate" },
    ];
  }
  constructor(options?: unknown) {
    super(options, "glottal-mod", "glottal-mod");
  }
  protected render(
    _input: Float32Array[],
    output: Float32Array[],
    parameters: Record<string, Float32Array>,
  ): Record<string, number> {
    const out = output[0];
    let sum = 0;
    const values = parameters.f0;
    for (let i = 0; i < (values?.length ?? 0); i++) sum += values[i];
    for (let i = 0; i < out.length; i++)
      out[i] = this.sample(0, 0, paramAt(values, i, 0), parameters.oq?.[0] ?? 0.5);
    return { f0: values?.length ? sum / values.length : 0 };
  }
}
registerProcessor("glottal-mod-processor", GlottalModProcessor);
