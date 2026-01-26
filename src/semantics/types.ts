/**
 * Qlatt Semantics Type Definitions
 */

/** CEL expression string */
export type CelExpression = string;

/** JMESPath query string */
export type JmesPath = string;

/** Parameter value types */
export type ParamValue = number | string | boolean;

/** Context for expression evaluation */
export interface EvaluationContext {
  params: Record<string, ParamValue>;
  constants: Record<string, ParamValue | Record<string, ParamValue>>;
  [key: string]: unknown;
}

/** Function definition for CEL */
export interface FunctionDef {
  params: string[];
  expr: CelExpression;
}

/** Realization rule */
export interface RealizationRule {
  expr: CelExpression;
  deps?: string[];
}

/** Semantics document structure */
export interface SemanticsDocument {
  name: string;
  version?: string;
  params?: Record<string, ParamDefinition>;
  constants?: Record<string, ParamValue | Record<string, ParamValue>>;
  functions?: Record<string, FunctionDef>;
  realize?: Record<string, RealizationRule | CelExpression>;
}

/** Parameter definition */
export interface ParamDefinition {
  type?: 'float' | 'int' | 'bool';
  range?: [number, number];
  default?: ParamValue;
  unit?: string;
}

/** Evaluation result */
export interface EvaluationResult {
  values: Record<string, ParamValue>;
  errors: Array<{ name: string; error: string }>;
}
