/**
 * Track Assembler -- converts a finalized phone sequence + F0 contour
 * into a KlattFrame[] (the "track") suitable for the interpreter.
 *
 * Pure function: data in, frames out.  No side effects, no global state.
 *
 * Extracted from tts-frontend.ts (Phase 5 refactor).
 */
import {
  fillDefaultParams,
} from "./declarative-frontend/inventory";
import { getF0FilterExports, RENDER_OK } from "./f0-filters-loader";
import type {
  InventorySpec,
} from "./declarative-frontend/inventory";
import type { Diagnostics } from "./diagnostics";
import type {
  KlattFrame,
  ControlFieldOp,
  ControlFieldSpec,
  ControlScoreF0LayerCommand,
  ControlScoreGlobalOverlay,
  ControlScoreSegment,
  ControlScoreTimedControl,
  ControlScoreTiming,
  DeclarativeControlScore,
} from "./tts-frontend-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KlattParams = Record<string, number>;
type ResolvedControlField = {
  op: ControlFieldOp;
  value?: number;
};
type ResolvedControlWindow = {
  startSec: number;
  endSec: number;
  fields: Record<string, ResolvedControlField>;
  tag?: string;
};

// Removed: PHONEME_TARGET_MAP global — callers must provide inventorySpec via options.

/** An F0 contour point (time in seconds, f0 in Hz).
 *  Optional tag/accentType metadata for provenance. */
export type F0Point = {
  time: number;
  f0: number;
  /** Source rule tag, e.g. "f0_h_star", "f0_l_star", "f0_boundary_low". */
  tag?: string;
  /** ToBI accent type derived from tag, e.g. "H*", "L*". */
  accentType?: string;
};

type CitedNumberSpec = {
  value: number;
  citations?: string[];
};

/** One formant's locus entry: target locus + percent kept toward vowel + span. */
type LocusEntry = {
  locus_hz: number;
  prcnt: number;
  durtran_ms: number;
};

/** Per-formant locus entries for one (obstruent, vowel-category) pairing. */
type LocusFormantBlock = Record<string, LocusEntry>;

/** loci[obstruentPhoneme][sontyx "1"|"2"|"3"][formant] -> LocusEntry. */
type LocusTable = Record<string, Record<string, LocusFormantBlock>>;

/** vowel_category[sonorantPhoneme] -> per-edge sontyx (1|2|3). */
type VowelCategoryTable = Record<string, { forward?: number; backward?: number }>;

export type TrackLoweringSpec = {
  id: string;
  timeline: {
    initial_silence_ms: CitedNumberSpec;
    final_silence_ms: CitedNumberSpec;
    duration_floors: {
      stop_release_ms: CitedNumberSpec;
      default_ms: CitedNumberSpec;
    };
    event_points: {
      include_segment_start: boolean;
      include_control_boundaries: boolean;
      include_f0_anchors: boolean;
      include_transition_steady_time: boolean;
    };
  };
  transitions: {
    default_transition_ms: CitedNumberSpec;
    blend: {
      factor: CitedNumberSpec;
      keys: string[];
      smooth_types: string[];
      /**
       * Optional: when true, the 50% midpoint blend becomes the UNIVERSAL
       * fallback — every segment boundary that the more-specific rules
       * (sonorant<->sonorant midpoint, obstruent locus) leave untransitioned
       * gets a midpoint formant/bandwidth ramp anyway. This matches DECtalk,
       * which smooths every parameter at every boundary (p_us_st1.c forw/back
       * smooth rules), instead of only sonorant pairs + obstruents with locus
       * data. Only the blend `keys` (F1-F3/B1-B3) are smoothed; amplitudes
       * (AV/AF/AH) and burst events ride control windows and are untouched, so
       * stop-burst crispness is preserved. A frontend that omits this (or sets
       * false) keeps the legacy coverage exactly. Citation: DECtalk 4.63
       * p_us_st1.c us_forw_smooth_rules / us_back_smooth_rules (default 50%
       * midpoint at every boundary; ph_setar.c:784-785,903-904).
       */
      smooth_all_boundaries?: boolean;
    };
    /**
     * Optional obstruent->sonorant formant LOCUS data (DECtalk-style). When
     * present, a vowel adjacent to an obstruent ramps F1-F3 toward the
     * consonant's locus at that edge (forward = vowel-after-obstruent start,
     * backward = vowel-before-obstruent end). DATA only: per obstruent phoneme
     * -> per vowel-category sontyx ("1"|"2"|"3") -> per formant (F1/F2/F3) ->
     * {locus_hz, prcnt, durtran_ms}. A frontend that omits this keeps the
     * legacy midpoint-only smoothing (no obstruent transitions). The engine is
     * generic — zero per-phoneme literals; everything obstruent-specific is here.
     * Citation: DECtalk 4.63 ph_sttr2.c setloc; p_us_rom.h us_maleloc.
     */
    loci?: LocusTable;
    /**
     * Optional FEMALE locus table (DECtalk us_femloc). Same shape and same
     * vowel_category classification as `loci` (the male/us_maleloc table); only
     * the absolute locus Hz differ. Selected per the chosen voice's `sex` field
     * (context.voiceSex === "female") — generic, no per-voice-name branches. A
     * frontend without this, or a male/unspecified voice, uses `loci`. The
     * female loci are ABSOLUTE female-appropriate Hz and are used directly (the
     * vowel target curval is already formant-scaled), matching DECtalk where
     * us_femloc is the absolute female table — no double formant scaling.
     * Citation: DECtalk 4.63 ph_sttr2.c:159-169 (setloc malfem); p_us_rom.h:5366.
     */
    loci_female?: LocusTable;
    /**
     * Optional sonorant vowel-category (sontyx) per phoneme per edge, used to
     * select which `loci` sontyx block applies. forward edge uses begtyp,
     * backward uses endtyp (clamped 1/2/3). A sonorant with no entry falls back
     * to the legacy midpoint blend at that edge.
     */
    vowel_category?: VowelCategoryTable;
    /**
     * Optional per-phoneme place flag for the setloc prcnt adjustment (a): a
     * rounded sonorant consonant adjacent to a NON-palatal/NON-dental obstruent
     * has its F2/F3 locus transition extent reduced. DATA only — `palatal_or_dental`
     * is `us_place[phoneme] & (FPALATL|FDENTAL)`. Used by the locus resolver to
     * decide whether the obstruent qualifies; a phoneme with no entry is treated
     * as not palatal/dental. Citation: DECtalk 4.63 ph_sttr2.c:294-298;
     * p_us_rom.h us_place[]; ph_defs.h:340-341 (FDENTAL/FPALATL bits).
     */
    obstruent_place?: Record<string, { palatal_or_dental?: boolean }>;
    /**
     * Optional list of sonorant phonemes whose `begtyp`/`endtyp` is
     * ROUNDED_SONOR_CONS (DECtalk value 5: e.g. /w/, /l/, /r/, /el/). The setloc
     * prcnt adjustment (a) only fires when the sonorant side is one of these.
     * DATA only. Citation: DECtalk 4.63 ph_sttr2.c:294 (typso==ROUNDED_SONOR_CONS);
     * ph_defs.h:176; p_us_rom.h us_begtyp[].
     */
    rounded_sonorant_consonant?: string[];
    /**
     * Optional per-vowel F2-back-cavity-affiliation flags for the setloc prcnt
     * adjustment (b): an F2 transition into a back-cavity-affiliated vowel (e.g.
     * [iy]) has reduced extent and shortened duration. forward = `us_place &
     * F2BACKI`, backward = `& F2BACKF`. DATA only. Citation: DECtalk 4.63
     * ph_sttr2.c:303-307; p_us_rom.h us_place[]; ph_defs.h:345-346.
     */
    f2_back?: Record<string, { forward?: boolean; backward?: boolean }>;
  };
  f0: {
    renderer: {
      type: "point_interpolation" | "layered_additive";
      layered_model_ref?: string;
    };
    output_clamp: {
      min_hz: CitedNumberSpec;
      max_hz: CitedNumberSpec;
    };
  };
  overlays: {
    operation_order: string[];
  };
};

export type TrackLoweringContext = {
  inventorySpec: InventorySpec;
  baseF0: number;
  /** Runtime-scaled transition duration. Policy lives in TrackLoweringSpec. */
  transitionMs?: number;
  f0Model?: LayeredF0ModelConfig;
  speakerParams?: Record<string, unknown>;
  /**
   * Selected voice's biological-sex data field (from the voice YAML `sex:`).
   * When "female" and the lowering spec declares `transitions.loci_female`, the
   * female locus table is used for obstruent formant transitions; otherwise the
   * male `loci` table (or none) is used. Generic — the engine branches only on
   * this data string, never on a voice name.
   */
  voiceSex?: string;
  diagnostics?: Diagnostics | null;
};

function requireOutputObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`E_OUTPUT_CONFIG_REQUIRED: output.${path} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireOutputNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`E_OUTPUT_CONFIG_REQUIRED: output.${path} must be a finite number`);
  }
  return value;
}

function requireCitedNumber(value: CitedNumberSpec | undefined, path: string): number {
  if (!value || typeof value !== "object" || typeof value.value !== "number" || !Number.isFinite(value.value)) {
    throw new Error(`E_TRACK_LOWERING_SPEC_REQUIRED: ${path}.value must be a finite number`);
  }
  return value.value;
}

function requireOutputStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`E_OUTPUT_CONFIG_REQUIRED: output.${path} must be a non-empty string array`);
  }
  return value;
}

function requireOptionNumber(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`E_ASSEMBLE_OPTION_REQUIRED: ${name} must be a finite number`);
  }
  return value;
}

function requireModelNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`E_F0_MODEL_REQUIRED: ${path} must be a finite number`);
  }
  return value;
}

function requirePositiveModelNumber(value: unknown, path: string): number {
  const number = requireModelNumber(value, path);
  if (number <= 0) {
    throw new Error(`E_F0_MODEL_REQUIRED: ${path} must be greater than zero`);
  }
  return number;
}

function resolveRequiredSpeakerNumber(
  speakerParams: Record<string, unknown> | undefined,
  paramPath: string,
): number {
  if (!speakerParams) {
    throw new Error(`E_F0_MODEL_REQUIRED: speaker parameter ${paramPath} is required`);
  }
  let value: unknown = speakerParams;
  for (const key of paramPath.split(".")) {
    value = (value as Record<string, unknown>)?.[key];
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`E_F0_MODEL_REQUIRED: speaker parameter ${paramPath} must be a finite number`);
  }
  return value;
}

/** Voice quality parameter overrides injected into every frame.
 *  Resolved from voice_quality_presets in the selected frontend spec.
 *  Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009 */
export type VoiceQualityOverrides = {
  /** Rd value for LF glottal source. Citation: Fant 1997 Table 1 */
  rd: number;
  /** Open quotient override (0 = derive from Rd). Citation: Klatt & Klatt 1990 */
  oq: number;
  /** Additive spectral tilt contribution in dB at 3 kHz. Citation: Klatt & Klatt 1990 */
  tl: number;
  /** Additive AH offset in dB. Citation: Gobl 2003, Klatt & Klatt 1990 */
  ah_offset_db: number;
  /** Flutter amount (0-100). Citation: Klatt & Klatt 1990 Eq. 1 */
  flutter: number;
  /** Jitter amount (0-100). Citation: Burkhardt 2009 */
  jitter: number;
};


function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "bigint") {
    const numericValue = Number(value);
    return Number.isSafeInteger(numericValue) ? numericValue : null;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coerceKlattParams(params: Record<string, unknown>): KlattParams {
  const coerced: KlattParams = {};
  for (const [key, value] of Object.entries(params)) {
    const numericValue = toFiniteNumber(value);
    if (numericValue != null) {
      coerced[key] = numericValue;
    }
  }
  return coerced;
}

function resolveFieldValue(
  baseValue: number | undefined,
  field: ResolvedControlField
): number | undefined {
  switch (field.op) {
    case "unset":
      return undefined;
    case "set":
      return field.value;
    case "add":
      return (baseValue ?? 0) + (field.value ?? 0);
    case "mul":
      return (baseValue ?? 0) * (field.value ?? 1);
    case "max":
      return Math.max(baseValue ?? Number.NEGATIVE_INFINITY, field.value ?? Number.NEGATIVE_INFINITY);
    case "min":
      return Math.min(baseValue ?? Number.POSITIVE_INFINITY, field.value ?? Number.POSITIVE_INFINITY);
    default:
      return baseValue;
  }
}

function applyControlField(
  params: KlattParams,
  fieldName: string,
  field: ResolvedControlField
): void {
  const nextValue = resolveFieldValue(params[fieldName], field);
  if (nextValue == null || !Number.isFinite(nextValue)) {
    delete params[fieldName];
    return;
  }
  params[fieldName] = nextValue;
}

function applyControlFields(
  params: KlattParams,
  fields: Record<string, ResolvedControlField>
): void {
  for (const [fieldName, field] of Object.entries(fields)) {
    applyControlField(params, fieldName, field);
  }
}

function segmentCanVoice(baseParams: KlattParams, windows: ResolvedControlWindow[]): boolean {
  if ((baseParams.AV ?? 0) > 0 || (baseParams.AVS ?? 0) > 0) return true;
  for (const window of windows) {
    const av = window.fields.AV ? resolveFieldValue(baseParams.AV, window.fields.AV) : baseParams.AV;
    if ((av ?? 0) > 0) return true;
    const avs = window.fields.AVS
      ? resolveFieldValue(baseParams.AVS, window.fields.AVS)
      : baseParams.AVS;
    if ((avs ?? 0) > 0) return true;
  }
  return false;
}

function buildSegmentEventTimes(
  segmentStart: number,
  segmentEnd: number,
  steadyTime: number | null,
  interiorF0Anchors: number[],
  controlWindows: ResolvedControlWindow[],
  eventPolicy: TrackLoweringSpec["timeline"]["event_points"],
  includeSegmentEnd = false,
  forwardSteadyTime: number | null = null,
  additionalTransitionSteadyTimes: readonly number[] = [],
): number[] {
  const epsilon = 1e-6;
  const times = eventPolicy.include_segment_start ? [segmentStart] : [];

  if (eventPolicy.include_f0_anchors) {
    for (const anchorTime of interiorF0Anchors) {
      if (anchorTime > segmentStart + epsilon && anchorTime < segmentEnd - epsilon) {
        times.push(anchorTime);
      }
    }
  }

  if (
    eventPolicy.include_transition_steady_time &&
    steadyTime != null &&
    steadyTime > segmentStart + epsilon &&
    steadyTime < segmentEnd - epsilon
  ) {
    times.push(steadyTime);
  }

  // Forward (segment-start) locus transition: the inner edge of the start
  // window needs an event point so the interpreter ramps from the boundary
  // value (held at the start) up to the steady target at this time. Gated by
  // the same event-point policy as the backward steady time.
  if (
    eventPolicy.include_transition_steady_time &&
    forwardSteadyTime != null &&
    forwardSteadyTime > segmentStart + epsilon &&
    forwardSteadyTime < segmentEnd - epsilon
  ) {
    times.push(forwardSteadyTime);
  }

  if (eventPolicy.include_transition_steady_time) {
    for (const transitionTime of additionalTransitionSteadyTimes) {
      if (transitionTime > segmentStart + epsilon && transitionTime < segmentEnd - epsilon) {
        times.push(transitionTime);
      }
    }
  }

  if (eventPolicy.include_control_boundaries) {
    for (const window of controlWindows) {
      const startTime = segmentStart + window.startSec;
      const endTime = segmentStart + window.endSec;
      if (startTime > segmentStart + epsilon && startTime < segmentEnd - epsilon) {
        times.push(startTime);
      }
      if (endTime > segmentStart + epsilon && endTime < segmentEnd - epsilon) {
        times.push(endTime);
      }
    }
  }

  if (includeSegmentEnd) {
    times.push(segmentEnd);
  }

  times.sort((left, right) => left - right);

  const deduped: number[] = [];
  for (const time of times) {
    const last = deduped[deduped.length - 1];
    if (last == null || Math.abs(last - time) > epsilon) {
      deduped.push(time);
    }
  }

  return deduped;
}

/**
 * Per-segment boundary smoothing for the formant transition windows.
 * - `backwardParams`/`backwardSteadyTime`: the END-edge boundary value held from
 *   `backwardSteadyTime` to the segment end (events at/after it use these).
 *   This is the legacy single transition window (midpoint or, when an obstruent
 *   follows and locus data exists, the locus boundary value).
 * - `forwardParams`/`forwardSteadyTime`: the optional START-edge boundary value
 *   held from the segment start until `forwardSteadyTime` (events at/before it
 *   use these), ramping toward steady. Used for a vowel preceded by an obstruent
 *   (DECtalk forward smoothing). `null` when no forward locus applies.
 */
type SegmentBoundarySmoothing = {
  backwardParams: KlattParams | null;
  backwardSteadyTime: number | null;
  backwardSteadyTimesByKey: Record<string, number> | null;
  forwardParams: KlattParams | null;
  forwardSteadyTime: number | null;
  forwardSteadyTimesByKey: Record<string, number> | null;
};

function applyControlWindowsAtOffset(
  baseParams: KlattParams,
  smoothing: SegmentBoundarySmoothing,
  segmentStart: number,
  segmentEnd: number,
  eventTime: number,
  controlWindows: ResolvedControlWindow[]
): KlattParams {
  const epsilon = 1e-6;
  const segmentOffset = Math.max(0, eventTime - segmentStart);

  const resolved: KlattParams = { ...baseParams };

  if (smoothing.forwardParams != null) {
    for (const [key, value] of Object.entries(smoothing.forwardParams)) {
      const steadyTime = smoothing.forwardSteadyTimesByKey?.[key] ?? smoothing.forwardSteadyTime;
      if (steadyTime != null && eventTime <= steadyTime + epsilon) {
        // Iteration 001 is converging F2 only: apply DECtalk setloc's linear
        // durtran ramp to F2 locus windows while leaving other families stable.
        const useF2LocusRamp = key === "F2" && smoothing.forwardSteadyTimesByKey?.[key] != null;
        const steadyValue = baseParams[key];
        const duration = steadyTime - segmentStart;
        if (useF2LocusRamp && Number.isFinite(steadyValue) && duration > epsilon) {
          const fraction = Math.max(0, Math.min(1, (eventTime - segmentStart) / duration));
          resolved[key] = value + (steadyValue - value) * fraction;
        } else {
          resolved[key] = value;
        }
      }
    }
  }

  if (smoothing.backwardParams != null) {
    for (const [key, value] of Object.entries(smoothing.backwardParams)) {
      const steadyTime = smoothing.backwardSteadyTimesByKey?.[key] ?? smoothing.backwardSteadyTime;
      if (steadyTime != null && eventTime >= steadyTime - epsilon) {
        // Iteration 001 is converging F2 only: apply DECtalk setloc's linear
        // durtran ramp to F2 locus windows while leaving other families stable.
        const useF2LocusRamp = key === "F2" && smoothing.backwardSteadyTimesByKey?.[key] != null;
        const steadyValue = baseParams[key];
        const duration = segmentEnd - steadyTime;
        if (useF2LocusRamp && Number.isFinite(steadyValue) && duration > epsilon) {
          const fraction = Math.max(0, Math.min(1, (eventTime - steadyTime) / duration));
          resolved[key] = steadyValue + (value - steadyValue) * fraction;
        } else {
          resolved[key] = value;
        }
      }
    }
  }

  for (const window of controlWindows) {
    if (segmentOffset + epsilon < window.startSec) continue;
    if (segmentOffset >= window.endSec - epsilon) continue;
    applyControlFields(resolved, window.fields);
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// Layered Additive F0 Model
// ---------------------------------------------------------------------------
//
// A generic additive F0 rendering mode where named layers with different
// semantics (profile, persistent step, decaying impulse) are summed and
// filtered.  DECtalk's hat-pattern model is the first consumer, but the
// design supports Fujisaki command-response models or any additive F0
// decomposition.
//
// Citations:
//   Fujisaki, H. "Information, Prosody, and Modeling" -- command-response model
//   Klatt, D. (1982) "The KLATTalk text-to-speech conversion system" -- hat-pattern
//   Rabiner, L. (1968) "Speech Synthesis by Rule" -- three-component F0 model
// ---------------------------------------------------------------------------

/** Layer type semantics.
 *  - `profile`: piecewise-linear shape mapped across phrase duration
 *  - `persistent`: STEP semantics -- value persists until next command or reset
 *  - `impulse`: decaying transient pulse
 *  - `glide`: linear ramp of `value` toward the accumulated target over
 *    `durationFrames` frames, then HOLD (a ramped persistent -- a STEP that
 *    takes a span of frames to arrive instead of jumping). Mirrors DECtalk's
 *    GLIDE command (Ph_drwt02.c:1891-1892, :2161-2184). A non-positive
 *    `durationFrames` degenerates to an instantaneous STEP. */
export type LayerType = "profile" | "persistent" | "impulse" | "glide";

/** Decay mode for impulse layers. */
export type DecayMode = "halving" | "linear" | "exponential";

/** Configuration for a single F0 layer, from the frontend YAML. */
export type LayerConfig = {
  type: LayerType;
  decay?: DecayMode;
  /** For impulse layers: divisor for initial decay step.
   *  `decay = value / initial_decay_divisor`.
   *  Default 4 — matches DECtalk 4.63 ph_drwt02.c stress impulse rate.
   *  Citation: DECtalk 4.63 Ph_drwt02.c (stress decay rate). */
  initial_decay_divisor?: number;
  /** For impulse layers: |value| below which the impulse is removed.
   *  Default 0.01.  Engineering threshold to avoid carrying dead impulses. */
  termination_threshold?: number;
  /** For impulse layers with `decay: exponential`: per-frame multiplier.
   *  Default 0.9 (≈ 10 frame half-life at the configured frame cadence). */
  exponential_factor?: number;
};

/** Low-pass filter configuration. */
export type FilterConfig = {
  type: "lowpass_2pole";
  cutoff_param?: string;
  default_cutoff?: number;
} | {
  type: "lowpass_1pole";
  alpha_param?: string;
  default_alpha?: number;
} | {
  type: "lowpass_2pole_coefficient";
  alpha_param?: string;
  default_alpha?: number;
};

/** Speaker scaling configuration. */
export type SpeakerScaleConfig = {
  minimum_param?: string;
  range_param?: string;
  reference?: number;
  /** DECtalk frac4mul divisor: `(filtered - reference) * range / divisor`.
   *  Default 4096 (12-bit right shift in DECtalk integer arithmetic).
   *  Citation: DECtalk 4.63 Ph_drwt02.c frac4mul(x,y) = (x*y) >> 12. */
  divisor?: number;
  /** Final unit-conversion multiplier on the scaled output.
   *  Default 0.1 (Hz*10 → Hz, matches DECtalk internal Hz*10 representation).
   *  Citation: DECtalk 4.63 Ph_drwt02.c (f0 stored as Hz*10 internally). */
  output_scale?: number;
};

/** Top-level layered additive F0 model config from frontend YAML.
 *  Citations:
 *    Fujisaki, H. "Information, Prosody, and Modeling" -- command-response additive F0
 *    Klatt, D. (1982) "KLATTalk" -- hat-pattern F0 algorithm
 *    Rabiner, L. (1968) "Speech Synthesis by Rule" -- three-component F0 */
export type LayeredF0ModelConfig = {
  type: "layered_additive";
  citations?: string[];
  /** Internal control-frame cadence in seconds.
   *  When omitted, the generic renderer uses the historical 5 ms default.
   *  Citation: DECtalk 4.63 ph_claus.c (6.4 ms frame cadence) */
  frame_period_sec?: number;
  filter?: FilterConfig;
  layers: Record<string, LayerConfig>;
  combine?: "sum";
  speaker_scale?: SpeakerScaleConfig;
  /** Final clamp applied to the rendered F0 in Hz.
   *  Defaults: min_hz=50, max_hz=500 — covers the typical adult speaker range
   *  from a creaky male floor (~50 Hz, Klatt 1990) to a high-pitched female
   *  ceiling (~500 Hz, Peterson & Barney 1952 corpus extrema). */
  output_clamp?: { min_hz?: number; max_hz?: number };
};

/** A command inserted into an F0 layer by a rule.
 *  Stored as tokens with stream === "f0_layer" in the parameter sequence. */
export type F0LayerCommand = {
  /** Name of the target layer (must match a key in f0_model.layers). */
  layer: string;
  /** Absolute time in seconds when the command takes effect. */
  time: number;
  /** Optional debug-only anchor geometry carried through from declarative rules. */
  anchorLeftMs?: number;
  anchorRightMs?: number;
  ratio?: number;
  /** Value in Hz (or internal F0 units). */
  value: number;
  /** For impulse layers: duration in internal frames. */
  durationFrames?: number;
  /** For profile layers: array of control point values. */
  profilePoints?: number[];
  /** Provenance tag. */
  tag?: string;
};

/** Default minimum F0 output in Hz when `f0_model.output_clamp.min_hz` is unset.
 *  50 Hz is the conventional creaky-voice floor for adult speakers.
 *  Citation: Klatt 1990 §2.1 (voice quality continuum, creak ≥ 50 Hz). */
const LAYERED_F0_MIN_HZ_DEFAULT = 50;
/** Default maximum F0 output in Hz when `f0_model.output_clamp.max_hz` is unset.
 *  500 Hz covers the upper extreme of the Peterson & Barney 1952 corpus. */
const LAYERED_F0_MAX_HZ_DEFAULT = 500;
/** Default DECtalk frac4mul divisor for speaker scaling: `(x*y) >> 12`.
 *  Citation: DECtalk 4.63 Ph_drwt02.c. */
const SPEAKER_SCALE_DIVISOR_DEFAULT = 4096;
/** Default speaker_scale output multiplier (Hz*10 → Hz).
 *  Citation: DECtalk 4.63 Ph_drwt02.c (internal Hz*10 representation). */
const SPEAKER_SCALE_OUTPUT_DEFAULT = 0.1;
/** Default initial-decay divisor for impulse layers: `decay = value / 4`.
 *  Citation: DECtalk 4.63 Ph_drwt02.c (stress impulse decay rate). */
const IMPULSE_INITIAL_DECAY_DIVISOR_DEFAULT = 4;
/** Default impulse termination threshold (impulse removed when |value| drops below).
 *  Engineering estimate: avoids accumulating dead impulses in the active list. */
const IMPULSE_TERMINATION_THRESHOLD_DEFAULT = 0.01;
/** Default exponential-decay per-frame multiplier. */
const IMPULSE_EXPONENTIAL_FACTOR_DEFAULT = 0.9;

// ---------------------------------------------------------------------------
// 2-Pole IIR Low-Pass Filter
// ---------------------------------------------------------------------------
//
// Standard second-order IIR: y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2]
//                                    - a1*y[n-1] - a2*y[n-2]
//
// DECtalk's filter uses coefficients derived from the speaker's QU parameter:
// f0_lp_filter = 1500 + 15 * QU.  For Paul (QU=40), cutoff ~2100.
// This controls smoothness of F0 transitions.
//
// Citation: Klatt 1982, Ph_drwt02.c filter_commands()
// ---------------------------------------------------------------------------

/** State for a 2-pole IIR low-pass filter. */
export type IIRFilterState = {
  y1: number;  // y[n-1]
  y2: number;  // y[n-2]
  x1: number;  // x[n-1]
  x2: number;  // x[n-2]
};

/** State for a 1-pole low-pass filter. */
export type OnePoleFilterState = {
  y: number;
};

/** Coefficients for a 2-pole Butterworth low-pass filter. */
export type IIRFilterCoefficients = {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
};

/**
 * Compute 2-pole Butterworth low-pass filter coefficients.
 *
 * Uses the bilinear transform of a 2nd-order Butterworth prototype.
 * Citation: Klatt 1982, Ph_drwt02.c (speaker-dependent F0 smoothing filter)
 *
 * @param cutoffHz  Cutoff frequency in Hz.
 * @param sampleRate  Sample rate in Hz (1 / frame period).
 */
export function computeButterworth2Coefficients(
  cutoffHz: number,
  sampleRate: number
): IIRFilterCoefficients {
  const wc = Math.tan((Math.PI * cutoffHz) / sampleRate);
  const wc2 = wc * wc;
  const sqrt2 = Math.SQRT2;
  const k = 1.0 / (1.0 + sqrt2 * wc + wc2);

  return {
    b0: wc2 * k,
    b1: 2.0 * wc2 * k,
    b2: wc2 * k,
    a1: 2.0 * (wc2 - 1.0) * k,
    a2: (1.0 - sqrt2 * wc + wc2) * k,
  };
}

/**
 * Apply one sample through the 2-pole IIR filter.
 * Mutates state in-place for performance.
 */
export function iirFilter2Pole(
  input: number,
  state: IIRFilterState,
  coeffs: IIRFilterCoefficients
): number {
  const output =
    coeffs.b0 * input +
    coeffs.b1 * state.x1 +
    coeffs.b2 * state.x2 -
    coeffs.a1 * state.y1 -
    coeffs.a2 * state.y2;

  state.x2 = state.x1;
  state.x1 = input;
  state.y2 = state.y1;
  state.y1 = output;

  return output;
}

/** Create a zeroed filter state. */
export function createFilterState(): IIRFilterState {
  return { y1: 0, y2: 0, x1: 0, x2: 0 };
}

/** Create a zeroed 1-pole filter state. */
export function createOnePoleFilterState(): OnePoleFilterState {
  return { y: 0 };
}

/**
 * Apply one sample through a 1-pole low-pass filter.
 *
 * Standard exponential smoother:
 *   y[n] = y[n-1] + alpha * (x[n] - y[n-1])
 *
 * With alpha in [0, 1], larger alpha tracks changes faster.
 * This is a generic first-order control smoother and is also a good fit for
 * DECtalk's speaker-driven F0 smoothing coefficient path.
 */
export function onePoleLowpass(
  input: number,
  state: OnePoleFilterState,
  alpha: number,
): number {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  state.y += clampedAlpha * (input - state.y);
  return state.y;
}

// ---------------------------------------------------------------------------
// Layer rendering helpers
// ---------------------------------------------------------------------------

/**
 * Interpolate a piecewise-linear profile at a given normalized position [0, 1].
 * The profile is defined by N equidistant control points spanning [0, 1].
 */
function interpolateProfile(
  points: number[],
  normalizedPosition: number
): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0];

  const t = Math.max(0, Math.min(1, normalizedPosition));
  const maxIdx = points.length - 1;
  const floatIdx = t * maxIdx;
  const lowIdx = Math.floor(floatIdx);
  const highIdx = Math.min(lowIdx + 1, maxIdx);

  if (lowIdx === highIdx) return points[lowIdx];
  const frac = floatIdx - lowIdx;
  return points[lowIdx] + frac * (points[highIdx] - points[lowIdx]);
}

/**
 * Render a layered additive F0 contour.
 *
 * Generates internal frames at the configured frame cadence,
 * processes layer commands, applies the 2-pole IIR filter, then builds
 * an F0Point[] array that can be queried by getF0AtTime().
 *
 * Citations:
 *   Fujisaki, H. "Information, Prosody, and Modeling" -- command-response additive F0
 *   Klatt, D. (1982) "KLATTalk" -- hat-pattern F0, 2-pole low-pass filter
 *   Rabiner, L. (1968) "Speech Synthesis by Rule" -- three-component F0
 */
export function renderLayeredF0(
  commands: F0LayerCommand[],
  modelConfig: LayeredF0ModelConfig,
  totalDuration: number,
  speakerParams?: Record<string, unknown>
): F0Point[] {
  if (totalDuration <= 0) return [{ time: 0, f0: 0 }];

  const framePeriod = requirePositiveModelNumber(
    modelConfig.frame_period_sec,
    "f0_model.frame_period_sec",
  );
  const sampleRate = 1.0 / framePeriod;
  const numFrames = Math.ceil(totalDuration / framePeriod) + 1;

  // Resolve control smoothing filter.
  const filterConfig = modelConfig.filter;
  if (!filterConfig || typeof filterConfig !== "object") {
    throw new Error("E_F0_MODEL_REQUIRED: f0_model.filter must be an object");
  }
  const rawFilterType = String(filterConfig.type);
  const usesOnePoleFilter = filterConfig.type === "lowpass_1pole";
  const usesCoefficient2PoleFilter = filterConfig.type === "lowpass_2pole_coefficient";
  let onePoleAlpha = (usesOnePoleFilter || usesCoefficient2PoleFilter)
    ? requireModelNumber(filterConfig.default_alpha, "f0_model.filter.default_alpha")
    : 0;
  if ((usesOnePoleFilter || usesCoefficient2PoleFilter) && filterConfig.alpha_param && speakerParams) {
    const paramPath = filterConfig.alpha_param.split(".");
    let val: unknown = speakerParams;
    for (const key of paramPath) {
      val = (val as Record<string, unknown>)?.[key];
    }
    if (typeof val === "number" && Number.isFinite(val)) {
      onePoleAlpha = val;
    }
  }

  let cutoffHz = 0;
  if (!usesOnePoleFilter && !usesCoefficient2PoleFilter) {
    if (rawFilterType !== "lowpass_2pole") {
      throw new Error(`E_F0_MODEL_REQUIRED: unsupported f0_model.filter.type ${rawFilterType}`);
    }
    cutoffHz = requirePositiveModelNumber(filterConfig.default_cutoff, "f0_model.filter.default_cutoff");
    if (filterConfig.cutoff_param && speakerParams) {
      const paramPath = filterConfig.cutoff_param.split(".");
      let val: unknown = speakerParams;
      for (const key of paramPath) {
        val = (val as Record<string, unknown>)?.[key];
      }
      if (typeof val === "number" && Number.isFinite(val) && val > 0) {
        cutoffHz = val;
      }
    }
    cutoffHz = Math.max(1, Math.min(cutoffHz, sampleRate * 0.45));
  }

  const filterCoeffs = (usesOnePoleFilter || usesCoefficient2PoleFilter)
    ? null
    : computeButterworth2Coefficients(cutoffHz, sampleRate);

  // Resolve speaker scaling parameters.
  const scaleConfig = modelConfig.speaker_scale;
  let f0Minimum = 0;
  let f0ScaleFactor = 1.0;
  let f0Reference = 0;
  let baseF0BiasHz = 0;
  const scaleDivisor = scaleConfig?.divisor ?? SPEAKER_SCALE_DIVISOR_DEFAULT;
  const scaleOutput = scaleConfig?.output_scale ?? SPEAKER_SCALE_OUTPUT_DEFAULT;

  if (scaleConfig) {
    f0Reference = requireModelNumber(scaleConfig.reference, "f0_model.speaker_scale.reference");
    if (scaleConfig.minimum_param) {
      f0Minimum = resolveRequiredSpeakerNumber(speakerParams, scaleConfig.minimum_param);
    } else {
      throw new Error("E_F0_MODEL_REQUIRED: f0_model.speaker_scale.minimum_param is required");
    }
    if (scaleConfig.range_param) {
      f0ScaleFactor = resolveRequiredSpeakerNumber(speakerParams, scaleConfig.range_param);
    } else {
      throw new Error("E_F0_MODEL_REQUIRED: f0_model.speaker_scale.range_param is required");
    }
    const baseF0Hz = (speakerParams as Record<string, unknown>)?.base_f0_hz;
    if (typeof baseF0Hz === "number" && Number.isFinite(baseF0Hz)) {
      baseF0BiasHz = baseF0Hz - f0Minimum * scaleOutput;
    }
  }

  // Resolve output clamp bounds (default to historical hardcoded values).
  const minHz = modelConfig.output_clamp?.min_hz ?? LAYERED_F0_MIN_HZ_DEFAULT;
  const maxHz = modelConfig.output_clamp?.max_hz ?? LAYERED_F0_MAX_HZ_DEFAULT;

  // Organize commands by layer.
  const layerNames = Object.keys(modelConfig.layers);
  const commandsByLayer = new Map<string, F0LayerCommand[]>();
  for (const name of layerNames) {
    commandsByLayer.set(name, []);
  }
  for (const cmd of commands) {
    const existing = commandsByLayer.get(cmd.layer);
    if (existing) {
      existing.push(cmd);
    }
  }

  // Pre-fill steady-state value to avoid the IIR startup transient.
  // Computed from commands at time <= 0 and profile layers at normalized
  // position 0.  interpolateProfile(points, 0) === points[0] exactly, so this
  // is bit-identical to evaluating the profile interpolation in the kernel.
  let initTotal = 0;
  for (const name of layerNames) {
    const cfg = modelConfig.layers[name];
    const cmds = commandsByLayer.get(name)!;
    if (cfg.type === "persistent") {
      let level = 0;
      for (const cmd of cmds) {
        if (cmd.time <= framePeriod * 0.5) level += cmd.value;
        else break;
      }
      initTotal += level;
    } else if (cfg.type === "profile") {
      for (const cmd of cmds) {
        if (cmd.time <= framePeriod * 0.5 && cmd.profilePoints && cmd.profilePoints.length > 0) {
          initTotal += interpolateProfile(cmd.profilePoints, 0);
        }
      }
    }
    // Impulses start at 0 and decay, so they don't contribute to steady-state.
  }

  // ----- Marshal config + layers + commands into flat f64 buffers for the
  // f0-filters WASM kernel.  The per-frame DSP loop (command processing, layer
  // summation, IIR filtering, speaker scaling, clamp, impulse decay) lives in
  // crates/f0-filters; this is a byte-exact extraction (f64 throughout).
  const DECAY_MODE_CODES: Record<DecayMode, number> = {
    halving: 0,
    linear: 1,
    exponential: 2,
  };
  // Sentinel for a truthy-but-unsupported decay string. The kernel's decay
  // switch has a no-op default for any unrecognized code, exactly reproducing
  // master's behavior (an unsupported decay matched no branch → impulse value
  // left unchanged until removal). Must NOT collide with 0/1/2.
  const DECAY_MODE_UNKNOWN = -1;
  const LAYER_TYPE_CODES: Record<LayerType, number> = {
    profile: 0,
    persistent: 1,
    impulse: 2,
    glide: 3,
  };
  const LAYER_STRIDE = 7;
  const CMD_STRIDE = 5;

  // The frame loop processes a command only when its cursor reaches it, i.e.
  // when `cmd.time <= time + framePeriod*0.5` for some rendered frame. The
  // largest such threshold occurs at the final frame. The cursor advances in
  // array order and STOPS at the first command failing this test (a NaN time
  // never satisfies it and freezes the cursor). master validated
  // `durationFrames` only for commands the loop actually processed, so we
  // replicate that exact reachability here — eager validation of unreachable or
  // NaN-time commands would throw where master did not.
  const maxProcessThreshold =
    numFrames > 0 ? (numFrames - 1) * framePeriod + framePeriod * 0.5 : Number.NEGATIVE_INFINITY;

  // Flatten per-layer command lists (preserving order) and pool profile points.
  const layerDescs: number[] = [];
  const cmdDescs: number[] = [];
  const profilePool: number[] = [];
  for (const name of layerNames) {
    const cfg = modelConfig.layers[name];
    const cmds = commandsByLayer.get(name)!;
    const cmdStart = cmdDescs.length / CMD_STRIDE;

    // Validate per-layer fields exactly where the TS reference did (so the
    // same inputs throw the same errors).
    let decayCode = 0;
    let terminationThreshold = 0;
    let exponentialFactor = 0;
    let initialDecayDivisor = 0;
    if (cfg.type === "impulse") {
      // master: `if (!cfg.decay) throw` runs on the first frame for every
      // impulse layer regardless of whether it has commands.
      if (!cfg.decay) {
        throw new Error(`E_F0_MODEL_REQUIRED: f0_model.layers.${name}.decay is required`);
      }
      decayCode = DECAY_MODE_CODES[cfg.decay] ?? DECAY_MODE_UNKNOWN;
      terminationThreshold = cfg.termination_threshold ?? IMPULSE_TERMINATION_THRESHOLD_DEFAULT;
      exponentialFactor = cfg.exponential_factor ?? IMPULSE_EXPONENTIAL_FACTOR_DEFAULT;
      initialDecayDivisor = cfg.initial_decay_divisor ?? IMPULSE_INITIAL_DECAY_DIVISOR_DEFAULT;
    }

    // Track whether the cursor is still "live": once a command fails the
    // reachability test the cursor freezes and no later command is processed.
    let cursorLive = true;
    for (const cmd of cmds) {
      const reachable = cursorLive && cmd.time <= maxProcessThreshold;
      if (!reachable) cursorLive = false;

      let durationFrames = 0;
      let profileStart = 0;
      let profileCount = 0;
      if (cfg.type === "impulse") {
        // Validate (and thus possibly throw) only for commands the frame loop
        // would actually process — matching master's trigger condition.
        if (reachable) {
          durationFrames = requirePositiveModelNumber(
            cmd.durationFrames,
            `f0_layer.${name}.durationFrames`,
          );
        } else if (typeof cmd.durationFrames === "number" && Number.isFinite(cmd.durationFrames)) {
          // Unreachable command: pass its raw duration through (the kernel will
          // not process it, so the value is inert), but never throw.
          durationFrames = cmd.durationFrames;
        }
      } else if (cfg.type === "profile") {
        if (cmd.profilePoints && cmd.profilePoints.length > 0) {
          profileStart = profilePool.length;
          profileCount = cmd.profilePoints.length;
          for (const p of cmd.profilePoints) profilePool.push(p);
        }
      } else if (cfg.type === "glide") {
        // A glide ramps `cmd.value` over `cmd.durationFrames` frames (the span).
        // A non-positive / missing span degenerates to an instantaneous STEP in
        // the kernel (LAYER_GLIDE arm), so pass any finite span straight through
        // and default a missing one to 0 (instant). No validation throw — a
        // zero-span glide is a legitimate (step-like) command.
        if (typeof cmd.durationFrames === "number" && Number.isFinite(cmd.durationFrames)) {
          durationFrames = cmd.durationFrames;
        }
      }
      cmdDescs.push(cmd.time, cmd.value, durationFrames, profileStart, profileCount);
    }

    const cmdCount = cmds.length;
    layerDescs.push(
      LAYER_TYPE_CODES[cfg.type],
      decayCode,
      initialDecayDivisor,
      terminationThreshold,
      exponentialFactor,
      cmdStart,
      cmdCount,
    );
  }

  const nLayers = layerNames.length;
  const nCmds = cmdDescs.length / CMD_STRIDE;
  const nProfiles = profilePool.length;

  // Scalar header (must match the index layout in crates/f0-filters/src/lib.rs).
  const scalars = [
    framePeriod,
    totalDuration,
    usesOnePoleFilter ? 1 : usesCoefficient2PoleFilter ? 2 : 0,
    onePoleAlpha,
    filterCoeffs?.b0 ?? 0,
    filterCoeffs?.b1 ?? 0,
    filterCoeffs?.b2 ?? 0,
    filterCoeffs?.a1 ?? 0,
    filterCoeffs?.a2 ?? 0,
    scaleConfig ? 1 : 0,
    f0Minimum,
    f0ScaleFactor,
    f0Reference,
    scaleDivisor,
    scaleOutput,
    baseF0BiasHz,
    minHz,
    maxHz,
    initTotal,
  ];

  const exports = getF0FilterExports();
  const f64 = (values: number[] | Float64Array): { ptr: number; len: number } => {
    const len = values.length;
    if (len === 0) return { ptr: 0, len: 0 };
    const ptr = exports.alloc_f64(len);
    new Float64Array(exports.memory.buffer, ptr, len).set(values);
    return { ptr, len };
  };

  // Allocate every buffer into zero-initialized pointer records so the
  // finally block can free whatever was actually allocated, even if a later
  // allocation, the render_f0 call, or the readback throws/traps. Leaking into
  // the cached singleton instance would otherwise grow its memory unboundedly.
  let scalarsBuf = { ptr: 0, len: 0 };
  let layersBuf = { ptr: 0, len: 0 };
  let cmdsBuf = { ptr: 0, len: 0 };
  let profilesBuf = { ptr: 0, len: 0 };
  let outPtr = 0;
  let rawF0Values: Float64Array;
  try {
    scalarsBuf = f64(scalars);
    layersBuf = f64(layerDescs);
    cmdsBuf = f64(cmdDescs);
    profilesBuf = f64(profilePool);
    outPtr = exports.alloc_f64(numFrames);

    const status = exports.render_f0(
      scalarsBuf.ptr,
      scalarsBuf.len,
      layersBuf.ptr,
      nLayers,
      cmdsBuf.ptr,
      nCmds,
      profilesBuf.ptr,
      nProfiles,
      outPtr,
      numFrames,
    );
    if (status !== RENDER_OK) {
      // Malformed FFI shape: the kernel left the output untouched rather than
      // trapping. Surface it instead of silently returning zeros.
      throw new Error(`E_F0_RENDER_FAILED: f0-filters render_f0 returned status ${status}`);
    }

    // Read the rendered F0 values back out of WASM memory. Re-create the view
    // after the call in case any allocation grew (and detached) the buffer.
    rawF0Values = new Float64Array(
      new Float64Array(exports.memory.buffer, outPtr, numFrames),
    );
  } finally {
    if (scalarsBuf.ptr) exports.dealloc_f64(scalarsBuf.ptr, scalarsBuf.len);
    if (layersBuf.ptr) exports.dealloc_f64(layersBuf.ptr, layersBuf.len);
    if (cmdsBuf.ptr) exports.dealloc_f64(cmdsBuf.ptr, cmdsBuf.len);
    if (profilesBuf.ptr) exports.dealloc_f64(profilesBuf.ptr, profilesBuf.len);
    if (outPtr) exports.dealloc_f64(outPtr, numFrames);
  }

  // Convert to F0Point[] for the track assembler to query.
  const contour: F0Point[] = [];
  for (let frame = 0; frame < numFrames; frame++) {
    contour.push({
      time: frame * framePeriod,
      f0: rawF0Values[frame],
      tag: "layered_f0",
    });
  }

  return contour;
}

// ---------------------------------------------------------------------------
// Helpers -- frame-level F0 interpolation and formant blending
// ---------------------------------------------------------------------------

function getF0AtTime(f0Contour: F0Point[], time: number): number {
  if (!f0Contour || f0Contour.length === 0) return 0;
  for (let i = 0; i < f0Contour.length - 1; i++) {
    const p1 = f0Contour[i];
    const p2 = f0Contour[i + 1];
    if (time >= p1.time && time <= p2.time) {
      if (Math.abs(p2.time - p1.time) < 1e-6) return p1.f0;
      const fraction = (time - p1.time) / (p2.time - p1.time);
      return p1.f0 + fraction * (p2.f0 - p1.f0);
    }
  }
  return f0Contour[f0Contour.length - 1].f0;
}

function getInteriorF0AnchorTimes(
  f0Contour: F0Point[],
  startTime: number,
  endTime: number,
): number[] {
  if (!f0Contour || f0Contour.length === 0 || endTime <= startTime) return [];
  const epsilon = 1e-6;
  const anchors: number[] = [];
  for (const point of f0Contour) {
    if (point.time > startTime + epsilon && point.time < endTime - epsilon) {
      anchors.push(point.time);
    }
  }
  return anchors;
}

// DEFAULT_* constants removed — all values now read from the validated lowering spec.
// Citation: each value is cited in the YAML source.

// ---------------------------------------------------------------------------
// Generic inter-segment boundary-value transition primitive
//
// DECtalk model (notes/chunk-dt-tier4-transition-design.md §1.0): a transition
// is a boundary value `bouval` placed AT a segment edge that ramps LINEARLY to
// the segment's steady target over a span. Two edges per segment:
//   - "forward"  smoothing = the segment START edge (boundary with previous).
//   - "backward" smoothing = the segment END   edge (boundary with next).
// DECtalk's no-locus DEFAULT boundary value is the 50% neighbor midpoint
// (`(tarend+tarnex)/2` backward), which is exactly Qlatt's legacy symmetric
// blend. This primitive generalizes that single fixed midpoint blend into a
// per-parameter, per-edge boundary value + span, where the boundary value and
// span are supplied by a resolver. A LATER chunk (t4a-data) overrides the
// resolver to inject locus-derived boundary values and per-parameter `durtran`
// spans; in THIS chunk the resolver returns the legacy midpoint + shared span,
// so output is byte-identical.
//
// The primitive is GENERIC: it is driven entirely by the `transitions` config
// (keys, factor, smooth_types, span). No frontend-name or per-phoneme literals.
// ---------------------------------------------------------------------------

type BoundaryEdge = "forward" | "backward";

/**
 * Per-(parameter,edge) boundary value and ramp span resolved for a boundary.
 * - `value` is the parameter value AT the segment edge (`bouval`); the track
 *   ramps linearly between this and the segment's steady target across `spanSec`.
 * - `spanSec` is the transition duration (`durtran`) for this parameter/edge.
 *   A later chunk may vary it per parameter; today it is the shared span.
 */
type BoundaryValue = {
  value: number;
  spanSec: number;
};

/**
 * Resolves the boundary value (`bouval`) for one smoothed parameter at one
 * segment edge. Returning `null` means "no transition for this parameter/edge"
 * (the steady target is held). The default resolver reproduces the legacy
 * symmetric 50% midpoint blend; a later chunk supplies a locus-aware resolver.
 */
type BoundaryValueResolver = (args: {
  key: string;
  edge: BoundaryEdge;
  steadyParams: KlattParams;
  neighborParams: KlattParams | null | undefined;
  spanSec: number;
  factor: number;
}) => BoundaryValue | null;

/**
 * Legacy resolver: `bouval = steady + (neighbor - steady) * factor` with the
 * shared span. With `factor = 0.5` this is the 50% midpoint between this
 * segment's steady value and the neighbor's steady value — byte-identical to
 * the previous `blendParams` behavior.
 */
const midpointBoundaryResolver: BoundaryValueResolver = ({
  key,
  steadyParams,
  neighborParams,
  spanSec,
  factor,
}) => {
  if (!neighborParams) return null;
  const a = steadyParams[key];
  const b = neighborParams[key];
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return { value: a + (b - a) * factor, spanSec };
};

/**
 * Generic boundary-value transition primitive.
 *
 * Produces the parameter set that holds AT the segment edge (the `bouval` set):
 * for each smoothed key it asks the resolver for a boundary value; keys with no
 * boundary value retain their steady target. The interpreter then ramps
 * linearly between the steady params (held until `steadyTime`) and this returned
 * set, reproducing the linear boundary-value ramp.
 *
 * In this chunk only the END (backward) edge is emitted with the shared span,
 * matching legacy behavior exactly. The `edge`/`spanSec` plumbing exists so a
 * later chunk can emit per-parameter forward and backward edges with locus
 * boundary values and per-parameter spans WITHOUT another engine change.
 */
function resolveBoundaryParams(
  steadyParams: KlattParams,
  neighborParams: KlattParams | null | undefined,
  blendKeys: string[],
  factor: number,
  spanSec: number,
  edge: BoundaryEdge,
  resolver: BoundaryValueResolver = midpointBoundaryResolver,
): KlattParams {
  if (!neighborParams) return { ...steadyParams };
  const result = { ...steadyParams };
  for (const key of blendKeys) {
    const boundary = resolver({
      key,
      edge,
      steadyParams,
      neighborParams,
      spanSec,
      factor,
    });
    if (boundary != null && Number.isFinite(boundary.value)) {
      result[key] = boundary.value;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Locus-based obstruent<->sonorant boundary transitions (DECtalk-style)
//
// When the lowering spec declares `transitions.loci`, a vowel adjacent to an
// obstruent ramps its F1-F3 toward the consonant's locus at that edge instead
// of getting no transition (legacy behavior excluded obstruent boundaries
// entirely). The mechanism is the same boundary-value linear ramp as the
// midpoint blend, but the boundary value is `bouval = locus + prcnt*(curval -
// locus)/100` (curval = the vowel's steady target), read from DATA.
//
// GENERIC: this code branches only on the existence of locus DATA and a generic
// "is this neighbor an obstruent with locus data" check (neighbor not in
// smooth_types AND its phoneme present in the loci table). There are no
// per-phoneme or frontend-name literals — a frontend with no `loci` is a no-op.
// Citation: DECtalk 4.63 ph_sttr2.c setloc (the bouval formula and indexing).
// ---------------------------------------------------------------------------

/** Result of resolving the locus window for one segment edge. */
type LocusBoundary = {
  /** Per-key boundary value (`bouval`) held AT the edge; ramps to steady. */
  params: KlattParams;
  /** Window span (seconds) = max per-formant durtran among the locus keys. */
  spanSec: number;
  /** Selected DECtalk vowel category (`sontyx`) used for this edge. */
  category: number;
  /** Per-formant row values and adjusted values that produced `params`. */
  formants: {
    key: string;
    locusHz: number;
    steadyHz: number;
    sourcePrcnt: number;
    adjustedPrcnt: number;
    sourceDurtranMs: number;
    adjustedDurtranMs: number;
    boundaryHz: number;
    adjustments: string[];
    steadyTimeMs?: number;
    appliedSpanMs?: number;
  }[];
  roundedSonorantConsonant: boolean;
  obstruentPalatalOrDental: boolean;
  f2BackAffiliated: boolean;
};

/**
 * Resolve the locus boundary for a sonorant `vowelSeg` at one `edge`, given the
 * adjacent obstruent `obstruentSeg`. Returns `null` when no locus applies
 * (missing data, no vowel category, no entry for this obstruent/category) so the
 * caller falls back to the legacy behavior. Reads only the passed-in DATA.
 */
/** Optional place/feature DATA for the setloc prcnt adjustments (ph_sttr2.c:294-307). */
type LocusPrcntAdjustments = {
  obstruent_place?: Record<string, { palatal_or_dental?: boolean }>;
  rounded_sonorant_consonant?: string[];
  f2_back?: Record<string, { forward?: boolean; backward?: boolean }>;
};

function resolveLocusBoundary(
  steadyParams: KlattParams,
  vowelPhoneme: string,
  obstruentPhoneme: string,
  edge: BoundaryEdge,
  blendKeys: string[],
  loci: LocusTable | undefined,
  vowelCategory: VowelCategoryTable | undefined,
  prcntAdjust?: LocusPrcntAdjustments,
): LocusBoundary | null {
  if (!loci || !vowelCategory) return null;
  const obstruentBlock = loci[obstruentPhoneme];
  if (!obstruentBlock) return null;
  const category = vowelCategory[vowelPhoneme];
  if (!category) return null;
  const sontyx = edge === "forward" ? category.forward : category.backward;
  if (sontyx == null) return null;
  const formantBlock = obstruentBlock[String(sontyx)];
  if (!formantBlock) return null;

  // setloc prcnt adjustments (DATA-gated; ph_sttr2.c:294-307). All branches are
  // on DATA tables only — no per-phoneme literals. Undefined tables => no-op
  // (legacy core locus pull preserved exactly).
  const roundedSoncon =
    prcntAdjust?.rounded_sonorant_consonant?.includes(vowelPhoneme) ?? false;
  // place(fonobst) & (FPALATL|FDENTAL); a missing entry is treated as not set.
  const obstPalatalOrDental =
    prcntAdjust?.obstruent_place?.[obstruentPhoneme]?.palatal_or_dental ?? false;
  const f2BackAffil =
    (edge === "forward"
      ? prcntAdjust?.f2_back?.[vowelPhoneme]?.forward
      : prcntAdjust?.f2_back?.[vowelPhoneme]?.backward) ?? false;

  const params: KlattParams = { ...steadyParams };
  const formants: LocusBoundary["formants"] = [];
  let maxSpanSec = 0;
  let applied = false;
  for (const key of blendKeys) {
    const entry = formantBlock[key];
    if (!entry) continue; // only F1/F2/F3 have locus entries; B1-B3 keep steady
    const curval = steadyParams[key];
    if (!Number.isFinite(curval)) continue;

    const sourcePrcnt = entry.prcnt;
    const sourceDurtranMs = entry.durtran_ms;
    let prcnt = entry.prcnt;
    let durtranMs = entry.durtran_ms;
    const adjustments: string[] = [];
    // (a) Reduce F2/F3 transition extent for a rounded sonorant consonant next
    //     to a non-palatal/non-dental obstruent (ph_sttr2.c:294-298):
    //     prcnt = (prcnt >> 1) + 50. `np > &PF1` means F2 or F3 (not F1).
    if (roundedSoncon && (key === "F2" || key === "F3") && !obstPalatalOrDental) {
      prcnt = Math.floor(prcnt / 2) + 50;
      adjustments.push("rounded_sonorant_non_palatal_or_dental_obstruent");
    }
    // (b) Reduce F2 transition extent into a back-cavity-affiliated vowel
    //     (ph_sttr2.c:303-307): prcnt += 25 - (prcnt >> 2); durtran = (durtran >> 1) + 2.
    if (key === "F2" && f2BackAffil) {
      prcnt += 25 - Math.floor(prcnt / 4);
      durtranMs = Math.floor(durtranMs / 2) + 2;
      adjustments.push("f2_back_affiliation");
    }

    // bouval = locus + prcnt * (curval - locus) / 100  (ph_sttr2.c:328-329)
    const bouval = entry.locus_hz + (prcnt * (curval - entry.locus_hz)) / 100;
    if (!Number.isFinite(bouval)) continue;
    params[key] = bouval;
    formants.push({
      key,
      locusHz: entry.locus_hz,
      steadyHz: curval,
      sourcePrcnt,
      adjustedPrcnt: prcnt,
      sourceDurtranMs,
      adjustedDurtranMs: durtranMs,
      boundaryHz: bouval,
      adjustments,
    });
    applied = true;
    const spanSec = Math.max(0, durtranMs) / 1000;
    if (spanSec > maxSpanSec) maxSpanSec = spanSec;
  }
  if (!applied || maxSpanSec <= 0) return null;
  return {
    params,
    spanSec: maxSpanSec,
    category: sontyx,
    formants,
    roundedSonorantConsonant: roundedSoncon,
    obstruentPalatalOrDental: obstPalatalOrDental,
    f2BackAffiliated: f2BackAffil,
  };
}

// ---------------------------------------------------------------------------
// Voice quality overlay
// ---------------------------------------------------------------------------

/**
 * Apply voice quality overrides to a frame's params.
 * Injects Rd, OQ, TL, flutter, jitter into the params (overriding semantics defaults),
 * and adds ah_offset_db to the existing AH value (additive).
 *
 * Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009
 */
function applyVoiceQualityOverrides(
  params: KlattParams,
  vq: VoiceQualityOverrides,
): void {
  // Rd overrides the current speaker-default LF source shape.
  params.Rd = vq.rd;
  // OQ: 0 = derive from Rd in the LF WASM crate.
  if (vq.oq !== 0) {
    params.OQ = vq.oq;
  }
  // TL stacks on top of the speaker baseline tilt.
  // Citations: Klatt & Klatt 1990; speaker sex differences from Fant 1997 / Kent & Vorperian 2018
  if (vq.tl !== 0) {
    params.TL = (params.TL ?? 0) + vq.tl;
  }
  // Flutter and jitter override their semantics defaults of 0
  params.flutter = vq.flutter;
  params.jitter = vq.jitter;
  // AH offset is ADDITIVE to per-phoneme AH from inventory.
  // Citation: Klatt & Klatt 1990 (AH is the most important cue for breathiness)
  if (vq.ah_offset_db !== 0) {
    params.AH = (params.AH ?? 0) + vq.ah_offset_db;
  }
}

function scoreFieldsToResolved(
  fields: Record<string, ControlFieldSpec>,
): Record<string, ResolvedControlField> {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, field]) => [
      fieldName,
      field.op === "unset"
        ? { op: field.op }
        : { op: field.op, value: field.value },
    ]),
  );
}

