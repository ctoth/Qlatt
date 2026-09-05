import { beforeEach, describe, expect, it, vi } from "vitest";
import { type BaconGraph, createKlattRuntime, type Registry } from "../src/klatt-runtime";
import type { SemanticsDocument } from "../src/semantics/types";

// Mock AudioContext for testing (same pattern as klatt-runtime.test.ts)
class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  createGain() {
    return {
      gain: { value: 1, setValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
      context: { currentTime: 0 },
    };
  }
  createConstantSource() {
    return {
      offset: { value: 1, setValueAtTime: () => {} },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      context: { currentTime: 0 },
    };
  }
  get destination() {
    return {};
  }
}

const minimalRegistry: Registry = {
  bacon: "0.1",
  primitives: {
    gain: {
      native: "GainNode",
      params: {
        gain: { type: "float", default: 1.0 },
      },
      inputs: 1,
      outputs: 1,
    },
    "constant-source": {
      native: "ConstantSourceNode",
      params: {
        offset: { type: "float", default: 1.0 },
      },
      inputs: 0,
      outputs: 1,
    },
  },
};

describe("realize error routing", () => {
  let ctx: MockAudioContext;
  let logMessages: string[];
  let mockLogger: (msg: string) => void;

  beforeEach(() => {
    ctx = new MockAudioContext();
    logMessages = [];
    mockLogger = (msg: string) => logMessages.push(msg);
  });

  it("routes evaluate() errors through the log callback", async () => {
    // Semantics with a deliberately broken realize expression
    const semantics: SemanticsDocument = {
      name: "test-broken-realize",
      params: {
        volume: { type: "float", default: 0.5 },
      },
      realize: {
        brokenValue: "undefinedFn(volume)", // undefinedFn does not exist
      },
    };

    const graph: BaconGraph = {
      bacon: "0.1",
      nodes: {
        output: { type: "gain", params: { gain: { bind: "volume" } } },
      },
    };

    // Spy on console.warn to verify it's not the ONLY place errors appear
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
      logger: mockLogger,
    });

    warnSpy.mockRestore();

    // The log callback should have received a message about the semantics error
    const _errorLogs = logMessages.filter(
      (msg) => msg.toLowerCase().includes("error") || msg.toLowerCase().includes("semantics"),
    );
    // At minimum, there should be a log message mentioning the evaluation error
    const hasErrorRouted = logMessages.some(
      (msg) => msg.includes("Semantics evaluation error") || msg.includes("brokenValue"),
    );
    expect(hasErrorRouted).toBe(true);
  });

  it("logs when a graph binding references a failed realize rule", async () => {
    // The graph binds to 'derivedGain', which is a realize rule that fails.
    // The runtime should log that this binding is affected by the failure,
    // since the node is receiving the param-seeded fallback instead of the
    // intended derived value.
    const semantics: SemanticsDocument = {
      name: "test-fallthrough",
      params: {
        rawInput: { type: "float", default: 100 },
      },
      realize: {
        // This rule fails — nonExistentFunction is not registered
        derivedGain: "nonExistentFunction(rawInput)",
      },
    };

    const graph: BaconGraph = {
      bacon: "0.1",
      nodes: {
        output: { type: "gain", params: { gain: { bind: "derivedGain" } } },
      },
    };

    // Suppress console.warn noise
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
      logger: mockLogger,
    });

    warnSpy.mockRestore();

    // The logger should have received a fallthrough warning about derivedGain
    const hasFallthroughWarning = logMessages.some(
      (msg) => msg.includes("fallthrough") && msg.includes("derivedGain"),
    );
    expect(hasFallthroughWarning).toBe(true);
  });

  it("logs fallthrough summary on setInputs when realize rule fails", async () => {
    const semantics: SemanticsDocument = {
      name: "test-setinputs-fallthrough",
      params: {
        F0: { type: "float", default: 100 },
        AV: { type: "float", default: 60 },
      },
      realize: {
        // This will fail — nonExistentFunction is not registered
        derivedAV: "nonExistentFunction(AV)",
      },
    };

    const graph: BaconGraph = {
      bacon: "0.1",
      nodes: {
        output: { type: "gain", params: { gain: { bind: "derivedAV" } } },
      },
    };

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const runtime = await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
      logger: mockLogger,
    });

    // Clear log from init
    logMessages.length = 0;

    // Now call setInputs — this triggers evaluate() + applyValues() again
    runtime.setInputs({ AV: 50 });

    warnSpy.mockRestore();

    // Should log semantics error through the log callback during setInputs
    const hasErrorLog = logMessages.some(
      (msg) => msg.includes("Semantics evaluation error") || msg.includes("derivedAV"),
    );
    expect(hasErrorLog).toBe(true);
  });
});
