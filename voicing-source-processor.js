
// voicing-source-processor.js
class VoicingSourceProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'f0', defaultValue: 100, /* minValue: 1, */ maxValue: 500, automationRate: 'a-rate' }, // Allow F0=0
            { name: 'amp', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' } // Linear amplitude
        ];
    }

    constructor(options) {
        super(options);
        this.samplesUntilPulse = 0;
        // No need for lastF0 here anymore
        this._logCounter = 0; // Counter for throttling logs
        // Access sampleRate directly - it's globally available in the worklet scope
        this._logInterval = Math.floor(sampleRate / 10); // Log ~10 times per second
        console.log(`[VoicingSource] Initialized. Log interval: ${this._logInterval} samples. Sample Rate: ${sampleRate}`);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0]; // Single output channel
        if (!output || !output[0]) return true; // Stop if output is not available
        const outputChannel = output[0];
        const f0Values = parameters.f0;
        const ampValues = parameters.amp; // Linear amp 0-1
        const blockLength = outputChannel.length; // Usually 128 samples
        let generatedPulse = false; // Track if any pulse was generated in this block

        // --- Logging ---
        const shouldLog = this._logCounter === 0;
        let logF0 = 0, logAmp = 0;
        if (shouldLog) {
            logF0 = f0Values.length > 1 ? f0Values[0] : f0Values[0]; // Log first value in block
            logAmp = ampValues.length > 1 ? ampValues[0] : ampValues[0];
        }
        // ---

        for (let i = 0; i < blockLength; ++i) {
            const f0 = f0Values.length > 1 ? f0Values[i] : f0Values[0];
            const amp = ampValues.length > 1 ? ampValues[i] : ampValues[0];
            let pulse = 0.0;
            const MIN_F0_HZ = 1.0; // Minimum frequency to consider voiced

            // Check if voicing should be active AND F0 is sensible
            if (f0 >= MIN_F0_HZ && amp > 1e-6 && sampleRate > 0) {
                // Check if it's time to generate a pulse
                if (this.samplesUntilPulse <= 0) {
                    pulse = amp; // Generate impulse scaled by linear amp
                    generatedPulse = true;

                    // --- MODIFICATION START ---
                    // Define a minimum F0 for calculating the next pulse period
                    // to avoid excessively large periods during ramp onset from silence.
                    const MIN_F0_FOR_PERIOD_HZ = 20.0;
                    const f0ForPeriod = Math.max(f0, MIN_F0_FOR_PERIOD_HZ);

                    // Calculate the period for the *next* pulse based on clamped f0
                    const periodSamples = sampleRate / f0ForPeriod;
                    // --- MODIFICATION END ---

                    // Add the period to the current counter value.
                    // This correctly schedules the next pulse, preserving phase.
                    this.samplesUntilPulse += Math.max(1, periodSamples);
                    // console.log(`   -> Pulse generated! Next in ${this.samplesUntilPulse.toFixed(1)} samples (f0=${f0.toFixed(1)}, f0ForPeriod=${f0ForPeriod.toFixed(1)}).`);
                }
            } else {
                // If inactive (f0=0, amp=0, or f0 too low), reset the counter/phase.
                // This ensures it starts immediately when parameters become active again.
                // Also prevents counter explosion from f0 values between 0 and MIN_F0_HZ.
                this.samplesUntilPulse = 0;
                // if (f0 > 0 && f0 < MIN_F0_HZ) {
                //     console.log(`[VoicingSource DEBUG] Resetting samplesUntilPulse due to low F0 (${f0.toFixed(2)} Hz)`);
                // }
            }

            // Decrement the counter for *every* sample processed.
            this.samplesUntilPulse -= 1; // Can become negative

            outputChannel[i] = pulse;
        }

        // --- Logging ---
        if (shouldLog) {
            // Use the potentially updated samplesUntilPulse value for logging
            console.log(`[VoicingSource] F0: ${logF0.toFixed(1)}, Amp: ${logAmp.toFixed(3)}, Pulse Generated in Block: ${generatedPulse}, SamplesUntilNextPulse: ${this.samplesUntilPulse.toFixed(1)}`);
        }
        this._logCounter = (this._logCounter + blockLength) % this._logInterval;
        // ---

        return true; // Keep processor alive
    }
}

// Conditional registration: only run registerProcessor if it's available
if (typeof registerProcessor === 'function') {
    try {
        registerProcessor('voicing-source-processor', VoicingSourceProcessor);
    } catch (error) {
        console.error("Failed to register VoicingSourceProcessor:", error);
    }
}