function applyGlobalOverlays(
  params: KlattParams,
  overlays: ControlScoreGlobalOverlay[],
): void {
  for (const overlay of overlays) {
    applyControlFields(params, scoreFieldsToResolved(overlay.fields));
  }
}

function resolveScoreSegmentDurationMs(
  segment: ControlScoreSegment,
  minDurationStopReleaseMs: number,
  minDurationDefaultMs: number,
  phonemeTargetMap: Record<string, Record<string, unknown> | undefined>,
): number {
  const isStopRelease = segment.type === "stop_release" || segment.type === "stop_aspiration";
  const minimumDuration = isStopRelease ? minDurationStopReleaseMs : minDurationDefaultMs;
  const fallbackDuration = isStopRelease
    ? toFiniteNumber(phonemeTargetMap[segment.phoneme]?.dur)
    : null;
  const explicitDuration = toFiniteNumber(segment.duration.realized_target_ms);
  const candidate = explicitDuration ?? fallbackDuration ?? minimumDuration;
  return Math.max(minimumDuration, candidate);
}

function buildScoreTimeline(
  score: DeclarativeControlScore,
  loweringSpec: TrackLoweringSpec,
  phonemeTargetMap: Record<string, Record<string, unknown> | undefined>,
): {
  durationsMs: number[];
  segmentStartsMs: number[];
  segmentEndsMs: number[];
  markTimeById: Map<string, number>;
} {
  const minDurationStopReleaseMs = requireCitedNumber(
    loweringSpec.timeline.duration_floors.stop_release_ms,
    "timeline.duration_floors.stop_release_ms",
  );
  const minDurationDefaultMs = requireCitedNumber(
    loweringSpec.timeline.duration_floors.default_ms,
    "timeline.duration_floors.default_ms",
  );
  const durationsMs: number[] = [];
  const segmentStartsMs: number[] = [];
  const segmentEndsMs: number[] = [];
  const segmentTimeById = new Map<string, { startMs: number; endMs: number }>();
  let cursorMs = 0;

  for (const segment of score.segments) {
    const durationMs = resolveScoreSegmentDurationMs(
      segment,
      minDurationStopReleaseMs,
      minDurationDefaultMs,
      phonemeTargetMap,
    );
    durationsMs.push(durationMs);
    segmentStartsMs.push(cursorMs);
    cursorMs += durationMs;
    segmentEndsMs.push(cursorMs);
    segmentTimeById.set(segment.id, {
      startMs: cursorMs - durationMs,
      endMs: cursorMs,
    });
  }

  const markTimeById = new Map<string, number>();
  for (const mark of score.timeline_marks) {
    if (mark.time_ms !== undefined) {
      markTimeById.set(mark.id, mark.time_ms);
      continue;
    }
    const segmentTimes = segmentTimeById.get(mark.segment_id);
    if (segmentTimes === undefined) continue;
    markTimeById.set(mark.id, mark.edge === "onset" ? segmentTimes.startMs : segmentTimes.endMs);
  }

  return { durationsMs, segmentStartsMs, segmentEndsMs, markTimeById };
}

