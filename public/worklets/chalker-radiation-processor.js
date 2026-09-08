// Chalker & Mackerras (1985). Qlatt approximation and its limits are documented
// in the DSP authority: crates/chalker-radiation/src/lib.rs.
import { WasmSampleProcessor } from "./sample-processor.js";
import { computeRmsPeak } from "./wasm-utils.js";
class ChalkerRadiationProcessor extends WasmSampleProcessor {
    constructor(options) {
        super(options, "chalker-radiation", "chalker-rad");
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
registerProcessor("chalker-radiation-processor", ChalkerRadiationProcessor);
