/**
 * CEL (Common Expression Language) evaluator
 * Uses @marcbachmann/cel-js for expression parsing and evaluation.
 */

import { type ASTNode, Environment, type ParseResult } from "@marcbachmann/cel-js";
import type { CelExpression, EvaluationContext, ParamValue } from "./types";

export interface CelEvaluator {
  evaluate(expr: CelExpression, context: EvaluationContext): ParamValue;
  registerFunction(name: string, fn: (...args: ParamValue[]) => ParamValue): void;
  references(expr: CelExpression): string[][];
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
  // The CEL spec defines `%` only on ints; context values are doubles, so the
  // truncating remainder is extended to doubles (#47). Use `mod()` for the
  // floored modulo that clock arithmetic needs.
  env.registerOperator("double % double", (a: number, b: number) => a % b);
  env.registerOperator("double == int", (a: number, b: bigint) => a === Number(b));

  // Cache compiled expressions for reuse
  const exprCache = new Map<string, ParseResult>();

  function compileExpr(expr: string): ParseResult {
    let cached = exprCache.get(expr);
    if (cached) return cached;

    cached = env.parse(expr);
    exprCache.set(expr, cached);
    return cached;
  }

  return {
    references(expr): string[][] {
      const parsed = compileExpr(expr);
      const checked = parsed.check();
      if (!checked.valid) throw checked.error ?? new Error("Invalid semantic expression");
      const result: string[][] = [];
      const path = (node: ASTNode): string[] | undefined => {
        if (node.op === "id") return [node.args];
        if (node.op === "." || node.op === ".?") {
          const parent = path(node.args[0]);
          return parent && [...parent, node.args[1]];
        }
        if ((node.op === "[]" || node.op === "[?]") && node.args[1].op === "value") {
          const parent = path(node.args[0]);
          return parent && [...parent, String(node.args[1].args)];
        }
        return undefined;
      };
      const visit = (value: unknown, locals = new Set<string>()): void => {
        if (Array.isArray(value)) {
          for (const child of value) visit(child, locals);
        } else if (value && typeof value === "object" && "op" in value) {
          const node = value as ASTNode;
          const reference = path(node);
          if (reference) {
            if (!locals.has(reference[0])) result.push(reference);
            return;
          }
          if (
            node.op === "rcall" &&
            ["map", "filter", "all", "exists", "exists_one"].includes(node.args[0])
          ) {
            visit(node.args[1], locals);
            const [binding, ...body] = node.args[2];
            const scope = new Set(locals);
            if (binding?.op === "id") scope.add(binding.args);
            visit(body, scope);
          } else visit(node.args, locals);
        }
      };
      visit(parsed.ast);
      return result;
    },
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
      const CEL_BUILTINS = new Set([
        "double",
        "string",
        "int",
        "uint",
        "bool",
        "bytes",
        "type",
        "dyn",
      ]);
      if (CEL_BUILTINS.has(name)) return;

      // Register with dyn signature so it accepts any argument types.
      // Variadic functions (rest args) have .length === 0 — register
      // overloads for arities 1 and 2 so both max(x) and max(x, y) work.
      const coerceAndCall = (...evalArgs: unknown[]) => {
        const coercedArgs = evalArgs.map((a: unknown) =>
          typeof a === "bigint" ? Number(a) : a,
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
    },
  };
}
