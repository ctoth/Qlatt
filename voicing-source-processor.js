
// voicing-source-processor.js
class VoicingSourceProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'f0', defaultValue: 100, minValue: 1, maxValue: 500, automationRate: 'a-rate' },
            { name: 'amp', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' } // Linear amplitude
        ];
    }

    constructor() {
        super();
        this.samplesUntilPulse = 0;
        this.lastF0 = 0; // To detect changes
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0]; // Single output channel
        const outputChannel = output[0];
        const f0Values = parameters.f0;
        const ampValues = parameters.amp;
        const blockLength = outputChannel.length; // Usually 128 samples

        for (let i = 0; i < blockLength; ++i) {
            const f0 = f0Values.length > 1 ? f0Values[i] : f0Values[0];
            const amp = ampValues.length > 1 ? ampValues[i] : ampValues[0];
            let pulse = 0.0;

            if (f0 > 0 && amp > 0) {
                 // Update samplesUntilPulse only if F0 changed significantly to avoid phase jumps
                 // Or simpler: always recalculate based on current f0 for responsiveness

                if (this.samplesUntilPulse <= 0) {
                    pulse = amp; // Generate impulse
                    const periodSamples = sampleRate / f0; // sampleRate is a global variable in AudioWorkletGlobalScope
                    this.samplesUntilPulse += periodSamples; // Reset counter for next pulse
                }
                this.samplesUntilPulse -= 1;
            } else {
                // Reset phase/counter when F0 or amp is zero
                this.samplesUntilPulse = 0;
                this.lastF0 = 0;
            }
            outputChannel[i] = pulse;
        }
        return true; // Keep processor alive
    }
}

registerProcessor('voicing-source-processor', VoicingSourceProcessor);