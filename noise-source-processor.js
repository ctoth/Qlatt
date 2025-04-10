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
    this._logInterval = Math.floor(sampleRate / 10); // Log ~10 times per second
    console.log(`[NoiseSource] Initialized. Log interval: ${this._logInterval} samples.`);
  }

  process(inputs, outputs, parameters) {
    if (!outputs || !outputs[0] || !outputs[0][0] || !outputs[1] || !outputs[1][0]) {
        // console.log("[NoiseSource] Missing output buffers.");
        return true; // Keep alive but do nothing
    }
    const fricOutput = outputs[0][0]; // Output 0: Frication Noise
    const aspOutput = outputs[1][0]; // Output 1: Aspiration Noise

    const fricGainValues = parameters.fricationGain; // Linear gain 0-1
    const aspGainValues = parameters.aspirationGain;   // Linear gain 0-1

    const blockLength = fricOutput.length;
    let fricActive = false; // Track if output was non-zero
    let aspActive = false;  // Track if output was non-zero

    // --- Logging ---
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

      fricOutput[i] = noise * fricGain;
      aspOutput[i] = noise * aspGain;

      if (fricGain > 0) fricActive = true;
      if (aspGain > 0) aspActive = true;
    }

    // --- Logging ---
    if (shouldLog) {
        console.log(`[NoiseSource] FricGain: ${logFricGain.toFixed(3)}, AspGain: ${logAspGain.toFixed(3)}, FricActive: ${fricActive}, AspActive: ${aspActive}`);
    }
    this._logCounter = (this._logCounter + blockLength) % this._logInterval;
    // ---

    return true;
  }
}

registerProcessor("noise-source-processor", NoiseSourceProcessor);
