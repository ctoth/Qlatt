import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import type { BaconGraph, Registry } from '../src/klatt-runtime';
import { parseYamlString } from '../src/yaml-loader';

const basePath = resolve(__dirname, '../public/experiments/klatt80-baseline');

const graphPath = resolve(basePath, 'graph.yaml');
const graphRaw = readFileSync(graphPath, 'utf-8');
const graph = parseYamlString<BaconGraph>(graphRaw, graphPath);

const registryPath = resolve(basePath, 'registry.yaml');
const registryRaw = readFileSync(registryPath, 'utf-8');
const registry = parseYamlString<Registry>(registryRaw, registryPath);

describe('outputLp configuration', () => {
  it('uses a configurable reconstruction-filter primitive', () => {
    expect(graph.nodes.outputLp?.type).toBe('reconstruction-filter');
    expect(graph.nodes.outputLp?.options?.bypass).toBe(true);

    const primitive = registry.primitives['reconstruction-filter'];
    expect(primitive).toBeDefined();
    expect(primitive.worklet).toBe('reconstruction-filter-processor.js');
    expect(primitive.wasm).toBe('reconstruction-filter.wasm');
    expect(primitive.options?.bypass?.default).toBe(false);
  });

  it('does not route high-frequency parallel formants through an active 5 kHz low-pass', () => {
    const highParallelFormants = graph.formantBanks?.main?.formants.filter((formant) => (
      formant.parallelSource && formant.index >= 7
    )) ?? [];

    expect(highParallelFormants.map((formant) => formant.index)).toEqual([7, 8, 9, 10]);

    const outputLp = graph.nodes.outputLp;
    const permitsHighFrequencyOutput = !outputLp || outputLp.options?.bypass === true;

    expect(permitsHighFrequencyOutput).toBe(true);
  });
});
