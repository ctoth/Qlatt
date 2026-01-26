/**
 * CEL (Common Expression Language) evaluator
 * Uses cel-js for expression parsing and evaluation.
 */

import { evaluate } from 'cel-js';
import type { CelExpression, EvaluationContext, ParamValue } from './types.js';

export interface CelEvaluator {
  evaluate(expr: CelExpression, context: EvaluationContext): ParamValue;
  registerFunction(name: string, fn: (...args: ParamValue[]) => ParamValue): void;
}

export function createCelEvaluator(): CelEvaluator {
  const functions: Record<string, (...args: ParamValue[]) => ParamValue> = {};

  return {
    evaluate(expr: CelExpression, context: EvaluationContext): ParamValue {
      // Merge params into context for variable access
      const evalContext: Record<string, unknown> = { ...context.params };

      // Evaluate with cel-js
      const result = evaluate(expr, evalContext, functions);
      return result as ParamValue;
    },

    registerFunction(name: string, fn: (...args: ParamValue[]) => ParamValue): void {
      functions[name] = fn;
    }
  };
}
