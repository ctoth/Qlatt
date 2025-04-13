import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock the global scope expected by AudioWorkletProcessor
const mockRegisterProcessor = vi.fn();
vi.stubGlobal("registerProcessor", mockRegisterProcessor);
vi.stubGlobal("sampleRate", 44100); // Standard sample rate
vi.stubGlobal("currentFrame", 0); // Mock global currentFrame

// Mock the base class AudioWorkletProcessor
class MockAudioWorkletProcessor {
  constructor(options) {}
}
vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor);

// Dynamically import the processor AFTER setting up mocks
let RadiationProcessor;

describe("RadiationProcessor", () => {
  let processor;
  const BLOCK_LENGTH = 128;
  let inputs;
  let outputs;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("registerProcessor", mockRegisterProcessor);
    vi.stubGlobal("sampleRate", 44100);
    vi.stubGlobal("currentFrame", 0);
    vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor);

    const module = await import("./radiation-processor.js?t=" + Date.now());
    RadiationProcessor = module.default; // Assuming default export

    const processorOptions = { processorOptions: { sampleRate: 44100 } };
    processor = new RadiationProcessor(processorOptions);

    // Prepare mock inputs/outputs [outputIndex][channelIndex][sampleIndex]
    inputs = [[new Float32Array(BLOCK_LENGTH)]];
    outputs = [[new Float32Array(BLOCK_LENGTH)]];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should be registered with the correct name", () => {
    expect(mockRegisterProcessor).toHaveBeenCalledWith(
      "radiation-processor",
      RadiationProcessor
    );
  });

  it("should initialize with lastInputSample = 0", () => {
    expect(processor.lastInputSample).toBe(0.0);
  });

  it("should produce zero output for zero input", () => {
    inputs[0][0].fill(0.0);
    const alive = processor.process(inputs, outputs, {});
    expect(alive).toBe(true);
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true);
    expect(processor.lastInputSample).toBe(0.0); // State remains 0
  });

  it("should produce zero output for constant input", () => {
    inputs[0][0].fill(0.5);
    // First sample will have output 0.5 - 0 = 0.5
    // Subsequent samples will have output 0.5 - 0.5 = 0
    const alive = processor.process(inputs, outputs, {});
    expect(alive).toBe(true);
    expect(outputs[0][0][0]).toBeCloseTo(0.5); // First sample output
    expect(outputs[0][0].slice(1).every((sample) => sample === 0)).toBe(true); // Rest are zero
    expect(processor.lastInputSample).toBeCloseTo(0.5); // State updated
  });

  it("should perform first-order differencing correctly", () => {
    // Simple ramp input: 0, 0.1, 0.2, ...
    for (let i = 0; i < BLOCK_LENGTH; i++) {
      inputs[0][0][i] = i * 0.1;
    }
    processor.lastInputSample = -0.1; // Set initial state for predictable first output

    const alive = processor.process(inputs, outputs, {});
    expect(alive).toBe(true);

    // Expected output: 0 - (-0.1) = 0.1, 0.1 - 0 = 0.1, 0.2 - 0.1 = 0.1, ...
    outputs[0][0].forEach(sample => {
        expect(sample).toBeCloseTo(0.1);
    });
    expect(processor.lastInputSample).toBeCloseTo((BLOCK_LENGTH - 1) * 0.1); // Check final state
  });

   it("should handle a step input correctly", () => {
    // Input: 0 for first half, 1 for second half
    const halfBlock = BLOCK_LENGTH / 2;
    for (let i = 0; i < halfBlock; i++) inputs[0][0][i] = 0.0;
    for (let i = halfBlock; i < BLOCK_LENGTH; i++) inputs[0][0][i] = 1.0;
    processor.lastInputSample = 0.0; // Start from 0

    const alive = processor.process(inputs, outputs, {});
    expect(alive).toBe(true);

    // Expected output: 0 for first half (except first sample if lastInputSample wasn't 0)
    // Then a pulse of 1.0 at the step (1.0 - 0.0)
    // Then 0 for the rest (1.0 - 1.0)
    expect(outputs[0][0][0]).toBeCloseTo(0.0); // 0 - 0
    for (let i = 1; i < halfBlock; i++) expect(outputs[0][0][i]).toBeCloseTo(0.0); // 0 - 0
    expect(outputs[0][0][halfBlock]).toBeCloseTo(1.0); // 1 - 0 (the step)
    for (let i = halfBlock + 1; i < BLOCK_LENGTH; i++) expect(outputs[0][0][i]).toBeCloseTo(0.0); // 1 - 1

    expect(processor.lastInputSample).toBeCloseTo(1.0); // Final state
  });

  it("should maintain state across process calls", () => {
    // Block 1
    inputs[0][0].fill(0.2);
    processor.process(inputs, outputs, {});
    expect(processor.lastInputSample).toBeCloseTo(0.2);
    expect(outputs[0][0][0]).toBeCloseTo(0.2); // 0.2 - 0
    expect(outputs[0][0][1]).toBeCloseTo(0.0); // 0.2 - 0.2

    // Block 2
    inputs[0][0].fill(0.5);
    processor.process(inputs, outputs, {});
    expect(processor.lastInputSample).toBeCloseTo(0.5);
    expect(outputs[0][0][0]).toBeCloseTo(0.3); // 0.5 - 0.2 (from previous block)
    expect(outputs[0][0][1]).toBeCloseTo(0.0); // 0.5 - 0.5
  });

  it("should handle missing input gracefully", () => {
    processor.lastInputSample = 0.5; // Set some state
    const alive = processor.process([null], outputs, {}); // No input
    expect(alive).toBe(true);
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true); // Output silence
    expect(processor.lastInputSample).toBe(0.0); // State should reset
  });

   it("should handle empty input channel gracefully", () => {
    processor.lastInputSample = 0.5; // Set some state
    const alive = processor.process([[]], outputs, {}); // Empty input channel array
    expect(alive).toBe(true);
    expect(outputs[0][0].every((sample) => sample === 0)).toBe(true); // Output silence
    expect(processor.lastInputSample).toBe(0.0); // State should reset
  });

   it("should handle missing output gracefully", () => {
    inputs[0][0].fill(0.1);
    processor.lastInputSample = 0.0;
    // We expect it not to throw and return true
    expect(() => processor.process(inputs, [null], {})).not.toThrow();
    const alive = processor.process(inputs, [null], {});
    expect(alive).toBe(true);
    // State should still update
    expect(processor.lastInputSample).toBeCloseTo(0.1);
  });

  it("should handle NaN input by outputting zero and resetting state", () => {
    inputs[0][0][0] = 0.1;
    inputs[0][0][1] = NaN;
    inputs[0][0][2] = 0.3;
    processor.lastInputSample = 0.0;

    const alive = processor.process(inputs, outputs, {});
    expect(alive).toBe(true);

    expect(outputs[0][0][0]).toBeCloseTo(0.1); // 0.1 - 0.0
    expect(outputs[0][0][1]).toBeCloseTo(0.0); // NaN input -> 0 output
    expect(outputs[0][0][2]).toBeCloseTo(0.3); // 0.3 - 0.0 (state reset after NaN)

    expect(processor.lastInputSample).toBeCloseTo(0.3); // State after processing 0.3
  });

  it("should handle Infinity input by outputting zero and resetting state", () => {
    inputs[0][0][0] = 0.1;
    inputs[0][0][1] = Infinity;
    inputs[0][0][2] = 0.3;
    processor.lastInputSample = 0.0;

    const alive = processor.process(inputs, outputs, {});
    expect(alive).toBe(true);

    expect(outputs[0][0][0]).toBeCloseTo(0.1);
    expect(outputs[0][0][1]).toBeCloseTo(0.0); // Infinity input -> 0 output
    expect(outputs[0][0][2]).toBeCloseTo(0.3); // State reset

    expect(processor.lastInputSample).toBeCloseTo(0.3);
  });

});
