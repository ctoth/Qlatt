/**
 * Topological evaluator for dependency-ordered evaluation
 * Uses toposort package for dependency ordering.
 */

import toposort from 'toposort';
import type { SemanticsDocument, EvaluationResult, RealizationRule, ParamValue, EvaluationContext } from './types';
import type { CelEvaluator } from './cel-evaluator';

export interface TopologicalEvaluator {
  evaluate(semantics: SemanticsDocument, context: EvaluationContext): EvaluationResult;
  getEvaluationOrder(semantics: SemanticsDocument): string[];
}

/**
 * Build dependency edges for toposort
 * Returns [dependency, dependent] pairs
 */
function buildEdges(realize: Record<string, RealizationRule | string>): [string, string][] {
  const edges: [string, string][] = [];

  for (const [name, rule] of Object.entries(realize)) {
    const ruleObj = typeof rule === 'string' ? { expr: rule } : rule;
    const deps = ruleObj.deps || [];

    for (const dep of deps) {
      // Edge format: [dependency, dependent] - dep must come before name
      edges.push([dep, name]);
    }
  }

  return edges;
}

/**
 * Get all nodes (rule names) that need to be in the evaluation order
 */
function getAllNodes(realize: Record<string, RealizationRule | string>): string[] {
  return Object.keys(realize);
}

function buildEvaluationOrder(realize: Record<string, RealizationRule | string>): string[] {
  const edges = buildEdges(realize);
  const allNodes = getAllNodes(realize);

  let sorted: string[];
  try {
    sorted = toposort(edges);
  } catch (error: unknown) {
    throw new Error(`cycle: ${error instanceof Error ? error.message : String(error)}`);
  }

  const sortedSet = new Set(sorted);
  for (const node of allNodes) {
    if (!sortedSet.has(node)) sorted.unshift(node);
  }
  return sorted.filter((node) => allNodes.includes(node));
}

export function createTopologicalEvaluator(celEvaluator: CelEvaluator): TopologicalEvaluator {
  // A semantics realization document is compiled before interpreter creation
  // and then treated as immutable. Cache its dependency order so per-frame
  // evaluation only executes CEL rules.
  const orderCache = new WeakMap<
    Record<string, RealizationRule | string>,
    readonly string[]
  >();

  function getCompiledOrder(
    realize: Record<string, RealizationRule | string>,
  ): readonly string[] {
    const cached = orderCache.get(realize);
    if (cached !== undefined) return cached;
    const order = buildEvaluationOrder(realize);
    orderCache.set(realize, order);
    return order;
  }

  return {
    evaluate(semantics: SemanticsDocument, context: EvaluationContext): EvaluationResult {
      const seededParams: Record<string, ParamValue> = {};
      if (semantics.params) {
        for (const [name, def] of Object.entries(semantics.params)) {
          if (def.default !== undefined) {
            seededParams[name] = def.default;
          }
        }
      }
      const result: EvaluationResult = {
        values: { ...seededParams, ...context.params } as Record<string, ParamValue>,
        errors: [],
      };

      if (!semantics.realize) {
        return result;
      }

      const realize = semantics.realize;

      // Reuse the dependency order compiled for this realization map.
      let order: readonly string[];
      try {
        order = getCompiledOrder(realize);
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('cycle')) {
          throw new Error(`Dependency cycle detected: ${error.message}`);
        }
        throw error;
      }

      // Evaluate rules in topological order.
      for (const name of order) {
        const rule = realize[name];
        if (!rule) continue;

        const ruleObj = typeof rule === 'string' ? { expr: rule } : rule;

        try {
          const celContext: EvaluationContext = {
            params: result.values,
            constants: context.constants,
          };
          const value = celEvaluator.evaluate(ruleObj.expr, celContext);
          result.values[name] = value as ParamValue;
        } catch (e) {
          result.errors.push({
            name,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      return result;
    },

    getEvaluationOrder(semantics: SemanticsDocument): string[] {
      if (!semantics.realize) {
        return [];
      }

      const realize = semantics.realize;
      return [...getCompiledOrder(realize)];
    },
  };
}
