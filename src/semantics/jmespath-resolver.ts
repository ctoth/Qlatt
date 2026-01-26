/**
 * JMESPath resolver for accessing nested data
 * Uses jmespath package for path resolution.
 */

import jmespath from 'jmespath';
import type { JmesPath, EvaluationContext, ParamValue } from './types.js';

export interface JmespathResolver {
  resolve(path: JmesPath, context: EvaluationContext): ParamValue | undefined;
}

export function createJmespathResolver(): JmespathResolver {
  return {
    resolve(path: JmesPath, context: EvaluationContext): ParamValue | undefined {
      try {
        const result = jmespath.search(context, path);
        // Return undefined if path doesn't resolve (null or undefined from jmespath)
        if (result === null || result === undefined) {
          return undefined;
        }
        return result as ParamValue;
      } catch {
        // If jmespath throws (invalid path syntax etc), return undefined
        return undefined;
      }
    }
  };
}
