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
  /** When true, use linearRampToValueAtTime instead of the document default. */
  ramp?: boolean;
  /** When true, force setValueAtTime regardless of document default.
   *  Use for binary switches (cascade/parallel, source mode) where
   *  intermediate values are acoustically invalid.
   *  Klatt 1980: mode switches are instantaneous. */
  step?: boolean;
}

/** Formant spec — mirrors FormantSpec from formant-bank.ts for evaluator use */
export interface FormantBankFormantSpec {
  index: number;
  freqDefault: number;
  bwDefault: number;
  ndbScale?: number;
  sign?: 1 | -1;
  parallelSource?: string;
}

/** Formant bank spec — stored on SemanticsDocument for evaluator-native PFE computation */
export interface FormantBankEvalSpec {
  formants: FormantBankFormantSpec[];
}

/** Semantics document structure */
export interface SemanticsDocument {
  name: string;
  /** Default scheduling mode for all bindings.
   *  'ramp' = linearRampToValueAtTime (Klatt 1980 inter-frame interpolation).
   *  'step' = setValueAtTime (legacy default).
   *  Individual realize rules can override with step: true or ramp: true.
   *  Citation: Klatt 1980 — all parameters linearly interpolated between
   *  update frames at the 5 ms update rate. */
  defaultScheduling?: 'step' | 'ramp';
  params?: Record<string, ParamDefinition>;
  constants?: Record<string, ParamValue | Record<string, ParamValue>>;
  realize?: Record<string, RealizationRule | CelExpression>;
  /** Formant bank specs for evaluator-native PFE amplitude computation (Lin 1995) */
  formantBanks?: Record<string, FormantBankEvalSpec>;
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
