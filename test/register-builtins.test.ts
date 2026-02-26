import { describe, it, expect } from 'vitest';
import { requireNumericArg, registerNumericBuiltins } from '../src/semantics/register-builtins';
import { createCelEvaluator } from '../src/semantics/cel-evaluator';

describe('requireNumericArg', () => {
  it('returns a finite number unchanged', () => {
    expect(requireNumericArg('test', 0, 42)).toBe(42);
    expect(requireNumericArg('test', 0, -3.14)).toBe(-3.14);
    expect(requireNumericArg('test', 0, 0)).toBe(0);
  });

  it('throws on NaN', () => {
    expect(() => requireNumericArg('test', 0, NaN)).toThrow(
      'test expected finite numeric argument at index 0'
    );
  });

  it('throws on Infinity', () => {
    expect(() => requireNumericArg('test', 0, Infinity)).toThrow(
      'test expected finite numeric argument at index 0'
    );
    expect(() => requireNumericArg('test', 1, -Infinity)).toThrow(
      'test expected finite numeric argument at index 1'
    );
  });

  it('throws on string', () => {
    expect(() => requireNumericArg('test', 0, 'hello' as any)).toThrow(
      'test expected finite numeric argument at index 0'
    );
  });

  it('throws on undefined', () => {
    expect(() => requireNumericArg('test', 0, undefined as any)).toThrow(
      'test expected finite numeric argument at index 0'
    );
  });
});

describe('registerNumericBuiltins', () => {
  it('registers dbToLinear that evaluates correctly', () => {
    const evaluator = createCelEvaluator();
    registerNumericBuiltins(evaluator);
    const result = evaluator.evaluate('dbToLinear(60)', { params: {}, constants: {} });
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  it('registers min that returns the smaller value', () => {
    const evaluator = createCelEvaluator();
    registerNumericBuiltins(evaluator);
    expect(evaluator.evaluate('min(3, 5)', { params: {}, constants: {} })).toBe(3);
  });

  it('registers max that returns the larger value', () => {
    const evaluator = createCelEvaluator();
    registerNumericBuiltins(evaluator);
    expect(evaluator.evaluate('max(3, 5)', { params: {}, constants: {} })).toBe(5);
  });

  it('registers pow that computes exponentiation', () => {
    const evaluator = createCelEvaluator();
    registerNumericBuiltins(evaluator);
    expect(evaluator.evaluate('pow(2, 3)', { params: {}, constants: {} })).toBe(8);
  });
});
