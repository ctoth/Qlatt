/**
 * Tests that the PLSTEP burst detection threshold (49 dB) is defined in a single
 * source of truth (semantics.yaml constant) and referenced consistently by:
 * 1. The interpreter (telemetry PLSTEP detection)
 * 2. The graph.yaml AF edge-detector (audio-domain burst detection)
 *
 * From Klatt 80 PARCOE.FOR:
 *   IF (NNAF - NAFLAS >= 49) PLSTEP = GETAMP(G0 - 28)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { SemanticsDocument } from '../src/semantics/types';
import { parseYamlString } from '../src/yaml-loader';

// Load the real YAML files
const basePath = resolve(__dirname, '../public/experiments/klatt80-baseline');

const semanticsRaw = readFileSync(resolve(basePath, 'semantics.yaml'), 'utf-8');
const semantics = parseYamlString<SemanticsDocument>(semanticsRaw, resolve(basePath, 'semantics.yaml'));

const graphRaw = readFileSync(resolve(basePath, 'graph.yaml'), 'utf-8');
const graph = parseYamlString<{
  nodes: Record<string, { type: string; params?: Record<string, unknown> }>;
}>(graphRaw, resolve(basePath, 'graph.yaml'));

describe('PLSTEP threshold single source of truth', () => {
  it('semantics.yaml defines plstepThreshold constant', () => {
    expect(semantics.constants).toBeDefined();
    expect(semantics.constants!.plstepThreshold).toBeDefined();
    expect(typeof semantics.constants!.plstepThreshold).toBe('number');
    expect(semantics.constants!.plstepThreshold).toBe(49);
  });

  it('graph.yaml afEdgeDetector threshold binds to plstepThreshold', () => {
    const afEdge = graph.nodes.afEdgeDetector;
    expect(afEdge).toBeDefined();
    expect(afEdge.type).toBe('edge-detector');
    expect(afEdge.params).toBeDefined();
    const thresholdSpec = afEdge.params!.threshold as { bind: string };
    expect(thresholdSpec).toHaveProperty('bind');
    expect(thresholdSpec.bind).toBe('plstepThreshold');
  });

  it('graph.yaml does not trigger PLSTEP from AH', () => {
    expect(graph.nodes.ahEdgeDetector).toBeUndefined();
  });

  it('the AF edge-detector threshold references the canonical constant value', () => {
    // Get the constant value
    const threshold = semantics.constants!.plstepThreshold as number;

    // The AF edge-detector should bind to plstepThreshold.
    const afThreshold = graph.nodes.afEdgeDetector.params!.threshold as { bind: string };
    expect(afThreshold.bind).toBe('plstepThreshold');

    // The constant value should be the canonical Klatt 80 value
    expect(threshold).toBe(49);
  });

  it('semantics.yaml has a realize rule that passes plstepThreshold through to realized values', () => {
    // The runtime resolves { bind: X } from realizedValues, so plstepThreshold
    // must appear in the realize section for the edge-detectors to pick it up
    expect(semantics.realize).toBeDefined();
    expect(semantics.realize!.plstepThreshold).toBeDefined();
  });
});

describe('PLSTEP burst amplitude offset single source of truth', () => {
  it('semantics.yaml defines plstepBurstOffsetDb constant', () => {
    expect(semantics.constants).toBeDefined();
    expect(semantics.constants!.plstepBurstOffsetDb).toBeDefined();
    expect(typeof semantics.constants!.plstepBurstOffsetDb).toBe('number');
    expect(semantics.constants!.plstepBurstOffsetDb).toBe(75);
  });

  it('semantics.yaml has a realize rule that passes plstepBurstOffsetDb through to realized values', () => {
    // Same pattern as plstepThreshold — constant passthrough so it's available for binding
    expect(semantics.realize).toBeDefined();
    expect(semantics.realize!.plstepBurstOffsetDb).toBeDefined();
  });
});
