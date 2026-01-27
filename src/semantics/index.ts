/**
 * Qlatt Semantics Module
 *
 * Provides CEL expression evaluation, JMESPath resolution,
 * and topological ordering for Klatt parameter realization.
 */

export * from './types.js';
// Re-exports will be added as modules are implemented
// export { createCelEvaluator } from './cel-evaluator.js';
// export { createJmespathResolver } from './jmespath-resolver.js';
// export { createTopologicalEvaluator } from './topological-evaluator.js';

export const VERSION = '0.1.0';
