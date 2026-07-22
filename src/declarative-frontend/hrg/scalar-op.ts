/**
 * Shared scalar-effect algebra for the declarative frontend.
 *
 * The rule engine (`applyEffects`) and the lowering control-window resolver
 * (`resolveControlField`) both dispatch the same four binary operators over
 * numbers. This module owns that dispatch so the two spellings cannot drift.
 *
 * Only the pure arithmetic lives here: each caller keeps its own operand
 * coercion and defaulting (they differ by domain — e.g. the engine defaults a
 * missing `mul` operand differently than the control resolver), and the Klatt
 * duration-floor `mul` variant and `unset`/`set` remain caller-side. This keeps
 * behavior byte-identical while removing the duplicated operator switch.
 */
export type ScalarOp = "add" | "mul" | "max" | "min";

/** Apply one scalar operator to two already-coerced numbers. */
export function applyScalarOp(op: ScalarOp, base: number, operand: number): number {
  switch (op) {
    case "add":
      return base + operand;
    case "mul":
      return base * operand;
    case "max":
      return Math.max(base, operand);
    case "min":
      return Math.min(base, operand);
  }
}
