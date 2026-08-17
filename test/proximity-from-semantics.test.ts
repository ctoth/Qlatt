/**
 * Tests that parallel formant amplitude corrections are correctly computed
 * by compiled PFE (Partial Fraction Expansion) realization rules.
 *
 * Previously, formant bank expansion generated proximity correction rules
 * (n12Cor, n23Cor, n34Cor) and a{N}Linear rules using static ndbScale constants.
 * Formant-bank expansion now compiles a{N}Linear into ordinary semantics rules
 * using resonatorMagnitudeDb() to get the actual transfer function magnitude
 * of each resonator at every other formant's frequency.
 *
 * Citations:
 * - Lin 1995 (Partial Fraction Expansion)
 * - Klatt 1980 (original synthesizer specification)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { createCelEvaluator } from '../src/semantics/cel-evaluator';
import { registerNumericBuiltins } from '../src/semantics/register-builtins';
import { createTopologicalEvaluator } from '../src/semantics/topological-evaluator';
import { dbToLinear } from '../src/builtin-functions';
import { expandFormantBanks } from '../src/formant-bank';
import type { BaconGraph } from '../src/klatt-runtime';
import type { SemanticsDocument, EvaluationContext } from '../src/semantics/types';
import { parseYamlString } from '../src/yaml-loader';

// Load the real semantics.yaml and graph.yaml, then expand formant banks
const semanticsPath = resolve(__dirname, '../public/experiments/klatt80-baseline/semantics.yaml');
const semanticsRaw = readFileSync(semanticsPath, 'utf-8');
const semantics = parseYamlString<SemanticsDocument>(semanticsRaw, semanticsPath);

const graphPath = resolve(__dirname, '../public/experiments/klatt80-baseline/graph.yaml');
const graphRaw = readFileSync(graphPath, 'utf-8');
const graph = parseYamlString<BaconGraph>(graphRaw, graphPath);

// Run formant bank expansion (now only generates graph nodes/connections + params;
// amplitude computation is compiled into semantics via PFE)
expandFormantBanks(graph, semantics);

describe('PFE-based parallel formant amplitudes from semantics pipeline', () => {
  function evaluateWithFormants(f1: number, f2: number, f3: number, f4: number) {
    const celEvaluator = createCelEvaluator();
    registerNumericBuiltins(celEvaluator);
    const topoEvaluator = createTopologicalEvaluator(celEvaluator);

    // Build a minimal context with formant values and required defaults
    const params: Record<string, number> = {
      F0: 100, F1: f1, F2: f2, F3: f3, F4: f4,
      // Provide defaults for other params that realize rules may reference
      AV: 60, AH: 0, AF: 0, AVS: 0, GO: 47,
      B1: 80, B2: 90, B3: 100, B4: 300, B5: 300, B6: 300,
      BNP: 250, BNZ: 100, BTP: 200, BGP: 100, BGS: 200,
      FNP: 250, FNZ: 250, FTP: 2150, FGP: 300, FGS: 3000,
      A1: 0, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0, AB: 0, AN: 0,
      SW: 0,
      sampleRate: 44100,
    };

    const context: EvaluationContext = {
      params: { ...params },
      constants: semantics.constants ?? {},
    };

    const result = topoEvaluator.evaluate(semantics, context);
    return result;
  }

  it('produces a{N}Linear values for all parallel formants', () => {
    const result = evaluateWithFormants(500, 1500, 2500, 3500);
    // All 10 formants have parallel sources
    for (let i = 1; i <= 10; i++) {
      expect(result.values).toHaveProperty(`a${i}Linear`);
    }
  });

  it('a{N}Linear values are finite numbers', () => {
    const result = evaluateWithFormants(500, 1500, 2500, 3500);
    for (let i = 1; i <= 6; i++) {
      const val = result.values[`a${i}Linear`];
      expect(typeof val).toBe('number');
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it('sign alternation is respected (odd positive, even negative)', () => {
    // With A{N}=0 and large ndbScale offsets, all a{N}Linear should be near zero,
    // but sign should match the formant spec: F1 +, F2 -, F3 +, F4 -
    const result = evaluateWithFormants(500, 1500, 2500, 3500);
    // With A=0 and negative ndbScale, the absolute value will be very small
    // but sign should be correct. We test with non-zero A to get measurable values.
    const celEvaluator = createCelEvaluator();
    registerNumericBuiltins(celEvaluator);
    const topoEvaluator = createTopologicalEvaluator(celEvaluator);

    const params: Record<string, number> = {
      F0: 100, F1: 500, F2: 1500, F3: 2500, F4: 3500,
      AV: 60, AH: 0, AF: 0, AVS: 0, GO: 47,
      B1: 60, B2: 90, B3: 150, B4: 200, B5: 200, B6: 500,
      BNP: 250, BNZ: 100, BTP: 200, BGP: 100, BGS: 200,
      FNP: 250, FNZ: 250, FTP: 2150, FGP: 300, FGS: 3000,
      // Set A values high enough to produce non-zero linear values
      A1: 60, A2: 60, A3: 60, A4: 60, A5: 60, A6: 60, AB: 0, AN: 0,
      SW: 0,
      sampleRate: 44100,
    };

    const context: EvaluationContext = {
      params: { ...params },
      constants: semantics.constants ?? {},
    };

    const r = topoEvaluator.evaluate(semantics, context);
    // F1: sign=+1, F2: sign=-1, F3: sign=+1, F4: sign=-1
    expect(r.values['a1Linear'] as number).toBeGreaterThan(0);
    expect(r.values['a2Linear'] as number).toBeLessThan(0);
    expect(r.values['a3Linear'] as number).toBeGreaterThan(0);
    expect(r.values['a4Linear'] as number).toBeLessThan(0);
  });

  it('PFE correction increases when formants are close together', () => {
    // When F1 and F2 are close, the inter-formant correction at F1 should be
    // larger (more positive) than when they are far apart, because the F2
    // resonator still has significant energy at F1's frequency.
    const resultClose = evaluateWithFormants(500, 600, 2500, 3500);
    const resultFar = evaluateWithFormants(500, 1500, 2500, 3500);

    // a1Linear: with close F2, the correction from F2 is larger, so the
    // overall amplitude should be different (larger correction = more boost)
    const a1Close = Math.abs(resultClose.values['a1Linear'] as number);
    const a1Far = Math.abs(resultFar.values['a1Linear'] as number);

    // Close formants should produce a larger absolute amplitude due to
    // the nearby resonator contributing more energy
    expect(a1Close).toBeGreaterThan(a1Far);
  });

  it('reports no evaluation errors for a{N}Linear', () => {
    const result = evaluateWithFormants(500, 1500, 2500, 3500);
    const ampErrors = result.errors.filter(
      e => /^a\d+Linear$/.test(e.name)
    );
    expect(ampErrors).toEqual([]);
  });
});
