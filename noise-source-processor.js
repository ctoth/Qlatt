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
  constructor() {
    super();
    // State for modulation if implemented
  }

  process(inputs, outputs, parameters) {
    const fricOutput = outputs[0][0]; // Output 0: Frication Noise
    const aspOutput = outputs[1][0]; // Output 1: Aspiration Noise

    const fricGainValues = parameters.fricationGain;
    const aspGainValues = parameters.aspirationGain;

    const blockLength = fricOutput.length;

    for (let i = 0; i < blockLength; ++i) {
      const fricGain =
        fricGainValues.length > 1 ? fricGainValues[i] : fricGainValues[0];
      const aspGain =
        aspGainValues.length > 1 ? aspGainValues[i] : aspGainValues[0];

      let noise = Math.random() * 2.0 - 1.0; // Simple uniform noise

      // --- Optional Modulation could be added here ---

      fricOutput[i] = noise * fricGain;
      aspOutput[i] = noise * aspGain;
    }
    return true;
  }
}

registerProcessor("noise-source-processor", NoiseSourceProcessor);
