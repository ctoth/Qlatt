/**
 * Qlatt Semantics Type Definitions
 */

/** CEL expression string */
export type CelExpression = string;

/** Parameter value types */
export type ParamValue = number | string | boolean;

/** Context for expression evaluation */
export interface EvaluationContext {
  params: Record<string, ParamValue>;
  constants: Record<string, ParamValue | Record<string, ParamValue>>;
  [key: string]: unknown;
}

/** Realization rule */
export interface RealizationRule {
  expr: CelExpression;
  deps?: string[];
}

/** Semantics document structure */
export interface SemanticsDocument {
  name: string;
  params?: Record<string, ParamDefinition>;
  constants?: Record<string, ParamValue | Record<string, ParamValue>>;
  realize?: Record<string, RealizationRule | CelExpression>;
}

/** Parameter definition */
export interface ParamDefinition {
  type?: 'float' | 'int' | 'bool';
  range?: [number, number];
  default?: ParamValue;
  unit?: string;
}

/** A single rule-evaluation failure (rule name + message) */
export interface EvaluationError {
  name: string;
  error: string;
}

/** Evaluation result */
export interface EvaluationResult {
  values: Record<string, ParamValue>;
  errors: EvaluationError[];
}
