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
import type {
  InventorySpec,
} from "./declarative-frontend/inventory";
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
 *  Optional metadata for provenance and sag-injection passes.
 *  Citations: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation),
 *             Ladd 2008 pp.155-157 (sagging transition between H* accents) */
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
    };
  };
  f0: {
    renderer: {
      type: "point_interpolation" | "layered_additive";
      layered_model_ref?: string;
    };
    sag: {
      operator: "parabolic_hstar_sag" | "disabled";
      depth_hz: CitedNumberSpec;
      min_span_ms: CitedNumberSpec;
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
  includeSegmentEnd = false
): number[] {
  const epsilon = 1e-6;
  const times = [segmentStart];

  for (const anchorTime of interiorF0Anchors) {
    if (anchorTime > segmentStart + epsilon && anchorTime < segmentEnd - epsilon) {
      times.push(anchorTime);
    }
  }

  if (steadyTime != null && steadyTime > segmentStart + epsilon && steadyTime < segmentEnd - epsilon) {
    times.push(steadyTime);
  }

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

function applyControlWindowsAtOffset(
  baseParams: KlattParams,
  transitionParams: KlattParams | null,
  steadyTime: number | null,
  segmentStart: number,
  eventTime: number,
  controlWindows: ResolvedControlWindow[]
): KlattParams {
  const epsilon = 1e-6;
  const segmentOffset = Math.max(0, eventTime - segmentStart);
  const useTransitionParams =
    steadyTime != null && eventTime >= steadyTime - epsilon && transitionParams != null;
  const resolved: KlattParams = {
    ...(useTransitionParams ? transitionParams : baseParams),
  };

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
 *  - `impulse`: decaying transient pulse */
export type LayerType = "profile" | "persistent" | "impulse";

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

/** State for a single active impulse. */
type ActiveImpulse = {
  value: number;
  decay: number;
  remainingFrames: number;
};

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
  let onePoleAlpha = usesOnePoleFilter
    ? requireModelNumber(filterConfig.default_alpha, "f0_model.filter.default_alpha")
    : 0;
  if (usesOnePoleFilter && filterConfig.alpha_param && speakerParams) {
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
  if (!usesOnePoleFilter) {
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

  const filterCoeffs = usesOnePoleFilter
    ? null
    : computeButterworth2Coefficients(cutoffHz, sampleRate);
  const filterState = usesOnePoleFilter ? null : createFilterState();
  const onePoleState = usesOnePoleFilter ? createOnePoleFilterState() : null;

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

  // Per-layer state.
  const persistentLevels = new Map<string, number>();
  const activeImpulses = new Map<string, ActiveImpulse[]>();
  const profileData = new Map<string, number[]>();

  for (const name of layerNames) {
    const cfg = modelConfig.layers[name];
    if (cfg.type === "persistent") persistentLevels.set(name, 0);
    if (cfg.type === "impulse") activeImpulses.set(name, []);
    if (cfg.type === "profile") profileData.set(name, []);
  }

  // Per-layer command cursors.
  const commandCursors = new Map<string, number>();
  for (const name of layerNames) {
    commandCursors.set(name, 0);
  }

  // Pre-fill filter state to avoid startup transient.
  // Compute the initial steady-state value from commands at time <= 0 and
  // profile layers at normalized position 0.  This lets the IIR filter start
  // converged instead of ramping from zero.
  {
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
      // Impulses start at 0 and decay, so they don't contribute to the initial steady-state.
    }
    if (initTotal !== 0) {
      if (usesOnePoleFilter) {
        onePoleState!.y = initTotal;
      } else {
        filterState!.y1 = initTotal;
        filterState!.y2 = initTotal;
        filterState!.x1 = initTotal;
        filterState!.x2 = initTotal;
      }
    }
  }

  // Process frames.
  const rawF0Values = new Float64Array(numFrames);

  for (let frame = 0; frame < numFrames; frame++) {
    const time = frame * framePeriod;

    // Process pending commands for each layer up to current time.
    for (const name of layerNames) {
      const cfg = modelConfig.layers[name];
      const cmds = commandsByLayer.get(name)!;
      let cursor = commandCursors.get(name)!;

      while (cursor < cmds.length && cmds[cursor].time <= time + framePeriod * 0.5) {
        const cmd = cmds[cursor];

        if (cfg.type === "persistent") {
          const current = persistentLevels.get(name) ?? 0;
          persistentLevels.set(name, current + cmd.value);
        } else if (cfg.type === "impulse") {
          const impulses = activeImpulses.get(name)!;
          const durationFrames = requirePositiveModelNumber(
            cmd.durationFrames,
            `f0_layer.${name}.durationFrames`,
          );
          impulses.push({
            value: cmd.value,
            decay: cmd.value / (cfg.initial_decay_divisor ?? IMPULSE_INITIAL_DECAY_DIVISOR_DEFAULT),
            remainingFrames: durationFrames,
          });
        } else if (cfg.type === "profile") {
          if (cmd.profilePoints && cmd.profilePoints.length > 0) {
            profileData.set(name, cmd.profilePoints);
          }
        }

        cursor++;
      }
      commandCursors.set(name, cursor);
    }

    // Sum all layers.
    let total = 0;

    for (const name of layerNames) {
      const cfg = modelConfig.layers[name];

      if (cfg.type === "profile") {
        const points = profileData.get(name);
        if (points && points.length > 0) {
          const normalizedPos = totalDuration > 0 ? time / totalDuration : 0;
          total += interpolateProfile(points, normalizedPos);
        }
      } else if (cfg.type === "persistent") {
        total += persistentLevels.get(name) ?? 0;
      } else if (cfg.type === "impulse") {
        const impulses = activeImpulses.get(name)!;
        for (const imp of impulses) {
          total += imp.value;
        }
      }
    }

    // Apply IIR low-pass filter.
    const filtered = usesOnePoleFilter
      ? onePoleLowpass(total, onePoleState!, onePoleAlpha)
      : iirFilter2Pole(total, filterState!, filterCoeffs!);

    // Speaker scaling: only when speaker_scale is configured in the model.
    // When speaker_scale is absent, the filtered value is used directly as Hz.
    // When present, applies the DECtalk formula (Ph_drwt02.c line 2309):
    //   f0prime = f0minimum + frac4mul(f0prime - 1300, f0scalefac)
    // where frac4mul(x,y) = (x * y) >> 12 = x * y / 4096
    // The result is in Hz*10, so divide by 10 for final Hz.
    // Citation: DECtalk 4.63 Ph_drwt02.c (speaker-dependent F0 scaling)
    let f0Hz: number;
    if (scaleConfig) {
      f0Hz = (f0Minimum + (filtered - f0Reference) * f0ScaleFactor / scaleDivisor) * scaleOutput;
      f0Hz += baseF0BiasHz;
    } else {
      f0Hz = filtered;
    }
    f0Hz = Math.max(minHz, Math.min(maxHz, f0Hz));
    rawF0Values[frame] = f0Hz;

    // Advance impulse decay for all impulse layers.
    for (const name of layerNames) {
      const cfg = modelConfig.layers[name];
      if (cfg.type !== "impulse") continue;
      if (!cfg.decay) {
        throw new Error(`E_F0_MODEL_REQUIRED: f0_model.layers.${name}.decay is required`);
      }
      const decayMode = cfg.decay;
      const impulses = activeImpulses.get(name)!;
      const terminationThreshold =
        cfg.termination_threshold ?? IMPULSE_TERMINATION_THRESHOLD_DEFAULT;
      const exponentialFactor =
        cfg.exponential_factor ?? IMPULSE_EXPONENTIAL_FACTOR_DEFAULT;

      for (let i = impulses.length - 1; i >= 0; i--) {
        const imp = impulses[i];
        imp.remainingFrames--;

        if (imp.remainingFrames <= 0 || Math.abs(imp.value) < terminationThreshold) {
          impulses.splice(i, 1);
          continue;
        }

        if (decayMode === "halving") {
          imp.value -= imp.decay;
          imp.decay = imp.decay / 2;
        } else if (decayMode === "linear") {
          imp.value -= imp.decay;
        } else if (decayMode === "exponential") {
          imp.value *= exponentialFactor;
        }
      }
    }
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

// ---------------------------------------------------------------------------
// Helpers -- sagging transitions (H*-H* interpolation)
// Citation: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
// Citation: Ladd 2008 pp.155-157 (sagging transition between H* accents)
// ---------------------------------------------------------------------------

/**
 * Insert parabolic sag points between consecutive H* accent peaks.
 *
 * Pure function: takes an F0 contour and returns a new contour with additional
 * points that create the characteristic "dipping" shape between H*-H* pairs
 * described by Pierrehumbert (1980) and Ladd (2008).
 *
 * Sample points are fixed by the lowering operator; accent identity comes from
 * score points, not from raw rule tags.
 *
 * @param contour  Input F0 contour (sorted by time, with tag/accentType metadata).
 * @param sagDepthHz  Maximum sag depth in Hz at midpoint (default 12).
 * @param minSpanMs  Minimum inter-accent span in ms for sag to apply (default 150).
 * @returns New contour with sag points inserted (sorted by time).
 *
 * Citations:
 *   Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
 *   Ladd 2008 pp.155-157 (sagging transition between H* accents)
 */
export function applySaggingTransitions(
  contour: F0Point[],
  sagDepthHz: number = 12,
  minSpanMs: number = 150
): F0Point[] {
  if (contour.length < 2 || sagDepthHz <= 0) return [...contour];
  const samplePoints = [0.25, 0.5, 0.75];
  const depthMultiplier = 4;

  // Collect indices of score-declared high accent peaks.
  const hStarIndices: number[] = [];
  for (let i = 0; i < contour.length; i++) {
    if (contour[i].accentType?.includes("H*")) {
      hStarIndices.push(i);
    }
  }

  if (hStarIndices.length < 2) return [...contour];

  const minSpanSec = minSpanMs / 1000;
  const sagPoints: F0Point[] = [];

  // For each consecutive H*-H* pair, check eligibility and insert sag points.
  for (let k = 0; k < hStarIndices.length - 1; k++) {
    const leftIdx = hStarIndices[k];
    const rightIdx = hStarIndices[k + 1];
    const left = contour[leftIdx];
    const right = contour[rightIdx];

    // Check span threshold.
    // Citation: Pierrehumbert 1980 (closer H*s show less/no dipping)
    const span = right.time - left.time;
    if (span < minSpanSec) continue;

    // Check no phrase boundary between the two H* points.
    let hasBoundary = false;
    for (let j = leftIdx + 1; j < rightIdx; j++) {
      const tag = contour[j].tag;
      if (tag === "f0_boundary_low" || tag === "f0_register_reset") {
        hasBoundary = true;
        break;
      }
    }
    if (hasBoundary) continue;

    // Parabolic sag formula:
    // f0_sag(t) = f0_linear(t) - sagDepthHz * 4 * t * (1-t)
    // where f0_linear(t) = left.f0 + (right.f0 - left.f0) * t
    for (const t of samplePoints) {
      const time = left.time + span * t;
      const f0Linear = left.f0 + (right.f0 - left.f0) * t;
      const sagAmount = sagDepthHz * depthMultiplier * t * (1 - t);
      // Floor clamp: prevent negative F0 from extreme downstep + sag.
      const saggedF0 = Math.max(f0Linear - sagAmount, 0);
      sagPoints.push({
        time,
        f0: saggedF0,
        tag: "f0_sag",
      });
    }
  }

  if (sagPoints.length === 0) return [...contour];

  // Merge and sort by time.
  const merged = [...contour, ...sagPoints];
  merged.sort((a, b) => a.time - b.time);
  return merged;
}

// DEFAULT_* constants removed — all values now read from the validated lowering spec.
// Citation: each value is cited in the YAML source.

function blendParams(
  baseParams: KlattParams,
  nextParams: KlattParams | null | undefined,
  blendKeys: string[],
  blendFactor: number,
): KlattParams {
  if (!nextParams) return { ...baseParams };
  const blended = { ...baseParams };
  for (const key of blendKeys) {
    const a = baseParams[key];
    const b = nextParams[key];
    if (Number.isFinite(a) && Number.isFinite(b)) {
      blended[key] = a + (b - a) * blendFactor;
    }
  }
  return blended;
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
): F0Point[] {
  if (score.f0_points.length === 0) {
    return [{ time: 0, f0: baseF0 }];
  }

  const deduped = new Map<number, F0Point>();
  for (const point of score.f0_points) {
    const time = Math.max(0, resolveScoreTimingMs(point.timing, markTimeById) / 1000);
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
    );
    if (loweringSpec.f0.sag.operator === "disabled") {
      f0Contour = rawF0Contour;
    } else {
      f0Contour = applySaggingTransitions(
        rawF0Contour,
        requireCitedNumber(loweringSpec.f0.sag.depth_hz, "f0.sag.depth_hz"),
        requireCitedNumber(loweringSpec.f0.sag.min_span_ms, "f0.sag.min_span_ms"),
      );
    }
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
      const canSmooth =
        phTransitionSec > 0 &&
        smoothTypes.has(segment.type) &&
        smoothTypes.has(nextSegment?.type);
      const steadyTime = canSmooth
        ? Math.max(segmentStart + 0.02, targetTime - phTransitionSec)
        : null;
      const transitionParams =
        steadyTime && steadyTime > segmentStart && steadyTime < targetTime
          ? blendParams(finalParams, nextParams, blendKeys, blendFactor)
          : null;
      const eventTimes = buildSegmentEventTimes(
        segmentStart,
        targetTime,
        steadyTime,
        interiorF0Anchors,
        controlWindows,
        nextSegment == null && controlWindows.length > 0
      );

      for (const eventTime of eventTimes) {
        const eventParams = applyControlWindowsAtOffset(
          finalParams,
          transitionParams,
          steadyTime,
          segmentStart,
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
  const finalSilParams = fillDefaultParams(phonemeTargetMap["SIL"], baseParams);
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
