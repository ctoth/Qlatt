import type { VoiceQualityOverrides } from "./source-contour";

/**
 * Engine operations for the projection rows declared by source-contour YAML.
 *
 * The row order and every guard (numeric-current checks, override-defined checks,
 * value>0 for formant scaling) are preserved exactly so the projected values are
 * byte-identical to the original loop.
 *
 * Citations:
 * - Fant 1997 Table 1 (Rd baseline / voice-quality Rd)
 * - Klatt & Klatt 1990 (spectral tilt offset)
 * - Kent & Vorperian 2018 (formant frequency scaling)
 * - Gobl 2003, Burkhardt 2009 (voice-quality overrides: OQ/TL/AH/flutter/jitter)
 */

export interface SpeakerProjectionBaseline {
  source_mode: number;
  rd: number;
  rd_ref: number;
  spectral_tilt_offset_db: number;
}

/**
 * A single projection row. `op` selects one of the five projection behaviours the
 * original loop performed. `field` names the source operand, `target_param` the
 * frame destination; dual-source operations also declare a `baseline_field`.
 */
export type SpeakerProjectionRow = { target_param: string; order: number } & (
  | { field: keyof SpeakerProjectionBaseline; op: "baseline_const" }
  | {
      field: string;
      op: "override_or_baseline";
      baseline_field: keyof SpeakerProjectionBaseline;
    }
  | { field: string; op: "override_if_set" }
  | {
      field: string;
      op: "override_or_current_plus_baseline";
      baseline_field: keyof SpeakerProjectionBaseline;
    }
  | { field: string; op: "current_plus_override_if_set" }
);

/** Minimal read/write surface over a single Segment's frame targets. */
export interface SpeakerProjectionTarget {
  get(field: string): unknown;
  set(field: string, value: number): void;
}

/**
 * Apply the speaker/source projection table (and formant scaling) to one target.
 * Semantics and ordering match the original imperative loop exactly.
 */
export function projectSpeakerFields(
  projection: readonly SpeakerProjectionRow[],
  target: SpeakerProjectionTarget,
  baseline: SpeakerProjectionBaseline,
  overrides: VoiceQualityOverrides | undefined,
  formantScale: number,
  formantKeys: readonly string[],
): void {
  for (const row of projection) {
    switch (row.op) {
      case "baseline_const":
        target.set(row.target_param, baseline[row.field]);
        break;
      case "override_or_baseline":
        target.set(row.target_param, overrides?.[row.field] ?? baseline[row.baseline_field]);
        break;
      case "override_if_set": {
        const value = overrides?.[row.field];
        if (value !== undefined) target.set(row.target_param, value);
        break;
      }
      case "override_or_current_plus_baseline": {
        const current = target.get(row.target_param);
        if (typeof current === "number") {
          target.set(
            row.target_param,
            overrides?.[row.field] ?? current + baseline[row.baseline_field],
          );
        }
        break;
      }
      case "current_plus_override_if_set": {
        const current = target.get(row.target_param);
        const offset = overrides?.[row.field];
        if (typeof current === "number" && offset !== undefined) {
          target.set(row.target_param, current + offset);
        }
        break;
      }
    }
  }
  // Scale only the formant frequencies declared by the active inventory.
  if (formantScale !== 1) {
    for (const key of formantKeys) {
      const value = target.get(key);
      if (typeof value === "number" && value > 0) target.set(key, value * formantScale);
    }
  }
}
