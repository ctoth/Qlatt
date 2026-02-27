/**
 * CEL (Common Expression Language) evaluator
 * Uses @marcbachmann/cel-js for expression parsing and evaluation.
 */

import { Environment } from '@marcbachmann/cel-js';
import type { CelExpression, EvaluationContext, ParamValue } from './types';

export interface CelEvaluator {
  evaluate(expr: CelExpression, context: EvaluationContext): ParamValue;
  registerFunction(name: string, fn: (...args: ParamValue[]) => ParamValue): void;
}

/**
 * Coerce @marcbachmann/cel-js results: BigInt (CEL int) -> JS number.
 * The synthesizer expects plain JS numbers everywhere.
 */
function coerceResult(value: unknown): unknown {
  if (typeof value === "bigint") return Number(value);
  return value;
}

export function createCelEvaluator(): CelEvaluator {
  const env = new Environment({
    unlistedVariablesAreDyn: true,
    homogeneousAggregateLiterals: false,
    enableOptionalTypes: true,
  });

  // Register mixed-type arithmetic operators for int/double interop.
  // Context variables are JS numbers (CEL double), but CEL integer literals
  // are BigInt (CEL int). These overloads bridge the gap.
  env.registerOperator("double + int", (a: number, b: bigint) => a + Number(b));
  env.registerOperator("int + double", (a: bigint, b: number) => Number(a) + b);
  env.registerOperator("double * int", (a: number, b: bigint) => a * Number(b));
  env.registerOperator("int * double", (a: bigint, b: number) => Number(a) * b);
  env.registerOperator("double - int", (a: number, b: bigint) => a - Number(b));
  env.registerOperator("int - double", (a: bigint, b: number) => Number(a) - b);
  env.registerOperator("double / int", (a: number, b: bigint) => a / Number(b));
  env.registerOperator("int / double", (a: bigint, b: number) => Number(a) / b);
  env.registerOperator("double % int", (a: number, b: bigint) => a % Number(b));
  env.registerOperator("int % double", (a: bigint, b: number) => Number(a) % b);
  env.registerOperator("double == int", (a: number, b: bigint) => a === Number(b));

  // Cache compiled expressions for reuse
  const exprCache = new Map<string, (ctx?: Record<string, any>) => any>();

  function compileExpr(expr: string): (ctx?: Record<string, any>) => any {
    let cached = exprCache.get(expr);
    if (cached) return cached;

    cached = env.parse(expr);
    exprCache.set(expr, cached);
    return cached;
  }

  return {
    evaluate(expr: CelExpression, context: EvaluationContext): ParamValue {
      // Merge params and constants into context for variable access
      // This enables nested constant access like ndbScale.AV in expressions
      const evalContext: Record<string, unknown> = {
        ...context.params,
        ...context.constants,
      };

      // Parse, cache, and evaluate
      const compiled = compileExpr(expr);
      const result = compiled(evalContext);
      return coerceResult(result) as ParamValue;
    },

    registerFunction(name: string, fn: (...args: ParamValue[]) => ParamValue): void {
      // CEL builtins "double", "string", "int", "uint", "bool", "bytes"
      // cannot be overridden. Skip silently — the CEL builtins perform
      // equivalent type casts.
      const CEL_BUILTINS = new Set(["double", "string", "int", "uint", "bool", "bytes", "type", "dyn"]);
      if (CEL_BUILTINS.has(name)) return;

      // Register with dyn signature so it accepts any argument types.
      // Variadic functions (rest args) have .length === 0 — register
      // overloads for arities 1 and 2 so both max(x) and max(x, y) work.
      const coerceAndCall = (...evalArgs: any[]) => {
        const coercedArgs = evalArgs.map((a: unknown) =>
          typeof a === "bigint" ? Number(a) : a
        ) as ParamValue[];
        return fn(...coercedArgs);
      };

      const declaredArity = fn.length;
      if (declaredArity > 0) {
        // Fixed arity — register exactly that many dyn args
        const args = Array(declaredArity).fill("dyn").join(", ");
        env.registerFunction(`${name}(${args}): dyn`, coerceAndCall);
      } else {
        // Variadic (rest params) — register overloads for arity 1 and 2
        env.registerFunction(`${name}(dyn): dyn`, coerceAndCall);
        env.registerFunction(`${name}(dyn, dyn): dyn`, coerceAndCall);
      }
    }
  };
}
