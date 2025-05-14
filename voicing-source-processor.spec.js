import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock the global scope expected by AudioWorkletProcessor
const mockRegisterProcessor = vi.fn();
vi.stubGlobal("registerProcessor", mockRegisterProcessor);
vi.stubGlobal("sampleRate", 44100); // Standard sample rate
vi.stubGlobal("currentFrame", 0); // Mock global currentFrame

// Mock the base class AudioWorkletProcessor
class MockAudioWorkletProcessor {
  constructor(options) {
    // Basic constructor to accept options like the real one
  }
}
// vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor); // Will be stubbed in beforeEach

// Statically import the processor AFTER setting up mocks
// import VoicingSourceProcessor from "./voicing-source-processor.js"; // Will be imported dynamically

let VoicingSourceProcessor;

// Helper function (copied from voicing-source-processor.js for test assertions)
function dbToLinearWorklet(db) {
  if (isNaN(db) || db <= -70) return 0.0;
  return 10.0 ** (db / 20.0);
}

// Helper function to create mock parameter arrays
const createParamArray = (value, length) => {
  if (typeof value === 'number') {
    return new Float32Array(Array(length).fill(value));
  }
  if (Array.isArray(value)) {
    const arr = value.slice(0, length);
    while (arr.length < length) {
      arr.push(arr[arr.length - 1] ?? 0);
    }
    return new Float32Array(arr);
  }
  return new Float32Array([value]); // k-rate default
};

