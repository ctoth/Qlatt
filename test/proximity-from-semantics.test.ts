/**
 * Tests that proximity corrections (n12Cor, n23Cor, n34Cor) are correctly
 * computed by the semantics evaluation pipeline (CEL + topological evaluator),
 * not hardcoded in the interpreter.
 *
 * After removing the duplicated proximity lines from buildContext(),
 * the realize rules in semantics.yaml are the single source of truth.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { createCelEvaluator } from '../src/semantics/cel-evaluator';
import { registerNumericBuiltins } from '../src/semantics/register-builtins';
import { createTopologicalEvaluator } from '../src/semantics/topological-evaluator';
import { proximity } from '../src/builtin-functions';
import type { SemanticsDocument, EvaluationContext } from '../src/semantics/types';
import { parseYamlString } from '../src/yaml-loader';

// Load the real semantics.yaml
const semanticsPath = resolve(__dirname, '../public/experiments/klatt80-baseline/semantics.yaml');
const semanticsRaw = readFileSync(semanticsPath, 'utf-8');
const semantics = parseYamlString<SemanticsDocument>(semanticsRaw, semanticsPath);

describe('proximity corrections from semantics pipeline', () => {
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
      params: { ...params } as Record<string, unknown>,
      constants: semantics.constants ?? {},
    };

    const result = topoEvaluator.evaluate(semantics, context);
    return result;
  }

  it('produces n12Cor, n23Cor, n34Cor in the output', () => {
    const result = evaluateWithFormants(300, 2000, 3000, 3500);
    expect(result.values).toHaveProperty('n12Cor');
    expect(result.values).toHaveProperty('n23Cor');
    expect(result.values).toHaveProperty('n34Cor');
  });

  it('produces correct proximity values for widely-spaced formants', () => {
    // F1=300, F2=2000, F3=3000, F4=3500
    // n12Cor = proximity(2000 - 300) = proximity(1700) -> 0 (>= 550)
    // n23Cor = proximity(3000 - 2000 - 50) = proximity(950) -> 0 (>= 550)
    // n34Cor = proximity(3500 - 3000 - 150) = proximity(350) -> ndbCor[6] = 4
    const result = evaluateWithFormants(300, 2000, 3000, 3500);
    expect(result.values['n12Cor']).toBe(0);
    expect(result.values['n23Cor']).toBe(0);
    expect(result.values['n34Cor']).toBe(proximity(350));
    expect(result.values['n34Cor']).toBe(4);
  });

  it('produces correct proximity values for close formants', () => {
    // F1=500, F2=600: proximity(100) -> ndbCor[1] = 9
    // F3=700: proximity(700 - 600 - 50) = proximity(50) -> ndbCor[0] = 10
    // F4=900: proximity(900 - 700 - 150) = proximity(50) -> ndbCor[0] = 10
    const result = evaluateWithFormants(500, 600, 700, 900);
    expect(result.values['n12Cor']).toBe(proximity(100));
    expect(result.values['n12Cor']).toBe(9);
    expect(result.values['n23Cor']).toBe(proximity(50));
    expect(result.values['n23Cor']).toBe(10);
    expect(result.values['n34Cor']).toBe(proximity(50));
    expect(result.values['n34Cor']).toBe(10);
  });

  it('matches the proximity() builtin function for various formant spreads', () => {
    // Test a range of formant configurations to ensure semantics
    // matches the proximity function exactly
    const cases = [
      { f1: 270, f2: 2290, f3: 3010, f4: 3500 },  // typical /i/ vowel
      { f1: 730, f2: 1090, f3: 2440, f4: 3500 },  // typical /a/ vowel
      { f1: 300, f2: 870, f3: 2240, f4: 3500 },    // typical /u/ vowel
      { f1: 400, f2: 600, f3: 2500, f4: 3200 },    // F1-F2 close
    ];

    for (const { f1, f2, f3, f4 } of cases) {
      const result = evaluateWithFormants(f1, f2, f3, f4);
      const expected12 = proximity(f2 - f1);
      const expected23 = proximity(f3 - f2 - 50);
      const expected34 = proximity(f4 - f3 - 150);
      expect(result.values['n12Cor'], `n12Cor for F1=${f1},F2=${f2}`).toBe(expected12);
      expect(result.values['n23Cor'], `n23Cor for F2=${f2},F3=${f3}`).toBe(expected23);
      expect(result.values['n34Cor'], `n34Cor for F3=${f3},F4=${f4}`).toBe(expected34);
    }
  });

  it('reports no evaluation errors for proximity rules', () => {
    const result = evaluateWithFormants(300, 2000, 3000, 3500);
    const proximityErrors = result.errors.filter(
      e => e.name === 'n12Cor' || e.name === 'n23Cor' || e.name === 'n34Cor'
    );
    expect(proximityErrors).toEqual([]);
  });
});
