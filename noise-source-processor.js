class NoiseSourceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "fricationGain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate",
      },
      {
        name: "aspirationGain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "a-rate",
      },
      // Parameters for modulation (optional, complex) can be added here
    ];
  }
  constructor(options) { // Add options parameter
    super(options); // Pass options to super
    // State for modulation if implemented
    this._logCounter = 0; // Counter for throttling logs
    // Ensure sampleRate is defined globally or passed via options
    const effectiveSampleRate = typeof sampleRate !== 'undefined' ? sampleRate : options?.processorOptions?.sampleRate || 44100; // Default if undefined
    this._logInterval = Math.floor(effectiveSampleRate / 10); // Log ~10 times per second
    // console.log(`[NoiseSource] Initialized. Sample Rate: ${effectiveSampleRate}, Log interval: ${this._logInterval} samples.`);
  }

  process(inputs, outputs, parameters) {
    // Check if primary outputs and their first channels exist and have length
    const fricOutputAvailable = outputs && outputs[0] && outputs[0][0] && outputs[0][0].length > 0;
    const aspOutputAvailable = outputs && outputs[1] && outputs[1][0] && outputs[1][0].length > 0;

    if (!fricOutputAvailable && !aspOutputAvailable) {
      // console.log("[NoiseSource] Both output buffers missing or invalid.");
      return true; // Keep alive but do nothing if no valid outputs
    }

    // Determine block length from the first available valid output
    const blockLength = fricOutputAvailable ? outputs[0][0].length : outputs[1][0].length;

    // Get references, using null if unavailable
    const fricOutput = fricOutputAvailable ? outputs[0][0] : null; // Output 0: Frication Noise
    const aspOutput = aspOutputAvailable ? outputs[1][0] : null; // Output 1: Aspiration Noise

    // Ensure parameters exist before accessing them
    const fricGainValues = parameters.fricationGain || [0]; // Default to k-rate 0 if missing
    const aspGainValues = parameters.aspirationGain || [0];   // Default to k-rate 0 if missing

    let fricActive = false; // Track if output was non-zero
    let aspActive = false;  // Track if output was non-zero

    // --- Logging ---
    // Use a smaller interval for testing if needed, or disable
    // this._logInterval = 128; // Log every block during tests?
    const shouldLog = this._logCounter === 0;
    let logFricGain = 0, logAspGain = 0;
    if (shouldLog) {
        logFricGain = fricGainValues.length > 1 ? fricGainValues[0] : fricGainValues[0];
        logAspGain = aspGainValues.length > 1 ? aspGainValues[0] : aspGainValues[0];
    }
    // ---

    for (let i = 0; i < blockLength; ++i) {
      const fricGain =
        fricGainValues.length > 1 ? fricGainValues[i] : fricGainValues[0];
      const aspGain =
        aspGainValues.length > 1 ? aspGainValues[i] : aspGainValues[0];

      let noise = Math.random() * 2.0 - 1.0; // Simple uniform noise

      // --- Optional Modulation could be added here ---

      // Only write to output if it's available
      if (fricOutput) {
        fricOutput[i] = noise * fricGain;
        if (fricGain > 0) fricActive = true;
      }
      if (aspOutput) {
        aspOutput[i] = noise * aspGain;
        if (aspGain > 0) aspActive = true;
      }
    }

    // --- Logging ---
    if (shouldLog && (fricActive || aspActive)) { // Only log if something happened or gains were > 0
        // console.log(`[NoiseSource] FricGain: ${logFricGain.toFixed(3)}, AspGain: ${logAspGain.toFixed(3)}, FricActive: ${fricActive}, AspActive: ${aspActive}`);
    }
     // Always advance counter regardless of logging
    this._logCounter = (this._logCounter + blockLength) % this._logInterval;
    // ---

    return true; // Keep processor alive
  }
}

// Export the class for testing purposes if using ES modules
// If this script is meant to be loaded directly by addModule, registerProcessor is sufficient.
// For Vitest/Jest, we often need an export.
export default NoiseSourceProcessor;

// Conditional registration: only run registerProcessor if it's available (i.e., in a Worklet scope or mocked).
// This prevents errors during testing or if run outside a worklet.
if (typeof registerProcessor === 'function') {
    try {
        registerProcessor("noise-source-processor", NoiseSourceProcessor);
    } catch (error) {
        console.error("Failed to register NoiseSourceProcessor:", error);
        // Potentially re-registering?
    }
}
