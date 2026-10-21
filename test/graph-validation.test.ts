/**
 * Tests for graph validation in createPreparedRuntime.
 *
 * Verifies that inline expression param specs ({ expr: "..." }) are rejected
 * at graph load time rather than silently dropped at runtime.
 *
 * Also tests connectToDestination strict validation: graph.outputs must be
 * defined and reference an existing node, no fallback guessing.
 */
import { describe, expect, it } from "vitest";
import type { BaconGraph, Registry } from "../src/klatt-runtime";
import type { SemanticsDocument } from "../src/semantics/types";
import { createPreparedRuntime } from "./runtime-fixture";

// ---------------------------------------------------------------------------
// Minimal mocks — validation fires before any AudioContext/worklet methods
// ---------------------------------------------------------------------------

function createMockAudioContext(): AudioContext {
  return {
    currentTime: 0,
    sampleRate: 44100,
    audioWorklet: { addModule: async () => {} },
  } as unknown as AudioContext;
}

/** AudioContext mock that supports createGain() for full runtime creation */
function createFullMockAudioContext(): AudioContext {
  const mockDestination = {} as AudioDestinationNode;
  function makeMockNode(): AudioNode {
    return {
      connect: () => {},
      disconnect: () => {},
      numberOfInputs: 1,
      numberOfOutputs: 1,
    } as unknown as AudioNode;
  }
  return {
    currentTime: 0,
    sampleRate: 44100,
    destination: mockDestination,
    audioWorklet: { addModule: async () => {} },
    createGain: () => {
      const node = makeMockNode();
      (node as unknown as Record<string, unknown>).gain = {
        value: 1,
        setValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      };
      return node;
    },
  } as unknown as AudioContext;
}

const minimalRegistry: Registry = {
  bacon: "0.1",
  primitives: {
    gain: {
      native: "GainNode",
      params: { gain: { type: "float", default: 1 } },
    },
  },
};

const minimalSemantics: SemanticsDocument = {
  name: "test",
  params: { voiceGain: { default: 1 } },
  realize: {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("graph param spec validation", () => {
  it('rejects { expr: "..." } param spec with a clear error', async () => {
    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        myGain: {
          type: "gain",
          params: {
            gain: { expr: "someExpression" },
          },
        },
      },
    };

    await expect(
      createPreparedRuntime({
        audioContext: createMockAudioContext(),
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      }),
    ).rejects.toThrow(/expr.*not supported/i);
  });

  it('accepts { bind: "..." } param spec without error', async () => {
    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        myGain: {
          type: "gain",
          params: {
            gain: { bind: "voiceGain" },
          },
        },
      },
    };

    await expect(
      createPreparedRuntime({
        audioContext: createFullMockAudioContext(),
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      }),
    ).resolves.toBeDefined();
  });

  it("accepts literal number param spec without error", async () => {
    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        myGain: {
          type: "gain",
          params: {
            gain: 0.5,
          },
        },
      },
    };

    await expect(
      createPreparedRuntime({
        audioContext: createFullMockAudioContext(),
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      }),
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// connectToDestination strict validation tests
// ---------------------------------------------------------------------------

describe("connectToDestination", () => {
  it("connects the named output node when graph.outputs is defined", async () => {
    let connectedTo: unknown = null;
    const ctx = createFullMockAudioContext();
    // Patch createGain to track connect calls
    const originalCreateGain = ctx.createGain.bind(ctx);
    ctx.createGain = () => {
      const node = originalCreateGain();
      node.connect = (dest: unknown) => {
        connectedTo = dest;
        return dest as AudioNode;
      };
      return node;
    };

    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        outputGain: { type: "gain" },
      },
      outputs: ["outputGain"],
    };

    const runtime = await createPreparedRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    runtime.connectToDestination();
    expect(connectedTo).toBe(ctx.destination);
  });

  it("throws when graph.outputs is missing", async () => {
    const ctx = createFullMockAudioContext();
    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        outputGain: { type: "gain" },
      },
      // no outputs field
    };

    const runtime = await createPreparedRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    expect(() => runtime.connectToDestination()).toThrow(/missing.*outputs/i);
  });

  it("throws when graph.outputs is empty", async () => {
    const ctx = createFullMockAudioContext();
    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        outputGain: { type: "gain" },
      },
      outputs: [],
    };

    const runtime = await createPreparedRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    expect(() => runtime.connectToDestination()).toThrow(/missing.*outputs/i);
  });

  it("throws when graph.outputs references a non-existent node", async () => {
    const ctx = createFullMockAudioContext();
    const graph: BaconGraph = {
      bacon: "1.0",
      nodes: {
        outputGain: { type: "gain" },
      },
      outputs: ["nonExistentNode"],
    };

    await expect(
      createPreparedRuntime({
        audioContext: ctx,
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      }),
    ).rejects.toThrow(/nonExistentNode/);
  });
});
