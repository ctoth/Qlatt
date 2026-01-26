import { describe, it, expect, beforeEach } from 'vitest';
import { createKlattRuntime, BaconGraph } from '../../src/klatt-runtime.js';
import type { SemanticsDocument } from '../../src/semantics/types.js';

// Mock AudioContext for testing
class MockAudioContext {
  createGain() {
    return {
      gain: { value: 1 },
      connect: () => {},
      disconnect: () => {},
    };
  }
  createConstantSource() {
    return {
      offset: { value: 1 },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
    };
  }
  get destination() {
    return {};
  }
}

describe('Klatt Runtime', () => {
  let ctx: MockAudioContext;

  beforeEach(() => {
    ctx = new MockAudioContext();
  });

  it('creates runtime with minimal graph', () => {
    const semantics: SemanticsDocument = {
      name: 'test',
      params: {
        volume: { type: 'float', default: 0.5 },
      },
    };

    const graph: BaconGraph = {
      bacon: '0.1',
      nodes: {
        output: { type: 'gain', params: { gain: { bind: 'volume' } } },
      },
    };

    const runtime = createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
    });

    expect(runtime).toBeDefined();
    expect(runtime.getNode('output')).toBeDefined();
  });

  it('evaluates semantics and applies realized values', () => {
    const semantics: SemanticsDocument = {
      name: 'test',
      params: {
        volumeDb: { type: 'float', default: 0 },
      },
      realize: {
        volumeLinear: 'dbToLinear(volumeDb)',
      },
    };

    const graph: BaconGraph = {
      bacon: '0.1',
      nodes: {
        output: { type: 'gain', params: { gain: { bind: 'volumeLinear' } } },
      },
    };

    const runtime = createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
    });

    const values = runtime.getRealizedValues();
    expect(values.volumeLinear).toBe(1); // dbToLinear(0) = 2^0 = 1
  });

  it('updates when inputs change', () => {
    const semantics: SemanticsDocument = {
      name: 'test',
      params: {
        volumeDb: { type: 'float', default: 0 },
      },
      realize: {
        volumeLinear: 'dbToLinear(volumeDb)',
      },
    };

    const graph: BaconGraph = {
      bacon: '0.1',
      nodes: {
        output: { type: 'gain' },
      },
    };

    const runtime = createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
    });

    // 6 dB = 2x
    runtime.setInputs({ volumeDb: 6 });
    expect(runtime.getRealizedValues().volumeLinear).toBe(2);

    // -72 dB = cutoff to 0
    runtime.setInputs({ volumeDb: -72 });
    expect(runtime.getRealizedValues().volumeLinear).toBe(0);
  });
});
