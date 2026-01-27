/**
 * Topological evaluator for dependency-ordered evaluation
 * Uses toposort package for dependency ordering.
 */

import toposort from 'toposort';
import type { SemanticsDocument, EvaluationResult, RealizationRule, ParamValue, EvaluationContext } from './types.js';
import type { CelEvaluator } from './cel-evaluator.js';

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

export function createTopologicalEvaluator(celEvaluator: CelEvaluator): TopologicalEvaluator {
  return {
    evaluate(semantics: SemanticsDocument, context: EvaluationContext): EvaluationResult {
      const result: EvaluationResult = {
        values: { ...context.params } as Record<string, ParamValue>,
        errors: [],
      };

      if (!semantics.realize) {
        return result;
      }

      // Get evaluation order (may throw on cycle)
      let order: string[];
      try {
        order = this.getEvaluationOrder(semantics);
      } catch (e) {
        // Re-throw cycle detection errors
        if (e instanceof Error && e.message.includes('cycle')) {
          throw new Error(`Dependency cycle detected: ${e.message}`);
        }
        throw e;
      }

      // Evaluate rules in topological order
      for (const name of order) {
        const rule = semantics.realize[name];
        if (!rule) continue;

        const ruleObj = typeof rule === 'string' ? { expr: rule } : rule;

        try {
          // Build evaluation context for CEL using caller-provided constants
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

      const edges = buildEdges(semantics.realize);
      const allNodes = getAllNodes(semantics.realize);

      // toposort returns nodes in dependency order
      // We need to handle nodes with no edges (they won't appear in toposort result)
      let sorted: string[];
      try {
        sorted = toposort(edges);
      } catch (e) {
        // toposort throws on cycles - add "cycle" to error message
        throw new Error(`cycle: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Add any nodes that weren't in edges (no dependencies)
      const sortedSet = new Set(sorted);
      for (const node of allNodes) {
        if (!sortedSet.has(node)) {
          // Nodes with no dependencies can go first
          sorted.unshift(node);
        }
      }

      // Filter to only nodes that are actual rules
      return sorted.filter(node => allNodes.includes(node));
    },
  };
}
