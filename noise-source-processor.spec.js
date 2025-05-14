import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock the global scope expected by AudioWorkletProcessor
const mockRegisterProcessor = vi.fn();
vi.stubGlobal("registerProcessor", mockRegisterProcessor);
vi.stubGlobal("sampleRate", 44100); // Standard sample rate

// Mock the base class AudioWorkletProcessor
class MockAudioWorkletProcessor {
  constructor(options) {
    // Basic constructor to accept options like the real one
  }
  // No need to mock 'process' or other methods unless the processor's
  // constructor or other methods call super.method()
}
vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor);

// Dynamically import the processor AFTER setting up mocks
let NoiseSourceProcessor;

// Helper function to create mock parameter arrays
const createParamArray = (value, length) => {
  if (typeof value === 'number') {
    return new Float32Array(Array(length).fill(value));
  }
  if (Array.isArray(value)) {
    // Ensure it's the correct length, padding or truncating as needed
    const arr = value.slice(0, length);
    while (arr.length < length) {
      arr.push(arr[arr.length - 1] ?? 0); // Pad with last value or 0
    }
    return new Float32Array(arr);
  }
  // Default k-rate behavior: single value array
  return new Float32Array([value]);
};


describe("NoiseSourceProcessor", () => {
  let processor;
  const BLOCK_LENGTH = 128; // Standard AudioWorklet block size
  let outputs;
  let extraGain; // To store calculated extraGain for assertions
  let extraGain; // To store calculated extraGain
  let parameters;

  beforeEach(async () => {
    // Reset mocks and globals before each test
    vi.resetModules(); // Important to re-import the processor cleanly
    vi.stubGlobal("registerProcessor", mockRegisterProcessor);
    vi.stubGlobal("sampleRate", 44100);
    // Ensure the AudioWorkletProcessor mock is stubbed *before* the import
    vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor);


    // Import the processor class for this test run
    const module = await import("./noise-source-processor.js?t=" + Date.now()); // Cache bust import
    NoiseSourceProcessor = module.default; // Assuming it exports default

    // Re-create processor and buffers for isolation
    // Pass processorOptions including sampleRate to the constructor
    const currentSampleRate = 44100;
    vi.stubGlobal("sampleRate", currentSampleRate);
    const processorOptions = { processorOptions: { sampleRate: currentSampleRate } };
    processor = new NoiseSourceProcessor(processorOptions); // Pass options

    // Calculate extraGain based on the processor's internal logic for assertions
    const oldB = 0.75;
    const oldSampleRate = 10000;
    const f = 1000;
    const g = (1 - oldB) / Math.sqrt(1 - 2 * oldB * Math.cos(2 * Math.PI * f / oldSampleRate) + oldB ** 2);
    extraGain = 2.5 * (currentSampleRate / 10000) ** 0.33;
    // If processor.filterA and processor.filterB were public, we could use them directly
    // For now, we recalculate extraGain as the dominant factor for DC gain.

    // Prepare mock outputs [outputIndex][channelIndex][sampleIndex]
    outputs = [
      [new Float32Array(BLOCK_LENGTH)], // Output 0: Frication
      [new Float32Array(BLOCK_LENGTH)], // Output 1: Aspiration
    ];

    // Prepare mock parameters (a-rate)
    parameters = {
      fricationGain: createParamArray(0, BLOCK_LENGTH),
      aspirationGain: createParamArray(0, BLOCK_LENGTH),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should be registered with the correct name", () => {
    // Check if registerProcessor was called correctly after module import
    expect(mockRegisterProcessor).toHaveBeenCalledWith(
      "noise-source-processor",
      NoiseSourceProcessor
    );
  });

  it("should initialize with default parameter descriptors", () => {
    const descriptors = NoiseSourceProcessor.parameterDescriptors;
    expect(descriptors).toEqual([
      { name: "fricationGain", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
      { name: "aspirationGain", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "a-rate" },
    ]);
  });

  it("should produce zero output when both gains are zero", () => {
    // Parameters already set to 0 in beforeEach
    const alive = processor.process([], outputs, parameters);

    expect(alive).toBe(true); // Processor should stay alive
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true); // Frication output all zeros
    expect(outputs[1][0].every((sample) => sample === 0)).toBe(true); // Aspiration output all zeros
  });

  it("should produce non-zero frication noise when fricationGain is positive", () => {
    parameters.fricationGain = createParamArray(0.5, BLOCK_LENGTH);
    parameters.aspirationGain = createParamArray(0, BLOCK_LENGTH);

    processor.process([], outputs, parameters);

    // Check frication output: should not be all zero, values should be within [-0.5 * extraGain, 0.5 * extraGain]
    expect(outputs[0][0].some((sample) => sample !== 0)).toBe(true);
    outputs[0][0].forEach(sample => {
        expect(sample).toBeGreaterThanOrEqual(-0.5 * extraGain);
        expect(sample).toBeLessThanOrEqual(0.5 * extraGain);
    });

    // Check aspiration output: should still be all zero
    expect(outputs[1][0].every((sample) => sample === 0)).toBe(true);
  });

   it("should produce non-zero aspiration noise when aspirationGain is positive", () => {
    parameters.fricationGain = createParamArray(0, BLOCK_LENGTH);
    parameters.aspirationGain = createParamArray(0.5, BLOCK_LENGTH);

    processor.process([], outputs, parameters);

    // Check frication output: should be all zero
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true);

    // Check aspiration output: should not be all zero, values should be within [-0.5 * extraGain, 0.5 * extraGain]
    expect(outputs[1][0].some((sample) => sample !== 0)).toBe(true);
     outputs[1][0].forEach(sample => {
        expect(sample).toBeGreaterThanOrEqual(-0.5 * extraGain);
        expect(sample).toBeLessThanOrEqual(0.5 * extraGain);
    });
  });

  it("should produce identical noise on both outputs when gains are equal and positive", () => {
    const gainValue = 0.7;
    parameters.fricationGain = createParamArray(gainValue, BLOCK_LENGTH);
    parameters.aspirationGain = createParamArray(gainValue, BLOCK_LENGTH);

    processor.process([], outputs, parameters);

    // Check both outputs are non-zero
    expect(outputs[0][0].some((sample) => sample !== 0)).toBe(true);
    expect(outputs[1][0].some((sample) => sample !== 0)).toBe(true);

    // Check that the noise signal is identical for each sample
    for (let i = 0; i < BLOCK_LENGTH; i++) {
      expect(outputs[0][0][i]).toBeCloseTo(outputs[1][0][i]);
       // Check bounds based on gain * extraGain
       expect(outputs[0][0][i]).toBeGreaterThanOrEqual(-gainValue * extraGain);
       expect(outputs[0][0][i]).toBeLessThanOrEqual(gainValue * extraGain);
    }
  });

   it("should scale noise independently based on different gains", () => {
    const fricGain = 0.8;
    const aspGain = 0.4;
    parameters.fricationGain = createParamArray(fricGain, BLOCK_LENGTH);
    parameters.aspirationGain = createParamArray(aspGain, BLOCK_LENGTH);

    processor.process([], outputs, parameters);

    // Check both outputs are non-zero
    expect(outputs[0][0].some((sample) => sample !== 0)).toBe(true);
    expect(outputs[1][0].some((sample) => sample !== 0)).toBe(true);

    // Check that the noise signal ratio matches the gain ratio
    for (let i = 0; i < BLOCK_LENGTH; i++) {
      // Avoid division by zero if a sample happens to be exactly zero
      if (Math.abs(outputs[1][0][i]) > 1e-9) {
         expect(outputs[0][0][i] / outputs[1][0][i]).toBeCloseTo(fricGain / aspGain);
      } else {
         // If aspOutput is near zero, fricOutput should also be near zero
         expect(outputs[0][0][i]).toBeCloseTo(0);
      }
       // Check bounds for each, including extraGain
       expect(outputs[0][0][i]).toBeGreaterThanOrEqual(-fricGain * extraGain);
       expect(outputs[0][0][i]).toBeLessThanOrEqual(fricGain * extraGain);
       expect(outputs[1][0][i]).toBeGreaterThanOrEqual(-aspGain * extraGain);
       expect(outputs[1][0][i]).toBeLessThanOrEqual(aspGain * extraGain);
    }
  });

  it("should handle a-rate gain changes within a block", () => {
    // Create ramps for gains
    const fricGainRamp = Array.from({ length: BLOCK_LENGTH }, (_, i) => 0.1 + (0.8 * i) / (BLOCK_LENGTH - 1)); // Ramp 0.1 to 0.9
    const aspGainRamp = Array.from({ length: BLOCK_LENGTH }, (_, i) => 0.5 - (0.4 * i) / (BLOCK_LENGTH - 1)); // Ramp 0.5 to 0.1

    parameters.fricationGain = createParamArray(fricGainRamp, BLOCK_LENGTH);
    parameters.aspirationGain = createParamArray(aspGainRamp, BLOCK_LENGTH);

    processor.process([], outputs, parameters);

    // Verify outputs are non-zero
    expect(outputs[0][0].some(sample => sample !== 0)).toBe(true);
    expect(outputs[1][0].some(sample => sample !== 0)).toBe(true);

    // Check that the noise signal ratio approximately matches the gain ratio at each step
    // This is less precise due to randomness but checks the core logic
    for (let i = 0; i < BLOCK_LENGTH; i++) {
        const expectedRatio = aspGainRamp[i] !== 0 ? fricGainRamp[i] / aspGainRamp[i] : (fricGainRamp[i] === 0 ? 1 : Infinity); // Handle division by zero
        const actualRatio = outputs[1][0][i] !== 0 ? outputs[0][0][i] / outputs[1][0][i] : (outputs[0][0][i] === 0 ? 1 : Infinity);

        if (Math.abs(outputs[1][0][i]) > 1e-9 && Math.abs(aspGainRamp[i]) > 1e-9) {
             expect(actualRatio).toBeCloseTo(expectedRatio);
        } else if (Math.abs(aspGainRamp[i]) < 1e-9) {
            // If aspGain is near zero, aspOutput should be near zero
            expect(outputs[1][0][i]).toBeCloseTo(0);
            // If fricGain is also near zero, fricOutput should be near zero
            if (Math.abs(fricGainRamp[i]) < 1e-9) {
                 expect(outputs[0][0][i]).toBeCloseTo(0);
            }
        } else if (Math.abs(outputs[1][0][i]) < 1e-9) {
             // If aspOutput is near zero (due to random chance), aspGain wasn't zero,
             // then fricOutput should also be near zero
             expect(outputs[0][0][i]).toBeCloseTo(0);
        }

        // Check bounds based on instantaneous gain * extraGain
        expect(outputs[0][0][i]).toBeGreaterThanOrEqual(-fricGainRamp[i] * extraGain);
        expect(outputs[0][0][i]).toBeLessThanOrEqual(fricGainRamp[i] * extraGain);
        expect(outputs[1][0][i]).toBeGreaterThanOrEqual(-aspGainRamp[i] * extraGain);
        expect(outputs[1][0][i]).toBeLessThanOrEqual(aspGainRamp[i] * extraGain);
    }
  });

   it("should return true even if output buffers are missing or incomplete", () => {
    // Test cases for missing/incomplete outputs
    const cases = [
        null,
        [],
        [null],
        [[]],
        [[new Float32Array(BLOCK_LENGTH)]], // Missing second output
        [[new Float32Array(BLOCK_LENGTH)], null],
        [[new Float32Array(BLOCK_LENGTH)], []],
        [[new Float32Array(BLOCK_LENGTH)], [null]],
    ];

    parameters.fricationGain = createParamArray(0.5, BLOCK_LENGTH);
    parameters.aspirationGain = createParamArray(0.5, BLOCK_LENGTH);


    cases.forEach(outputCase => {
        expect(() => processor.process([], outputCase, parameters)).not.toThrow();
        const alive = processor.process([], outputCase, parameters);
        expect(alive).toBe(true);
    });
  });

});
