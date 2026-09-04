/**
 * Shared CEL evaluator factory.
 *
 * Single source of truth for creating a fully-configured CEL + topological
 * evaluator pair. Both klatt-interpreter.ts (frame-time evaluation) and
 * klatt-runtime.ts (init-time evaluation) use this factory to ensure
 * identical builtin registration — preventing silent semantic divergence
 * if a builtin is added to one path but not the other.
 */

import { type CelEvaluator, createCelEvaluator } from "./cel-evaluator";
import { registerNumericBuiltins } from "./register-builtins";
import { createTopologicalEvaluator, type TopologicalEvaluator } from "./topological-evaluator";

export interface ConfiguredEvaluator {
  celEvaluator: CelEvaluator;
  topoEvaluator: TopologicalEvaluator;
}

/**
 * Create a CEL evaluator with all standard numeric builtins registered,
 * and a topological evaluator wired to it.
 *
 * Each call returns fresh, independent instances.
 */
export function createConfiguredEvaluator(): ConfiguredEvaluator {
  const celEvaluator = createCelEvaluator();
  registerNumericBuiltins(celEvaluator);
  const topoEvaluator = createTopologicalEvaluator(celEvaluator);
  return { celEvaluator, topoEvaluator };
}
