// Klatt (1980), COEWAV.FOR. DSP authority: crates/differentiator/src/lib.rs.
import { WasmSampleProcessor } from "./sample-processor.js";
import { computeRmsPeak } from "./wasm-utils.js";
class DifferentiatorProcessor extends WasmSampleProcessor {
    constructor(options) {
        super(options, "differentiator", "diff");
    }
    render(input, output) {
        for (let ch = 0; ch < output.length; ch++) {
            const source = input[ch];
            if (!source)
                continue;
            for (let i = 0; i < output[ch].length; i++)
                output[ch][i] = this.sample(ch, source[i] ?? 0);
        }
        const metrics = input[0] ? computeRmsPeak(input[0]) : null;
        return metrics ? { inRms: metrics.rms, inPeak: metrics.peak } : {};
    }
}
registerProcessor("differentiator-processor", DifferentiatorProcessor);