function resolveScoreTimingMs(
  timing: ControlScoreTiming,
  markTimeById: Map<string, number>,
): number {
  if (timing.kind === "absolute") return timing.time_ms;
  const left = markTimeById.get(timing.anchor_left);
  const right = markTimeById.get(timing.anchor_right);
  if (left === undefined || right === undefined) return 0;
  return left + (right - left) * timing.ratio;
}

function buildF0ContourFromScore(
  score: DeclarativeControlScore,
  baseF0: number,
  markTimeById: Map<string, number>,
  diagnostics?: Diagnostics | null,
): F0Point[] {
  if (score.f0_points.length === 0) {
    return [{ time: 0, f0: baseF0 }];
  }

  // Dedup coincident-time points: the last point in pipeline order wins (rules
  // run in pipeline order and push in order, so a later phase — e.g. a boundary
  // tone — deterministically overrides an earlier accent tail at the same
  // instant). The resolution is stable given fixed rule+token order; we surface
  // every dropped point as a diagnostic so the silent overwrite is explainable.
  const deduped = new Map<number, F0Point>();
  for (const point of score.f0_points) {
    const time = Math.max(0, resolveScoreTimingMs(point.timing, markTimeById) / 1000);
    const displaced = deduped.get(time);
    if (displaced) {
      diagnostics?.warn(
        "Coincident F0 points: later pipeline point overrides earlier at the same instant",
        {
          timeMs: time * 1000,
          keptTag: point.tag ?? null,
          keptHz: point.value_hz,
          droppedTag: displaced.tag ?? null,
          droppedHz: displaced.f0,
        },
        "F0_POINT_COINCIDENT_OVERRIDE",
      );
    }
    deduped.set(time, {
      time,
      f0: point.value_hz,
      ...(point.tag ? { tag: point.tag } : {}),
      ...(point.accent_type ? { accentType: point.accent_type } : {}),
    });
  }

  const contour = [...deduped.values()].sort((left, right) => left.time - right.time);
  if (contour.length === 0 || contour[0].time > 0) {
    contour.unshift({ time: 0, f0: baseF0 });
  }
  return contour;
}

