import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDiagnostics, type Diagnostics } from "../src/diagnostics";
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
  let diagnostics: Diagnostics;

  beforeEach(() => {
    ctx = new MockAudioContext();
    diagnostics = createDiagnostics();
  });

  it("routes unbound evaluate() errors through the caller diagnostics", async () => {
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
      diagnostics,
    });

    warnSpy.mockRestore();

    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "runtime.realization_failed",
        data: expect.objectContaining({
          affected: [
            expect.objectContaining({
              rule: "brokenValue",
              error: expect.stringContaining("undefinedFn"),
              last: expect.objectContaining({
                outcome: "no bound write; evaluation value retained",
              }),
            }),
          ],
        }),
      }),
    );
  });

  it("reports a retained value when a graph binding references a failed realize rule", async () => {
    // The graph binds to 'derivedGain', which is a realize rule that fails.
    // No derivedGain seed exists: the AudioParam remains unchanged.
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

    const runtime = await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
      diagnostics,
    });

    warnSpy.mockRestore();

    expect((runtime.getNode("output") as GainNode).gain.value).toBe(1);
    expect(runtime.getRealizedValues().derivedGain).toBeUndefined();
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "runtime.realization_failed",
        data: expect.objectContaining({
          affected: [
            expect.objectContaining({
              rule: "derivedGain",
              nodeId: "output",
              paramName: "gain",
              last: expect.objectContaining({
                appliedValue: 1,
                outcome: "previous/default value retained",
              }),
            }),
          ],
        }),
      }),
    );
  });

  it("updates failure counts on setInputs when realize rule fails", async () => {
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
      diagnostics,
    });

    // Now call setInputs — this triggers evaluate() + applyValues() again
    runtime.setInputs({ AV: 50 });

    warnSpy.mockRestore();

    expect((runtime.getNode("output") as GainNode).gain.value).toBe(1);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        code: "runtime.realization_failed",
        data: expect.objectContaining({
          count: 2,
          affected: [expect.objectContaining({ rule: "derivedAV", count: 2 })],
        }),
      }),
    );
  });
});
