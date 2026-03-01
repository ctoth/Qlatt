/**
 * Track Assembler -- converts a finalized phone sequence + F0 contour
 * into a KlattFrame[] (the "track") suitable for the interpreter.
 *
 * Pure function: data in, frames out.  No side effects, no global state.
 *
 * Extracted from tts-frontend.ts (Phase 5 refactor).
 */
import {
  PHONEME_TARGETS,
  fillDefaultParams,
} from "./declarative-frontend/inventory";
import type { KlattFrame } from "./tts-frontend-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InputToken = Record<string, any>;
type KlattParams = Record<string, number>;

export const PHONEME_TARGET_MAP = PHONEME_TARGETS as Record<string, Record<string, any> | undefined>;

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
  /** Value in Hz (or internal F0 units). */
  value: number;
  /** For impulse layers: duration in internal frames. */
  durationFrames?: number;
  /** For profile layers: array of control point values. */
  profilePoints?: number[];
  /** Provenance tag. */
  tag?: string;
};

/** Internal frame rate for the IIR filter (seconds per frame).
 *  5ms frames (200 Hz) -- close to DECtalk's 6.4ms but at a round number. */
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
  sequence: InputToken[]
): F0LayerCommand[] {
  const commands: F0LayerCommand[] = [];
  for (const token of sequence) {
    if (token?.stream !== "f0_layer") continue;
    if (token?.status === 2) continue;
    const cmd: F0LayerCommand = {
      layer: typeof token.layer === "string" ? token.layer : "",
      time: Number.isFinite(token.time) ? Number(token.time) / 1000 : 0,
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
 * Generates internal frames at the fixed LAYERED_F0_FRAME_PERIOD_SEC rate,
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

  const framePeriod = LAYERED_F0_FRAME_PERIOD_SEC;
  const sampleRate = 1.0 / framePeriod;
  const numFrames = Math.ceil(totalDuration / framePeriod) + 1;

  // Resolve filter cutoff.
  let cutoffHz = modelConfig.filter?.default_cutoff ?? 2700;
  if (modelConfig.filter?.cutoff_param && speakerParams) {
    const paramPath = modelConfig.filter.cutoff_param.split(".");
    let val: unknown = speakerParams;
    for (const key of paramPath) {
      val = (val as Record<string, unknown>)?.[key];
    }
    if (typeof val === "number" && Number.isFinite(val) && val > 0) {
      cutoffHz = val;
    }
  }
  cutoffHz = Math.max(1, Math.min(cutoffHz, sampleRate * 0.45));

  const filterCoeffs = computeButterworth2Coefficients(cutoffHz, sampleRate);
  const filterState = createFilterState();

  // Resolve speaker scaling parameters.
  const scaleConfig = modelConfig.speaker_scale;
  let f0Minimum = 50;
  let f0ScaleFactor = 1.0;
  const f0Reference = scaleConfig?.reference ?? 130;

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
      filterState.y1 = initTotal;
      filterState.y2 = initTotal;
      filterState.x1 = initTotal;
      filterState.x2 = initTotal;
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
    const filtered = iirFilter2Pole(total, filterState, filterCoeffs);

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
  baseF0: number
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
        time: Number.isFinite(point.time) ? Number(point.time) / 1000 : 0,
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
  options: AssembleTrackOptions = {}
): KlattFrame[] {
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
      const tgtDur = isStopRel ? PHONEME_TARGET_MAP[ph.phoneme]?.dur : null;
      const phDurationMs = Number.isFinite(tgtDur) ? tgtDur : (ph.duration || 100);
      totalDuration += Math.max(minDur, phDurationMs) / 1000.0;
    }
    totalDuration += finalSilenceMs / 1000.0;

    const layerCommands = extractLayerCommands(parameterSequence);
    f0Contour = renderLayeredF0(
      layerCommands,
      options.f0Model,
      totalDuration,
      options.speakerParams,
    );
  } else {
    // Existing declarative point-interpolation path.
    const rawF0Contour = buildF0ContourFromDeclarative(parameterSequence, baseF0);

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

  // Start silent.
  const silParams = fillDefaultParams(PHONEME_TARGET_MAP["SIL"]);
  if (vq) applyVoiceQualityOverrides(silParams, vq);
  klattTrack.push({
    time: 0,
    params: silParams,
  });

  for (let i = 0; i < phoneSequence.length; i++) {
    const ph = phoneSequence[i] as InputToken;
    // Stop releases/aspiration must use their fixed MITalk durations (5-25ms)
    const isStopRelease = ph.type === "stop_release" || ph.type === "stop_aspiration";
    const minDuration = isStopRelease ? minDurationStopReleaseMs : minDurationDefaultMs;
    const targetDur = isStopRelease ? PHONEME_TARGET_MAP[ph.phoneme]?.dur : null;
    const phDurationMs = Number.isFinite(targetDur) ? targetDur : (ph.duration || 100);
    const phDuration = Math.max(minDuration, phDurationMs) / 1000.0;
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
      : fillDefaultParams(PHONEME_TARGET_MAP["SIL"]);

    // Apply voice quality overrides (Rd, OQ, TL, flutter, jitter, AH offset).
    // Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009
    if (vq) applyVoiceQualityOverrides(finalParams, vq);

    // Determine and set F0.
    const isTargetVoiced = finalParams.AV > 0 || finalParams.AVS > 0;
    const f0FromContour = getF0AtTime(f0Contour, segmentStart);
    let calculatedF0 = isTargetVoiced ? f0FromContour : 0;
    if (ph.phoneme === "SIL") calculatedF0 = 0;
    if (isTargetVoiced && calculatedF0 < 1) {
      calculatedF0 = baseF0 / 2;
    }
    finalParams.F0 = calculatedF0;
    const interiorF0Anchors = isTargetVoiced
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

      klattTrack.push({
        time: segmentStart,
        phoneme: ph.phoneme,
        word: ph.word,
        params: finalParams,
      });

      const pushAnchorFrame = (time: number, sourceParams: KlattParams): void => {
        const anchorParams = { ...sourceParams, F0: ph.phoneme === "SIL" ? 0 : getF0AtTime(f0Contour, time) };
        klattTrack.push({
          time,
          phoneme: ph.phoneme,
          word: ph.word,
          params: anchorParams,
        });
      };

      const epsilon = 1e-6;
      const preSteadyAnchors = steadyTime
        ? interiorF0Anchors.filter((time) => time < steadyTime - epsilon)
        : interiorF0Anchors;
      const postSteadyAnchors = steadyTime
        ? interiorF0Anchors.filter((time) => time > steadyTime + epsilon)
        : [];

      for (const anchorTime of preSteadyAnchors) {
        pushAnchorFrame(anchorTime, finalParams);
      }

      if (steadyTime && steadyTime > segmentStart && steadyTime < targetTime) {
        // blendParams copies from finalParams (already has vq applied) for non-blend keys.
        // Only F1-F3, B1-B3 are blended; Rd, OQ, TL, flutter, jitter, AH carry through.
        const transitionParams = blendParams(finalParams, nextPh?.params, blendKeys, blendFactor);
        const transitionF0 = isTargetVoiced ? getF0AtTime(f0Contour, steadyTime) : 0;
        transitionParams.F0 = ph.phoneme === "SIL" ? 0 : transitionF0;
        klattTrack.push({
          time: steadyTime,
          phoneme: ph.phoneme,
          word: ph.word,
          params: transitionParams,
        });

        for (const anchorTime of postSteadyAnchors) {
          pushAnchorFrame(anchorTime, transitionParams);
        }
      }
      currentTime = targetTime;
    }
  }

  // Add final silence.
  const finalTime = currentTime + finalSilenceMs / 1000.0;
  const finalSilParams = fillDefaultParams(PHONEME_TARGET_MAP["SIL"]);
  if (vq) applyVoiceQualityOverrides(finalSilParams, vq);
  klattTrack.push({
    time: finalTime,
    phoneme: "SIL",
    params: finalSilParams,
  });

  return klattTrack;
}
