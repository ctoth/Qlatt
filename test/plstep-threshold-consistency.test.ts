/**
 * Tests that the PLSTEP burst detection threshold (49 dB) is defined in a single
 * source of truth (semantics.yaml constant) and referenced consistently by:
 * 1. The interpreter (telemetry PLSTEP detection)
 * 2. The graph.yaml edge-detectors (audio-domain burst detection)
 *
 * From Klatt 80 PARCOE.FOR:
 *   IF (NNAF - NAFLAS >= 49) PLSTEP = GETAMP(G0 - 28)
 *   IF (NNAH - NAHLAS >= 49) PLSTEP = GETAMP(G0 - 28)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import yaml from 'js-yaml';
import type { SemanticsDocument } from '../src/semantics/types';

// Load the real YAML files
const basePath = resolve(__dirname, '../public/experiments/klatt80-baseline');

const semanticsRaw = readFileSync(resolve(basePath, 'semantics.yaml'), 'utf-8');
const semantics = yaml.load(semanticsRaw) as SemanticsDocument;

const graphRaw = readFileSync(resolve(basePath, 'graph.yaml'), 'utf-8');
const graph = yaml.load(graphRaw) as {
  nodes: Record<string, { type: string; params?: Record<string, unknown> }>;
};

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

  it('graph.yaml ahEdgeDetector threshold binds to plstepThreshold', () => {
    const ahEdge = graph.nodes.ahEdgeDetector;
    expect(ahEdge).toBeDefined();
    expect(ahEdge.type).toBe('edge-detector');
    expect(ahEdge.params).toBeDefined();
    const thresholdSpec = ahEdge.params!.threshold as { bind: string };
    expect(thresholdSpec).toHaveProperty('bind');
    expect(thresholdSpec.bind).toBe('plstepThreshold');
  });

  it('all edge-detector thresholds reference the same constant value', () => {
    // Get the constant value
    const threshold = semantics.constants!.plstepThreshold as number;

    // Both edge-detectors should bind to plstepThreshold
    const afThreshold = graph.nodes.afEdgeDetector.params!.threshold as { bind: string };
    const ahThreshold = graph.nodes.ahEdgeDetector.params!.threshold as { bind: string };
    expect(afThreshold.bind).toBe('plstepThreshold');
    expect(ahThreshold.bind).toBe('plstepThreshold');

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
