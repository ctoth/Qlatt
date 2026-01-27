import { describe, it, expect } from 'vitest';
import { createTopologicalEvaluator } from '../../src/semantics/topological-evaluator.js';
import { createCelEvaluator } from '../../src/semantics/cel-evaluator.js';

describe('Topological Evaluator', () => {
  it('evaluates in dependency order', () => {
    const celEvaluator = createCelEvaluator();
    const evaluator = createTopologicalEvaluator(celEvaluator);
    const semantics = {
      name: 'test',
      realize: {
        b: { expr: 'a + 1', deps: ['a'] },
        c: { expr: 'b + 1', deps: ['b'] },
      },
    };
    const result = evaluator.evaluate(semantics, { params: { a: 1 }, constants: {} });
    expect(result.values).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('detects cycles', () => {
    const celEvaluator = createCelEvaluator();
    const evaluator = createTopologicalEvaluator(celEvaluator);
    const semantics = {
      name: 'cyclic',
      realize: {
        a: { expr: 'b + 1', deps: ['b'] },
        b: { expr: 'a + 1', deps: ['a'] },
      },
    };
    expect(() => evaluator.evaluate(semantics, { params: {}, constants: {} })).toThrow(/cycle/i);
  });
});
