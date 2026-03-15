/**
 * Topological evaluator for dependency-ordered evaluation
 * Uses toposort package for dependency ordering.
 */

import toposort from 'toposort';
import type { SemanticsDocument, EvaluationResult, RealizationRule, ParamValue, EvaluationContext } from './types';
import type { CelEvaluator } from './cel-evaluator';
import { resonatorMagnitudeDb, dbToLinear } from '../builtin-functions';

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

      // After normal realize rules, compute formant bank amplitudes via PFE (Lin 1995).
      // This replaces the old codegen layer that produced proximity corrections and
      // static ndbScale-based a{N}Linear rules. The PFE approach computes the actual
      // transfer function magnitude of each resonator at every other formant's frequency,
      // yielding dynamic corrections that track formant movement.
      if (semantics.formantBanks) {
        const sr = (result.values.sampleRate as number) ?? 10000;
        for (const [, bank] of Object.entries(semantics.formantBanks)) {
          const formants = bank.formants;
          for (let i = 0; i < formants.length; i++) {
            const f = formants[i];
            if (!f.parallelSource) continue; // No parallel branch for this formant
            const idx = f.index;
            const evalFreq = (result.values[`F${idx}`] as number) ?? f.freqDefault;
            const ampDb = (result.values[`A${idx}`] as number) ?? 0;
            const ndbScaleVal = f.ndbScale ?? 0;
            // Sum correction from all OTHER formants' transfer functions at this frequency
            let correctionDb = 0;
            for (let j = 0; j < formants.length; j++) {
              if (j === i) continue;
              const jIdx = formants[j].index;
              const otherFreq = (result.values[`F${jIdx}`] as number) ?? formants[j].freqDefault;
              const otherBw = (result.values[`B${jIdx}`] as number) ?? formants[j].bwDefault;
              correctionDb += resonatorMagnitudeDb(evalFreq, otherFreq, otherBw, sr);
            }
            const sign = f.sign ?? 1;
            const parallelScale = (result.values.parallelScale as number) ?? 1;
            result.values[`a${idx}Linear`] = sign * dbToLinear(ampDb + correctionDb + ndbScaleVal) * parallelScale;
          }
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
