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
    let maxAbsInput = 0.0; // Track input level for logging
    let maxAbsOutput = 0.0; // Track output level for logging
    let invalidInputDetected = false; // Flag for logging
    let invalidInputDetected = false; // Flag for logging
    let invalidOutputDetected = false; // Flag for logging

    // --- Logging ---
    const shouldLog = this._logCounter === 0;
    // ---

    for (let i = 0; i < blockLength; ++i) {
      const currentInput = inputChannel[i];

      // *** ADDED: Input Validation ***
      if (!isFinite(currentInput)) {
        if (!invalidInputDetected) { // Log only once per block
            console.warn(`[Radiation] Invalid input detected: ${currentInput} at sample ${i}. Resetting state.`);
            invalidInputDetected = true;
        }
        outputChannel[i] = 0.0; // Output silence
        this.lastInputSample = 0.0; // Reset state
        continue; // Skip normal processing for this sample
      }
      // *** END ADDED ***

      outputChannel[i] = currentInput - this.lastInputSample;
      this.lastInputSample = currentInput; // Update state *after* using it

      // *** ADDED: Output Validation ***
       if (!isFinite(outputChannel[i])) {
           if (!invalidOutputDetected) { // Log only once per block
               console.error(`[Radiation] Invalid output generated: ${outputChannel[i]} from input ${currentInput} and lastInput ${this.lastInputSample}. Resetting state.`);
               invalidOutputDetected = true;
           }
           outputChannel[i] = 0.0; // Output silence
           this.lastInputSample = 0.0; // Reset state
       }
      // *** END ADDED ***


      // Track max absolute values for logging (only if output was valid)
      const absInput = Math.abs(currentInput); // Input was already validated
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

// Conditional registration: only run registerProcessor if it's available
if (typeof registerProcessor === 'function') {
    try {
        registerProcessor("radiation-processor", RadiationProcessor);
    } catch (error) {
        console.error("Failed to register RadiationProcessor:", error);
    }
}
