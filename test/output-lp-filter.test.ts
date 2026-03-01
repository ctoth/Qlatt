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
  it('uses a dedicated reconstruction-filter primitive', () => {
    expect(graph.nodes.outputLp?.type).toBe('reconstruction-filter');

    const primitive = registry.primitives['reconstruction-filter'];
    expect(primitive).toBeDefined();
    expect(primitive.worklet).toBe('reconstruction-filter-processor.js');
    expect(primitive.wasm).toBe('reconstruction-filter.wasm');
  });
});
