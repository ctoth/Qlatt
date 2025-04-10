class RadiationProcessor extends AudioWorkletProcessor {
  constructor(options) { // Add options parameter
    super(options); // Pass options to super
    this.lastInputSample = 0.0;
    this._logCounter = 0; // Counter for throttling logs
    this._logInterval = Math.floor(sampleRate / 10); // Log ~10 times per second
    console.log(`[Radiation] Initialized. Log interval: ${this._logInterval} samples.`);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Check if input or output channel is missing or empty
    if (!input || !input[0] || input[0].length === 0 || !output || !output[0]) {
      // Input disconnected or silent, or output buffer unavailable
      const outputChannel = output ? output[0] : null;
      if (outputChannel) {
        console.log("[Radiation] Input/Output missing or empty, filling output with 0.");
        outputChannel.fill(0.0); // Output silence if possible
      } else {
        console.log("[Radiation] Input/Output missing or empty, cannot fill output.");
      }
      if (this.lastInputSample !== 0.0) {
        console.log("[Radiation] Resetting lastInputSample due to missing input.");
        this.lastInputSample = 0.0;
      }
      return true; // Keep processor alive
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockLength = inputChannel.length;
    let maxAbsInput = 0.0; // Track input level
    let maxAbsOutput = 0.0; // Track output level

    // --- Logging ---
    const shouldLog = this._logCounter === 0;
    // ---

    for (let i = 0; i < blockLength; ++i) {
      const currentInput = inputChannel[i];
      outputChannel[i] = currentInput - this.lastInputSample;
      this.lastInputSample = currentInput;

      // Track max absolute values for logging
      const absInput = Math.abs(currentInput);
      const absOutput = Math.abs(outputChannel[i]);
      if (absInput > maxAbsInput) maxAbsInput = absInput;
      if (absOutput > maxAbsOutput) maxAbsOutput = absOutput;
    }

    // --- Logging ---
    if (shouldLog) {
        console.log(`[Radiation] MaxInput: ${maxAbsInput.toFixed(4)}, MaxOutput: ${maxAbsOutput.toFixed(4)}, LastInputSample: ${this.lastInputSample.toFixed(4)}`);
    }
    this._logCounter = (this._logCounter + blockLength) % this._logInterval;
    // ---

    return true;
  }
}

registerProcessor("radiation-processor", RadiationProcessor);
