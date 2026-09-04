import type { VoiceQualityOverrides } from "./source-contour";

/**
 * Declarative speaker/source projection table (phase 4 item 3).
 *
 * The former imperative `speakerStamp` loop in tts-frontend.ts hardcoded, field
 * by field, how resolved source-contour + speaker policy is projected onto every
 * Segment's final frame targets. Those field/op/operand triples are policy data;
 * this module expresses them as a table interpreted by one generic driver,
 * removing the hardcoded field list and the baked-in 1..10 formant count.
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

/** Named formant frequency keys (replaces the baked-in `for (formant=1..10)` loop). */
export const SPEAKER_FORMANT_KEYS = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
] as const;

export interface SpeakerProjectionBaseline {
  source_mode: number;
  rd: number;
  rd_ref: number;
  spectral_tilt_offset_db: number;
}

/**
 * A single projection row. `op` selects one of the five projection behaviours the
 * original loop performed; `field` is the target frame field and the key fields
 * name the operands read from the resolved baseline / voice-quality overrides.
 */
export type SpeakerProjectionRow =
  | { field: string; op: "baseline_const"; baselineKey: keyof SpeakerProjectionBaseline }
  | {
      field: string;
      op: "override_or_baseline";
      overrideKey: keyof VoiceQualityOverrides;
      baselineKey: keyof SpeakerProjectionBaseline;
    }
  | { field: string; op: "override_if_set"; overrideKey: keyof VoiceQualityOverrides }
  | {
      field: string;
      op: "override_or_current_plus_baseline";
      overrideKey: keyof VoiceQualityOverrides;
      baselineKey: keyof SpeakerProjectionBaseline;
    }
  | { field: string; op: "current_plus_override_if_set"; overrideKey: keyof VoiceQualityOverrides };

/** Projection triples, in the exact order the original speakerStamp loop applied them. */
export const SPEAKER_PROJECTION_TABLE: readonly SpeakerProjectionRow[] = [
  { field: "sourceMode", op: "baseline_const", baselineKey: "source_mode" },
  { field: "Rd", op: "override_or_baseline", overrideKey: "rd", baselineKey: "rd" },
  { field: "RdRef", op: "baseline_const", baselineKey: "rd_ref" },
  { field: "OQ", op: "override_if_set", overrideKey: "oq" },
  {
    field: "TL",
    op: "override_or_current_plus_baseline",
    overrideKey: "tl",
    baselineKey: "spectral_tilt_offset_db",
  },
  { field: "AH", op: "current_plus_override_if_set", overrideKey: "ah_offset_db" },
  { field: "flutter", op: "override_if_set", overrideKey: "flutter" },
  { field: "jitter", op: "override_if_set", overrideKey: "jitter" },
];

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
  target: SpeakerProjectionTarget,
  baseline: SpeakerProjectionBaseline,
  overrides: VoiceQualityOverrides | undefined,
  formantScale: number,
): void {
  for (const row of SPEAKER_PROJECTION_TABLE) {
    switch (row.op) {
      case "baseline_const":
        target.set(row.field, baseline[row.baselineKey]);
        break;
      case "override_or_baseline":
        target.set(row.field, overrides?.[row.overrideKey] ?? baseline[row.baselineKey]);
        break;
      case "override_if_set": {
        const value = overrides?.[row.overrideKey];
        if (value !== undefined) target.set(row.field, value);
        break;
      }
      case "override_or_current_plus_baseline": {
        const current = target.get(row.field);
        if (typeof current === "number") {
          target.set(
            row.field,
            overrides?.[row.overrideKey] ?? current + baseline[row.baselineKey],
          );
        }
        break;
      }
      case "current_plus_override_if_set": {
        const current = target.get(row.field);
        const offset = overrides?.[row.overrideKey];
        if (typeof current === "number" && offset !== undefined) {
          target.set(row.field, current + offset);
        }
        break;
      }
    }
  }
  // Formant frequency scaling: declared key list replaces the baked-in 1..10 loop.
  if (formantScale !== 1) {
    for (const key of SPEAKER_FORMANT_KEYS) {
      const value = target.get(key);
      if (typeof value === "number" && value > 0) target.set(key, value * formantScale);
    }
  }
}
