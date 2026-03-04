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
  loadInventorySpecFromPath,
} from "./declarative-frontend/inventory";
import type {
  InventorySpec,
} from "./declarative-frontend/inventory";
import type {
  KlattFrame,
  ControlFieldOp,
  ControlFieldSpec,
  ControlWindowSpec,
  ControlWindowTarget,
} from "./tts-frontend-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InputToken = Record<string, any>;
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

/** YAML-sourced output configuration for track assembly. */
export type OutputConfig = {
  blend?: {
    factor?: number;
    keys?: string[];
    smooth_types?: string[];
  };
  min_duration?: {
    stop_release_ms?: number;
    default_ms?: number;
  };
  transition_ms?: number;
  final_silence_ms?: number;
};

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

/** Options passed to {@link assembleKlattTrack}. */
export type AssembleTrackOptions = {
  /** Inventory spec providing phoneme targets and base params. Defaults to qlatt-english. */
  inventorySpec?: InventorySpec;
  /** Base F0 in Hz (default 110). */
  baseF0?: number;
  /** Transition duration in milliseconds (default 30). */
  transitionMs?: number;
  /** Output configuration from YAML (overrides hardcoded defaults). */
  outputConfig?: OutputConfig;
  /** Voice quality overrides applied to every frame's params.
   *  Citations: Fant 1997, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009 */
  voiceQuality?: VoiceQualityOverrides;
  /** Sagging transition depth in Hz between consecutive H* accents (default 12).
   *  Citation: Pierrehumbert 1980, Ladd 2008 pp.155-157 */
  sagDepthHz?: number;
  /** Minimum inter-accent span in ms for sag to apply (default 150).
   *  Citation: Pierrehumbert 1980 (closer H*s show less/no dipping) */
  sagMinSpanMs?: number;
  /** Layered additive F0 model configuration from the frontend spec.
   *  When present and type === "layered_additive", the layered renderer is
   *  used instead of the declarative point-interpolation path.
   *  Citations: Fujisaki (command-response), Klatt 1982 (hat-pattern),
   *  Rabiner 1968 (three-component F0) */
  f0Model?: LayeredF0ModelConfig;
  /** Speaker parameters for the layered F0 model's speaker scaling.
   *  When present, these are passed to renderLayeredF0() so it can resolve
   *  speaker-dependent scaling parameters (f0_minimum, f0_scale_factor, etc.).
   *  Citations: DECtalk 4.63 ph_vset.c (speaker-dependent F0 scaling) */
  speakerParams?: Record<string, unknown>;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "bigint") {
    const numericValue = Number(value);
    return Number.isSafeInteger(numericValue) ? numericValue : null;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getSyncMarkerKey(markLike: unknown): string | null {
  if (typeof markLike === "string" && markLike.length > 0) {
    return markLike;
  }
  if (typeof markLike === "number" && Number.isFinite(markLike)) {
    return `num:${markLike}`;
  }
  if (typeof markLike === "bigint") {
    return `num:${markLike.toString()}`;
  }
  if (markLike && typeof markLike === "object" && !Array.isArray(markLike)) {
    const source = markLike as Record<string, unknown>;
    if (typeof source.id === "string" && source.id.length > 0) {
      return source.id;
    }
    if (typeof source.rank === "string" && source.rank.length > 0) {
      const kind = typeof source.kind === "string" ? source.kind : "RANK";
      return `${kind}:${source.rank}`;
    }
  }
  return null;
}

export function buildSyncTimeMap(
  phoneSequence: InputToken[],
  minDurationStopReleaseMs: number,
  minDurationDefaultMs: number,
  phonemeTargets?: Record<string, Record<string, unknown>>,
): Map<string, number> {
  const syncTimeByKey = new Map<string, number>();
  let cursorSec = 0;

  for (const token of phoneSequence) {
    const isStopRelease = token.type === "stop_release" || token.type === "stop_aspiration";
    const minDurationMs = isStopRelease ? minDurationStopReleaseMs : minDurationDefaultMs;
    const fallbackDurationMs = isStopRelease
      ? toFiniteNumber((phonemeTargets?.[token.phoneme] as Record<string, unknown> | undefined)?.dur)
      : null;
    const durationSec =
      resolveTokenDurationMs(token, minDurationMs, fallbackDurationMs) / 1000;
    const leftKey = getSyncMarkerKey(token?.sync_left);
    const rightKey = getSyncMarkerKey(token?.sync_right);

    if (leftKey) syncTimeByKey.set(leftKey, cursorSec);
    cursorSec += durationSec;
    if (rightKey) syncTimeByKey.set(rightKey, cursorSec);
  }

  return syncTimeByKey;
}

function resolveAnchorEndpointSeconds(
  primary: unknown,
  secondary: unknown,
  tertiary: unknown,
  syncTimeByKey?: Map<string, number>,
): number | null {
  const key =
    getSyncMarkerKey(primary) ??
    getSyncMarkerKey(secondary) ??
    getSyncMarkerKey(tertiary);
  if (key && syncTimeByKey?.has(key)) {
    return syncTimeByKey.get(key) ?? null;
  }

  const numeric =
    toFiniteNumber(primary) ??
    toFiniteNumber(secondary) ??
    toFiniteNumber(tertiary);
  return numeric != null ? numeric / 1000 : null;
}

function resolveAnchoredTimeSeconds(
  token: InputToken,
  syncTimeByKey?: Map<string, number>,
): number {
  const explicitTime = toFiniteNumber(token?.time);
  if (explicitTime != null) {
    return explicitTime / 1000;
  }

  const anchorLeft = resolveAnchorEndpointSeconds(
    token?.anchor_left,
    token?.left,
    token?.sync_left,
    syncTimeByKey,
  );
  const anchorRight = resolveAnchorEndpointSeconds(
    token?.anchor_right,
    token?.right,
    token?.sync_right,
    syncTimeByKey,
  );
  if (anchorLeft == null || anchorRight == null) {
    return 0;
  }

  const rawRatio = toFiniteNumber(token?.ratio);
  const ratio =
    rawRatio == null
      ? anchorLeft === anchorRight
        ? 0
        : 0.5
      : Math.max(0, Math.min(1, rawRatio));
  return anchorLeft + (anchorRight - anchorLeft) * ratio;
}

function resolveTokenDurationMs(
  token: InputToken,
  minDurationMs: number,
  fallbackInventoryDurationMs: number | null
): number {
  const configuredDuration = toFiniteNumber(token?.duration);
  const fallbackDuration =
    fallbackInventoryDurationMs != null && Number.isFinite(fallbackInventoryDurationMs)
      ? fallbackInventoryDurationMs
      : 100;
  return Math.max(minDurationMs, configuredDuration ?? fallbackDuration);
}

function resolveWindowOffsetSec(
  window: ControlWindowSpec,
  durationSec: number,
  msField: "start_ms" | "end_ms",
  ratioField: "start_ratio" | "end_ratio",
  fallbackSec: number
): number {
  const msValue = toFiniteNumber(window?.[msField]);
  if (msValue != null) return msValue / 1000;

  const ratioValue = toFiniteNumber(window?.[ratioField]);
  if (ratioValue != null) return durationSec * Math.max(0, Math.min(1, ratioValue));

  return fallbackSec;
}

function resolveControlWindowSpan(
  window: ControlWindowSpec,
  durationSec: number
): { startSec: number; endSec: number } | null {
  const prefixMs = toFiniteNumber(window?.prefix_ms);
  if (prefixMs != null) {
    const endSec = Math.max(0, Math.min(durationSec, prefixMs / 1000));
    return endSec > 0 ? { startSec: 0, endSec } : null;
  }

  const suffixMs = toFiniteNumber(window?.suffix_ms);
  if (suffixMs != null) {
    const spanSec = Math.max(0, Math.min(durationSec, suffixMs / 1000));
    const startSec = Math.max(0, durationSec - spanSec);
    return durationSec > startSec ? { startSec, endSec: durationSec } : null;
  }

  const rawStartSec = resolveWindowOffsetSec(window, durationSec, "start_ms", "start_ratio", 0);
  const rawEndSec = resolveWindowOffsetSec(
    window,
    durationSec,
    "end_ms",
    "end_ratio",
    durationSec
  );
  const startSec = Math.max(0, Math.min(durationSec, rawStartSec));
  const endSec = Math.max(startSec, Math.min(durationSec, rawEndSec));
  if (endSec <= startSec) return null;
  return { startSec, endSec };
}

function resolveControlFields(
  rawFields: unknown
): Record<string, ResolvedControlField> | null {
  if (!rawFields || typeof rawFields !== "object" || Array.isArray(rawFields)) return null;

  const fields: Record<string, ResolvedControlField> = {};
  for (const [fieldName, rawSpec] of Object.entries(rawFields)) {
    const shorthandValue = toFiniteNumber(rawSpec);
    if (shorthandValue != null) {
      fields[fieldName] = { op: "set", value: shorthandValue };
      continue;
    }
    if (!rawSpec || typeof rawSpec !== "object" || Array.isArray(rawSpec)) continue;
    const fieldSpec = rawSpec as ControlFieldSpec;
    const op =
      typeof fieldSpec.op === "string" &&
      ["set", "add", "mul", "max", "min", "unset"].includes(
        fieldSpec.op.replace(/^['"]|['"]$/g, "")
      )
        ? (fieldSpec.op.replace(/^['"]|['"]$/g, "") as ControlFieldOp)
        : null;
    if (op == null) continue;
    const numericValue = toFiniteNumber(fieldSpec.value);
    if (op !== "unset" && numericValue == null) continue;
    fields[fieldName] =
      op === "unset" ? { op } : { op, value: numericValue as number };
  }

  return Object.keys(fields).length > 0 ? fields : null;
}

function resolveControlWindow(
  rawWindow: ControlWindowSpec,
  durationSec: number
): ResolvedControlWindow | null {
  const span = resolveControlWindowSpan(rawWindow, durationSec);
  if (span == null) return null;
  const fields = resolveControlFields(rawWindow.fields);
  if (fields == null) return null;
  return {
    startSec: span.startSec,
    endSec: span.endSec,
    fields,
    tag: typeof rawWindow.tag === "string" ? rawWindow.tag : undefined,
  };
}

function collectResolvedControlWindows(
  phoneSequence: InputToken[],
  minDurationStopReleaseMs: number,
  minDurationDefaultMs: number,
  phonemeTargetMap: Record<string, Record<string, any> | undefined>,
): ResolvedControlWindow[][] {
  const resolvedByIndex = phoneSequence.map(() => [] as ResolvedControlWindow[]);

  for (let sourceIndex = 0; sourceIndex < phoneSequence.length; sourceIndex += 1) {
    const sourceToken = phoneSequence[sourceIndex];
    const rawWindows = Array.isArray(sourceToken?.control_windows)
      ? (sourceToken.control_windows as ControlWindowSpec[])
      : [];
    if (rawWindows.length === 0) continue;

    for (const rawWindow of rawWindows) {
      if (!rawWindow || typeof rawWindow !== "object" || Array.isArray(rawWindow)) continue;
      const rawTarget =
        typeof rawWindow.target === "string"
          ? rawWindow.target.replace(/^['"]|['"]$/g, "")
          : "current";
      const targetIndex =
        rawTarget === "next"
          ? sourceIndex + 1
          : rawTarget === "prev"
            ? sourceIndex - 1
            : sourceIndex;
      if (targetIndex < 0 || targetIndex >= phoneSequence.length) continue;

      const targetToken = phoneSequence[targetIndex];
      const isStopRelease =
        targetToken.type === "stop_release" || targetToken.type === "stop_aspiration";
      const minDurationMs = isStopRelease ? minDurationStopReleaseMs : minDurationDefaultMs;
      const fallbackDurationMs = isStopRelease
        ? toFiniteNumber(phonemeTargetMap[targetToken.phoneme]?.dur)
        : null;
      const targetDurationSec =
        resolveTokenDurationMs(targetToken, minDurationMs, fallbackDurationMs) / 1000;
      const resolvedWindow = resolveControlWindow(rawWindow, targetDurationSec);
      if (resolvedWindow == null) continue;
      resolvedByIndex[targetIndex].push(resolvedWindow);
    }
  }

  return resolvedByIndex;
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

/** Default internal frame rate for the layered F0 renderer (seconds per frame).
 *  5 ms is the legacy generic default; frontends can override it declaratively. */
const LAYERED_F0_FRAME_PERIOD_SEC = 0.005;

/** Minimum F0 output in Hz. */
const LAYERED_F0_MIN_HZ = 50;
/** Maximum F0 output in Hz. */
const LAYERED_F0_MAX_HZ = 500;

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
 * Extract F0 layer commands from the parameter sequence.
 * These are tokens with `stream === "f0_layer"` inserted by `kind: f0_layer` rules.
 */
export function extractLayerCommands(
  sequence: InputToken[],
  syncTimeByKey?: Map<string, number>,
): F0LayerCommand[] {
  const commands: F0LayerCommand[] = [];
  for (const token of sequence) {
    if (token?.stream !== "f0_layer") continue;
    if (token?.status === 2) continue;
    const cmd: F0LayerCommand = {
      layer: typeof token.layer === "string" ? token.layer : "",
      time: resolveAnchoredTimeSeconds(token, syncTimeByKey),
      ...(toFiniteNumber(token?.anchor_left) != null
        ? { anchorLeftMs: toFiniteNumber(token.anchor_left) as number }
        : {}),
      ...(toFiniteNumber(token?.anchor_right) != null
        ? { anchorRightMs: toFiniteNumber(token.anchor_right) as number }
        : {}),
      ...(toFiniteNumber(token?.ratio) != null
        ? { ratio: toFiniteNumber(token.ratio) as number }
        : {}),
      value: Number.isFinite(token.value) ? Number(token.value) : 0,
    };
    if (Number.isFinite(token.duration_frames)) {
      cmd.durationFrames = Number(token.duration_frames);
    }
    if (Array.isArray(token.profile_points)) {
      cmd.profilePoints = (token.profile_points as unknown[])
        .filter((v: unknown): v is number => typeof v === "number" && Number.isFinite(v))
        .map(Number);
    }
    if (typeof token.tag === "string") {
      cmd.tag = token.tag;
    }
    commands.push(cmd);
  }
  commands.sort((a, b) => a.time - b.time);
  return commands;
}

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

  const framePeriod =
    typeof modelConfig.frame_period_sec === "number" &&
    Number.isFinite(modelConfig.frame_period_sec) &&
    modelConfig.frame_period_sec > 0
      ? modelConfig.frame_period_sec
      : LAYERED_F0_FRAME_PERIOD_SEC;
  const sampleRate = 1.0 / framePeriod;
  const numFrames = Math.ceil(totalDuration / framePeriod) + 1;

  // Resolve control smoothing filter.
  const filterConfig = modelConfig.filter;
  const usesOnePoleFilter = filterConfig?.type === "lowpass_1pole";
  let onePoleAlpha = usesOnePoleFilter ? filterConfig.default_alpha ?? 0.5 : 0.5;
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

  let cutoffHz = 2700;
  if (!usesOnePoleFilter) {
    cutoffHz = filterConfig?.type === "lowpass_2pole" ? filterConfig.default_cutoff ?? 2700 : 2700;
    if (filterConfig?.type === "lowpass_2pole" && filterConfig.cutoff_param && speakerParams) {
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
  let f0Minimum = 50;
  let f0ScaleFactor = 1.0;
  const f0Reference = scaleConfig?.reference ?? 130;
  let baseF0BiasHz = 0;

  if (scaleConfig && speakerParams) {
    if (scaleConfig.minimum_param) {
      const paramPath = scaleConfig.minimum_param.split(".");
      let val: unknown = speakerParams;
      for (const key of paramPath) {
        val = (val as Record<string, unknown>)?.[key];
      }
      if (typeof val === "number" && Number.isFinite(val)) {
        f0Minimum = val;
      }
    }
    if (scaleConfig.range_param) {
      const paramPath = scaleConfig.range_param.split(".");
      let val: unknown = speakerParams;
      for (const key of paramPath) {
        val = (val as Record<string, unknown>)?.[key];
      }
      if (typeof val === "number" && Number.isFinite(val)) {
        f0ScaleFactor = val;
      }
    }
    const baseF0Hz = (speakerParams as Record<string, unknown>)?.base_f0_hz;
    if (typeof baseF0Hz === "number" && Number.isFinite(baseF0Hz)) {
      baseF0BiasHz = baseF0Hz - f0Minimum / 10;
    }
  }

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
          const durationFrames = cmd.durationFrames ?? 20;
          impulses.push({
            value: cmd.value,
            decay: cmd.value / 4,
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
      f0Hz = (f0Minimum + (filtered - f0Reference) * f0ScaleFactor / 4096) / 10;
      f0Hz += baseF0BiasHz;
    } else {
      f0Hz = filtered;
    }
    f0Hz = Math.max(LAYERED_F0_MIN_HZ, Math.min(LAYERED_F0_MAX_HZ, f0Hz));
    rawF0Values[frame] = f0Hz;

    // Advance impulse decay for all impulse layers.
    for (const name of layerNames) {
      const cfg = modelConfig.layers[name];
      if (cfg.type !== "impulse") continue;
      const decayMode = cfg.decay ?? "halving";
      const impulses = activeImpulses.get(name)!;

      for (let i = impulses.length - 1; i >= 0; i--) {
        const imp = impulses[i];
        imp.remainingFrames--;

        if (imp.remainingFrames <= 0 || Math.abs(imp.value) < 0.01) {
          impulses.splice(i, 1);
          continue;
        }

        if (decayMode === "halving") {
          imp.value -= imp.decay;
          imp.decay = imp.decay / 2;
        } else if (decayMode === "linear") {
          imp.value -= imp.decay;
        } else if (decayMode === "exponential") {
          imp.value *= 0.9;
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
// Helpers -- F0 contour construction
// ---------------------------------------------------------------------------

export function compareAxisMark(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (typeof left === "number" && typeof right === "number") {
    return left < right ? -1 : 1;
  }
  const a = left == null ? "" : String(left);
  const b = right == null ? "" : String(right);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function parseTrailingInteger(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildF0ContourFromDeclarative(
  sequence: InputToken[],
  baseF0: number,
  syncTimeByKey?: Map<string, number>,
): F0Point[] {
  const points = sequence
    .filter(
      (token) =>
        token?.stream === "f0" &&
        token?.status !== 2 &&
        Number.isFinite(token?.value)
    )
    .slice()
    .sort((left: InputToken, right: InputToken) => {
      const leftTime = Number.isFinite(left?.time) ? Number(left.time) : null;
      const rightTime = Number.isFinite(right?.time) ? Number(right.time) : null;
      if (leftTime != null && rightTime != null && leftTime !== rightTime) {
        return leftTime < rightTime ? -1 : 1;
      }
      const byLeft = compareAxisMark(left?.anchor_left, right?.anchor_left);
      if (byLeft !== 0) return byLeft;
      const byRight = compareAxisMark(left?.anchor_right, right?.anchor_right);
      if (byRight !== 0) return byRight;
      const leftRatio = Number.isFinite(left?.ratio) ? Number(left.ratio) : 0;
      const rightRatio = Number.isFinite(right?.ratio) ? Number(right.ratio) : 0;
      if (leftRatio !== rightRatio) return leftRatio < rightRatio ? -1 : 1;
      const leftIdNum = parseTrailingInteger(left?.id ?? null);
      const rightIdNum = parseTrailingInteger(right?.id ?? null);
      if (leftIdNum != null && rightIdNum != null && leftIdNum !== rightIdNum) {
        return leftIdNum < rightIdNum ? -1 : 1;
      }
      return compareAxisMark(left?.id ?? "", right?.id ?? "");
    });

  if (points.length === 0) {
    return [{ time: 0, f0: baseF0 }];
  }

  const contour = points
    .map((point: InputToken): F0Point => {
      const tag = typeof point.tag === "string" ? point.tag : undefined;
      // Derive accentType from rule tag.
      // Citation: Pierrehumbert 1980 (H* and L* tone distinction)
      let accentType: string | undefined;
      if (tag === "f0_h_star") accentType = "H*";
      else if (tag === "f0_h_star_plus_l_peak") accentType = "H*+L";
      else if (tag === "f0_l_plus_h_star") accentType = "L+H*";
      else if (tag === "f0_h_plus_downstepped_h_star") accentType = "H+!H*";
      else if (tag === "f0_h_star_plus_h_peak") accentType = "H*+H";
      else if (tag === "f0_h_plus_l_star") accentType = "H+L*";
      else if (tag === "f0_l_star") accentType = "L*";
      else if (tag === "f0_l_star_plus_h") accentType = "L*+H";
      return {
        time: resolveAnchoredTimeSeconds(point, syncTimeByKey),
        f0: Number(point.value),
        ...(tag != null ? { tag } : {}),
        ...(accentType != null ? { accentType } : {}),
      };
    })
    .filter((point: F0Point) => point.time >= 0 && Number.isFinite(point.f0));

  if (contour.length === 0) return [{ time: 0, f0: baseF0 }];
  if (contour[0].time > 0) {
    contour.unshift({ time: 0, f0: baseF0 });
  }

  const cleaned = [contour[0]];
  for (let i = 1; i < contour.length; i += 1) {
    const prev = cleaned[cleaned.length - 1];
    const curr = contour[i];
    if (curr.time <= prev.time + 1e-6) {
      cleaned[cleaned.length - 1] = {
        time: prev.time,
        f0: curr.f0,
        ...(curr.tag != null ? { tag: curr.tag } : {}),
        ...(curr.accentType != null ? { accentType: curr.accentType } : {}),
      };
      continue;
    }
    cleaned.push(curr);
  }

  return cleaned;
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

/** Tags that indicate a phrase boundary, preventing sag across phrases. */
const BOUNDARY_TAGS = new Set([
  "f0_boundary_low",
  "f0_boundary_rise",
  "f0_register_reset",
]);

/**
 * Insert parabolic sag points between consecutive H* accent peaks.
 *
 * Pure function: takes an F0 contour and returns a new contour with additional
 * points that create the characteristic "dipping" shape between H*-H* pairs
 * described by Pierrehumbert (1980) and Ladd (2008).
 *
 * Model: f0(t) = f0_linear(t) - sagDepthHz * 4 * t * (1-t)
 * where t is normalized [0,1] between the two H* peaks.
 *
 * Three sag points are inserted at t=0.25, t=0.50, t=0.75 for smooth curvature.
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
function isHighPeakAccent(accentType: string | undefined): boolean {
  return (
    accentType === "H*" ||
    accentType === "L+H*" ||
    accentType === "H+!H*" ||
    accentType === "H*+L" ||
    accentType === "H*+H"
  );
}

export function applySaggingTransitions(
  contour: F0Point[],
  sagDepthHz: number = 12,
  minSpanMs: number = 150
): F0Point[] {
  if (contour.length < 2 || sagDepthHz <= 0) return [...contour];

  // Collect indices of high accent peaks (H* and L+H*).
  const hStarIndices: number[] = [];
  for (let i = 0; i < contour.length; i++) {
    if (isHighPeakAccent(contour[i].accentType)) {
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
      if (contour[j].tag && BOUNDARY_TAGS.has(contour[j].tag!)) {
        hasBoundary = true;
        break;
      }
    }
    if (hasBoundary) continue;

    // Insert sag points at t=0.25, t=0.50, t=0.75.
    // Formula: f0_sag(t) = f0_linear(t) - sagDepthHz * 4 * t * (1-t)
    // where f0_linear(t) = left.f0 + (right.f0 - left.f0) * t
    const tValues = [0.25, 0.5, 0.75];
    for (const t of tValues) {
      const time = left.time + span * t;
      const f0Linear = left.f0 + (right.f0 - left.f0) * t;
      const sagAmount = sagDepthHz * 4 * t * (1 - t);
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

// Hardcoded defaults — overridden by YAML output config when available
const DEFAULT_BLEND_FACTOR = 0.35;
const DEFAULT_SMOOTH_TYPES = new Set(["vowel", "nasal", "liquid", "glide"]);
const DEFAULT_BLEND_KEYS = ["F1", "F2", "F3", "B1", "B2", "B3"];
const DEFAULT_MIN_DURATION_STOP_RELEASE_MS = 5;
const DEFAULT_MIN_DURATION_MS = 20;
const DEFAULT_FINAL_SILENCE_MS = 100;

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

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Convert a phone sequence and full parameter sequence (including F0 stream)
 * into an array of Klatt frames (the "track").
 *
 * @param phoneSequence  Phones only (stream !== "f0", status !== 2).
 * @param parameterSequence  Full sequence including F0 stream tokens.
 * @param options  Base F0 and transition duration.
 * @returns KlattFrame[] with monotonically increasing times.
 */
export function assembleKlattTrack(
  phoneSequence: InputToken[],
  parameterSequence: InputToken[],
  options: AssembleTrackOptions,
): KlattFrame[] {
  const inventorySpec = options.inventorySpec ?? loadInventorySpecFromPath('/rules/frontends/qlatt-english/inventory.yaml');
  const phonemeTargetMap = inventorySpec.phoneme_targets as Record<string, Record<string, any> | undefined>;
  const baseParams = inventorySpec.base_params;
  const baseF0 = options.baseF0 ?? 110;
  const cfg = options.outputConfig;
  const vq = options.voiceQuality;
  const transitionMs = options.transitionMs ?? cfg?.transition_ms ?? 30;

  // Resolve blend config from YAML, falling back to hardcoded defaults.
  const blendFactor = cfg?.blend?.factor ?? DEFAULT_BLEND_FACTOR;
  const blendKeys = cfg?.blend?.keys ?? DEFAULT_BLEND_KEYS;
  const smoothTypes = cfg?.blend?.smooth_types
    ? new Set(cfg.blend.smooth_types)
    : DEFAULT_SMOOTH_TYPES;
  const minDurationStopReleaseMs =
    cfg?.min_duration?.stop_release_ms ?? DEFAULT_MIN_DURATION_STOP_RELEASE_MS;
  const minDurationDefaultMs =
    cfg?.min_duration?.default_ms ?? DEFAULT_MIN_DURATION_MS;
  const finalSilenceMs = cfg?.final_silence_ms ?? DEFAULT_FINAL_SILENCE_MS;
  const syncTimeByKey = buildSyncTimeMap(
    phoneSequence,
    minDurationStopReleaseMs,
    minDurationDefaultMs,
    inventorySpec.phoneme_targets,
  );

  // Build the F0 contour.
  // If f0Model is present, use the layered additive renderer.
  // Otherwise, use the existing declarative point-interpolation path.
  // Citations: Fujisaki (command-response), Klatt 1982 (hat-pattern),
  //            Rabiner 1968 (three-component F0)
  let f0Contour: F0Point[];
  if (options.f0Model && options.f0Model.type === "layered_additive") {
    // Compute total duration from phone sequence for the layered renderer.
    let totalDuration = 0;
    for (const ph of phoneSequence) {
      const isStopRel = ph.type === "stop_release" || ph.type === "stop_aspiration";
      const minDur = isStopRel ? minDurationStopReleaseMs : minDurationDefaultMs;
      const fallbackDur = isStopRel ? toFiniteNumber(phonemeTargetMap[ph.phoneme]?.dur) : null;
      totalDuration += resolveTokenDurationMs(ph, minDur, fallbackDur) / 1000.0;
    }
    totalDuration += finalSilenceMs / 1000.0;

    const layerCommands = extractLayerCommands(parameterSequence, syncTimeByKey);
    f0Contour = renderLayeredF0(
      layerCommands,
      options.f0Model,
      totalDuration,
      options.speakerParams,
    );
  } else {
    // Existing declarative point-interpolation path.
    const rawF0Contour = buildF0ContourFromDeclarative(
      parameterSequence,
      baseF0,
      syncTimeByKey,
    );

    // Apply sagging transitions between consecutive H* accent peaks.
    // Citation: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
    // Citation: Ladd 2008 pp.155-157 (sagging transition between H* accents)
    const sagDepth = options.sagDepthHz ?? 12;
    const sagMinSpan = options.sagMinSpanMs ?? 150;
    f0Contour = applySaggingTransitions(rawF0Contour, sagDepth, sagMinSpan);
  }

  const klattTrack: KlattFrame[] = [];
  let currentTime = 0;
  const transitionSec = Math.max(0, transitionMs) / 1000.0;
  const resolvedControlWindowsByIndex = collectResolvedControlWindows(
    phoneSequence,
    minDurationStopReleaseMs,
    minDurationDefaultMs,
    phonemeTargetMap,
  );

  // Start silent.
  const silParams = fillDefaultParams(phonemeTargetMap["SIL"], baseParams);
  if (vq) applyVoiceQualityOverrides(silParams, vq);
  klattTrack.push({
    time: 0,
    params: silParams,
  });

  for (let i = 0; i < phoneSequence.length; i++) {
    const ph = phoneSequence[i] as InputToken;
    // Respect explicit rule-assigned durations; fall back to inventory defaults only
    // when a release/aspiration token did not receive a declarative duration.
    const isStopRelease = ph.type === "stop_release" || ph.type === "stop_aspiration";
    const minDuration = isStopRelease ? minDurationStopReleaseMs : minDurationDefaultMs;
    const fallbackDuration = isStopRelease ? toFiniteNumber(phonemeTargetMap[ph.phoneme]?.dur) : null;
    const phDuration = resolveTokenDurationMs(ph, minDuration, fallbackDuration) / 1000.0;
    const segmentStart = currentTime;

    if (phDuration <= 0) {
      console.warn(
        `[TTS Frontend DEBUG] Calculated duration is non-positive (${phDuration.toFixed(
          4
        )}s) for ${ph.phoneme}. Original duration: ${ph.duration}ms. Skipping.`
      );
      continue;
    }
    const targetTime = segmentStart + phDuration;

    // Use the params object directly from the sequence (already filled and potentially modified by rules)
    const finalParams: KlattParams = ph.params
      ? { ...ph.params }
      : fillDefaultParams(phonemeTargetMap["SIL"], baseParams);

    // Apply voice quality overrides (Rd, OQ, TL, flutter, jitter, AH offset).
    // Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009
    if (vq) applyVoiceQualityOverrides(finalParams, vq);
    const controlWindows = resolvedControlWindowsByIndex[i] ?? [];

    // Determine and set F0.
    const segmentVoiced = segmentCanVoice(finalParams, controlWindows);
    const interiorF0Anchors = segmentVoiced
      ? getInteriorF0AnchorTimes(f0Contour, segmentStart, targetTime)
      : [];

    if (targetTime > segmentStart) {
      const nextPh = phoneSequence[i + 1] as InputToken | undefined;
      const canSmooth =
        transitionSec > 0 &&
        smoothTypes.has(ph.type) &&
        smoothTypes.has(nextPh?.type);
      const steadyTime = canSmooth
        ? Math.max(segmentStart + 0.02, targetTime - transitionSec)
        : null;
      const transitionParams =
        steadyTime && steadyTime > segmentStart && steadyTime < targetTime
          ? blendParams(finalParams, nextPh?.params, blendKeys, blendFactor)
          : null;
      const eventTimes = buildSegmentEventTimes(
        segmentStart,
        targetTime,
        steadyTime,
        interiorF0Anchors,
        controlWindows,
        nextPh == null && controlWindows.length > 0
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
          ph.phoneme === "SIL" || !voicedAtEvent ? 0 : getF0AtTime(f0Contour, eventTime);
        if (voicedAtEvent && eventF0 < 1) {
          eventF0 = baseF0 / 2;
        }
        eventParams.F0 = eventF0;

        klattTrack.push({
          time: eventTime,
          phoneme: ph.phoneme,
          word: ph.word,
          params: eventParams,
        });
      }

      currentTime = targetTime;
    }
  }

  // Add final silence.
  const finalTime = currentTime + finalSilenceMs / 1000.0;
  const finalSilParams = fillDefaultParams(phonemeTargetMap["SIL"], baseParams);
  if (vq) applyVoiceQualityOverrides(finalSilParams, vq);
  klattTrack.push({
    time: finalTime,
    phoneme: "SIL",
    params: finalSilParams,
  });

  return klattTrack;
}
