import { describe, it, expect } from 'vitest';
import { createConfiguredEvaluator } from '../src/semantics/evaluator-factory';
import type { SemanticsDocument, EvaluationContext } from '../src/semantics/types';

describe('createConfiguredEvaluator', () => {
  it('returns both cel and topo evaluators', () => {
    const { celEvaluator, topoEvaluator } = createConfiguredEvaluator();
    expect(celEvaluator).toBeDefined();
    expect(topoEvaluator).toBeDefined();
    expect(typeof celEvaluator.evaluate).toBe('function');
    expect(typeof celEvaluator.registerFunction).toBe('function');
    expect(typeof topoEvaluator.evaluate).toBe('function');
    expect(typeof topoEvaluator.getEvaluationOrder).toBe('function');
  });

  it('has all numeric builtins registered', () => {
    const { celEvaluator } = createConfiguredEvaluator();
    const ctx: EvaluationContext = { params: {}, constants: {} };

    // dbToLinear: Klatt dB conversion
    const dbResult = celEvaluator.evaluate('dbToLinear(60)', ctx);
    expect(typeof dbResult).toBe('number');
    expect(dbResult).toBeGreaterThan(0);

    // min
    expect(celEvaluator.evaluate('min(3, 5)', ctx)).toBe(3);

    // max
    expect(celEvaluator.evaluate('max(3, 5)', ctx)).toBe(5);

    // pow
    expect(celEvaluator.evaluate('pow(2, 3)', ctx)).toBe(8);

    // proximity
    const proxResult = celEvaluator.evaluate('proximity(500)', ctx);
    expect(typeof proxResult).toBe('number');
  });

  it('can run topological evaluation with a minimal semantics', () => {
    const { topoEvaluator } = createConfiguredEvaluator();

    const semantics: SemanticsDocument = {
      name: 'test',
      params: {
        AV: { default: 60 },
      },
      realize: {
        voiceGain: {
          expr: 'dbToLinear(AV)',
          deps: [],
        },
      },
    };

    const context: EvaluationContext = {
      params: { AV: 60 },
      constants: {},
    };

    const result = topoEvaluator.evaluate(semantics, context);
    expect(result.errors).toHaveLength(0);
    expect(typeof result.values['voiceGain']).toBe('number');
    expect(result.values['voiceGain']).toBeGreaterThan(0);
  });

  it('each call returns independent evaluator instances', () => {
    const a = createConfiguredEvaluator();
    const b = createConfiguredEvaluator();
    expect(a.celEvaluator).not.toBe(b.celEvaluator);
    expect(a.topoEvaluator).not.toBe(b.topoEvaluator);
  });
});