describe("VoicingSourceProcessor", () => {
  let processor;
  const BLOCK_LENGTH = 128;
  let outputs;
  let parameters;

  beforeEach(async () => {
    vi.resetModules(); // Ensure clean import for each test
    vi.stubGlobal("registerProcessor", mockRegisterProcessor);
    vi.stubGlobal("sampleRate", 44100);
    vi.stubGlobal("currentFrame", 0);
    vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor); // Stub before import

    // Dynamically import the processor for this test run
    const module = await import("./voicing-source-processor.js?t=" + Date.now()); // Cache bust
    VoicingSourceProcessor = module.default;


    // Pass processorOptions including sampleRate to the constructor
    const processorOptions = { processorOptions: { sampleRate: 44100 } };
    processor = new VoicingSourceProcessor(processorOptions);

    outputs = [[new Float32Array(BLOCK_LENGTH)]];
    parameters = {
      f0: createParamArray(0, BLOCK_LENGTH),
      baseAmpDb: createParamArray(-70, BLOCK_LENGTH), // Use baseAmpDb and default to silent
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should be registered with the correct name", () => {
    expect(mockRegisterProcessor).toHaveBeenCalledWith(
      "voicing-source-processor",
      VoicingSourceProcessor
    );
  });

  it("should initialize with default parameter descriptors", () => {
    const descriptors = VoicingSourceProcessor.parameterDescriptors;
    expect(descriptors).toEqual([
      { name: "f0", defaultValue: 100, maxValue: 500, automationRate: "a-rate" },
      { name: "baseAmpDb", defaultValue: -70, minValue: -70, maxValue: 80, automationRate: "a-rate" },
    ]);
  });

  it("should produce zero output when baseAmpDb is -70 (or less)", () => {
    parameters.f0 = createParamArray(100, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(-70, BLOCK_LENGTH);
    const alive = processor.process([], outputs, parameters);
    expect(alive).toBe(true);
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true);
  });

  it("should produce zero output when f0 is zero", () => {
    parameters.f0 = createParamArray(0, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB, but F0 is 0
    const alive = processor.process([], outputs, parameters);
    expect(alive).toBe(true);
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true);
  });

   it("should produce zero output when f0 is below MIN_F0_HZ (e.g., 0.5 Hz)", () => {
    parameters.f0 = createParamArray(0.5, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB, but F0 is too low
    const alive = processor.process([], outputs, parameters);
    expect(alive).toBe(true);
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true);
    // Check internal state reset
    expect(processor.samplesUntilPulse).toBe(0);
  });

  it("should produce pulses when f0 is positive and baseAmpDb is above -70dB", () => {
    parameters.f0 = createParamArray(100, BLOCK_LENGTH); // f0 = referenceF0, so f0Factor = 1
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB = linear 1.0
    const alive = processor.process([], outputs, parameters);
    expect(alive).toBe(true);
    // Check if *any* pulse was generated
    expect(outputs[0][0].some((sample) => sample !== 0)).toBe(true);
    // Check pulse amplitude (abs because pulses can be negative)
    const pulses = outputs[0][0].filter(sample => sample !== 0);
    pulses.forEach(pulse => expect(Math.abs(pulse)).toBeCloseTo(1.0)); // Expected linear amp is 1.0
  });

  it("should produce pulses with correct spacing for constant f0", () => {
    const testF0 = 110.25; // Choose a non-integer period
    const expectedPeriodSamples = 44100 / testF0;
    parameters.f0 = createParamArray(testF0, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB for amplitude

    // Process multiple blocks to observe spacing
    let allOutputs = [];
    let pulseIndices = [];
    for (let block = 0; block < 5; block++) {
        const blockOutput = new Float32Array(BLOCK_LENGTH);
        processor.process([], [[blockOutput]], parameters);
        allOutputs = allOutputs.concat(Array.from(blockOutput));
    }

    // Find indices of pulses
    allOutputs.forEach((sample, index) => {
        if (sample > 0) {
            pulseIndices.push(index);
        }
    });

    expect(pulseIndices.length).toBeGreaterThan(1); // Need at least two pulses

    // Check spacing between consecutive pulses
    for (let i = 1; i < pulseIndices.length; i++) {
        const spacing = pulseIndices[i] - pulseIndices[i - 1];
        expect(spacing).toBeCloseTo(expectedPeriodSamples, 0); // Allow small floating point deviation
    }
  });

  it("should handle a-rate f0 changes and maintain phase", () => {
    const f0Ramp = Array.from({ length: BLOCK_LENGTH }, (_, i) => 100 + (100 * i) / (BLOCK_LENGTH - 1)); // Ramp 100Hz to 200Hz
    parameters.f0 = createParamArray(f0Ramp, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB for amplitude

    // Process one block
    const alive = processor.process([], outputs, parameters);
    expect(alive).toBe(true);

    // Check that pulses are generated
    const pulseIndices = outputs[0][0].map((s, i) => s > 0 ? i : -1).filter(i => i !== -1);
    expect(pulseIndices.length).toBeGreaterThan(0);

    // More complex check: Ensure the timing reflects the changing period.
    // This is hard to verify exactly without simulating the internal counter.
    // A basic check is that pulses exist.
  });

   it("should handle a-rate baseAmpDb changes", () => {
    // Ramp from -20dB (linear 0.1) to 0dB (linear 1.0)
    const baseAmpDbRamp = Array.from({ length: BLOCK_LENGTH }, (_, i) => -20 + (20 * i) / (BLOCK_LENGTH - 1));
    parameters.f0 = createParamArray(100, BLOCK_LENGTH); // f0 = referenceF0
    parameters.baseAmpDb = createParamArray(baseAmpDbRamp, BLOCK_LENGTH);

    const alive = processor.process([], outputs, parameters);
    expect(alive).toBe(true);

    // Check that pulses are generated and their amplitude roughly follows the ramp
    let pulseCount = 0;
    outputs[0][0].forEach((sample, i) => {
        if (sample !== 0) { // Check non-zero for positive or negative pulses
            pulseCount++;
            const expectedLinearAmp = dbToLinearWorklet(baseAmpDbRamp[i]);
            // processor.referenceF0 is 100, current f0 is 100, so f0Factor is 1.0
            expect(Math.abs(sample)).toBeCloseTo(expectedLinearAmp, 1);
        }
    });
    expect(pulseCount).toBeGreaterThan(0);
  });

  it("should reset phase when f0 ramps up from 0", () => {
    // Block 1: Silent
    parameters.f0 = createParamArray(0, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB
    processor.process([], outputs, parameters);
    expect(outputs[0][0].every(s => s === 0)).toBe(true);
    expect(processor.samplesUntilPulse).toBe(0); // Should be reset

    // Block 2: Ramp F0 up
    const f0Ramp = Array.from({ length: BLOCK_LENGTH }, (_, i) => 0 + (100 * i) / (BLOCK_LENGTH - 1)); // 0 to 100 Hz
    parameters.f0 = createParamArray(f0Ramp, BLOCK_LENGTH);
    processor.process([], outputs, parameters);

    // Expect a pulse very early in the block (or at index 0) as the phase was reset
    const firstPulseIndex = outputs[0][0].findIndex(s => s > 0);
    expect(firstPulseIndex).toBeLessThan(5); // Pulse should occur quickly after F0 > MIN_F0_HZ
    expect(firstPulseIndex).not.toBe(-1); // Ensure a pulse actually happened
  });

   it("should use MIN_F0_FOR_PERIOD_HZ when f0 is low but active", () => {
    const lowF0 = 10; // Below MIN_F0_FOR_PERIOD_HZ (20)
    const expectedPeriodSamples = 44100 / 20.0; // Period based on 20Hz

    parameters.f0 = createParamArray(lowF0, BLOCK_LENGTH);
    parameters.baseAmpDb = createParamArray(0, BLOCK_LENGTH); // 0dB for amplitude

    // Process enough blocks to get multiple pulses
    let allOutputs = [];
    let pulseIndices = [];
    processor.samplesUntilPulse = 0; // Ensure starting state

    for (let block = 0; block < 10; block++) { // Need more blocks for low F0
        const blockOutput = new Float32Array(BLOCK_LENGTH);
        processor.process([], [[blockOutput]], parameters);
        allOutputs = allOutputs.concat(Array.from(blockOutput));
    }

    allOutputs.forEach((sample, index) => {
        if (sample > 0) pulseIndices.push(index);
    });

    expect(pulseIndices.length).toBeGreaterThan(1);

    // Check spacing reflects the clamped period
    for (let i = 1; i < pulseIndices.length; i++) {
        const spacing = pulseIndices[i] - pulseIndices[i - 1];
        expect(spacing).toBeCloseTo(expectedPeriodSamples, 0);
    }
  });

});
