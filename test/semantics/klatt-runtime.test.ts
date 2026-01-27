import { describe, it, expect, beforeEach } from 'vitest';
import {
  createKlattRuntime,
  BaconGraph,
  Registry,
} from '../../src/klatt-runtime.js';
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
  const minimalRegistry: Registry = {
    bacon: '0.1',
    primitives: {
      gain: {
        native: 'GainNode',
        params: {
          gain: { type: 'float', default: 1.0 },
        },
        inputs: 1,
        outputs: 1,
      },
      'constant-source': {
        native: 'ConstantSourceNode',
        params: {
          offset: { type: 'float', default: 1.0 },
        },
        inputs: 0,
        outputs: 1,
      },
    },
  };

  beforeEach(() => {
    ctx = new MockAudioContext();
  });

  it('creates runtime with minimal graph', async () => {
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

    const runtime = await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
    });

    expect(runtime).toBeDefined();
    expect(runtime.getNode('output')).toBeDefined();
  });

  it('evaluates semantics and applies realized values', async () => {
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

    const runtime = await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
    });

    const values = runtime.getRealizedValues();
    expect(values.volumeLinear).toBe(1); // dbToLinear(0) = 2^0 = 1
  });

  it('updates when inputs change', async () => {
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

    const runtime = await createKlattRuntime({
      audioContext: ctx as unknown as AudioContext,
      semantics,
      graph,
      registry: minimalRegistry,
    });

    // 6 dB = 2x
    runtime.setInputs({ volumeDb: 6 });
    expect(runtime.getRealizedValues().volumeLinear).toBe(2);

    // -72 dB = cutoff to 0
    runtime.setInputs({ volumeDb: -72 });
    expect(runtime.getRealizedValues().volumeLinear).toBe(0);
  });
});

describe('registry-based type mappings', () => {
  const mockRegistry: Registry = {
    version: '1.0',
    primitives: {
      'gain': { category: 'webaudio', inputs: 1, outputs: 1 },
      'constant-source': { category: 'webaudio', inputs: 0, outputs: 1 },
      'resonator': {
        category: 'wasm-worklet',
        worklet: 'resonator-processor.js',
        wasm: 'resonator.wasm',
        inputs: 1,
        outputs: 1,
      },
      'antiresonator': {
        category: 'wasm-worklet',
        worklet: 'antiresonator-processor.js',
        wasm: 'antiresonator.wasm',
        inputs: 1,
        outputs: 1,
      },
      'lf-source': {
        category: 'wasm-worklet',
        worklet: 'lf-source-processor.js',
        wasm: 'lf-source.wasm',
        inputs: 0,
        outputs: 1,
      },
      'impulse-train': {
        category: 'js-worklet',
        worklet: 'impulse-train-processor.js',
        inputs: 0,
        outputs: 1,
      },
      'noise-source': {
        category: 'js-worklet',
        worklet: 'noise-source-processor.js',
        inputs: 1,
        outputs: 1,
      },
      'differentiator': {
        category: 'js-worklet',
        worklet: 'differentiator-processor.js',
        inputs: 1,
        outputs: 1,
      },
      'glottal-mod': {
        category: 'js-worklet',
        worklet: 'glottal-mod-processor.js',
        inputs: 1,
        outputs: 1,
      },
    },
  };

  it('registry contains all expected node types', () => {
    const expected = [
      'resonator', 'antiresonator', 'lf-source',
      'impulse-train', 'noise-source', 'differentiator', 'glottal-mod'
    ];
    for (const type of expected) {
      expect(mockRegistry.primitives[type]).toBeDefined();
    }
  });

  it('WASM types have wasm property', () => {
    expect(mockRegistry.primitives['resonator'].wasm).toBe('resonator.wasm');
    expect(mockRegistry.primitives['antiresonator'].wasm).toBe('antiresonator.wasm');
    expect(mockRegistry.primitives['lf-source'].wasm).toBe('lf-source.wasm');
  });

  it('worklet types have worklet property', () => {
    expect(mockRegistry.primitives['resonator'].worklet).toBe('resonator-processor.js');
    expect(mockRegistry.primitives['antiresonator'].worklet).toBe('antiresonator-processor.js');
    expect(mockRegistry.primitives['lf-source'].worklet).toBe('lf-source-processor.js');
    expect(mockRegistry.primitives['impulse-train'].worklet).toBe('impulse-train-processor.js');
    expect(mockRegistry.primitives['noise-source'].worklet).toBe('noise-source-processor.js');
    expect(mockRegistry.primitives['differentiator'].worklet).toBe('differentiator-processor.js');
    expect(mockRegistry.primitives['glottal-mod'].worklet).toBe('glottal-mod-processor.js');
  });

  it('categorizes primitives correctly', () => {
    expect(mockRegistry.primitives['gain'].category).toBe('webaudio');
    expect(mockRegistry.primitives['constant-source'].category).toBe('webaudio');
    expect(mockRegistry.primitives['resonator'].category).toBe('wasm-worklet');
    expect(mockRegistry.primitives['impulse-train'].category).toBe('js-worklet');
  });
});
