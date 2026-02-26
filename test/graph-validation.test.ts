/**
 * Tests for graph validation in createKlattRuntime.
 *
 * Verifies that inline expression param specs ({ expr: "..." }) are rejected
 * at graph load time rather than silently dropped at runtime.
 *
 * Also tests connectToDestination strict validation: graph.outputs must be
 * defined and reference an existing node, no fallback guessing.
 */
import { describe, it, expect } from 'vitest';
import { createKlattRuntime } from '../src/klatt-runtime';
import type { BaconGraph, Registry } from '../src/klatt-runtime';
import type { SemanticsDocument } from '../src/semantics/types';

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
  primitives: {
    gain: {
      native: 'GainNode',
      params: { gain: { type: 'a-rate', default: 1 } },
    },
  },
};

const minimalSemantics: SemanticsDocument = {
  params: {},
  realize: [],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('graph param spec validation', () => {
  it('rejects { expr: "..." } param spec with a clear error', async () => {
    const graph: BaconGraph = {
      bacon: '1.0',
      nodes: {
        myGain: {
          type: 'gain',
          params: {
            gain: { expr: 'someExpression' },
          },
        },
      },
    };

    await expect(
      createKlattRuntime({
        audioContext: createMockAudioContext(),
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      }),
    ).rejects.toThrow(/expr.*not supported/i);
  });

  it('accepts { bind: "..." } param spec without error', async () => {
    const graph: BaconGraph = {
      bacon: '1.0',
      nodes: {
        myGain: {
          type: 'gain',
          params: {
            gain: { bind: 'voiceGain' },
          },
        },
      },
    };

    // Should not throw during validation.
    // It will likely fail later (no real AudioContext), but that's fine —
    // the point is it does NOT throw with an "expr not supported" error.
    try {
      await createKlattRuntime({
        audioContext: createMockAudioContext(),
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      });
    } catch (e: unknown) {
      // Any error here should NOT be about expr specs
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).not.toMatch(/expr.*not supported/i);
    }
  });

  it('accepts literal number param spec without error', async () => {
    const graph: BaconGraph = {
      bacon: '1.0',
      nodes: {
        myGain: {
          type: 'gain',
          params: {
            gain: 0.5,
          },
        },
      },
    };

    // Should not throw during validation
    try {
      await createKlattRuntime({
        audioContext: createMockAudioContext(),
        semantics: minimalSemantics,
        graph,
        registry: minimalRegistry,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).not.toMatch(/expr.*not supported/i);
    }
  });
});

// ---------------------------------------------------------------------------
// connectToDestination strict validation tests
// ---------------------------------------------------------------------------

describe('connectToDestination', () => {
  it('connects the named output node when graph.outputs is defined', async () => {
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
      bacon: '1.0',
      nodes: {
        outputGain: { type: 'gain' },
      },
      outputs: ['outputGain'],
    };

    const runtime = await createKlattRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    runtime.connectToDestination();
    expect(connectedTo).toBe(ctx.destination);
  });

  it('throws when graph.outputs is missing', async () => {
    const ctx = createFullMockAudioContext();
    const graph: BaconGraph = {
      bacon: '1.0',
      nodes: {
        outputGain: { type: 'gain' },
      },
      // no outputs field
    };

    const runtime = await createKlattRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    expect(() => runtime.connectToDestination()).toThrow(/missing.*outputs/i);
  });

  it('throws when graph.outputs is empty', async () => {
    const ctx = createFullMockAudioContext();
    const graph: BaconGraph = {
      bacon: '1.0',
      nodes: {
        outputGain: { type: 'gain' },
      },
      outputs: [],
    };

    const runtime = await createKlattRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    expect(() => runtime.connectToDestination()).toThrow(/missing.*outputs/i);
  });

  it('throws when graph.outputs references a non-existent node', async () => {
    const ctx = createFullMockAudioContext();
    const graph: BaconGraph = {
      bacon: '1.0',
      nodes: {
        outputGain: { type: 'gain' },
      },
      outputs: ['nonExistentNode'],
    };

    const runtime = await createKlattRuntime({
      audioContext: ctx,
      semantics: minimalSemantics,
      graph,
      registry: minimalRegistry,
    });

    expect(() => runtime.connectToDestination()).toThrow(/not found/i);
  });
});
