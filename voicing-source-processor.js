// voicing-source-processor.js (Process Method - RETRY Force First Pulse Logic)

// Helper function (copied from klatt-synth.js for worklet scope)
function dbToLinearWorklet(db) {
  if (isNaN(db) || db <= -70) return 0.0;
  return 10.0 ** (db / 20.0);
}

class VoicingSourceProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
         return [
            { name: 'f0', defaultValue: 100, /* minValue: 1, */ maxValue: 500, automationRate: 'a-rate' }, // Allow F0=0
            // Renamed 'amp' to 'baseAmpDb' - expects dB value corresponding to AV
            { name: 'baseAmpDb', defaultValue: -70, minValue: -70, maxValue: 80, automationRate: 'a-rate' }
        ];
    }

    constructor(options) {
        super(options);
        this.samplesUntilPulse = 0;
        this.pendingNegativePulseAmp = 0;
        this._isActivePreviously = false; // Track active state across samples
        // Reference F0 for scaling, can be adjusted
        this.referenceF0 = 100.0;
        console.log(`[VoicingSource] Initialized (F0 Scaling Active, Ref F0=${this.referenceF0}). Sample Rate: ${sampleRate}`);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        if (!output || !output[0]) return true;
        const outputChannel = output[0];
        const f0Values = parameters.f0;
        const baseAmpDbValues = parameters.baseAmpDb; // Use the new parameter name
        const blockLength = outputChannel.length;

        for (let i = 0; i < blockLength; ++i) {
            const f0 = f0Values.length > 1 ? f0Values[i] : f0Values[0];
            const baseAmpDb = baseAmpDbValues.length > 1 ? baseAmpDbValues[i] : baseAmpDbValues[0];
            let outputSample = 0.0;
            const MIN_F0_HZ = 1.0;
            const MIN_AMP_DB = -69.0; // Threshold slightly above -70

            // Calculate linear amplitude with F0 scaling
            const linearBaseAmp = dbToLinearWorklet(baseAmpDb);
            // Scale amplitude by (f0 / referenceF0). Ensure f0 is positive.
            // Clamp f0 for scaling calculation to avoid extreme values if f0 is very low/high
            const f0ForScaling = Math.max(MIN_F0_HZ, Math.min(f0, 500)); // Clamp f0 used for scaling
            const f0Factor = (f0ForScaling > 0 && this.referenceF0 > 0) ? (f0ForScaling / this.referenceF0) : 1.0;
            const currentAmp = linearBaseAmp * f0Factor;

            const isActiveCurrentSample = (f0 >= MIN_F0_HZ && baseAmpDb > MIN_AMP_DB && sampleRate > 0);
            const justActivated = isActiveCurrentSample && !this._isActivePreviously;

            // --- Optional: Log only the first sample's state ---
            if (i === 0) {
                 console.log(`[VoicingSource Block Start (i=0)] samplesUntilPulse=${this.samplesUntilPulse.toFixed(2)}, baseAmpDb=${baseAmpDb.toFixed(2)}, f0=${f0.toFixed(2)}, currentAmp=${currentAmp.toFixed(4)}, active=${isActiveCurrentSample}, wasActive=${this._isActivePreviously}, justActivated=${justActivated}`);
            }
            // ---

            // 1. Handle pending negative pulse first
            if (this.pendingNegativePulseAmp > 0) {
                outputSample = -this.pendingNegativePulseAmp;
                this.pendingNegativePulseAmp = 0; // Clear pending pulse
            }
            // 2. Handle main logic if no negative pulse was generated
            else {
                if (isActiveCurrentSample) {
                    // Generate pulse if EITHER it's the first activation OR the timer is ready
                    if (justActivated || this.samplesUntilPulse <= 0) {
                        outputSample = currentAmp; // Positive pulse using calculated amplitude
                        this.pendingNegativePulseAmp = currentAmp; // Schedule negative pulse with the same amplitude

                        // Reset counter based on current period
                        const MIN_F0_FOR_PERIOD_HZ = 20.0; // Minimum F0 to calculate period from
                        // Use the actual f0 for period calculation, clamping prevents division by zero/negative
                        const f0ForPeriod = Math.max(MIN_F0_FOR_PERIOD_HZ, f0);
                        const periodSamples = sampleRate / f0ForPeriod;
                        // Reset counter: samplesUntilPulse should be periodSamples - 1 (for the current sample)
                        // Ensure it's not negative if periodSamples is < 1 (very high f0)
                        this.samplesUntilPulse = Math.max(0, periodSamples - 1);

                        // Optional: Log pulse generation only on i=0 if needed
                        // if (i === 0) console.log(`   -> Pulse generated (amp=${outputSample.toFixed(4)}, justActivated=${justActivated}). Counter reset to ${this.samplesUntilPulse.toFixed(2)}`);

                    }
                    // If active but not time for pulse, do nothing, counter decrements below
                } else {
                    // --- Inactive ---
                    // If inactive, ensure no pulse is generated and reset state
                    outputSample = 0.0;
                    this.pendingNegativePulseAmp = 0.0;
                    // Reset counter only if it wasn't already zero (or negative)
                    if (this.samplesUntilPulse > 0) {
                       this.samplesUntilPulse = 0;
                    }
                    // If already 0 or negative, let it stay there until activation
                }
            }

            // 3. Decrement counter (always, even if inactive, stops at/below 0)
            // Ensure counter doesn't go excessively negative if inactive for long
            this.samplesUntilPulse = Math.max(-1, this.samplesUntilPulse - 1);

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
