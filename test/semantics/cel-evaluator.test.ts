import { describe, it, expect } from 'vitest';
import { createCelEvaluator } from '../../src/semantics/cel-evaluator.js';

describe('CEL Evaluator', () => {
  it('evaluates simple math', () => {
    const evaluator = createCelEvaluator();
    expect(evaluator.evaluate('2 + 3', { params: {}, constants: {} })).toBe(5);
  });

  it('evaluates ternary', () => {
    const evaluator = createCelEvaluator();
    expect(evaluator.evaluate('x > 0 ? x : 0', { params: { x: 5 }, constants: {} })).toBe(5);
    expect(evaluator.evaluate('x > 0 ? x : 0', { params: { x: -5 }, constants: {} })).toBe(0);
  });

  it('calls registered functions', () => {
    const evaluator = createCelEvaluator();
    evaluator.registerFunction('double', (x: number) => x * 2);
    expect(evaluator.evaluate('double(5)', { params: {}, constants: {} })).toBe(10);
  });
});
