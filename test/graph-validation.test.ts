/**
 * Tests for graph validation in createKlattRuntime.
 *
 * Verifies that inline expression param specs ({ expr: "..." }) are rejected
 * at graph load time rather than silently dropped at runtime.
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
