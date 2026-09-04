/**
 * Shared builtin function registration for CEL evaluators.
 *
 * Registers numeric math functions (dbToLinear, min, max, pow, etc.) with
 * a CelEvaluator instance. Used by both klatt-interpreter.ts and klatt-runtime.ts.
 */

import {
  builtinAbs,
  builtinExp,
  builtinLog,
  builtinSqrt,
  dbToLinear,
  dbToLinearKlsyn,
  max,
  min,
  pow,
  proximity,
  resonatorMagnitudeDb,
} from "../builtin-functions";
import type { CelEvaluator } from "./cel-evaluator";
import type { ParamValue } from "./types";

/**
 * Validate that a function argument is a finite number.
 * Throws if the value is NaN, Infinity, or not a number.
 */
export function requireNumericArg(fnName: string, index: number, value: ParamValue): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fnName} expected finite numeric argument at index ${index}`);
  }
  return value;
}

/**
 * Register standard numeric builtin functions with a CEL evaluator.
 * Registers: dbToLinear, dbToLinearKlsyn, min, max, pow
 */
export function registerNumericBuiltins(celEvaluator: CelEvaluator): void {
  celEvaluator.registerFunction("dbToLinear", (...args: ParamValue[]): ParamValue => {
    const db = requireNumericArg("dbToLinear", 0, args[0]);
    return dbToLinear(db);
  });

  celEvaluator.registerFunction("dbToLinearKlsyn", (...args: ParamValue[]): ParamValue => {
    const db = requireNumericArg("dbToLinearKlsyn", 0, args[0]);
    return dbToLinearKlsyn(db);
  });

  celEvaluator.registerFunction("min", (...args: ParamValue[]): ParamValue => {
    const values = args.map((arg, index) => requireNumericArg("min", index, arg));
    return min(...values);
  });

  celEvaluator.registerFunction("max", (...args: ParamValue[]): ParamValue => {
    const values = args.map((arg, index) => requireNumericArg("max", index, arg));
    return max(...values);
  });

  celEvaluator.registerFunction("pow", (...args: ParamValue[]): ParamValue => {
    const x = requireNumericArg("pow", 0, args[0]);
    const y = requireNumericArg("pow", 1, args[1]);
    return pow(x, y);
  });

  celEvaluator.registerFunction("proximity", (...args: ParamValue[]): ParamValue => {
    const delta = requireNumericArg("proximity", 0, args[0]);
    return proximity(delta);
  });

  celEvaluator.registerFunction(
    "resonatorMagnitudeDb",
    (
      evalFreq: ParamValue,
      poleFreq: ParamValue,
      poleBW: ParamValue,
      sr: ParamValue,
    ): ParamValue => {
      return resonatorMagnitudeDb(
        requireNumericArg("resonatorMagnitudeDb", 0, evalFreq),
        requireNumericArg("resonatorMagnitudeDb", 1, poleFreq),
        requireNumericArg("resonatorMagnitudeDb", 2, poleBW),
        requireNumericArg("resonatorMagnitudeDb", 3, sr),
      );
    },
  );

  celEvaluator.registerFunction("sqrt", (...args: ParamValue[]): ParamValue => {
    const x = requireNumericArg("sqrt", 0, args[0]);
    return builtinSqrt(x);
  });

  celEvaluator.registerFunction("exp", (...args: ParamValue[]): ParamValue => {
    const x = requireNumericArg("exp", 0, args[0]);
    return builtinExp(x);
  });

  celEvaluator.registerFunction("abs", (...args: ParamValue[]): ParamValue => {
    const x = requireNumericArg("abs", 0, args[0]);
    return builtinAbs(x);
  });

  celEvaluator.registerFunction("log", (...args: ParamValue[]): ParamValue => {
    const x = requireNumericArg("log", 0, args[0]);
    return builtinLog(x);
  });
}
