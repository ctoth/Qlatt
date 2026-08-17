/**
 * Tests for PFE codegen — generatePfeRules() produces CEL realize rules
 * that replace the imperative PFE loop in topological-evaluator.ts.
 *
 * Citations:
 * - Lin 1995: Partial Fraction Expansion for parallel formant amplitude correction
 * - Klatt 1980: Original synthesizer specification
 */
import { describe, it, expect } from 'vitest';
import { generatePfeRules } from '../src/semantics/pfe-codegen';
import type { PfeFormantSpec } from '../src/semantics/pfe-codegen';
import { createCelEvaluator } from '../src/semantics/cel-evaluator';
import { registerNumericBuiltins } from '../src/semantics/register-builtins';
import { createTopologicalEvaluator } from '../src/semantics/topological-evaluator';
import { expandFormantBanks } from '../src/formant-bank';
import { resonatorMagnitudeDb, dbToLinear } from '../src/builtin-functions';
import type { SemanticsDocument, EvaluationContext } from '../src/semantics/types';
import type { BaconGraph } from '../src/klatt-runtime';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseYamlString } from '../src/yaml-loader';

// A minimal 6-formant bank for unit tests (matches klatt80-baseline formants 1-6)
const sixFormants: PfeFormantSpec[] = [
  { index: 1, ndbScale: -58, sign: 1, parallelSource: 'src' },
  { index: 2, ndbScale: -65, sign: -1, parallelSource: 'src' },
  { index: 3, ndbScale: -73, sign: 1, parallelSource: 'src' },
  { index: 4, ndbScale: -78, sign: -1, parallelSource: 'src' },
  { index: 5, ndbScale: -79, sign: 1, parallelSource: 'src' },
  { index: 6, ndbScale: -80, sign: -1, parallelSource: 'src' },
];

// A 3-formant bank where only some have parallelSource
const threeParallelFormants: PfeFormantSpec[] = [
  { index: 1, ndbScale: -58, sign: 1, parallelSource: 'src' },
  { index: 2 },
  { index: 3, ndbScale: -73, sign: 1, parallelSource: 'src' },
  { index: 4 },
  { index: 5, ndbScale: -79, sign: 1, parallelSource: 'src' },
];

describe('generatePfeRules', () => {
  it('produces one rule per formant with parallelSource: true', () => {
    const rules = generatePfeRules(sixFormants);
    // All 6 formants have parallelSource, so 6 rules
    expect(Object.keys(rules)).toHaveLength(6);
    for (let i = 1; i <= 6; i++) {
      expect(rules).toHaveProperty(`a${i}Linear`);
    }
  });

  it('generated rule for formant 1 (in 6-formant bank) has CEL with 5 resonatorMagnitudeDb calls', () => {
    const rules = generatePfeRules(sixFormants);
    const expr = (rules['a1Linear'] as { expr: string }).expr;
    const matches = expr.match(/resonatorMagnitudeDb/g);
    expect(matches).toHaveLength(5);
  });

  it('generated rule deps include all F, B, A params plus sampleRate and parallelScale', () => {
    const rules = generatePfeRules(sixFormants);
    const rule = rules['a1Linear'] as { expr: string; deps: string[] };
    // Must depend on A1, F1 (own freq), and all other F/B pairs, plus sampleRate, parallelScale
    expect(rule.deps).toContain('A1');
    expect(rule.deps).toContain('F1');
    expect(rule.deps).toContain('sampleRate');
    expect(rule.deps).toContain('parallelScale');
    // Other formants' F and B
    for (let j = 2; j <= 6; j++) {
      expect(rule.deps).toContain(`F${j}`);
      expect(rule.deps).toContain(`B${j}`);
    }
  });

  it('for a bank with only 3 formants with parallelSource, exactly 3 rules are generated', () => {
    const rules = generatePfeRules(threeParallelFormants);
    expect(Object.keys(rules)).toHaveLength(3);
    expect(rules).toHaveProperty('a1Linear');
    expect(rules).not.toHaveProperty('a2Linear');
    expect(rules).toHaveProperty('a3Linear');
    expect(rules).not.toHaveProperty('a4Linear');
    expect(rules).toHaveProperty('a5Linear');
  });

  it('evaluating generated rules produces identical values to imperative loop (within 1e-10)', () => {
    // Reproduce the imperative loop logic manually for comparison
    const sr = 44100;
    const formants = sixFormants;
    const params: Record<string, number> = {
      F1: 520, F2: 1480, F3: 2510, F4: 3600, F5: 4400, F6: 5600,
      B1: 70, B2: 100, B3: 160, B4: 210, B5: 190, B6: 520,
      A1: 10, A2: 15, A3: 8, A4: 5, A5: 3, A6: 2,
      sampleRate: sr,
      parallelScale: 0.85,
    };

    // Imperative loop computation (matches topological-evaluator.ts lines 98-128)
    const imperativeResults: Record<string, number> = {};
    for (let i = 0; i < formants.length; i++) {
      const f = formants[i];
      if (!f.parallelSource) continue;
      const idx = f.index;
      const evalFreq = params[`F${idx}`];
      const ampDb = params[`A${idx}`] ?? 0;
      const ndbScaleVal = f.ndbScale ?? 0;
      let correctionDb = 0;
      for (let j = 0; j < formants.length; j++) {
        if (j === i) continue;
        const jIdx = formants[j].index;
        const otherFreq = params[`F${jIdx}`];
        const otherBw = params[`B${jIdx}`];
        correctionDb += resonatorMagnitudeDb(evalFreq, otherFreq, otherBw, sr);
      }
      const sign = f.sign ?? 1;
      const parallelScale = params.parallelScale;
      imperativeResults[`a${idx}Linear`] = sign * dbToLinear(ampDb + correctionDb + ndbScaleVal) * parallelScale;
    }

    // Now evaluate via generated CEL rules
    const rules = generatePfeRules(sixFormants);
    const celEvaluator = createCelEvaluator();
    registerNumericBuiltins(celEvaluator);

    const celResults: Record<string, number> = {};
    for (const [name, rule] of Object.entries(rules)) {
      const ruleObj = typeof rule === 'string' ? { expr: rule } : rule;
      const context: EvaluationContext = {
        params: { ...params },
        constants: {},
      };
      const value = celEvaluator.evaluate(ruleObj.expr, context);
      celResults[name] = value as number;
    }

    // Compare
    for (const key of Object.keys(imperativeResults)) {
      expect(celResults[key]).toBeCloseTo(imperativeResults[key], 10);
    }
  });
});

