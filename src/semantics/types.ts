/**
 * Qlatt Semantics Type Definitions
 */

import type { Diagnostics } from "../diagnostics";

/** CEL expression string */
export type CelExpression = string;

/** Parameter value types */
export type ParamValue = number | string | boolean;

/** Plain document data; nested mappings, arrays and null retain their CEL shape. */
export type ConstantValue = ParamValue | null | ConstantValue[] | { [key: string]: ConstantValue };
export type SemanticsConstants = Record<string, ConstantValue>;

/** Context for expression evaluation */
export interface EvaluationContext {
  diagnostics?: Diagnostics;
  params: Record<string, ParamValue>;
  constants: SemanticsConstants;
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

/** Declarative frame-delta policy for PLSTEP telemetry. */
export interface PlstepPolicy {
  /** Frame parameters observed independently for burst telemetry. */
  triggers: string[];
  initialValue: number;
  missingValue: number;
  /** Compare each signed frame delta with constants.plstepThreshold. */
  comparison: "gte" | "gt";
  citations: string[];
}

/** Semantics document structure */
export interface SemanticsDocument {
  name: string;
  /** Optional burst telemetry policy; audio bursts remain graph-owned. */
  plstep?: PlstepPolicy;
  /** Default scheduling mode for all bindings.
   *  'ramp' = linearRampToValueAtTime (Klatt 1980 inter-frame interpolation).
   *  'step' = setValueAtTime (legacy default).
   *  Individual realize rules can override with step: true or ramp: true.
   *  Citation: Klatt 1980 — all parameters linearly interpolated between
   *  update frames at the 5 ms update rate. */
  defaultScheduling?: "step" | "ramp";
  params?: Record<string, ParamDefinition>;
  constants?: SemanticsConstants;
  realize?: Record<string, RealizationRule | CelExpression>;
}

/**
 * One `realize_each` entry: a family of realize rules written once and
 * generated for every value of a single scalar index.
 * See `src/semantics/realize-each.ts`.
 */
export interface RealizeEachEntry {
  /** Placeholder name; `{<index>}` is substituted textually. */
  index: string;
  /** Values the index takes, in generation order. */
  over: Array<number | string>;
  /** Rule-name template → rule template. Every name must contain `{<index>}`. */
  rules: Record<string, RealizationRule | CelExpression>;
}

/**
 * A semantics document as written on disk. `expandRealizeEach` turns it into
 * the `SemanticsDocument` every consumer evaluates; `realize_each` does not
 * exist after loading.
 */
export interface AuthoredSemanticsDocument extends SemanticsDocument {
  realize_each?: RealizeEachEntry[];
}

/** Parameter definition */
export interface ParamDefinition {
  /** Report inputs outside range; realization rules still own the response. */
  diagnoseRange?: boolean;
  type?: "float" | "int" | "bool";
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
