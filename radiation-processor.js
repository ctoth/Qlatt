class RadiationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lastInputSample = 0.0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Check if input or output channel is missing or empty
    if (!input || !input[0] || input[0].length === 0 || !output || !output[0]) {
      // Input disconnected or silent, or output buffer unavailable
      const outputChannel = output ? output[0] : null;
      if (outputChannel) {
        outputChannel.fill(0.0); // Output silence if possible
      }
      this.lastInputSample = 0.0;
      return true; // Keep processor alive
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    const blockLength = inputChannel.length;

    for (let i = 0; i < blockLength; ++i) {
      const currentInput = inputChannel[i];
      outputChannel[i] = currentInput - this.lastInputSample;
      this.lastInputSample = currentInput;
    }
    return true;
  }
}

registerProcessor("radiation-processor", RadiationProcessor);