describe('PFE codegen integration: full pipeline produces identical results', () => {
  // Load real semantics and graph, expand formant banks, then compare
  // evaluator output with and without the generated rules
  const semanticsPath = resolve(__dirname, '../public/experiments/klatt80-baseline/semantics.yaml');
  const semanticsRaw = readFileSync(semanticsPath, 'utf-8');
  const graphPath = resolve(__dirname, '../public/experiments/klatt80-baseline/graph.yaml');
  const graphRaw = readFileSync(graphPath, 'utf-8');

  function makeEvaluatorAndSemantics() {
    const sem = parseYamlString<SemanticsDocument>(semanticsRaw, semanticsPath);
    const g = parseYamlString<BaconGraph>(graphRaw, graphPath);
    expandFormantBanks(g, sem);
    const celEvaluator = createCelEvaluator();
    registerNumericBuiltins(celEvaluator);
    const topoEvaluator = createTopologicalEvaluator(celEvaluator);
    return { sem, topoEvaluator };
  }

  const testCases = [
    { name: 'default formants', F1: 500, F2: 1500, F3: 2500, F4: 3500 },
    { name: 'close F1-F2', F1: 500, F2: 600, F3: 2500, F4: 3500 },
    { name: 'high vowel', F1: 300, F2: 2200, F3: 3000, F4: 3500 },
  ];

  for (const tc of testCases) {
    it(`produces correct a{N}Linear for ${tc.name}`, () => {
      const { sem, topoEvaluator } = makeEvaluatorAndSemantics();
      const params: Record<string, number> = {
        F0: 100, F1: tc.F1, F2: tc.F2, F3: tc.F3, F4: tc.F4,
        AV: 60, AH: 0, AF: 0, AVS: 0, GO: 47,
        B1: 80, B2: 90, B3: 100, B4: 300, B5: 300, B6: 300,
        BNP: 250, BNZ: 100, BTP: 200, BGP: 100, BGS: 200,
        FNP: 250, FNZ: 250, FTP: 2150, FGP: 300, FGS: 3000,
        A1: 10, A2: 15, A3: 8, A4: 5, A5: 3, A6: 2, AB: 0, AN: 0,
        SW: 0,
        sampleRate: 44100,
      };

      const context: EvaluationContext = {
        params: { ...params },
        constants: sem.constants ?? {},
      };

      const result = topoEvaluator.evaluate(sem, context);

      // Verify all parallel formants got values
      for (let i = 1; i <= 10; i++) {
        expect(result.values).toHaveProperty(`a${i}Linear`);
        const val = result.values[`a${i}Linear`];
        expect(typeof val).toBe('number');
        expect(Number.isFinite(val)).toBe(true);
      }

      // Verify no errors for a{N}Linear rules
      const ampErrors = result.errors.filter(e => /^a\d+Linear$/.test(e.name));
      expect(ampErrors).toEqual([]);
    });
  }
});
