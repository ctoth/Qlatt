// voicing-source-processor.js (Process Method - RETRY Force First Pulse Logic)

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
        this.pendingNegativePulseAmp = 0;
        this._isActivePreviously = false; // Track active state across samples
        console.log(`[VoicingSource] Initialized (Retry Force First Pulse). Sample Rate: ${sampleRate}`);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || !output[0]) return true;
        const outputChannel = output[0];
        const f0Values = parameters.f0;
        const ampValues = parameters.amp;
        const blockLength = outputChannel.length;

        for (let i = 0; i < blockLength; ++i) {
            const f0 = f0Values.length > 1 ? f0Values[i] : f0Values[0];
            const amp = ampValues.length > 1 ? ampValues[i] : ampValues[0];
            let outputSample = 0.0;
            const MIN_F0_HZ = 1.0;
            const MIN_AMP = 1e-6; // Use a small threshold for activation

            const isActiveCurrentSample = (f0 >= MIN_F0_HZ && amp > MIN_AMP && sampleRate > 0);
            const justActivated = isActiveCurrentSample && !this._isActivePreviously;

            // --- Optional: Log only the first sample's state ---
            if (i === 0) {
                 console.log(`[VoicingSource Block Start (i=0)] samplesUntilPulse=${this.samplesUntilPulse.toFixed(2)}, amp=${amp.toFixed(4)}, f0=${f0.toFixed(2)}, active=${isActiveCurrentSample}, wasActive=${this._isActivePreviously}, justActivated=${justActivated}`);
            }
            // ---

            // 1. Handle pending negative pulse first
            if (this.pendingNegativePulseAmp > 0) {
                outputSample = -this.pendingNegativePulseAmp;
                this.pendingNegativePulseAmp = 0;
            }
            // 2. Handle main logic if no negative pulse was generated
            else {
                if (isActiveCurrentSample) {
                    // Generate pulse if EITHER it's the first activation OR the timer is ready
                    if (justActivated || this.samplesUntilPulse <= 0) {
                        outputSample = amp; // Positive pulse
                        this.pendingNegativePulseAmp = amp; // Schedule negative

                        // Reset counter based on current period
                        const MIN_F0_FOR_PERIOD_HZ = 20.0;
                        const f0ForPeriod = Math.max(f0, MIN_F0_FOR_PERIOD_HZ);
                        const periodSamples = sampleRate / f0ForPeriod;
                        this.samplesUntilPulse = Math.max(0, periodSamples - 1); // Use direct reset

                        // Optional: Log pulse generation only on i=0 if needed
                        // if (i === 0) console.log(`   -> Pulse generated (justActivated=${justActivated}). Counter reset to ${this.samplesUntilPulse.toFixed(2)}`);

                    }
                    // If active but not time for pulse, do nothing, counter decrements below
                } else {
                    // --- Inactive ---
                    // Reset counter only if it wasn't already zero (or negative)
                    if (this.samplesUntilPulse > 0 || this.pendingNegativePulseAmp > 0) {
                       this.samplesUntilPulse = 0;
                       this.pendingNegativePulseAmp = 0;
                    }
                     // If already 0 or -1, let it stay there until activation
                }
            }

            // 3. Decrement counter (always)
            this.samplesUntilPulse -= 1;

            // 4. Assign output
            outputChannel[i] = outputSample;

            // 5. Update previous state tracker for next sample
            this._isActivePreviously = isActiveCurrentSample;

        } // End sample loop

        return true;
    }
}

// Conditional registration
if (typeof registerProcessor === 'function') {
    try {
        registerProcessor('voicing-source-processor', VoicingSourceProcessor);
    } catch (error) {
        console.error("Failed to register VoicingSourceProcessor:", error);
    }
}