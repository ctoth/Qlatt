// Klatt (1980). DSP authority: crates/impulse-train/src/lib.rs.
import { paramAt, WasmSampleProcessor } from "./sample-processor.js";
class ImpulseTrainProcessor extends WasmSampleProcessor {
    static get parameterDescriptors() {
        return [
            { name: "f0", defaultValue: 0, minValue: 0, maxValue: 2000, automationRate: "a-rate" },
            { name: "gain", defaultValue: 1, minValue: 0, maxValue: 1, automationRate: "a-rate" },
            {
                name: "openPhaseRatio",
                defaultValue: 0.7,
                minValue: 0,
                maxValue: 1,
                automationRate: "k-rate",
            },
        ];
    }
    constructor(options) {
        super(options, "impulse-train", "impulse");
    }
    render(_input, output, parameters) {
        const out = output[0];
        let gainSum = 0;
        let gainPeak = 0;
        for (let i = 0; i < out.length; i++) {
            const gain = paramAt(parameters.gain, i, 0);
            gainSum += gain;
            gainPeak = Math.max(gainPeak, gain);
            out[i] = this.sample(0, 0, paramAt(parameters.f0, i, 0), gain, parameters.openPhaseRatio?.[0] ?? 0.7);
        }
        return { gainAvg: gainSum / out.length, gainPeak };
    }
}
registerProcessor("impulse-train-processor", ImpulseTrainProcessor);
