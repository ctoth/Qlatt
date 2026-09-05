/**
 * Tests for shared AudioParam access utilities in audio-param-utils.ts
 *
 * Covers the 3-step duck-typing pattern for resolving AudioParams:
 * 1. GainNode — property named 'gain'
 * 2. ConstantSourceNode — property named 'offset'
 * 3. AudioWorkletNode — parameters.get(name)
 *
 * Also covers applyParamValue (setValueAtTime preference, .value fallback).
 */
import { describe, expect, it, vi } from "vitest";
import { applyParamValue, getAudioParam } from "../src/audio-param-utils";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Minimal AudioParam-like with setValueAtTime */
function mockAudioParam(initial = 0) {
  return {
    value: initial,
    setValueAtTime: vi.fn(),
  };
}

/** GainNode-like object */
function mockGainNode() {
  const gain = mockAudioParam(1);
  return {
    gain,
    context: { currentTime: 0 },
    connect() {},
    disconnect() {},
  };
}

/** ConstantSourceNode-like object */
function mockConstantSourceNode() {
  const offset = mockAudioParam(0);
  return {
    offset,
    context: { currentTime: 0 },
    connect() {},
    disconnect() {},
  };
}

/** AudioWorkletNode-like object with a parameters Map */
function mockWorkletNode(paramEntries: [string, ReturnType<typeof mockAudioParam>][]) {
  const params = new Map(paramEntries);
  return {
    parameters: params,
    context: { currentTime: 0 },
    connect() {},
    disconnect() {},
  };
}

// ---------------------------------------------------------------------------
// getAudioParam tests
// ---------------------------------------------------------------------------

describe("getAudioParam", () => {
  it("finds gain on GainNode-like object", () => {
    const node = mockGainNode();
    const param = getAudioParam(node as unknown as AudioNode, "gain");
    expect(param).toBe(node.gain);
  });

  it("finds offset on ConstantSourceNode-like object", () => {
    const node = mockConstantSourceNode();
    const param = getAudioParam(node as unknown as AudioNode, "offset");
    expect(param).toBe(node.offset);
  });

  it("finds named param on AudioWorkletNode-like object via parameters.get", () => {
    const freqParam = mockAudioParam(440);
    const node = mockWorkletNode([["frequency", freqParam]]);
    const param = getAudioParam(node as unknown as AudioNode, "frequency");
    expect(param).toBe(freqParam);
  });

  it("returns null for unknown param name on GainNode", () => {
    const node = mockGainNode();
    const param = getAudioParam(node as unknown as AudioNode, "frequency");
    expect(param).toBeNull();
  });

  it("returns null for unknown param name on WorkletNode", () => {
    const node = mockWorkletNode([["frequency", mockAudioParam()]]);
    const param = getAudioParam(node as unknown as AudioNode, "nonexistent");
    expect(param).toBeNull();
  });

  it("returns null for plain object with no recognized AudioParam properties", () => {
    const node = { context: { currentTime: 0 }, connect() {}, disconnect() {} };
    const param = getAudioParam(node as unknown as AudioNode, "gain");
    expect(param).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyParamValue tests
// ---------------------------------------------------------------------------

describe("applyParamValue", () => {
  it("sets value via setValueAtTime when available", () => {
    const node = mockGainNode();
    const result = applyParamValue(node as unknown as AudioNode, "gain", 0.5, 1.0);
    expect(result).toBe(true);
    expect(node.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 1.0);
  });

  it("uses node.context.currentTime when time is not provided", () => {
    const node = mockGainNode();
    (node.context as { currentTime: number }).currentTime = 2.5;
    const result = applyParamValue(node as unknown as AudioNode, "gain", 0.8);
    expect(result).toBe(true);
    expect(node.gain.setValueAtTime).toHaveBeenCalledWith(0.8, 2.5);
  });

  it("falls back to .value assignment when setValueAtTime unavailable", () => {
    const param = { value: 0 }; // no setValueAtTime
    const node = {
      gain: param,
      context: { currentTime: 0 },
      connect() {},
      disconnect() {},
    };
    const result = applyParamValue(node as unknown as AudioNode, "gain", 0.7);
    expect(result).toBe(true);
    expect(param.value).toBe(0.7);
  });

  it("returns false when param is not found", () => {
    const node = { context: { currentTime: 0 }, connect() {}, disconnect() {} };
    const result = applyParamValue(node as unknown as AudioNode, "gain", 1.0);
    expect(result).toBe(false);
  });

  it("works with AudioWorkletNode-like parameters", () => {
    const freqParam = mockAudioParam(440);
    const node = mockWorkletNode([["frequency", freqParam]]);
    const result = applyParamValue(node as unknown as AudioNode, "frequency", 880, 3.0);
    expect(result).toBe(true);
    expect(freqParam.setValueAtTime).toHaveBeenCalledWith(880, 3.0);
  });
});
