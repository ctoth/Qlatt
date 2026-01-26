import { describe, it, expect } from 'vitest';
import { createTopologicalEvaluator } from '../../src/semantics/topological-evaluator.js';

describe('Topological Evaluator', () => {
  it('evaluates in dependency order', () => {
    const evaluator = createTopologicalEvaluator();
    const semantics = {
      name: 'test',
      realize: {
        b: { expr: 'a + 1', deps: ['a'] },
        c: { expr: 'b + 1', deps: ['b'] },
      },
    };
    const result = evaluator.evaluate(semantics, { a: 1 });
    expect(result.values).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('detects cycles', () => {
    const evaluator = createTopologicalEvaluator();
    const semantics = {
      name: 'cyclic',
      realize: {
        a: { expr: 'b + 1', deps: ['b'] },
        b: { expr: 'a + 1', deps: ['a'] },
      },
    };
    expect(() => evaluator.evaluate(semantics, {})).toThrow(/cycle/i);
  });
});