function scoreLayerCommandsToRendererCommands(
  commands: ControlScoreF0LayerCommand[],
  markTimeById: Map<string, number>,
): F0LayerCommand[] {
  return commands.map((command) => ({
    layer: command.layer,
    time: Math.max(0, resolveScoreTimingMs(command.timing, markTimeById) / 1000),
    value: command.value,
    ...(command.duration_frames !== undefined ? { durationFrames: command.duration_frames } : {}),
    ...(command.profile_points !== undefined ? { profilePoints: command.profile_points } : {}),
    ...(command.tag !== undefined ? { tag: command.tag } : {}),
  }));
}

function collectScoreControlWindowsByIndex(
  score: DeclarativeControlScore,
  durationsMs: number[],
): ResolvedControlWindow[][] {
  const segmentIndexById = new Map(
    score.segments.map((segment, index) => [segment.id, index]),
  );
  const byIndex: ResolvedControlWindow[][] = score.segments.map(() => []);

  for (const control of score.timed_controls) {
    const index = segmentIndexById.get(control.target_segment_id);
    if (index === undefined) continue;
    const durationMs = durationsMs[index] ?? 0;
    const startMs = Math.max(0, Math.min(durationMs, control.start_offset_ms));
    const endMs = Math.max(startMs, Math.min(durationMs, control.end_offset_ms));
    if (endMs <= startMs) continue;
    byIndex[index].push({
      startSec: startMs / 1000,
      endSec: endMs / 1000,
      fields: scoreFieldsToResolved(control.fields),
      ...(control.tag ? { tag: control.tag } : {}),
    });
  }

  return byIndex;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Lower a declarative control score into Klatt frames.
 */
export function lowerControlScoreToKlattTrack(
  score: DeclarativeControlScore,
  loweringSpec: TrackLoweringSpec,
  context: TrackLoweringContext,
): KlattFrame[] {
  const inventorySpec = context.inventorySpec;
  const phonemeTargetMap = inventorySpec.phoneme_targets as Record<string, Record<string, unknown> | undefined>;
  const baseParams = inventorySpec.base_params;
  const baseF0 = context.baseF0;
  const transitionMs =
    typeof context.transitionMs === "number" && Number.isFinite(context.transitionMs)
      ? context.transitionMs
      : requireCitedNumber(loweringSpec.transitions.default_transition_ms, "transitions.default_transition_ms");
  const blendFactor = requireCitedNumber(loweringSpec.transitions.blend.factor, "transitions.blend.factor");
  const blendKeys = loweringSpec.transitions.blend.keys;
  const smoothTypes = new Set(loweringSpec.transitions.blend.smooth_types);
  // When set, the midpoint blend is the universal fallback at every boundary the
  // specific rules leave untransitioned (DECtalk smooths every boundary). Default
  // off -> legacy coverage (qlatt-english omits it and is byte-identical).
  const smoothAllBoundaries = loweringSpec.transitions.blend.smooth_all_boundaries === true;
  // Optional locus data (DECtalk-style obstruent transitions). A frontend that
  // omits `loci` keeps the legacy midpoint-only smoothing: every locus lookup
  // returns null below, so the obstruent edges stay untouched (no-op).
  //
  // Male vs female table selection is GENERIC: the chosen voice's `sex` data
  // field (context.voiceSex) picks `loci_female` when it is "female" AND that
  // table is declared; everything else (male, unspecified, or no female table)
  // uses the male `loci`. No per-voice-name branches — the only branch is on the
  // data string "female". The female loci are absolute female Hz (DECtalk
  // us_femloc) used as-is; the vowel curval is already formant-scaled, so there
  // is no double formant scaling. vowel_category is sex-independent (it derives
  // from begtyp/endtyp, not the locus table) and is shared by both tables.
  const usesFemaleLocusTable =
    context.voiceSex === "female" && loweringSpec.transitions.loci_female != null;
  const loci = usesFemaleLocusTable
    ? loweringSpec.transitions.loci_female
    : loweringSpec.transitions.loci;
  const locusTableId = usesFemaleLocusTable ? "loci_female" : "loci";
  const vowelCategory = loweringSpec.transitions.vowel_category;
  // Optional DATA for the setloc prcnt adjustments (ph_sttr2.c:294-307). Undefined
  // tables make resolveLocusBoundary skip the adjustments (legacy core locus pull).
  const prcntAdjust: LocusPrcntAdjustments = {
    obstruent_place: loweringSpec.transitions.obstruent_place,
    rounded_sonorant_consonant: loweringSpec.transitions.rounded_sonorant_consonant,
    f2_back: loweringSpec.transitions.f2_back,
  };
  // Find the obstruent phoneme adjacent to a sonorant at `index`, scanning in
  // `direction` (-1 = previous, +1 = next). A stop is represented as a closure
  // segment plus glue release/aspiration segments (the shared engine convention:
  // a `<base>` stop_closure followed by `<base>_REL` stop_release / aspiration),
  // so we skip stop_release/stop_aspiration segments to reach the underlying
  // obstruent — matching DECtalk's single `fonobst` per stop. Returns the
  // obstruent phoneme only when it is NOT a smoothed sonorant type AND has a
  // locus block; otherwise null. GENERIC: branches on `type` + locus DATA only,
  // no per-phoneme or frontend-name literals.
  const locusGlueTypes = new Set(["stop_release", "stop_aspiration"]);
  const adjacentLocusObstruent = (index: number, direction: -1 | 1): string | null => {
    if (loci == null) return null;
    let j = index + direction;
    while (score.segments[j] != null && locusGlueTypes.has(score.segments[j].type)) {
      j += direction;
    }
    const seg = score.segments[j];
    if (seg == null || smoothTypes.has(seg.type)) return null;
    return loci[seg.phoneme] != null ? seg.phoneme : null;
  };
  const initialSilenceMs = requireCitedNumber(loweringSpec.timeline.initial_silence_ms, "timeline.initial_silence_ms");
  const finalSilenceMs = requireCitedNumber(loweringSpec.timeline.final_silence_ms, "timeline.final_silence_ms");
  const timeline = buildScoreTimeline(score, loweringSpec, phonemeTargetMap);

  const segmentParams = score.segments.map((segment) => {
    const params = segment.params && Object.keys(segment.params).length > 0
      ? coerceKlattParams(segment.params)
      : fillDefaultParams(phonemeTargetMap["SIL"], baseParams);
    applyGlobalOverlays(params, score.global_overlays);
    return params;
  });
  const resolvedControlWindowsByIndex = collectScoreControlWindowsByIndex(
    score,
    timeline.durationsMs,
  );

  let f0Contour: F0Point[];
  if (loweringSpec.f0.renderer.type === "layered_additive") {
    if (!context.f0Model || context.f0Model.type !== "layered_additive") {
      throw new Error("E_TRACK_LOWERING_CONTEXT: layered_additive renderer requires context.f0Model");
    }
    const totalDuration =
      (initialSilenceMs + timeline.durationsMs.reduce((sum, value) => sum + value, 0) + finalSilenceMs) / 1000;
    f0Contour = renderLayeredF0(
      scoreLayerCommandsToRendererCommands(score.f0_layer_commands, timeline.markTimeById),
      context.f0Model,
      totalDuration,
      context.speakerParams,
    );
  } else {
    const rawF0Contour = buildF0ContourFromScore(
      score,
      baseF0,
      timeline.markTimeById,
      context.diagnostics,
    );
    f0Contour = rawF0Contour;
  }

  const klattTrack: KlattFrame[] = [];
  let currentTime = Math.max(0, initialSilenceMs) / 1000.0;

  // Start silent.
  const silParams = fillDefaultParams(phonemeTargetMap["SIL"], baseParams);
  applyGlobalOverlays(silParams, score.global_overlays);
  klattTrack.push({
    time: 0,
    params: coerceKlattParams(silParams),
  });

  for (let i = 0; i < score.segments.length; i++) {
    const segment = score.segments[i];
    const phDuration = timeline.durationsMs[i] / 1000.0;
    const segmentStart = currentTime;

    if (phDuration <= 0) {
      continue;
    }
    const targetTime = segmentStart + phDuration;

    const finalParams = segmentParams[i];
    const controlWindows = resolvedControlWindowsByIndex[i] ?? [];

    const segmentVoiced = segmentCanVoice(finalParams, controlWindows);
    const interiorF0Anchors = segmentVoiced
      ? getInteriorF0AnchorTimes(f0Contour, segmentStart, targetTime)
      : [];

    if (targetTime > segmentStart) {
      const nextSegment = score.segments[i + 1];
      const nextParams = segmentParams[i + 1];
      const phTransitionSec = Math.max(0, segment.alignment.transition_ms ?? transitionMs) / 1000.0;
      const isSmoothedSonorant = smoothTypes.has(segment.type);

      // -------------------------------------------------------------------
      // BACKWARD (segment END) edge.
      // -------------------------------------------------------------------
      let backwardParams: KlattParams | null = null;
      let backwardSteadyTime: number | null = null;
      let backwardSteadyTimesByKey: Record<string, number> | null = null;
      // Legacy sonorant<->sonorant midpoint blend (UNCHANGED): both this and the
      // next segment are smoothed types.
      const canMidpointSmooth =
        phTransitionSec > 0 &&
        isSmoothedSonorant &&
        smoothTypes.has(nextSegment?.type);
      if (canMidpointSmooth) {
        const steadyTime = Math.max(segmentStart + 0.02, targetTime - phTransitionSec);
        if (steadyTime > segmentStart && steadyTime < targetTime) {
          backwardParams = resolveBoundaryParams(
            finalParams,
            nextParams,
            blendKeys,
            blendFactor,
            phTransitionSec,
            "backward",
          );
          backwardSteadyTime = steadyTime;
        }
      } else if (isSmoothedSonorant) {
        // Vowel before an obstruent: ramp F1-F3 toward the obstruent's locus
        // over the last `durtran` of this segment (DECtalk backward smoothing).
        const obstruentPhoneme = adjacentLocusObstruent(i, 1);
        const locus = obstruentPhoneme
          ? resolveLocusBoundary(
              finalParams,
              segment.phoneme,
              obstruentPhoneme,
              "backward",
              blendKeys,
              loci,
              vowelCategory,
              prcntAdjust,
            )
          : null;
        if (locus) {
          const steadyTimesByKey: Record<string, number> = {};
          const diagnosticFormants = locus.formants.map((formant) => {
            const formantSpan = Math.min(Math.max(0, formant.adjustedDurtranMs) / 1000, phDuration);
            const formantSteadyTime = Math.max(segmentStart + 0.02, targetTime - formantSpan);
            if (formantSteadyTime > segmentStart && formantSteadyTime < targetTime) {
              steadyTimesByKey[formant.key] = formantSteadyTime;
            }
            return {
              ...formant,
              steadyTimeMs: formantSteadyTime * 1000,
              appliedSpanMs: formantSpan * 1000,
            };
          });
          const steadyTimes = Object.values(steadyTimesByKey);
          if (steadyTimes.length > 0) {
            backwardParams = locus.params;
            backwardSteadyTimesByKey = steadyTimesByKey;
            backwardSteadyTime = Math.min(...steadyTimes);
            context.diagnostics?.info(
              "Applied obstruent locus transition at sonorant end",
              {
                segmentIndex: i,
                segmentId: segment.id,
                word: segment.word ?? null,
                edge: "backward",
                sonorantPhoneme: segment.phoneme,
                obstruentPhoneme,
                voiceSex: context.voiceSex ?? null,
                locusTable: locusTableId,
                vowelCategory: locus.category,
                segmentStartMs: segmentStart * 1000,
                segmentEndMs: targetTime * 1000,
                steadyTimeMs: backwardSteadyTime * 1000,
                spanMs: locus.spanSec * 1000,
                roundedSonorantConsonant: locus.roundedSonorantConsonant,
                obstruentPalatalOrDental: locus.obstruentPalatalOrDental,
                f2BackAffiliated: locus.f2BackAffiliated,
                formants: diagnosticFormants,
                citation: "DECtalk 4.63 ph_sttr2.c setloc; p_us_rom.h us_maleloc/us_femloc",
              },
              "I_LOCUS_TRANSITION_APPLIED",
            );
          }
        }
      }

      // -------------------------------------------------------------------
      // FORWARD (segment START) edge — vowel after an obstruent.
      // -------------------------------------------------------------------
      let forwardParams: KlattParams | null = null;
      let forwardSteadyTime: number | null = null;
      let forwardSteadyTimesByKey: Record<string, number> | null = null;
      const forwardObstruent = isSmoothedSonorant ? adjacentLocusObstruent(i, -1) : null;
      if (forwardObstruent) {
        const locus = resolveLocusBoundary(
          finalParams,
          segment.phoneme,
          forwardObstruent,
          "forward",
          blendKeys,
          loci,
          vowelCategory,
          prcntAdjust,
        );
        if (locus) {
          const steadyTimesByKey: Record<string, number> = {};
          const diagnosticFormants = locus.formants.map((formant) => {
            const formantSpan = Math.min(Math.max(0, formant.adjustedDurtranMs) / 1000, phDuration);
            let formantSteadyTime = Math.min(targetTime - 0.02, segmentStart + formantSpan);
            // Keep the forward window from overrunning the backward window.
            if (backwardSteadyTime != null) {
              formantSteadyTime = Math.min(formantSteadyTime, backwardSteadyTime);
            }
            if (formantSteadyTime > segmentStart && formantSteadyTime < targetTime) {
              steadyTimesByKey[formant.key] = formantSteadyTime;
            }
            return {
              ...formant,
              steadyTimeMs: formantSteadyTime * 1000,
              appliedSpanMs: formantSpan * 1000,
            };
          });
          const steadyTimes = Object.values(steadyTimesByKey);
          if (steadyTimes.length > 0) {
            forwardParams = locus.params;
            forwardSteadyTimesByKey = steadyTimesByKey;
            forwardSteadyTime = Math.max(...steadyTimes);
            context.diagnostics?.info(
              "Applied obstruent locus transition at sonorant start",
              {
                segmentIndex: i,
                segmentId: segment.id,
                word: segment.word ?? null,
                edge: "forward",
                sonorantPhoneme: segment.phoneme,
                obstruentPhoneme: forwardObstruent,
                voiceSex: context.voiceSex ?? null,
                locusTable: locusTableId,
                vowelCategory: locus.category,
                segmentStartMs: segmentStart * 1000,
                segmentEndMs: targetTime * 1000,
                steadyTimeMs: forwardSteadyTime * 1000,
                spanMs: locus.spanSec * 1000,
                roundedSonorantConsonant: locus.roundedSonorantConsonant,
                obstruentPalatalOrDental: locus.obstruentPalatalOrDental,
                f2BackAffiliated: locus.f2BackAffiliated,
                formants: diagnosticFormants,
                citation: "DECtalk 4.63 ph_sttr2.c setloc; p_us_rom.h us_maleloc/us_femloc",
              },
              "I_LOCUS_TRANSITION_APPLIED",
            );
          }
        }
      }

      // -------------------------------------------------------------------
      // UNIVERSAL MIDPOINT FALLBACK (DECtalk: smooth every boundary).
      // For any edge the specific rules above left untransitioned, apply the
      // 50% midpoint formant/bandwidth blend toward the neighbor. Gated by data
      // (smooth_all_boundaries); only blend keys (F1-F3/B1-B3) move, so burst
      // amplitudes are untouched. Covers obstruent edges and no-locus
      // boundaries, which legacy coverage stepped through abruptly.
      // -------------------------------------------------------------------
      if (smoothAllBoundaries && phTransitionSec > 0) {
        if (backwardParams == null && nextParams) {
          const steadyTime = Math.max(segmentStart + 0.02, targetTime - phTransitionSec);
          if (steadyTime > segmentStart && steadyTime < targetTime) {
            backwardParams = resolveBoundaryParams(
              finalParams,
              nextParams,
              blendKeys,
              blendFactor,
              phTransitionSec,
              "backward",
            );
            backwardSteadyTime = steadyTime;
          }
        }
        if (forwardParams == null && i > 0) {
          const prevParams = segmentParams[i - 1];
          if (prevParams) {
            let candidate = Math.min(targetTime - 0.02, segmentStart + phTransitionSec);
            if (backwardSteadyTime != null) {
              candidate = Math.min(candidate, backwardSteadyTime);
            }
            if (candidate > segmentStart && candidate < targetTime) {
              forwardParams = resolveBoundaryParams(
                finalParams,
                prevParams,
                blendKeys,
                blendFactor,
                phTransitionSec,
                "forward",
              );
              forwardSteadyTime = candidate;
            }
          }
        }
      }

      const smoothing: SegmentBoundarySmoothing = {
        backwardParams,
        backwardSteadyTime,
        backwardSteadyTimesByKey,
        forwardParams,
        forwardSteadyTime,
        forwardSteadyTimesByKey,
      };

      const additionalTransitionSteadyTimes = [
        ...Object.values(backwardSteadyTimesByKey ?? {}),
        ...Object.values(forwardSteadyTimesByKey ?? {}),
      ];

      const eventTimes = buildSegmentEventTimes(
        segmentStart,
        targetTime,
        backwardSteadyTime,
        interiorF0Anchors,
        controlWindows,
        loweringSpec.timeline.event_points,
        nextSegment == null && controlWindows.length > 0,
        forwardSteadyTime,
        additionalTransitionSteadyTimes,
      );

      for (const eventTime of eventTimes) {
        const eventParams = applyControlWindowsAtOffset(
          finalParams,
          smoothing,
          segmentStart,
          targetTime,
          eventTime,
          controlWindows
        );
        const voicedAtEvent = (eventParams.AV ?? 0) > 0 || (eventParams.AVS ?? 0) > 0;
        let eventF0 =
          segment.phoneme === "SIL" || !voicedAtEvent ? 0 : getF0AtTime(f0Contour, eventTime);
        if (voicedAtEvent && eventF0 < 1) {
          eventF0 = baseF0 / 2;
        }
        eventParams.F0 = eventF0;

        klattTrack.push({
          time: eventTime,
          phoneme: segment.phoneme,
          word: segment.word,
          params: coerceKlattParams(eventParams),
        });
      }

      currentTime = targetTime;
    }
  }

  // Add final silence. The reset must happen at the end of the last phone;
  // otherwise release/noise parameters are held through the trailing silence.
  const finalSilenceSec = Math.max(0, finalSilenceMs) / 1000.0;
  const finalTime = currentTime + finalSilenceSec;
  const lastSegment = score.segments[score.segments.length - 1];
  const scoreAlreadyEndsInSilence = finalSilenceSec === 0 && lastSegment?.phoneme === "SIL";
  const finalSilParams =
    scoreAlreadyEndsInSilence && segmentParams[segmentParams.length - 1]
      ? { ...segmentParams[segmentParams.length - 1] }
      : fillDefaultParams(phonemeTargetMap["SIL"], baseParams);
  applyGlobalOverlays(finalSilParams, score.global_overlays);
  klattTrack.push({
    time: currentTime,
    phoneme: "SIL",
    params: coerceKlattParams(finalSilParams),
  });
  if (finalTime > currentTime) {
    klattTrack.push({
      time: finalTime,
      phoneme: "SIL",
      params: coerceKlattParams(finalSilParams),
    });
  }

  return klattTrack;
}
