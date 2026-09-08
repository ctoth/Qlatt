/**
 * Qlatt Semantics Type Definitions
 */

import type { Diagnostics } from "../diagnostics";

/** CEL expression string */
export type CelExpression = string;

/** Parameter value types */
export type ParamValue = number | string | boolean;

/** Context for expression evaluation */
export interface EvaluationContext {
  diagnostics?: Diagnostics;
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
  constants?: Record<string, ParamValue | Record<string, ParamValue>>;
  realize?: Record<string, RealizationRule | CelExpression>;
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
