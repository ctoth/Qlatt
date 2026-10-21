/**
 * HRG lowering — the single final pass: project leaf `Segment` features into a
 * sparse timestamped Klatt automation-event track (the synthesizer's input vocabulary,
 * `KlattFrame` from tts-frontend-types). Each emitted param carries the
 * decision id of the write that produced it, so the lowered track is itself
 * queryable (see provenance-query.ts).
 *
 * Segment, F0Point, Tilt, and PhraseCommand values are projected here. Affect
 * and speaker/source projection join the same pass in their Phase 4 families.
 *
 * Citations: Klatt 1980 (time-varying control parameters); Allen 1987 MITalk PHONET (flatten
 * the structure to a parameter track only at the end);
 * design/beauty-synthesis/11-sota-frontend-architecture.md §5 (one final lowering).
 */

import { describeRenderStatus, getF0FilterExports, RENDER_OK } from "../../f0-filters-loader";
import { projectRd } from "../../input/rd-policy";
import {
  VQ_FIELDS,
  VQ_MULTIPLICATIVE_FIELDS,
  VQ_NEUTRAL,
  VQ_PARAM_CHANNELS,
} from "../../input/vq-channels";
import type { KlattFrame } from "../../tts-frontend-types";
import { isPlainObject } from "../../yaml-loader";
import { frameValueIndex, isFrameValues } from "./frame-program";
import { buildHolmesTransitions, sampleHolmesCurve } from "./holmes-transitions";
import type { Item } from "./item";
import { PARAMETER_SCOPE_FEATURE } from "./parameter-scope";
import { applyScalarOp } from "./scalar-op";
import type { FeatureValue } from "./types";
import type { Utterance } from "./utterance";

type LocusEntry = {
  locus_hz: number;
  prcnt: number;
  durtran_ms: number;
};

type LocusTable = Readonly<
  Record<string, Readonly<Record<string, Readonly<Record<string, LocusEntry>>>>>
>;
type VowelCategoryTable = Readonly<Record<string, { forward?: number; backward?: number }>>;

type LayerType =
  | "profile"
  | "persistent"
  | "impulse"
  | "glide"
  | "dectalk_segmental"
  | "range"
  | "floor"
  | "dectalk_user_target";
type DecayMode = "halving" | "step_plus_ramp" | "exponential" | "step_plus_rise";

/**
 * Layers whose commands DECtalk's make_f0_command() issues on the controller
 * clock (ph_inton1.c:1857-1902: steps, impulses, glides and user targets), as
 * against the per-allophone and whole-clause layers.
 */
const isClockedCommandLayer = (type: LayerType | undefined): boolean =>
  type === "persistent" || type === "impulse" || type === "glide" || type === "dectalk_user_target";

type LayerConfig = {
  type: LayerType;
  decay?: DecayMode;
  initial_decay_divisor?: number;
  termination_threshold?: number;
  exponential_factor?: number;
  /**
   * On a dectalk_segmental layer: the dip in F0 around a glottal-stop
   * gesture, `distance * slope - depth` within `reach_frames` of it, and the
   * frame of an allophone at which the gesture at its end is taken up.
   * Absent: no dip.
   */
  glottal_gesture?: {
    depth: number;
    slope: number;
    reach_frames: number;
    latch_frame: number;
  };
  /**
   * On a dectalk_user_target layer (F0 a user wrote on phonemes: DECtalk
   * 4.63 Ph_drwt02.c set_user_target 3953-4026, linear_interp 4249-4290). A
   * command's value is its target in Hz * 10 and its first profile point says
   * the target is a sung note. A stretch with such a command is drawn from
   * this layer alone, with the glottal gesture of the segmental layer.
   */
  /** What a sung stretch's F0 is multiplied by, out of 4096. */
  note_scale?: number;
  /** The vibrato of a sung note: its phase's gain in a frame, and the bits its cosine is shifted down. */
  vibrato?: { phase_step: number; shift: number };
  /** The bits a move to a note is shifted down to give its change in a frame, times four. */
  note_transition_shift?: number;
};

type LayeredFilterConfig = {
  type: "lowpass_2pole_coefficient";
  alpha_param?: string;
  default_alpha: number;
  /**
   * Bits the filter's state and input are shifted down and its output up
   * (default 0). The shift drops bits, so it changes the output.
   */
  scale_shift?: number;
};

type SpeakerScaleConfig = {
  minimum_param: string;
  range_param: string;
  pivot: number;
  divisor: number;
  output_scale: number;
  /** Shift the scaled output by a declared target-minus-reference pitch in Hz. */
  pitch_offset?: {
    target_param: string;
    reference_param: string;
  };
};

export type LayeredF0ModelConfig = {
  type: "layered_additive";
  frame_period_sec: number;
  output_frame_period_sec?: number;
  filter: LayeredFilterConfig;
  layers: Readonly<Record<string, LayerConfig>>;
  speaker_scale?: SpeakerScaleConfig;
  output_clamp: { min_hz: number; max_hz: number };
  /**
   * What the model takes instead for a voice of the keyed sex: the filter,
   * layers and speaker-scale fields given replace the model's own.
   */
  by_sex?: Readonly<Record<string, F0ModelVoiceOverlay>>;
};

type F0ModelVoiceOverlay = {
  filter?: Partial<LayeredFilterConfig>;
  layers?: Readonly<Record<string, Partial<LayerConfig>>>;
  speaker_scale?: Partial<SpeakerScaleConfig>;
};

/** The model a voice of `sex` renders with: `model` under its `by_sex` entry. */
export function f0ModelForVoice(
  model: LayeredF0ModelConfig,
  sex: string | undefined,
): LayeredF0ModelConfig {
  const overlay = sex == null ? undefined : model.by_sex?.[sex];
  if (!overlay) return model;
  const layers: Record<string, LayerConfig> = { ...model.layers };
  for (const [name, fields] of Object.entries(overlay.layers ?? {})) {
    const base = layers[name];
    if (!base) throw new Error(`E_HRG_LOWER_F0_MODEL: by_sex.${sex} names unknown layer '${name}'`);
    layers[name] = { ...base, ...fields };
  }
  return {
    ...model,
    filter: { ...model.filter, ...overlay.filter },
    layers,
    ...(model.speaker_scale
      ? { speaker_scale: { ...model.speaker_scale, ...overlay.speaker_scale } }
      : {}),
  };
}

type F0LayerCommand = {
  layer: string;
  time: number;
  value: number;
  durationFrames?: number;
  profilePoints?: number[];
  tag?: string;
};

interface CitedNumber {
  value: number;
  citations?: readonly string[];
}

export interface LowerOptions {
  /** Optional configuration identity retained for diagnostics and inspection. */
  id?: string;
  /** Required backend parameter columns, in declared output order. */
  columns: readonly string[];
  /** Selected frontend timing policy. No bundled fallback is permitted. */
  timeline: {
    initial_silence_ms: CitedNumber;
    /**
     * Segment feature holding a rule-computed initial silence in ms. When the
     * utterance's first active Segment carries a stamped number under this
     * key it replaces `initial_silence_ms`.
     */
    initial_silence_key?: string;
    final_silence_ms: CitedNumber;
    duration_floors: {
      stop_release_ms: CitedNumber;
      default_ms: CitedNumber;
    };
    event_points: {
      include_segment_start: boolean;
      include_control_boundaries: boolean;
      include_f0_anchors: boolean;
      include_transition_steady_time: boolean;
    };
  };
  transitions: {
    native_frame_ms?: CitedNumber;
    min_transition_edge_ms: CitedNumber;
    default_transition_ms: CitedNumber;
    blend: {
      factor: CitedNumber;
      keys: readonly string[];
      smooth_types: readonly string[];
      smooth_all_boundaries?: boolean;
      step_keys_by_phoneme?: Readonly<Record<string, readonly string[]>>;
    };
    sonorant_f2?: {
      key: string;
      span_ms: CitedNumber;
      neighbor_weight: CitedNumber;
      current_type: string;
      neighbor_types: readonly string[];
      forward: boolean;
      backward: boolean;
    };
    loci?: LocusTable;
    loci_female?: LocusTable;
    vowel_category?: VowelCategoryTable;
    obstruent_place?: Readonly<Record<string, { palatal_or_dental?: boolean }>>;
    rounded_sonorant_consonant?: readonly string[];
    f2_back?: Readonly<Record<string, { forward?: boolean; backward?: boolean }>>;
    locus_glue_types?: readonly string[];
  };
  f0?: {
    renderer: { type: "point_interpolation" | "layered_additive" };
    layered_model_ref?: string;
    output_clamp: {
      min_hz: CitedNumber;
      max_hz: CitedNumber;
    };
  };
  overlays?: {
    operation_order: readonly string[];
  };
  /** Feature key holding each segment's realized duration in ms (default "duration"). */
  durationKey?: string;
  /** Feature key holding each segment's phoneme label (default "phoneme"). */
  phonemeKey?: string;
  /** Feature key holding the segment class used by duration policy (default "type"). */
  typeKey?: string;
}

export type LowerContext = {
  f0Model?: LayeredF0ModelConfig;
  /**
   * Segment features that hold per-frame column values written by frame
   * programs (frame-program.ts, FrameValues). Each frame of such a feature is
   * an event point, and its columns override the Segment's own values.
   */
  frameValueFeatures?: readonly string[];
  speakerParams?: Readonly<Record<string, unknown>>;
  speakerSex?: string;
  /**
   * By parameter scope (parameter-scope.ts), "" for no scope: what an F0
   * clause whose commands are in the scope takes in place of `speakerParams`
   * and `speakerSex`, and the parameters every frame that a frame program ran
   * in the scope adds to the track (FrameValues.scopes).
   */
  scopes?: Readonly<
    Record<
      string,
      {
        speakerParams?: Readonly<Record<string, unknown>>;
        speakerSex?: string;
        frameParams?: Readonly<Record<string, number>>;
      }
    >
  >;
  silence?: {
    symbol: string;
    initialParams: Readonly<Record<string, number>>;
    finalParams: Readonly<Record<string, number>>;
    decisionId: string;
  };
};

/** Per-segment realized timing window (ms). */
export interface SegmentTiming {
  item: Item;
  startMs: number;
  endMs: number;
  durationMs: number;
}

export interface LoweredTrack {
  frames: KlattFrame[];
  /** Parallel to `frames`: paramKey -> decision id that produced it. */
  provenanceByFrame: Array<Record<string, string>>;
  totalMs: number;
  paramKeys: string[];
  timings: SegmentTiming[];
  utterance: Utterance;
}

/** Recover the already compiler-validated lowering policy without a second representation. */
export function readLowerOptions(value: unknown): LowerOptions {
  if (!isPlainObject(value)) {
    throw new Error("E_HRG_LOWER_POLICY: output.lowering must be an object");
  }
  if (
    !Array.isArray(value.columns) ||
    !value.columns.every((column) => typeof column === "string")
  ) {
    throw new Error("E_HRG_LOWER_POLICY: output.lowering.columns must be string[]");
  }
  if (!isPlainObject(value.timeline) || !isPlainObject(value.transitions)) {
    throw new Error("E_HRG_LOWER_POLICY: output.lowering timeline/transitions are required");
  }
  const candidate: unknown = value;
  if (!isLowerOptions(candidate)) {
    throw new Error("E_HRG_LOWER_POLICY: compiled lowering policy is incomplete");
  }
  return candidate;
}

function isLowerOptions(value: unknown): value is LowerOptions {
  if (!isPlainObject(value) || !Array.isArray(value.columns)) return false;
  if (!isPlainObject(value.timeline) || !isPlainObject(value.transitions)) return false;
  const timeline = value.timeline;
  const transitions = value.transitions;
  return (
    value.columns.every((column) => typeof column === "string") &&
    isPlainObject(timeline.initial_silence_ms) &&
    isPlainObject(timeline.final_silence_ms) &&
    isPlainObject(timeline.duration_floors) &&
    isPlainObject(timeline.event_points) &&
    isPlainObject(transitions.min_transition_edge_ms) &&
    typeof transitions.min_transition_edge_ms.value === "number" &&
    Number.isFinite(transitions.min_transition_edge_ms.value) &&
    transitions.min_transition_edge_ms.value > 0 &&
    isPlainObject(transitions.default_transition_ms) &&
    isPlainObject(transitions.blend)
  );
}

type ControlFieldOperation = "set" | "add" | "mul" | "max" | "min" | "unset";

type ResolvedControlField = {
  operation: ControlFieldOperation;
  value?: number;
};

type ResolvedControlWindow = {
  startMs: number;
  endMs: number;
  fields: Readonly<Record<string, ResolvedControlField>>;
  decisionId: string;
};

type ResolvedSegmentTransition = {
  startMs: number;
  fields: Readonly<Record<string, number>>;
  endMs?: number;
  linearFields?: Readonly<Record<string, { startValue: number; endValue: number }>>;
};

type ResolvedF0Point = {
  decisionId: string;
  timeMs: number;
  valueHz: number;
};

const AFFECT_FIELDS = VQ_FIELDS;

type AffectField = (typeof AFFECT_FIELDS)[number];
type AffectValues = Record<AffectField, number>;

type ResolvedAffect = {
  values: AffectValues;
  decisions: Partial<Record<AffectField, string>>;
};

type AffectDirective = {
  syllableIds?: ReadonlySet<string>;
  declarationOrder: number;
  decisionId: string;
  fields: ReadonlySet<AffectField>;
  precedence: number;
  scope: { kind: "utterance" } | { kind: "token_range"; startToken: number; endToken: number };
  values: AffectValues;
};

const NEUTRAL_AFFECT: Readonly<AffectValues> = VQ_NEUTRAL;

const MULTIPLICATIVE_AFFECT_FIELDS = new Set(VQ_MULTIPLICATIVE_FIELDS);

const AFFECT_PROJECTION_TABLE = VQ_PARAM_CHANNELS.map((row) => ({
  backendKey: row.backend_param,
  affectField: row.channel,
  mode: row.algebra === "mul" ? "scale" : "add",
  floor: row.floor ?? -Infinity,
}));

function isFeatureObject(
  value: FeatureValue | undefined,
): value is { readonly [key: string]: FeatureValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteFeatureNumber(value: FeatureValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isAffectField(value: FeatureValue): value is AffectField {
  return typeof value === "string" && AFFECT_FIELDS.some((field) => field === value);
}

function parseAffectValues(value: FeatureValue | undefined, itemId: string): AffectValues {
  if (!isFeatureObject(value)) {
    throw new Error(`E_HRG_LOWER_AFFECT_DELTA: Affect Item '${itemId}' requires a typed delta`);
  }
  const parsed = { ...NEUTRAL_AFFECT };
  for (const field of AFFECT_FIELDS) {
    const number = finiteFeatureNumber(value[field]);
    if (number == null) {
      throw new Error(`E_HRG_LOWER_AFFECT_DELTA: Affect Item '${itemId}' has invalid '${field}'`);
    }
    parsed[field] = number;
  }
  return parsed;
}

function composeAffectField(base: number, over: number, field: AffectField): number {
  return MULTIPLICATIVE_AFFECT_FIELDS.has(field) ? base * over : base + over;
}

function parseControlFields(value: FeatureValue | undefined): Record<string, ResolvedControlField> {
  if (!isFeatureObject(value)) {
    throw new Error("E_HRG_LOWER_CONTROL_WINDOW: fields must be a typed object");
  }
  const fields: Record<string, ResolvedControlField> = {};
  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
      fields[fieldName] = { operation: "set", value: fieldValue };
      continue;
    }
    if (!isFeatureObject(fieldValue) || typeof fieldValue.op !== "string") {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: field '${fieldName}' is invalid`);
    }
    const operation = fieldValue.op;
    if (
      operation !== "set" &&
      operation !== "add" &&
      operation !== "mul" &&
      operation !== "max" &&
      operation !== "min" &&
      operation !== "unset"
    ) {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: field '${fieldName}' has invalid operation`);
    }
    if (operation === "unset") {
      fields[fieldName] = { operation };
      continue;
    }
    const operand = finiteFeatureNumber(fieldValue.value);
    if (operand == null) {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: field '${fieldName}' requires a finite value`);
    }
    fields[fieldName] = { operation, value: operand };
  }
  if (Object.keys(fields).length === 0) {
    throw new Error("E_HRG_LOWER_CONTROL_WINDOW: fields cannot be empty");
  }
  return fields;
}

function resolveWindowSpan(
  value: { readonly [key: string]: FeatureValue },
  durationMs: number,
  earliestStartMs = 0,
): { startMs: number; endMs: number } | null {
  const prefixMs = finiteFeatureNumber(value.prefix_ms);
  if (prefixMs != null) {
    const endMs = Math.max(0, Math.min(durationMs, prefixMs));
    return endMs > 0 ? { startMs: 0, endMs } : null;
  }
  const suffixMs = finiteFeatureNumber(value.suffix_ms);
  if (suffixMs != null) {
    const spanMs = Math.max(0, Math.min(durationMs, suffixMs));
    const startMs = Math.max(0, durationMs - spanMs);
    return durationMs > startMs ? { startMs, endMs: durationMs } : null;
  }
  const startMsValue = finiteFeatureNumber(value.start_ms);
  const endMsValue = finiteFeatureNumber(value.end_ms);
  const startRatio = finiteFeatureNumber(value.start_ratio);
  const endRatio = finiteFeatureNumber(value.end_ratio);
  const rawStartMs = startMsValue ?? durationMs * Math.max(0, Math.min(1, startRatio ?? 0));
  const rawEndMs = endMsValue ?? durationMs * Math.max(0, Math.min(1, endRatio ?? 1));
  const startMs = Math.max(earliestStartMs, Math.min(durationMs, rawStartMs));
  const endMs = Math.max(startMs, Math.max(earliestStartMs, Math.min(durationMs, rawEndMs)));
  return endMs > startMs ? { startMs, endMs } : null;
}

function resolveControlField(
  baseValue: number | undefined,
  field: ResolvedControlField,
): number | undefined {
  switch (field.operation) {
    case "unset":
      return undefined;
    case "set":
      return field.value;
    case "add":
      return applyScalarOp("add", baseValue ?? 0, field.value ?? 0);
    case "mul":
      return applyScalarOp("mul", baseValue ?? 0, field.value ?? 1);
    case "max":
      return applyScalarOp(
        "max",
        baseValue ?? Number.NEGATIVE_INFINITY,
        field.value ?? Number.NEGATIVE_INFINITY,
      );
    case "min":
      return applyScalarOp(
        "min",
        baseValue ?? Number.POSITIVE_INFINITY,
        field.value ?? Number.POSITIVE_INFINITY,
      );
  }
}

function resolveLocusFormants(
  vowel: Item,
  obstruent: Item,
  edge: "forward" | "backward",
  loci: LocusTable | undefined,
  options: LowerOptions,
  phonemeKey: string,
): Array<{ key: string; boundaryValue: number; spanMs: number }> {
  const categories = options.transitions.vowel_category;
  const vowelPhoneme = vowel.get(phonemeKey);
  const obstruentPhoneme = obstruent.get(phonemeKey);
  if (
    !loci ||
    !categories ||
    typeof vowelPhoneme !== "string" ||
    typeof obstruentPhoneme !== "string"
  ) {
    return [];
  }
  const category = categories[vowelPhoneme];
  const categoryId = edge === "forward" ? category?.forward : category?.backward;
  const formants = categoryId == null ? undefined : loci[obstruentPhoneme]?.[String(categoryId)];
  if (!formants) return [];
  const rounded = options.transitions.rounded_sonorant_consonant?.includes(vowelPhoneme) ?? false;
  const palatalOrDental =
    options.transitions.obstruent_place?.[obstruentPhoneme]?.palatal_or_dental ?? false;
  const f2Back =
    edge === "forward"
      ? options.transitions.f2_back?.[vowelPhoneme]?.forward === true
      : options.transitions.f2_back?.[vowelPhoneme]?.backward === true;
  const resolved: Array<{ key: string; boundaryValue: number; spanMs: number }> = [];
  for (const key of options.transitions.blend.keys) {
    const entry = formants[key];
    const currentValue = vowel.get(key);
    if (!entry || typeof currentValue !== "number") continue;
    let percent = entry.prcnt;
    let spanMs = entry.durtran_ms;
    if (rounded && (key === "F2" || key === "F3") && !palatalOrDental) {
      percent = Math.floor(percent / 2) + 50;
    }
    if (key === "F2" && f2Back) {
      percent += 25 - Math.floor(percent / 4);
      spanMs = Math.floor(spanMs / 2) + 2;
    }
    const boundaryValue = entry.locus_hz + (percent * (currentValue - entry.locus_hz)) / 100;
    if (Number.isFinite(boundaryValue) && Number.isFinite(spanMs) && spanMs > 0) {
      resolved.push({ key, boundaryValue, spanMs });
    }
  }
  return resolved;
}

function requirePolicyNumber(value: number, path: string, utterance: Utterance): number {
  if (!Number.isFinite(value) || value < 0) {
    utterance.diagnostics.error(
      "Selected lowering policy requires a finite non-negative number",
      { path, value },
      "HRG_LOWER_POLICY_REJECTED",
    );
    throw new Error(`E_HRG_LOWER_POLICY_NUMBER: '${path}' must be finite and non-negative`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`E_HRG_LOWER_F0_MODEL: '${path}' must be finite`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, path: string): number {
  const number = requireFiniteNumber(value, path);
  if (number <= 0) throw new Error(`E_HRG_LOWER_F0_MODEL: '${path}' must be positive`);
  return number;
}

function isUnknownObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function resolveSpeakerNumber(
  speakerParams: Readonly<Record<string, unknown>> | undefined,
  path: string,
): number {
  let value: unknown = speakerParams;
  for (const key of path.split(".")) {
    value = isUnknownObject(value) ? value[key] : undefined;
  }
  return requireFiniteNumber(value, `speaker.${path}`);
}

function optionalSpeakerNumber(
  speakerParams: Readonly<Record<string, unknown>> | undefined,
  path: string,
): number | undefined {
  let value: unknown = speakerParams;
  for (const key of path.split(".")) {
    value = isUnknownObject(value) ? value[key] : undefined;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function interpolateProfile(points: readonly number[], position: number): number {
  if (points.length === 0) return 0;
  if (points.length === 1) return points[0] ?? 0;
  const floatIndex = Math.max(0, Math.min(1, position)) * (points.length - 1);
  const lowIndex = Math.floor(floatIndex);
  const highIndex = Math.min(lowIndex + 1, points.length - 1);
  const low = points[lowIndex] ?? 0;
  const high = points[highIndex] ?? low;
  return low + (high - low) * (floatIndex - lowIndex);
}

/**
 * Command indices by the commands' times, keeping issue order among equal
 * times. Commands are issued rule by rule, so their order is not time order.
 */
export function f0CommandsInTimeOrder(
  indices: readonly number[],
  times: readonly number[],
): number[] {
  return [...indices].sort(
    (left, right) => (times[left] ?? 0) - (times[right] ?? 0) || left - right,
  );
}

/**
 * The clause an F0 command belongs to: the last clause that has started by
 * the time of the phone the command was issued on (`anchorTime`, without the
 * command's own offset). A command timed before its clause's first frame
 * still belongs to that clause.
 */
export function f0CommandClause(clauseStartTimes: readonly number[], anchorTime: number): number {
  let owner = 0;
  for (let index = 0; index < clauseStartTimes.length; index += 1) {
    if ((clauseStartTimes[index] ?? 0) <= anchorTime + 1e-9) owner = index;
  }
  return owner;
}

/**
 * An F0 command's time on a clause's controller clock, in seconds, rounded to
 * a frame. `anchors` pair the acoustic time of each allophone's start with
 * its controller time, in acoustic order; the command keeps its distance
 * from the first allophone that starts at or after it. `time` is the
 * command's acoustic time before any clamp: one that would fall before the
 * clause's first frame is put at that frame.
 */
export function f0CommandControllerTime(
  anchors: ReadonlyArray<{ acousticTime: number; controllerTime: number }>,
  time: number,
  framePeriod: number,
): number | undefined {
  const anchor =
    anchors.find((candidate) => candidate.acousticTime >= time - 1e-9) ?? anchors.at(-1);
  if (!anchor) return undefined;
  const mapped = Math.max(0, anchor.controllerTime - (anchor.acousticTime - time));
  return Math.round(mapped / framePeriod) * framePeriod;
}

/**
 * Realize selected PhraseCommand/Tilt Items through the f0-filters ABI.
 *
 * Citations: DECtalk 4.63 Ph_drwt02.c (command cadence, two-pole coefficient
 * smoothing, speaker scaling); Klatt 1982 (hat-pattern layers); Fujisaki,
 * Information, Prosody, and Modeling (additive phrase/accent commands).
 */
export function renderLayeredF0(
  commands: readonly F0LayerCommand[],
  model: LayeredF0ModelConfig,
  totalDurationSec: number,
  speakerParams?: Readonly<Record<string, unknown>>,
  /**
   * Leading internal frames the kernel runs and discards. Omitted: the
   * kernel's own default. A stretch that continues an earlier one passes 0.
   */
  outputLeadFrames?: number,
  /** Frames the earlier stretches of the same output ran (kernel scalars[19]). */
  elapsedFrames = 0,
): Array<{ time: number; f0: number }> {
  const framePeriod = requirePositiveNumber(model.frame_period_sec, "f0_model.frame_period_sec");
  const frameCount = Math.ceil(totalDurationSec / framePeriod) + 1;
  const alpha = requireFiniteNumber(model.filter.default_alpha, "f0_model.filter.default_alpha");
  const resolvedAlpha = model.filter.alpha_param
    ? (optionalSpeakerNumber(speakerParams, model.filter.alpha_param) ?? alpha)
    : alpha;
  const scale = model.speaker_scale;
  const f0ScaleFactor = scale ? resolveSpeakerNumber(speakerParams, scale.range_param) : 1;
  const scalePivot = scale ? requireFiniteNumber(scale.pivot, "f0_model.speaker_scale.pivot") : 0;
  const divisor = scale
    ? requirePositiveNumber(scale.divisor, "f0_model.speaker_scale.divisor")
    : 1;
  const outputScale = scale
    ? requirePositiveNumber(scale.output_scale, "f0_model.speaker_scale.output_scale")
    : 1;
  const pitchOffsetHz = scale?.pitch_offset
    ? resolveSpeakerNumber(speakerParams, scale.pitch_offset.target_param) -
      resolveSpeakerNumber(speakerParams, scale.pitch_offset.reference_param)
    : 0;
  const f0Minimum = scale
    ? resolveSpeakerNumber(speakerParams, scale.minimum_param) + pitchOffsetHz / outputScale
    : 0;
  const minHz = requireFiniteNumber(model.output_clamp?.min_hz, "f0_model.output_clamp.min_hz");
  const maxHz = requireFiniteNumber(model.output_clamp?.max_hz, "f0_model.output_clamp.max_hz");

  const layerNames = Object.keys(model.layers);
  const commandsByLayer = new Map<string, F0LayerCommand[]>();
  for (const name of layerNames) commandsByLayer.set(name, []);
  for (const command of commands) {
    const layerCommands = commandsByLayer.get(command.layer);
    if (!layerCommands) throw new Error(`E_HRG_LOWER_F0_MODEL: unknown layer '${command.layer}'`);
    layerCommands.push(command);
  }
  const dectalkControllerFrames = layerNames.reduce((total, name) => {
    if (model.layers[name]?.type !== "dectalk_segmental") return total;
    return (
      total +
      (commandsByLayer.get(name) ?? []).reduce(
        // Ph_inton2.c's tcumdur excludes the final GEN_SIL even though
        // pht0draw() consumes that allophone in the segmental controller.
        // It also excludes every allophone from the one at which phinton
        // leaves its loop early (Ph_inton2.c:809-819, 1659-1671); the rules
        // tag those commands.
        (layerTotal, command) =>
          layerTotal +
          (command.tag === "f0_segmental_terminal_silence" ||
          command.tag === "f0_segmental_uncounted_phone"
            ? 0
            : (command.durationFrames ?? 0)),
        0,
      )
    );
  }, 0);
  // Ph_drwt02.c clocks its 17-point baseline over tcumdur, the controller
  // allophones through the dummy carrier; terminal silence is not in tcumdur.
  const profileDurationSec =
    dectalkControllerFrames > 0 ? dectalkControllerFrames * framePeriod : totalDurationSec;
  let initialTotal = 0;
  for (const name of layerNames) {
    const config = model.layers[name];
    if (!config) continue;
    for (const command of commandsByLayer.get(name) ?? []) {
      if (command.time > framePeriod * 0.5) break;
      if (config.type === "profile" && command.profilePoints) {
        initialTotal += interpolateProfile(command.profilePoints, 0);
      }
    }
  }

  const layerTypeCodes: Record<LayerType, number> = {
    profile: 0,
    persistent: 1,
    impulse: 2,
    glide: 3,
    dectalk_segmental: 4,
    range: 5,
    floor: 6,
    dectalk_user_target: 7,
  };
  const decayCodes: Record<DecayMode, number> = {
    halving: 0,
    step_plus_ramp: 1,
    exponential: 2,
    step_plus_rise: 3,
  };
  // f0-filters ABI constants; keep synchronized with crates/f0-filters/src/lib.rs.
  const commandDescriptorWidth = 5;
  const coefficientTwoPoleFilterMode = 2;
  const filterScaleShift =
    model.filter.scale_shift == null
      ? 0
      : requireFiniteNumber(model.filter.scale_shift, "f0_model.filter.scale_shift");
  const gestures = layerNames.flatMap((name) => {
    const gesture = model.layers[name]?.glottal_gesture;
    return gesture ? [{ name, gesture }] : [];
  });
  if (gestures.length > 1) {
    throw new Error("E_HRG_LOWER_F0_MODEL: only one layer may declare glottal_gesture");
  }
  const glottalGesture = gestures.map(({ name, gesture }) => [
    requireFiniteNumber(gesture.depth, `f0_model.layers.${name}.glottal_gesture.depth`),
    requireFiniteNumber(gesture.slope, `f0_model.layers.${name}.glottal_gesture.slope`),
    requireFiniteNumber(
      gesture.reach_frames,
      `f0_model.layers.${name}.glottal_gesture.reach_frames`,
    ),
    requireFiniteNumber(gesture.latch_frame, `f0_model.layers.${name}.glottal_gesture.latch_frame`),
  ])[0] ?? [0, 0, 0, 0];
  const userTargets = layerNames.filter(
    (name) => model.layers[name]?.type === "dectalk_user_target",
  );
  if (userTargets.length > 1) {
    throw new Error("E_HRG_LOWER_F0_MODEL: only one layer may be a dectalk_user_target");
  }
  const userTarget = userTargets.map((name) => {
    const config = model.layers[name];
    const at = `f0_model.layers.${name}`;
    return [
      requirePositiveNumber(config?.note_scale, `${at}.note_scale`),
      requirePositiveNumber(config?.vibrato?.phase_step, `${at}.vibrato.phase_step`),
      requireFiniteNumber(config?.vibrato?.shift, `${at}.vibrato.shift`),
      requireFiniteNumber(config?.note_transition_shift, `${at}.note_transition_shift`),
    ];
  })[0] ?? [0, 0, 0, 0];
  const layerDescriptors: number[] = [];
  const commandDescriptors: number[] = [];
  const profilePool: number[] = [];
  const maximumCommandTime = (frameCount - 1) * framePeriod + framePeriod * 0.5;
  for (const name of layerNames) {
    const config = model.layers[name];
    if (!config) throw new Error(`E_HRG_LOWER_F0_MODEL: layer '${name}' is missing`);
    const layerCommands = commandsByLayer.get(name) ?? [];
    const commandStart = commandDescriptors.length / commandDescriptorWidth;
    const impulse = config.type === "impulse";
    const dectalkSegmental = config.type === "dectalk_segmental";
    const decayCode = impulse && config.decay ? decayCodes[config.decay] : 0;
    const initialDecayDivisor =
      impulse && config.decay === "halving"
        ? requirePositiveNumber(
            config.initial_decay_divisor,
            `f0_model.layers.${name}.initial_decay_divisor`,
          )
        : 0;
    const terminationThreshold =
      impulse && config.decay !== "step_plus_ramp" && config.decay !== "step_plus_rise"
        ? requirePositiveNumber(
            config.termination_threshold,
            `f0_model.layers.${name}.termination_threshold`,
          )
        : 0;
    const exponentialFactor =
      impulse && config.decay === "exponential"
        ? requirePositiveNumber(
            config.exponential_factor,
            `f0_model.layers.${name}.exponential_factor`,
          )
        : 0;
    let cursorLive = true;
    for (const command of layerCommands) {
      const reachable = cursorLive && command.time <= maximumCommandTime;
      if (!reachable) cursorLive = false;
      const durationFrames =
        (impulse && reachable) || dectalkSegmental
          ? requirePositiveNumber(command.durationFrames, `f0_control.${name}.durationFrames`)
          : typeof command.durationFrames === "number" && Number.isFinite(command.durationFrames)
            ? command.durationFrames
            : 0;
      const profileStart = profilePool.length;
      const profileCount =
        config.type === "profile" || dectalkSegmental || config.type === "dectalk_user_target"
          ? (command.profilePoints?.length ?? 0)
          : 0;
      // A fourth flag marks a glottal-stop gesture at the allophone's end.
      if (dectalkSegmental && profileCount !== 3 && profileCount !== 4) {
        throw new Error(
          `E_HRG_LOWER_F0_MODEL: f0_control.${name}.profilePoints requires [voiceless, plosive, stressed] and optionally [glottal gesture]`,
        );
      }
      if (profileCount > 0 && command.profilePoints) profilePool.push(...command.profilePoints);
      commandDescriptors.push(
        command.time,
        command.value,
        durationFrames,
        profileStart,
        profileCount,
      );
    }
    layerDescriptors.push(
      layerTypeCodes[config.type],
      decayCode,
      initialDecayDivisor,
      terminationThreshold,
      exponentialFactor,
      commandStart,
      layerCommands.length,
    );
  }

  const scalars = [
    framePeriod,
    profileDurationSec,
    coefficientTwoPoleFilterMode,
    resolvedAlpha,
    0,
    0,
    0,
    0,
    0,
    scale ? 1 : 0,
    f0Minimum,
    f0ScaleFactor,
    divisor,
    outputScale,
    minHz,
    maxHz,
    initialTotal,
    scalePivot,
    // -1: the kernel's own default lead.
    outputLeadFrames ?? -1,
    elapsedFrames,
    filterScaleShift,
    ...glottalGesture,
    ...userTarget,
  ];
  const exports = getF0FilterExports();
  const allocate = (values: readonly number[]): { ptr: number; len: number } => {
    if (values.length === 0) return { ptr: 0, len: 0 };
    const ptr = exports.alloc_f64(values.length);
    new Float64Array(exports.memory.buffer, ptr, values.length).set(values);
    return { ptr, len: values.length };
  };
  const scalarBuffer = allocate(scalars);
  const layerBuffer = allocate(layerDescriptors);
  const commandBuffer = allocate(commandDescriptors);
  const profileBuffer = allocate(profilePool);
  const outputPtr = exports.alloc_f64(frameCount);
  try {
    const status = exports.render_f0(
      scalarBuffer.ptr,
      scalarBuffer.len,
      layerBuffer.ptr,
      layerNames.length,
      commandBuffer.ptr,
      commandDescriptors.length / commandDescriptorWidth,
      profileBuffer.ptr,
      profilePool.length,
      outputPtr,
      frameCount,
    );
    if (status !== RENDER_OK) {
      throw new Error(`E_HRG_LOWER_F0_RENDER: ${describeRenderStatus(status)}`);
    }
    const values = new Float64Array(new Float64Array(exports.memory.buffer, outputPtr, frameCount));
    return Array.from(values, (f0, index) => ({
      time: index * framePeriod,
      f0,
    }));
  } finally {
    if (scalarBuffer.ptr) exports.dealloc_f64(scalarBuffer.ptr, scalarBuffer.len);
    if (layerBuffer.ptr) exports.dealloc_f64(layerBuffer.ptr, layerBuffer.len);
    if (commandBuffer.ptr) exports.dealloc_f64(commandBuffer.ptr, commandBuffer.len);
    if (profileBuffer.ptr) exports.dealloc_f64(profileBuffer.ptr, profileBuffer.len);
    exports.dealloc_f64(outputPtr, frameCount);
  }
}

/** Whether a point list is in time order with finite times; found once a list. */
const pointListsInTimeOrder = new WeakMap<readonly { timeMs: number }[], boolean>();

function inTimeOrder(points: readonly { timeMs: number }[]): boolean {
  let ordered = pointListsInTimeOrder.get(points);
  if (ordered === undefined) {
    ordered = true;
    for (let index = 0; index < points.length && ordered; index += 1) {
      const time = points[index]?.timeMs;
      if (
        typeof time !== "number" ||
        !Number.isFinite(time) ||
        (index > 0 && time < (points[index - 1] as { timeMs: number }).timeMs)
      ) {
        ordered = false;
      }
    }
    pointListsInTimeOrder.set(points, ordered);
  }
  return ordered;
}

/**
 * The first index whose point is later than `timeMs`, in a list in time
 * order; `points.length` if there is none.
 */
function firstPointAfter(points: readonly { timeMs: number }[], timeMs: number): number {
  let low = 0;
  let high = points.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((points[middle] as { timeMs: number }).timeMs > timeMs) high = middle;
    else low = middle + 1;
  }
  return low;
}

/**
 * The points later than `afterMs` and earlier than `beforeMs`, in list order.
 * A list in time order is searched, not scanned: a track has a point for
 * every frame, and every Segment asks.
 */
export function pointsBetween<Point extends { timeMs: number }>(
  points: readonly Point[],
  afterMs: number,
  beforeMs: number,
): Point[] {
  if (!inTimeOrder(points) || Number.isNaN(afterMs) || Number.isNaN(beforeMs)) {
    return points.filter((point) => point.timeMs > afterMs && point.timeMs < beforeMs);
  }
  const found: Point[] = [];
  for (let index = firstPointAfter(points, afterMs); index < points.length; index += 1) {
    const point = points[index] as Point;
    if (!(point.timeMs < beforeMs)) break;
    found.push(point);
  }
  return found;
}

/**
 * The index of the first pair of neighbouring points that `timeMs` lies
 * between (ends included), or -1. Searched in a list in time order.
 */
function spanIndexAt(points: readonly ResolvedF0Point[], timeMs: number): number {
  const lastPair = points.length - 2;
  if (lastPair < 0) return -1;
  if (!inTimeOrder(points) || Number.isNaN(timeMs)) {
    for (let index = 0; index <= lastPair; index += 1) {
      const left = points[index];
      const right = points[index + 1];
      if (!left || !right || timeMs < left.timeMs || timeMs > right.timeMs) continue;
      return index;
    }
    return -1;
  }
  const first = points[0] as ResolvedF0Point;
  const last = points[lastPair + 1] as ResolvedF0Point;
  if (timeMs < first.timeMs || timeMs > last.timeMs) return -1;
  // The lowest pair whose right end is not before `timeMs`. Its left end is
  // not after it: either it is the first point, or the pair before it ended
  // before `timeMs`.
  let low = 0;
  let high = lastPair;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((points[middle + 1] as ResolvedF0Point).timeMs >= timeMs) high = middle;
    else low = middle + 1;
  }
  return low;
}

/**
 * The index of the first frame later than `time`, or -1: where a frame at
 * `time` goes into a track kept in time order. Frames are nearly always
 * appended in order, so the last frame is looked at first; otherwise the
 * track is searched. The track must be in time order and hold no NaN time,
 * which it is when every frame was put in this way; the caller scans instead
 * once a NaN time has been seen.
 */
export function firstFrameAfter(frames: readonly { time: number }[], time: number): number {
  const count = frames.length;
  if (count === 0 || !((frames[count - 1] as { time: number }).time > time)) return -1;
  let low = 0;
  let high = count - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((frames[middle] as { time: number }).time > time) high = middle;
    else low = middle + 1;
  }
  return low;
}

export function resolveF0AtTime(
  points: readonly ResolvedF0Point[],
  timeMs: number,
  sampling: "linear" | "step",
): ResolvedF0Point | null {
  if (points.length === 0) return null;
  const index = spanIndexAt(points, timeMs);
  if (index >= 0) {
    const left = points[index] as ResolvedF0Point;
    const right = points[index + 1] as ResolvedF0Point;
    const spanMs = right.timeMs - left.timeMs;
    if (Math.abs(spanMs) < 1e-6) return left;
    if (sampling === "step") {
      return Math.abs(timeMs - right.timeMs) < 1e-6 ? { ...right, timeMs } : { ...left, timeMs };
    }
    const fraction = (timeMs - left.timeMs) / spanMs;
    return {
      decisionId: fraction < 1 ? left.decisionId : right.decisionId,
      timeMs,
      valueHz: left.valueHz + (right.valueHz - left.valueHz) * fraction,
    };
  }
  const last = points[points.length - 1];
  return last ? { ...last, timeMs } : null;
}

/** Lower an utterance's Segment relation into a KlattFrame[] track. */
export function lowerToFrames(
  utterance: Utterance,
  options: LowerOptions,
  context: LowerContext = {},
): LoweredTrack {
  const durationKey = options.durationKey ?? "duration";
  const phonemeKey = options.phonemeKey ?? "phoneme";
  const typeKey = options.typeKey ?? "type";
  const policyInitialSilenceMs = requirePolicyNumber(
    options.timeline.initial_silence_ms.value,
    "timeline.initial_silence_ms.value",
    utterance,
  );
  const initialSilenceKey = options.timeline.initial_silence_key;
  const firstActiveSegment = utterance.segments
    .listItems()
    .find((item) => item.get("active") !== false);
  const ruledInitialSilenceMs =
    initialSilenceKey != null && firstActiveSegment?.latestWrite(initialSilenceKey)
      ? firstActiveSegment.get(initialSilenceKey)
      : undefined;
  const initialSilenceMs =
    typeof ruledInitialSilenceMs === "number"
      ? requirePolicyNumber(ruledInitialSilenceMs, `Segment.${initialSilenceKey}`, utterance)
      : policyInitialSilenceMs;
  if (initialSilenceMs !== policyInitialSilenceMs) {
    utterance.diagnostics.info(
      "Initial silence taken from the first Segment instead of the lowering policy",
      {
        itemId: firstActiveSegment?.id,
        key: initialSilenceKey,
        ruledMs: initialSilenceMs,
        policyMs: policyInitialSilenceMs,
      },
      "HRG_LOWER_INITIAL_SILENCE_RULED",
    );
  }
  const finalSilenceMs = requirePolicyNumber(
    options.timeline.final_silence_ms.value,
    "timeline.final_silence_ms.value",
    utterance,
  );
  const stopReleaseFloorMs = requirePolicyNumber(
    options.timeline.duration_floors.stop_release_ms.value,
    "timeline.duration_floors.stop_release_ms.value",
    utterance,
  );
  const defaultFloorMs = requirePolicyNumber(
    options.timeline.duration_floors.default_ms.value,
    "timeline.duration_floors.default_ms.value",
    utterance,
  );
  const minTransitionEdgeMs = options.transitions.min_transition_edge_ms.value;
  const defaultTransitionMs = requirePolicyNumber(
    options.transitions.default_transition_ms.value,
    "transitions.default_transition_ms.value",
    utterance,
  );
  const nativeFrameMs =
    options.transitions.native_frame_ms == null
      ? 0
      : requirePolicyNumber(
          options.transitions.native_frame_ms.value,
          "transitions.native_frame_ms.value",
          utterance,
        );
  const blendFactor = options.transitions.blend.factor.value;
  if (!Number.isFinite(blendFactor) || blendFactor < 0 || blendFactor > 1) {
    utterance.diagnostics.error(
      "Selected transition blend factor must be within [0,1]",
      { path: "transitions.blend.factor.value", value: blendFactor },
      "HRG_LOWER_POLICY_REJECTED",
    );
    throw new Error(
      "E_HRG_LOWER_POLICY_NUMBER: 'transitions.blend.factor.value' must be within [0,1]",
    );
  }

  const segmentItems = utterance.segments
    .listItems()
    .filter((item) => item.get("active") !== false);

  const timings: SegmentTiming[] = [];
  let previousEndMs: number | null = null;
  for (const item of segmentItems) {
    const rawDuration = item.get(durationKey);
    if (typeof rawDuration !== "number" || !Number.isFinite(rawDuration) || rawDuration <= 0) {
      utterance.diagnostics.error(
        "Required Segment duration is missing or invalid during final lowering",
        { itemId: item.id, durationKey, value: rawDuration },
        "HRG_LOWER_DURATION_REQUIRED",
      );
      throw new Error(
        `E_HRG_LOWER_DURATION_REQUIRED: Segment '${item.id}' requires a finite positive '${durationKey}'`,
      );
    }
    for (const key of options.columns) {
      const value = item.get(key);
      const write = item.latestWrite(key);
      if (typeof value === "number" && Number.isFinite(value) && write) continue;
      // A column a frame program computes frame by frame needs no Segment value.
      if (
        (context.frameValueFeatures ?? []).some((feature) => {
          const frames = item.get(feature);
          return isFrameValues(frames) && (frames.columns[key]?.length ?? 0) > 0;
        })
      ) {
        continue;
      }
      utterance.diagnostics.error(
        "Segment is missing a finite stamped value for a declared backend column",
        { itemId: item.id, key, value },
        "HRG_LOWER_COLUMN_REQUIRED",
      );
      throw new Error(
        `E_HRG_LOWER_COLUMN_REQUIRED: Segment '${item.id}' requires '${key}' (value=${String(value)}, write=${write?.decisionId ?? "none"})`,
      );
    }
    const anchor = utterance.intervalAnchor(item);
    const startMs = anchor ? utterance.axis.getMarkTime(anchor.leftMarkId) : null;
    const endMs = anchor ? utterance.axis.getMarkTime(anchor.rightMarkId) : null;
    if (!anchor || startMs == null || endMs == null) {
      utterance.diagnostics.error(
        "Required Segment timing is unresolved during final lowering",
        { itemId: item.id },
        "HRG_LOWER_TIME_REQUIRED",
      );
      throw new Error(
        `E_HRG_LOWER_TIME_REQUIRED: Segment '${item.id}' requires resolved interval timing`,
      );
    }
    const segmentType = item.get(typeKey);
    const isStopRelease = segmentType === "stop_release" || segmentType === "stop_aspiration";
    const durationFloorMs = isStopRelease ? stopReleaseFloorMs : defaultFloorMs;
    const effectiveDurationMs = Math.max(rawDuration, durationFloorMs);
    if (effectiveDurationMs !== rawDuration) {
      utterance.diagnostics.info(
        "Selected lowering policy raised Segment duration to its declared floor",
        {
          itemId: item.id,
          requestedMs: rawDuration,
          effectiveMs: effectiveDurationMs,
          floorMs: durationFloorMs,
        },
        "HRG_LOWER_DURATION_FLOORED",
      );
    }
    const resolvedDurationMs = endMs - startMs;
    if (
      resolvedDurationMs <= 0 ||
      Math.abs(resolvedDurationMs - effectiveDurationMs) > 1e-6 ||
      (previousEndMs != null && Math.abs(startMs - previousEndMs) > 1e-6)
    ) {
      utterance.diagnostics.error(
        "Segment duration and resolved interval timing disagree",
        {
          itemId: item.id,
          durationMs: rawDuration,
          effectiveDurationMs,
          durationFloorMs,
          startMs,
          endMs,
          previousEndMs,
        },
        "HRG_LOWER_TIMING_MISMATCH",
      );
      throw new Error(`E_HRG_LOWER_TIMING_MISMATCH: Segment '${item.id}' has inconsistent timing`);
    }
    timings.push({ item, startMs, endMs, durationMs: effectiveDurationMs });
    previousEndMs = endMs;
  }
  const segmentTotalMs = previousEndMs ?? 0;

  const paramKeys = options.columns.slice();
  const frameValueFeatures = context.frameValueFeatures ?? [];
  const smoothTypes = new Set(options.transitions.blend.smooth_types);
  const transitionsByItem = new Map<Item, ResolvedSegmentTransition[]>();
  const holmes = buildHolmesTransitions(timings, utterance);
  const fallbackItems = new Set<Item>();
  const transitionDuration = (item: Item, boundaryIndex: number): number => {
    const explicit = finiteFeatureNumber(item.get("transition_ms"));
    if (explicit != null) return explicit;
    if (!holmes.covered.has(boundaryIndex) && !fallbackItems.has(item)) {
      fallbackItems.add(item);
      utterance.diagnostics.warn(
        "No tabulated or explicit transition duration; using flat fallback",
        { itemId: item.id, durationMs: defaultTransitionMs },
        "HRG_LOWER_TRANSITION_FALLBACK",
      );
    }
    return defaultTransitionMs;
  };
  const appendTransition = (item: Item, transition: ResolvedSegmentTransition): void => {
    const existing = transitionsByItem.get(item);
    if (existing) existing.push(transition);
    else transitionsByItem.set(item, [transition]);
  };
  /**
   * Build one edge transition, applying each caller's exact edge arithmetic and
   * clamps so the four blend/locus sites share a single window computation.
   * A "leading" edge (segment head) runs the window [0, min(spanMs, dur - EDGE)]
   * and is dropped unless that end is positive; a "trailing" edge (segment tail)
   * runs [max(EDGE, dur - spanMs), dur] and is dropped unless that start falls
   * before the segment end. EDGE is the validated positive policy value, so the
   * historic dead `startMs <= 0` sub-guard is not reproduced. `build` receives
   * the resolved window and returns the transition body (choosing its own
   * fields / linearFields / omitted endMs) or null to skip the append.
   */
  const addLinearTransition = (
    item: Item,
    durationMs: number,
    edge: "leading" | "trailing",
    spanMs: number,
    build: (window: { startMs: number; endMs: number }) => ResolvedSegmentTransition | null,
  ): void => {
    if (edge === "leading") {
      const endMs = Math.min(spanMs, durationMs - minTransitionEdgeMs);
      if (endMs <= 0) return;
      const transition = build({ startMs: 0, endMs });
      if (transition) appendTransition(item, transition);
      return;
    }
    const startMs = Math.max(minTransitionEdgeMs, durationMs - spanMs);
    if (startMs >= durationMs) return;
    const transition = build({ startMs, endMs: durationMs });
    if (transition) appendTransition(item, transition);
  };
  timings.forEach((timing, index) => {
    const nextTiming = timings[index + 1];
    if (!nextTiming) return;
    const currentType = timing.item.get(typeKey);
    const nextType = nextTiming.item.get(typeKey);
    if (typeof currentType !== "string" || typeof nextType !== "string") return;
    const bothSmoothed = smoothTypes.has(currentType) && smoothTypes.has(nextType);
    if (!bothSmoothed && options.transitions.blend.smooth_all_boundaries !== true) return;
    const transitionMs = transitionDuration(timing.item, index);
    if (transitionMs <= 0) return;
    addLinearTransition(timing.item, timing.durationMs, "trailing", transitionMs, ({ startMs }) => {
      const currentPhoneme = timing.item.get(phonemeKey);
      const nextPhoneme = nextTiming.item.get(phonemeKey);
      const currentStepKeys =
        typeof currentPhoneme === "string"
          ? (options.transitions.blend.step_keys_by_phoneme?.[currentPhoneme] ?? [])
          : [];
      const nextStepKeys =
        typeof nextPhoneme === "string"
          ? (options.transitions.blend.step_keys_by_phoneme?.[nextPhoneme] ?? [])
          : [];
      const fields: Record<string, number> = {};
      for (const key of options.transitions.blend.keys) {
        if (currentStepKeys.includes(key) || nextStepKeys.includes(key)) continue;
        const currentValue = timing.item.get(key);
        const nextValue = nextTiming.item.get(key);
        if (typeof currentValue !== "number" || typeof nextValue !== "number") continue;
        fields[key] = currentValue + (nextValue - currentValue) * blendFactor;
      }
      return Object.keys(fields).length > 0 ? { startMs, fields } : null;
    });
  });
  if (options.transitions.blend.smooth_all_boundaries === true) {
    timings.forEach((timing, index) => {
      const previous = timings[index - 1];
      if (!previous) return;
      const transitionMs = transitionDuration(timing.item, index - 1);
      addLinearTransition(timing.item, timing.durationMs, "leading", transitionMs, ({ endMs }) => {
        const currentPhoneme = timing.item.get(phonemeKey);
        const previousPhoneme = previous.item.get(phonemeKey);
        const currentStepKeys =
          typeof currentPhoneme === "string"
            ? (options.transitions.blend.step_keys_by_phoneme?.[currentPhoneme] ?? [])
            : [];
        const previousStepKeys =
          typeof previousPhoneme === "string"
            ? (options.transitions.blend.step_keys_by_phoneme?.[previousPhoneme] ?? [])
            : [];
        const fields: Record<string, number> = {};
        for (const key of options.transitions.blend.keys) {
          if (currentStepKeys.includes(key) || previousStepKeys.includes(key)) continue;
          const currentValue = timing.item.get(key);
          const previousValue = previous.item.get(key);
          if (typeof currentValue !== "number" || typeof previousValue !== "number") continue;
          fields[key] = currentValue + (previousValue - currentValue) * blendFactor;
        }
        return Object.keys(fields).length > 0 ? { startMs: 0, endMs, fields } : null;
      });
    });
  }
  const sonorantF2 = options.transitions.sonorant_f2;
  if (sonorantF2) {
    const spanMs = requirePolicyNumber(
      sonorantF2.span_ms.value,
      "transitions.sonorant_f2.span_ms.value",
      utterance,
    );
    const neighborWeight = sonorantF2.neighbor_weight.value;
    if (!Number.isFinite(neighborWeight) || neighborWeight < 0 || neighborWeight > 1) {
      utterance.diagnostics.error(
        "Selected sonorant neighbor weight must be within [0,1]",
        { path: "transitions.sonorant_f2.neighbor_weight.value", value: neighborWeight },
        "HRG_LOWER_POLICY_REJECTED",
      );
      throw new Error(
        "E_HRG_LOWER_POLICY_NUMBER: 'transitions.sonorant_f2.neighbor_weight.value' must be within [0,1]",
      );
    }
    const neighborTypes = new Set(sonorantF2.neighbor_types);
    timings.forEach((timing, index) => {
      if (timing.item.get(typeKey) !== sonorantF2.current_type) return;
      const currentValue = timing.item.get(sonorantF2.key);
      if (typeof currentValue !== "number") return;
      const previous = timings[index - 1];
      if (sonorantF2.forward && previous && neighborTypes.has(String(previous.item.get(typeKey)))) {
        const previousValue = previous.item.get(sonorantF2.key);
        addLinearTransition(
          timing.item,
          timing.durationMs,
          "leading",
          spanMs,
          ({ startMs, endMs }) => {
            if (typeof previousValue !== "number") return null;
            return {
              startMs,
              endMs,
              fields: {},
              linearFields: {
                [sonorantF2.key]: {
                  startValue: currentValue + (previousValue - currentValue) * neighborWeight,
                  endValue: currentValue,
                },
              },
            };
          },
        );
      }
      const next = timings[index + 1];
      if (sonorantF2.backward && next && neighborTypes.has(String(next.item.get(typeKey)))) {
        const nextValue = next.item.get(sonorantF2.key);
        const transitionSpanMs = Math.min(spanMs, timing.durationMs);
        addLinearTransition(
          timing.item,
          timing.durationMs,
          "trailing",
          transitionSpanMs,
          ({ startMs, endMs }) => {
            if (typeof nextValue !== "number") return null;
            return {
              startMs,
              endMs,
              fields: {},
              linearFields: {
                [sonorantF2.key]: {
                  startValue: currentValue,
                  endValue: currentValue + (nextValue - currentValue) * neighborWeight,
                },
              },
            };
          },
        );
      }
    });
  }
  const locusGlueTypes = new Set(options.transitions.locus_glue_types ?? []);
  const selectedLoci =
    context.speakerSex === "female" && options.transitions.loci_female
      ? options.transitions.loci_female
      : options.transitions.loci;
  const adjacentLocusObstruent = (index: number, direction: -1 | 1): Item | undefined => {
    let neighborIndex = index + direction;
    while (
      timings[neighborIndex] &&
      locusGlueTypes.has(String(timings[neighborIndex].item.get(typeKey)))
    ) {
      neighborIndex += direction;
    }
    const neighbor = timings[neighborIndex]?.item;
    if (!neighbor || smoothTypes.has(String(neighbor.get(typeKey)))) return undefined;
    const phoneme = neighbor.get(phonemeKey);
    return typeof phoneme === "string" && selectedLoci?.[phoneme] ? neighbor : undefined;
  };
  if (selectedLoci && options.transitions.vowel_category) {
    timings.forEach((timing, index) => {
      if (!smoothTypes.has(String(timing.item.get(typeKey)))) return;
      const previousObstruent = adjacentLocusObstruent(index, -1);
      if (previousObstruent) {
        const previousTiming = timings.find((candidate) => candidate.item === previousObstruent);
        for (const formant of resolveLocusFormants(
          timing.item,
          previousObstruent,
          "forward",
          selectedLoci,
          options,
          phonemeKey,
        )) {
          const currentValue = timing.item.get(formant.key);
          let applied = false;
          addLinearTransition(
            timing.item,
            timing.durationMs,
            "leading",
            formant.spanMs,
            ({ startMs, endMs }) => {
              if (typeof currentValue !== "number") return null;
              applied = true;
              return {
                startMs,
                endMs,
                fields: {},
                linearFields: {
                  [formant.key]: {
                    startValue: formant.boundaryValue,
                    endValue: currentValue,
                  },
                },
              };
            },
          );
          if (!applied) continue;
          // DECtalk p_us_st1.c applies the same locus boundary while drawing
          // the preceding plosive, with durtran equal to the full phone.
          // ph_draw.c emits the current accumulator before its per-frame
          // update, so a selected native frame period delays that trajectory
          // by one synthesis frame and lets it finish in release glue.
          if (previousTiming?.item.get(typeKey) === "stop_closure") {
            const obstruentValue = previousObstruent.get(formant.key);
            if (typeof obstruentValue === "number" && previousTiming.durationMs > 0) {
              const transitionElapsedMs = Math.max(0, previousTiming.durationMs - nativeFrameMs);
              const closureEndValue =
                obstruentValue +
                (formant.boundaryValue - obstruentValue) *
                  Math.min(1, transitionElapsedMs / previousTiming.durationMs);
              appendTransition(previousObstruent, {
                startMs: Math.min(nativeFrameMs, previousTiming.durationMs),
                endMs: previousTiming.durationMs,
                fields: {},
                linearFields: {
                  [formant.key]: {
                    startValue: obstruentValue,
                    endValue: closureEndValue,
                  },
                },
              });
            }
            const previousTimingIndex = timings.indexOf(previousTiming);
            let transitionElapsedMs = Math.max(0, previousTiming.durationMs - nativeFrameMs);
            for (let glueIndex = previousTimingIndex + 1; glueIndex < index; glueIndex += 1) {
              const glueTiming = timings[glueIndex];
              if (!glueTiming || !locusGlueTypes.has(String(glueTiming.item.get(typeKey))))
                continue;
              const remainingTransitionMs = Math.max(
                0,
                previousTiming.durationMs - transitionElapsedMs,
              );
              const glueTransitionMs = Math.min(glueTiming.durationMs, remainingTransitionMs);
              const startValue =
                typeof obstruentValue !== "number"
                  ? formant.boundaryValue
                  : obstruentValue +
                    (formant.boundaryValue - obstruentValue) *
                      Math.min(1, transitionElapsedMs / previousTiming.durationMs);
              const endValue =
                typeof obstruentValue !== "number"
                  ? formant.boundaryValue
                  : obstruentValue +
                    (formant.boundaryValue - obstruentValue) *
                      Math.min(
                        1,
                        (transitionElapsedMs + glueTransitionMs) / previousTiming.durationMs,
                      );
              appendTransition(glueTiming.item, {
                startMs: 0,
                endMs: glueTransitionMs,
                fields: {},
                linearFields: {
                  [formant.key]: { startValue, endValue },
                },
              });
              transitionElapsedMs += glueTiming.durationMs;
            }
          }
        }
      }
      const nextObstruent = adjacentLocusObstruent(index, 1);
      if (nextObstruent) {
        for (const formant of resolveLocusFormants(
          timing.item,
          nextObstruent,
          "backward",
          selectedLoci,
          options,
          phonemeKey,
        )) {
          const spanMs = Math.min(timing.durationMs, formant.spanMs);
          const currentValue = timing.item.get(formant.key);
          addLinearTransition(
            timing.item,
            timing.durationMs,
            "trailing",
            spanMs,
            ({ startMs, endMs }) => {
              if (typeof currentValue !== "number") return null;
              return {
                startMs,
                endMs,
                fields: {},
                linearFields: {
                  [formant.key]: {
                    startValue: currentValue,
                    endValue: formant.boundaryValue,
                  },
                },
              };
            },
          );
        }
      }
    });
  }
  const controlWindowsByItem = new Map<Item, ResolvedControlWindow[]>();
  segmentItems.forEach((sourceItem, sourceIndex) => {
    const rawWindows = sourceItem.get("control_windows");
    if (!Array.isArray(rawWindows)) return;
    const windowWrite = sourceItem.latestWrite("control_windows");
    if (!windowWrite) {
      utterance.diagnostics.error(
        "Control windows have no producing Segment write",
        { itemId: sourceItem.id },
        "HRG_LOWER_CONTROL_WINDOW_REJECTED",
      );
      throw new Error(
        `E_HRG_LOWER_CONTROL_WINDOW: Segment '${sourceItem.id}' has unstamped controls`,
      );
    }
    rawWindows.forEach((rawWindow) => {
      if (!isFeatureObject(rawWindow)) {
        utterance.diagnostics.error(
          "Control window is not a typed object",
          { itemId: sourceItem.id },
          "HRG_LOWER_CONTROL_WINDOW_REJECTED",
        );
        throw new Error(
          `E_HRG_LOWER_CONTROL_WINDOW: Segment '${sourceItem.id}' has invalid controls`,
        );
      }
      const targetName = typeof rawWindow.target === "string" ? rawWindow.target : "current";
      const targetIndex =
        targetName === "next"
          ? sourceIndex + 1
          : targetName === "prev"
            ? sourceIndex - 1
            : sourceIndex;
      const targetTiming = timings[targetIndex];
      if (!targetTiming) {
        utterance.diagnostics.warn(
          "Control window target falls outside the active Segment relation",
          { sourceItemId: sourceItem.id, target: targetName },
          "HRG_LOWER_CONTROL_WINDOW_TARGET",
        );
        return;
      }
      const span = resolveWindowSpan(
        rawWindow,
        targetTiming.durationMs,
        targetIndex === 0 ? -initialSilenceMs : 0,
      );
      if (!span) {
        utterance.diagnostics.warn(
          "Control window has an empty resolved span",
          { sourceItemId: sourceItem.id, targetItemId: targetTiming.item.id },
          "HRG_LOWER_CONTROL_WINDOW_EMPTY",
        );
        return;
      }
      let fields: Readonly<Record<string, ResolvedControlField>>;
      try {
        fields = parseControlFields(rawWindow.fields);
      } catch (error) {
        utterance.diagnostics.error(
          "Control window fields failed final-lowering validation",
          {
            itemId: sourceItem.id,
            error: error instanceof Error ? error.message : String(error),
          },
          "HRG_LOWER_CONTROL_WINDOW_REJECTED",
        );
        throw error;
      }
      const resolved: ResolvedControlWindow = {
        ...span,
        fields,
        decisionId: windowWrite.decisionId,
      };
      const targetWindows = controlWindowsByItem.get(targetTiming.item);
      if (targetWindows) targetWindows.push(resolved);
      else controlWindowsByItem.set(targetTiming.item, [resolved]);
    });
  });

  const affectItems = utterance.getRelation("Affect")?.listItems() ?? [];
  const affectDirectives = affectItems.flatMap((item): AffectDirective[] => {
    const delta = item.get("delta");
    if (delta == null) return [];
    const deltaWrite = item.latestWrite("delta");
    const rawFields = item.get("delta_fields");
    const rawScope = item.get("scope");
    const declarationOrder = finiteFeatureNumber(item.get("declaration_order"));
    const precedence = finiteFeatureNumber(item.get("precedence"));
    if (
      !deltaWrite ||
      !Array.isArray(rawFields) ||
      !isFeatureObject(rawScope) ||
      declarationOrder == null ||
      precedence == null
    ) {
      utterance.diagnostics.error(
        "Affect Item is missing stamped delta fields or typed scope during final lowering",
        { itemId: item.id },
        "HRG_LOWER_AFFECT_REQUIRED",
      );
      throw new Error(`E_HRG_LOWER_AFFECT_REQUIRED: Affect Item '${item.id}' is incomplete`);
    }
    const fields = new Set<AffectField>();
    for (const field of rawFields) {
      if (!isAffectField(field)) {
        utterance.diagnostics.error(
          "Affect Item names a field outside the live Direction Track contract",
          { itemId: item.id, field },
          "HRG_LOWER_AFFECT_REJECTED",
        );
        throw new Error(`E_HRG_LOWER_AFFECT_FIELD: Affect Item '${item.id}' has unknown field`);
      }
      fields.add(field);
    }
    const scope =
      rawScope.kind === "utterance"
        ? { kind: "utterance" as const }
        : rawScope.kind === "token_range" &&
            finiteFeatureNumber(rawScope.startToken) != null &&
            finiteFeatureNumber(rawScope.endToken) != null
          ? {
              kind: "token_range" as const,
              startToken: finiteFeatureNumber(rawScope.startToken) ?? 0,
              endToken: finiteFeatureNumber(rawScope.endToken) ?? 0,
            }
          : null;
    if (!scope) {
      utterance.diagnostics.error(
        "Affect Item has an invalid typed scope",
        { itemId: item.id, scope: rawScope },
        "HRG_LOWER_AFFECT_REJECTED",
      );
      throw new Error(`E_HRG_LOWER_AFFECT_SCOPE: Affect Item '${item.id}' has invalid scope`);
    }
    let values: AffectValues;
    try {
      values = parseAffectValues(delta, item.id);
    } catch (error) {
      utterance.diagnostics.error(
        "Affect Item delta failed final-lowering validation",
        { itemId: item.id, error: error instanceof Error ? error.message : String(error) },
        "HRG_LOWER_AFFECT_REJECTED",
      );
      throw error;
    }
    return [
      {
        declarationOrder,
        decisionId: deltaWrite.decisionId,
        fields,
        precedence,
        scope,
        ...(Array.isArray(item.get("syllable_ids"))
          ? { syllableIds: new Set(item.get("syllable_ids") as readonly string[]) }
          : {}),
        values,
      },
    ];
  });
  const globalAffectDirectives = affectDirectives.filter(
    (directive) => directive.scope.kind === "utterance",
  );
  const wordItems = utterance.getRelation("Word")?.listItems() ?? [];
  const wordIndexByItem = new Map(wordItems.map((item, index) => [item, index]));
  const tokenIndexForSegment = (item: Item): number | null => {
    let node = item.node("SylStructure") ?? null;
    while (node) {
      const wordIndex = wordIndexByItem.get(node.item);
      if (wordIndex != null) return wordIndex;
      node = node.parent;
    }
    return null;
  };
  const resolveAffect = (item?: Item): ResolvedAffect => {
    const values = { ...NEUTRAL_AFFECT };
    const decisions: Partial<Record<AffectField, string>> = {};
    for (const directive of globalAffectDirectives) {
      for (const field of directive.fields) {
        values[field] = composeAffectField(values[field], directive.values[field], field);
        decisions[field] = directive.decisionId;
      }
    }
    if (!item) return { values, decisions };
    const tokenIndex = tokenIndexForSegment(item);
    const local = affectDirectives.filter(
      (directive) =>
        directive.scope.kind === "token_range" &&
        tokenIndex != null &&
        tokenIndex >= directive.scope.startToken &&
        tokenIndex <= directive.scope.endToken &&
        (!directive.syllableIds ||
          directive.syllableIds.has(item.node("SylStructure")?.parent?.item.id ?? "")),
    );
    if (
      tokenIndex == null &&
      affectDirectives.some((directive) => directive.scope.kind === "token_range")
    ) {
      utterance.diagnostics.error(
        "Local Affect cannot resolve a Segment through Word/SylStructure identity",
        { itemId: item.id },
        "HRG_LOWER_AFFECT_ATTACHMENT_REQUIRED",
      );
      throw new Error(
        `E_HRG_LOWER_AFFECT_ATTACHMENT_REQUIRED: Segment '${item.id}' has no Word attachment`,
      );
    }
    for (const field of AFFECT_FIELDS) {
      const winner = local
        .filter((directive) => directive.fields.has(field))
        .sort(
          (left, right) =>
            right.precedence - left.precedence || right.declarationOrder - left.declarationOrder,
        )[0];
      if (!winner) continue;
      values[field] = composeAffectField(values[field], winner.values[field], field);
      decisions[field] = winner.decisionId;
    }
    return { values, decisions };
  };
  const globalAffect = resolveAffect();
  const affectByItem = new Map(timings.map((timing) => [timing.item, resolveAffect(timing.item)]));
  const outputTimingByItem = new Map<Item, { startMs: number; scale: number }>();
  const globalPauseScale = globalAffect.values.durationScale * globalAffect.values.pauseScale;
  if (!Number.isFinite(globalPauseScale) || globalPauseScale <= 0) {
    utterance.diagnostics.error(
      "Global Affect duration/pause projection must be finite and positive",
      {
        durationScale: globalAffect.values.durationScale,
        pauseScale: globalAffect.values.pauseScale,
      },
      "HRG_LOWER_AFFECT_TIME_REJECTED",
    );
    throw new Error("E_HRG_LOWER_AFFECT_TIME: global duration/pause scale must be positive");
  }
  // One output clock for every frame. A backend whose controller counts
  // nominal frames but emits each as a packet of a different real length
  // declares both periods; all control times, segment starts and F0 ticks
  // alike, are stretched by their ratio. Projecting only the ticks would let a
  // tick near a segment's end land after the next segment's start.
  // Citation: DECtalk 4.63 ph_claus.c (6.4 ms controller frames) and
  // VTM/vtmiont.c (71-sample packets at 11,025 Hz).
  const frameClockModel =
    context.f0Model?.type === "layered_additive" ? context.f0Model : undefined;
  const outputClockRatio =
    frameClockModel?.output_frame_period_sec == null
      ? 1
      : requirePositiveNumber(
          frameClockModel.output_frame_period_sec,
          "f0_model.output_frame_period_sec",
        ) / requirePositiveNumber(frameClockModel.frame_period_sec, "f0_model.frame_period_sec");
  const edgeOutputScale = globalPauseScale * outputClockRatio;
  const leadingAxisMs = timings[0]?.startMs ?? 0;
  let outputCursorMs =
    initialSilenceMs * edgeOutputScale +
    leadingAxisMs * globalAffect.values.durationScale * outputClockRatio;
  for (const timing of timings) {
    const affect = affectByItem.get(timing.item) ?? globalAffect;
    const segmentScale =
      affect.values.durationScale *
      (timing.item.get(typeKey) === "silence" ? affect.values.pauseScale : 1);
    if (!Number.isFinite(segmentScale) || segmentScale <= 0) {
      utterance.diagnostics.error(
        "Segment Affect duration/pause projection must be finite and positive",
        { itemId: timing.item.id, scale: segmentScale },
        "HRG_LOWER_AFFECT_TIME_REJECTED",
      );
      throw new Error(
        `E_HRG_LOWER_AFFECT_TIME: Segment '${timing.item.id}' scale must be positive`,
      );
    }
    const outputScale = segmentScale * outputClockRatio;
    outputTimingByItem.set(timing.item, { startMs: outputCursorMs, scale: outputScale });
    outputCursorMs += timing.durationMs * outputScale;
  }
  const outputFinalResetMs = outputCursorMs;
  const outputTotalMs = outputFinalResetMs + finalSilenceMs * edgeOutputScale;

  const pointItems = utterance.getRelation("F0Point")?.listItems() ?? [];
  const f0PointsByTime = new Map<number, ResolvedF0Point>();
  if (pointItems.length > 0) {
    if (options.f0?.renderer.type !== "point_interpolation") {
      utterance.diagnostics.error(
        "Explicit F0 points are incompatible with the selected renderer",
        { renderer: options.f0?.renderer.type },
        "HRG_LOWER_F0_RENDERER_REJECTED",
      );
      throw new Error("E_HRG_LOWER_F0_RENDERER: F0Point requires the point_interpolation policy");
    }
    for (const point of pointItems) {
      const resolvedTimeMs = utterance.resolveAnchorTime(point);
      const valueHz = point.get("value");
      const valueWrite = point.latestWrite("value");
      if (
        resolvedTimeMs == null ||
        !Number.isFinite(resolvedTimeMs) ||
        typeof valueHz !== "number" ||
        !Number.isFinite(valueHz) ||
        !valueWrite
      ) {
        utterance.diagnostics.error(
          "Explicit F0 point is unresolved, invalid, or unstamped during final lowering",
          { itemId: point.id, resolvedTimeMs, valueHz },
          "HRG_LOWER_F0_POINT_REQUIRED",
        );
        throw new Error(`E_HRG_LOWER_F0_POINT_REQUIRED: F0Point '${point.id}' is invalid`);
      }
      const timeMs = Math.max(0, resolvedTimeMs);
      if (timeMs !== resolvedTimeMs) {
        utterance.diagnostics.warn(
          "Explicit F0 point time was clamped to the graph axis origin",
          { itemId: point.id, requestedMs: resolvedTimeMs, clampedMs: timeMs },
          "HRG_LOWER_VALUE_CLAMPED",
        );
      }
      const displaced = f0PointsByTime.get(timeMs);
      if (displaced) {
        utterance.diagnostics.warn(
          "Coincident F0 points: later relation Item overrides earlier at the same instant",
          {
            droppedDecisionId: displaced.decisionId,
            droppedHz: displaced.valueHz,
            keptDecisionId: valueWrite.decisionId,
            keptHz: valueHz,
            timeMs,
          },
          "F0_POINT_COINCIDENT_OVERRIDE",
        );
      }
      f0PointsByTime.set(timeMs, {
        decisionId: valueWrite.decisionId,
        timeMs,
        valueHz,
      });
    }
  }
  let f0Points = [...f0PointsByTime.values()].sort((left, right) => left.timeMs - right.timeMs);
  if (f0Points.length > 0 && (f0Points[0]?.timeMs ?? Number.POSITIVE_INFINITY) > 1e-6) {
    utterance.diagnostics.error(
      "Point-interpolation contour is missing its required origin point",
      { firstPointMs: f0Points[0]?.timeMs },
      "HRG_LOWER_F0_INITIAL_POINT_REQUIRED",
    );
    throw new Error(
      "E_HRG_LOWER_F0_INITIAL_POINT: point_interpolation requires an explicit point at 0 ms",
    );
  }

  const phraseCommands = utterance.getRelation("PhraseCommand")?.listItems() ?? [];
  const tiltEvents = utterance.getRelation("Tilt")?.listItems() ?? [];
  const f0ControlItems = [...phraseCommands, ...tiltEvents];
  if (f0ControlItems.length > 0) {
    if (options.f0?.renderer.type !== "layered_additive") {
      utterance.diagnostics.error(
        "PhraseCommand/Tilt controls are incompatible with the selected renderer",
        { renderer: options.f0?.renderer.type },
        "HRG_LOWER_F0_RENDERER_REJECTED",
      );
      throw new Error(
        "E_HRG_LOWER_F0_RENDERER: PhraseCommand/Tilt requires the layered_additive policy",
      );
    }
    if (!context.f0Model || context.f0Model.type !== "layered_additive") {
      utterance.diagnostics.error(
        "Layered intonation requires the selected backend F0 model",
        { modelType: context.f0Model?.type },
        "HRG_LOWER_F0_MODEL_REQUIRED",
      );
      throw new Error("E_HRG_LOWER_F0_MODEL: layered_additive requires the selected F0 model");
    }
    const clauseModel = context.f0Model;
    const f0Model = f0ModelForVoice(clauseModel, context.speakerSex);
    const usesSegmentalControllerClock = f0ControlItems.some(
      (item) => f0Model.layers[String(item.get("layer"))]?.type === "dectalk_segmental",
    );
    // Command times before the clamp at 0, in seconds, by command index.
    const unclampedCommandTimes: number[] = [];
    // The time of the place each command is anchored to, without the
    // anchor's offset, in seconds: where the phone it was issued on begins.
    const commandAnchorTimes: number[] = [];
    const commands = f0ControlItems.map((item): F0LayerCommand => {
      const timeMs = utterance.resolveAnchorTime(item);
      const layer = item.get("layer");
      const value = item.get("value");
      const valueWrite = item.latestWrite("value");
      if (
        timeMs == null ||
        !Number.isFinite(timeMs) ||
        typeof layer !== "string" ||
        layer.length === 0 ||
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        !valueWrite
      ) {
        utterance.diagnostics.error(
          "Layered intonation Item is unresolved, invalid, or unstamped during final lowering",
          { itemId: item.id, layer, timeMs, value },
          "HRG_LOWER_F0_CONTROL_REQUIRED",
        );
        throw new Error(`E_HRG_LOWER_F0_CONTROL_REQUIRED: control Item '${item.id}' is invalid`);
      }
      const durationFrames = finiteFeatureNumber(item.get("duration_frames"));
      const rawProfilePoints = item.get("profile_points");
      const profilePoints = Array.isArray(rawProfilePoints)
        ? rawProfilePoints.filter(
            (entry): entry is number => typeof entry === "number" && Number.isFinite(entry),
          )
        : undefined;
      const tag = item.get("tag");
      const layerType = f0Model.layers[layer]?.type;
      // Without DECtalk controller allophones, project speech-relative
      // commands across the synthesized initial-silence edge. When the exact
      // segmental stream exists, its integer durations own this projection
      // below; acoustic Segment timing is not the DECtalk command clock.
      const outputTimeMs = isClockedCommandLayer(layerType)
        ? timeMs + (usesSegmentalControllerClock ? 0 : initialSilenceMs)
        : timeMs;
      unclampedCommandTimes.push(outputTimeMs / 1000);
      commandAnchorTimes.push(
        (outputTimeMs - (utterance.temporalAnchor(item)?.offsetMs ?? 0)) / 1000,
      );
      return {
        layer,
        time: Math.max(0, outputTimeMs) / 1000,
        value,
        ...(durationFrames != null ? { durationFrames } : {}),
        ...(profilePoints && profilePoints.length > 0 ? { profilePoints } : {}),
        ...(typeof tag === "string" ? { tag } : {}),
      };
    });
    // A controller-clock contour restarts at every clause: Ph_drwt02.c:1652-1810
    // re-initialises the baseline, both filters, the hat and the impulse when
    // a clause's first frame is drawn, and Ph_inton2.c:484-496 starts that
    // clause's command clock afresh. A clause is the run of segmental commands
    // from one opening-pause command up to the next.
    const isSegmentalCommand = (command: F0LayerCommand): boolean =>
      f0Model.layers[command.layer]?.type === "dectalk_segmental";
    const acousticCommands = commands.slice();
    // In time order: the commands come in rule order, and the opening pauses
    // of different clauses may come from different rules.
    const clauseStarts = usesSegmentalControllerClock
      ? f0CommandsInTimeOrder(
          acousticCommands.flatMap((command, index) =>
            isSegmentalCommand(command) && command.tag === "f0_segmental_initial_silence"
              ? [index]
              : [],
          ),
          unclampedCommandTimes,
        )
      : [];
    const renderClauses = (): Array<{ time: number; f0: number }> => {
      const framePeriod = f0Model.frame_period_sec;
      const clauses = clauseStarts.map((startIndex, clauseIndex) => {
        const firstPhoneTime = unclampedCommandTimes[startIndex] ?? 0;
        const openingFrames = acousticCommands[startIndex]?.durationFrames ?? 0;
        return {
          // The opening pause of a later clause lies before its first phone.
          startTime:
            clauseIndex === 0
              ? Number.NEGATIVE_INFINITY
              : firstPhoneTime - openingFrames * framePeriod,
          members: [] as number[],
        };
      });
      // Commands arrive in rule order; put them in time order, keeping rule
      // order among equal times (an opening pause before its first phone, a
      // stress impulse before a question gesture).
      const timeOrder = acousticCommands
        .map((_, index) => index)
        .sort(
          (left, right) =>
            (unclampedCommandTimes[left] ?? 0) - (unclampedCommandTimes[right] ?? 0) ||
            left - right,
        );
      let segmentalOwner = 0;
      for (const index of timeOrder) {
        // A command belongs to the clause of the phone it was issued on, not
        // to the clause its own time falls in: one meant before its clause's
        // first frame is clamped to that frame (make_f0_command,
        // ph_inton1.c:1880-1883), it does not reach back into the clause
        // before.
        let owner = f0CommandClause(
          clauses.map((clause) => clause.startTime),
          commandAnchorTimes[index] ?? 0,
        );
        // A segmental command belongs to the clause whose opening pause it
        // follows, whatever its time: a clause's closing pause holds the next
        // clause's opening frames.
        if (isSegmentalCommand(acousticCommands[index] as F0LayerCommand)) {
          const startsClause = clauseStarts.indexOf(index);
          if (startsClause >= 0) segmentalOwner = startsClause;
          owner = segmentalOwner;
        }
        clauses[owner]?.members.push(index);
      }
      const output: Array<{ time: number; f0: number }> = [];
      let elapsedControllerFrames = 0;
      clauses.forEach((clause, clauseIndex) => {
        const anchors: Array<{ acousticTime: number; controllerTime: number }> = [];
        let clauseFrames = 0;
        for (const index of clause.members) {
          const command = acousticCommands[index] as F0LayerCommand;
          if (!isSegmentalCommand(command)) continue;
          const acousticTime = unclampedCommandTimes[index] ?? 0;
          const existing = anchors.find((anchor) => anchor.acousticTime === acousticTime);
          if (existing) existing.controllerTime = clauseFrames * framePeriod;
          else anchors.push({ acousticTime, controllerTime: clauseFrames * framePeriod });
          clauseFrames += command.durationFrames ?? 0;
        }
        anchors.sort((left, right) => left.acousticTime - right.acousticTime);
        const outputOffsetFrames = output.length;
        const clauseCommands = clause.members.map((index): F0LayerCommand => {
          const command = acousticCommands[index] as F0LayerCommand;
          const layerType = f0Model.layers[command.layer]?.type;
          const time = unclampedCommandTimes[index] ?? 0;
          let localTime = 0;
          if (isClockedCommandLayer(layerType)) {
            localTime = f0CommandControllerTime(anchors, time, framePeriod) ?? 0;
          }
          commands[index] = { ...command, time: outputOffsetFrames * framePeriod + localTime };
          return { ...command, time: localTime };
        });
        // The first clause's first controller frame is never emitted, which is
        // the kernel's default lead; a later clause's first frame is the one
        // after the previous clause's last.
        // A clause whose commands are in a parameter scope is rendered with
        // that scope's voice: the scope of the command that opens the clause.
        const opening = f0ControlItems[clauseStarts[clauseIndex] as number];
        const scopeName = opening?.get(PARAMETER_SCOPE_FEATURE);
        const scope = typeof scopeName === "string" ? context.scopes?.[scopeName] : undefined;
        const frames = renderLayeredF0(
          clauseCommands,
          scope?.speakerSex !== undefined
            ? f0ModelForVoice(clauseModel, scope.speakerSex)
            : f0Model,
          clauseFrames * framePeriod,
          scope?.speakerParams ?? context.speakerParams,
          clauseIndex === 0 ? undefined : 0,
          elapsedControllerFrames,
        );
        elapsedControllerFrames += clauseFrames;
        const isLast = clauseIndex === clauses.length - 1;
        const keep = isLast
          ? frames.length
          : Math.min(frames.length, clauseIndex === 0 ? clauseFrames - 1 : clauseFrames);
        for (let frame = 0; frame < keep; frame += 1) {
          output.push({ time: output.length * framePeriod, f0: frames[frame]?.f0 ?? 0 });
        }
      });
      return output;
    };
    // The segmental commands (one per controller allophone) by their times.
    const segmentalSlots = commands.flatMap((command, index) =>
      isSegmentalCommand(command) ? [index] : [],
    );
    const segmentalCommandsInTimeOrder = (): F0LayerCommand[] =>
      f0CommandsInTimeOrder(segmentalSlots, unclampedCommandTimes).map(
        (index) => commands[index] as F0LayerCommand,
      );
    if (usesSegmentalControllerClock) {
      // Ph_inton2.c and pht0draw() share the ordered allodurs[] controller
      // clock. Preserve a command's offset from its following acoustic
      // allophone boundary, but place that boundary at the cumulative native
      // controller duration carried by the existing segmental commands.
      // DECtalk 4.63 Ph_inton2.c make_f0_command(); Ph_drwt02.c pht0draw().
      const controllerTimeByAcousticTime = new Map<number, number>();
      let controllerFrames = 0;
      // The allophones in time order: the commands come rule by rule, and an
      // allophone of one rule may stand between two of another (a silence
      // inside a clause, between phones).
      for (const command of segmentalCommandsInTimeOrder()) {
        controllerTimeByAcousticTime.set(command.time, controllerFrames * f0Model.frame_period_sec);
        if (command.tag !== "f0_segmental_terminal_silence") {
          controllerFrames += command.durationFrames ?? 0;
        }
      }
      const controllerAnchors = [...controllerTimeByAcousticTime]
        .map(([acousticTime, controllerTime]) => ({ acousticTime, controllerTime }))
        .sort((left, right) => left.acousticTime - right.acousticTime);
      for (let index = 0; index < commands.length; index += 1) {
        const command = commands[index];
        if (!command) continue;
        const layerType = f0Model.layers[command.layer]?.type;
        if (!isClockedCommandLayer(layerType)) continue;
        // The command's time before its clamp at 0: one meant before the
        // first phone lies in the opening pause, not at the phone's start.
        const mappedTime = f0CommandControllerTime(
          controllerAnchors,
          unclampedCommandTimes[index] ?? command.time,
          f0Model.frame_period_sec,
        );
        if (mappedTime == null) continue;
        commands[index] = { ...command, time: mappedTime };
      }
    }
    // The kernel steps through the segmental commands in the order it is
    // given them: time order, each in a segmental command's place.
    const commandsForKernel = (): F0LayerCommand[] => {
      const ordered = commands.slice();
      const inTimeOrder = segmentalCommandsInTimeOrder();
      segmentalSlots.forEach((slot, place) => {
        ordered[slot] = inTimeOrder[place] as F0LayerCommand;
      });
      return ordered;
    };
    let rendered: Array<{ time: number; f0: number }>;
    try {
      rendered =
        clauseStarts.length > 1
          ? renderClauses()
          : renderLayeredF0(
              usesSegmentalControllerClock ? commandsForKernel() : commands,
              f0Model,
              (initialSilenceMs + segmentTotalMs + finalSilenceMs) / 1000,
              context.speakerParams,
            );
    } catch (error) {
      utterance.diagnostics.error(
        "Selected layered F0 model failed final realization",
        { error: error instanceof Error ? error.message : String(error) },
        "HRG_LOWER_F0_MODEL_REJECTED",
      );
      throw error;
    }
    const commandWrites = f0ControlItems
      .map((item, index) => ({
        decisionId: item.latestWrite("value")?.decisionId,
        timeMs: commands[index]?.time == null ? undefined : commands[index].time * 1000,
      }))
      .filter(
        (entry): entry is { decisionId: string; timeMs: number } =>
          typeof entry.decisionId === "string" &&
          typeof entry.timeMs === "number" &&
          Number.isFinite(entry.timeMs),
      )
      .sort((left, right) => left.timeMs - right.timeMs);
    f0Points = rendered.map((point) => {
      let producer = commandWrites[0];
      for (const command of commandWrites) {
        if (command.timeMs <= point.time * 1000 + 1e-6) producer = command;
        else break;
      }
      if (!producer) {
        utterance.diagnostics.error(
          "Layered F0 output has no producing stamped command",
          { timeMs: point.time * 1000 },
          "HRG_LOWER_F0_CONTROL_REQUIRED",
        );
        throw new Error("E_HRG_LOWER_F0_CONTROL_REQUIRED: no stamped layered command");
      }
      return {
        decisionId: producer.decisionId,
        timeMs: point.time * 1000,
        valueHz: point.f0,
      };
    });
  }

  const segmentCanVoice = (item: Item): boolean => {
    const baseAv = finiteFeatureNumber(item.get("AV"));
    const baseAvs = finiteFeatureNumber(item.get("AVS"));
    if ((baseAv ?? 0) > 0 || (baseAvs ?? 0) > 0) return true;
    for (const window of controlWindowsByItem.get(item) ?? []) {
      const av = window.fields.AV ? resolveControlField(baseAv, window.fields.AV) : baseAv;
      const avs = window.fields.AVS ? resolveControlField(baseAvs, window.fields.AVS) : baseAvs;
      if ((av ?? 0) > 0 || (avs ?? 0) > 0) return true;
    }
    return false;
  };

  const layeredF0 = options.f0?.renderer.type === "layered_additive";
  const f0Sampling = layeredF0 ? "step" : "linear";

  const f0VarianceSamplesByDecision = new Map<string, number[]>();
  timings.forEach((timing, index) => {
    const affect = affectByItem.get(timing.item);
    if (!affect || affect.values.f0VarianceScale === 1 || !segmentCanVoice(timing.item)) return;
    if (affect.values.f0VarianceScale < 0) {
      utterance.diagnostics.error(
        "Affect F0-variance scale must be non-negative",
        { itemId: timing.item.id, scale: affect.values.f0VarianceScale },
        "HRG_LOWER_F0_VARIANCE_REJECTED",
      );
      throw new Error(
        `E_HRG_LOWER_F0_VARIANCE: Segment '${timing.item.id}' scale must be non-negative`,
      );
    }
    const decisionId = affect.decisions.f0VarianceScale;
    if (!decisionId) {
      utterance.diagnostics.error(
        "Affect F0-variance scale has no producing graph write",
        { itemId: timing.item.id, scale: affect.values.f0VarianceScale },
        "HRG_LOWER_F0_VARIANCE_REQUIRED",
      );
      throw new Error(`E_HRG_LOWER_F0_VARIANCE: Segment '${timing.item.id}' scale is unstamped`);
    }
    const samples = f0VarianceSamplesByDecision.get(decisionId) ?? [];
    const sampleCountBeforeSegment = samples.length;
    const startMs = initialSilenceMs + timing.startMs;
    const endMs = initialSilenceMs + timing.endMs;
    for (const point of f0Points) {
      const atFinalBoundary =
        index === timings.length - 1 && Math.abs(point.timeMs - endMs) <= 1e-6;
      if (point.timeMs >= startMs - 1e-6 && (point.timeMs < endMs - 1e-6 || atFinalBoundary)) {
        if (point.valueHz > 0) samples.push(point.valueHz);
      }
    }
    if (samples.length === sampleCountBeforeSegment) {
      const contourValue =
        f0Points.length > 0
          ? resolveF0AtTime(f0Points, startMs, f0Sampling)?.valueHz
          : finiteFeatureNumber(timing.item.get("F0"));
      if (contourValue != null && contourValue > 0) samples.push(contourValue);
    }
    f0VarianceSamplesByDecision.set(decisionId, samples);
  });
  const f0VarianceCenterByDecision = new Map<string, number>();
  for (const [decisionId, samples] of f0VarianceSamplesByDecision) {
    if (samples.length === 0) continue;
    f0VarianceCenterByDecision.set(
      decisionId,
      samples.reduce((sum, value) => sum + value, 0) / samples.length,
    );
  }

  const frames: KlattFrame[] = [];
  const provenanceByFrame: Array<Record<string, string>> = [];

  // appendFrame builds one KlattFrame by running these ordered sub-steps below,
  // each of which mutates the shared params/provenance maps in place.

  /**
   * Silence-edge frames: copy the selected silence resource's params, and for
   * the initial edge blend in the first segment's boundary + control-window
   * values so the run-in glides toward the first phone.
   */
  let silenceResourceKnown: boolean | undefined;
  const applySilenceEdgeParams = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    segmentOffsetMs: number,
    silenceEdge: "initial" | "final",
  ): void => {
    if (context.silence) {
      // Looked up once: the list is a copy of every decision of the
      // utterance, and each frame of the edges asks. A decision that is there
      // stays there, and one that is not ends the lowering below.
      silenceResourceKnown ??= utterance.provenance
        .getDecisions()
        .some((decision) => decision.id === context.silence?.decisionId);
      if (!silenceResourceKnown) {
        utterance.diagnostics.error(
          "Selected silence/source resource decision is absent from the Utterance",
          { decisionId: context.silence.decisionId, edge: silenceEdge },
          "HRG_LOWER_SILENCE_PROVENANCE_REQUIRED",
        );
        throw new Error("E_HRG_LOWER_SILENCE_PROVENANCE: selected silence decision is unknown");
      }
      const sourceParams =
        silenceEdge === "initial" ? context.silence.initialParams : context.silence.finalParams;
      for (const key of paramKeys) {
        const value = sourceParams[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          params[key] = value;
          provenance[key] = context.silence.decisionId;
        }
      }
    }
    if (silenceEdge === "initial" && initialSilenceMs > 0) {
      const firstSegment = timings[0]?.item;
      if (firstSegment) {
        for (const key of options.transitions.blend.keys) {
          const value = firstSegment.get(key);
          const write = firstSegment.latestWrite(key);
          if (typeof value === "number" && write) {
            params[key] = value;
            provenance[key] = write.decisionId;
          }
        }
        for (const window of controlWindowsByItem.get(firstSegment) ?? []) {
          if (segmentOffsetMs < window.startMs - 1e-6 || segmentOffsetMs >= window.endMs - 1e-6) {
            continue;
          }
          for (const [key, field] of Object.entries(window.fields)) {
            const value = resolveControlField(params[key], field);
            if (value == null || !Number.isFinite(value)) {
              delete params[key];
              delete provenance[key];
            } else {
              params[key] = value;
              provenance[key] = window.decisionId;
            }
          }
        }
      }
    }
  };

  /** Copy the Segment Item's own stamped scalar params into the frame. */
  const applyItemParams = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    item: Item,
  ): void => {
    for (const key of paramKeys) {
      const value = item.get(key);
      if (typeof value === "number") {
        params[key] = value;
        const write = item.latestWrite(key);
        if (write) provenance[key] = write.decisionId;
      }
    }
  };

  /** Apply steady (static) and linear transition fields active at this offset. */
  const applyItemTransitions = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    item: Item,
    segmentOffsetMs: number,
  ): void => {
    const itemTransitions = transitionsByItem.get(item) ?? [];
    for (const transition of itemTransitions) {
      if (segmentOffsetMs < transition.startMs - 1e-6) continue;
      for (const [key, value] of Object.entries(transition.fields)) {
        const staticFieldsActive =
          transition.endMs == null || segmentOffsetMs <= transition.endMs + 1e-6;
        const superseded =
          !staticFieldsActive &&
          itemTransitions.some(
            (candidate) =>
              candidate.startMs > transition.startMs + 1e-6 &&
              candidate.startMs <= segmentOffsetMs + 1e-6 &&
              (candidate.fields[key] !== undefined || candidate.linearFields?.[key] !== undefined),
          );
        if (superseded) continue;
        params[key] = value;
        const write = item.latestWrite(key);
        if (write) provenance[key] = write.decisionId;
      }
      if (transition.linearFields && transition.endMs != null) {
        const durationMs = transition.endMs - transition.startMs;
        const fraction =
          durationMs <= 0
            ? 1
            : Math.max(0, Math.min(1, (segmentOffsetMs - transition.startMs) / durationMs));
        for (const [key, values] of Object.entries(transition.linearFields)) {
          params[key] = values.startValue + (values.endValue - values.startValue) * fraction;
          const write = item.latestWrite(key);
          if (write) provenance[key] = write.decisionId;
        }
      }
    }
  };

  /** Apply control-window field overrides active at this offset. */
  const applyControlWindows = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    item: Item,
    segmentOffsetMs: number,
  ): void => {
    for (const window of controlWindowsByItem.get(item) ?? []) {
      if (segmentOffsetMs < window.startMs - 1e-6 || segmentOffsetMs >= window.endMs - 1e-6) {
        continue;
      }
      for (const [key, field] of Object.entries(window.fields)) {
        const value = resolveControlField(params[key], field);
        if (value == null || !Number.isFinite(value)) {
          delete params[key];
          delete provenance[key];
        } else {
          params[key] = value;
          provenance[key] = window.decisionId;
        }
      }
    }
  };

  /** Sample the F0 contour into the frame (unvoiced/SIL forced to 0). */
  const applyItemF0Sample = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    item: Item,
    timeMs: number,
  ): void => {
    if (f0Points.length > 0 && paramKeys.includes("F0")) {
      const phoneme = item.get(phonemeKey);
      const voiced = (params.AV ?? 0) > 0 || (params.AVS ?? 0) > 0;
      if (!layeredF0 && (phoneme === context.silence?.symbol || !voiced)) {
        params.F0 = 0;
      } else {
        const resolvedF0 = resolveF0AtTime(f0Points, timeMs, f0Sampling);
        if (resolvedF0) {
          params.F0 = resolvedF0.valueHz;
          provenance.F0 = resolvedF0.decisionId;
        }
      }
    }
  };

  /** Project affect deltas/scales onto backend params with cited clamps. */
  const applyAffectProjection = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    item: Item,
  ): void => {
    const affect = affectByItem.get(item);
    if (affect) {
      const applyAdd = (key: string, field: AffectField): void => {
        const base = params[key];
        const delta = affect.values[field];
        if (typeof base !== "number" || delta === 0) return;
        params[key] = base + delta;
        const decision = affect.decisions[field];
        if (decision) provenance[key] = decision;
      };
      const applyScale = (key: string, field: AffectField, floor: number): void => {
        const base = params[key];
        const scale = affect.values[field];
        if (typeof base !== "number" || scale === 1) return;
        const requested = base * scale;
        params[key] = Math.max(floor, requested);
        const decision = affect.decisions[field];
        if (decision) provenance[key] = decision;
        if (params[key] !== requested) {
          utterance.diagnostics.warn(
            "Affect projection clamped a scaled backend parameter",
            { itemId: item.id, key, requested, clamped: params[key], min: floor },
            "HRG_LOWER_VALUE_CLAMPED",
          );
        }
      };
      if (typeof params.F0 === "number" && params.F0 > 0) {
        if (affect.values.f0VarianceScale !== 1) {
          const decision = affect.decisions.f0VarianceScale;
          if (!decision) {
            utterance.diagnostics.error(
              "Affect F0-variance projection has no producing graph write",
              { itemId: item.id },
              "HRG_LOWER_F0_VARIANCE_REQUIRED",
            );
            throw new Error(`E_HRG_LOWER_F0_VARIANCE: Segment '${item.id}' scale is unstamped`);
          }
          const center = f0VarianceCenterByDecision.get(decision);
          if (center == null) {
            utterance.diagnostics.error(
              "Affect F0-variance projection has no voiced contour reference",
              { itemId: item.id, decisionId: decision },
              "HRG_LOWER_F0_VARIANCE_REQUIRED",
            );
            throw new Error(
              `E_HRG_LOWER_F0_VARIANCE: Segment '${item.id}' has no voiced contour reference`,
            );
          }
          const requestedF0 = center + (params.F0 - center) * affect.values.f0VarianceScale;
          params.F0 = Math.max(0.001, requestedF0);
          provenance.F0 = decision;
          if (params.F0 !== requestedF0) {
            utterance.diagnostics.warn(
              "Affect F0-variance projection clamped voiced F0 above zero",
              {
                itemId: item.id,
                key: "F0",
                requested: requestedF0,
                clamped: params.F0,
                min: 0.001,
              },
              "HRG_LOWER_VALUE_CLAMPED",
            );
          }
        }
        if (affect.values.f0Scale !== 1) {
          params.F0 *= affect.values.f0Scale;
          const decision = affect.decisions.f0Scale;
          if (decision) provenance.F0 = decision;
        }
      }
      if (affect.values.rdDelta !== 0) {
        Object.assign(
          params,
          projectRd(params, affect.values.rdDelta, {
            speakerParams: context.speakerParams,
            diagnostics: utterance.diagnostics,
            itemId: item.id,
          }),
        );
        const decision = affect.decisions.rdDelta;
        if (decision) provenance.RdPhraseOffset = decision;
      }
      // Project the pure {backendKey, affectField, mode, floor} affect rows via
      // the declarative table. 1 Hz formant and 20 Hz bandwidth floors are
      // explicit engineering bounds. The F1/F2/F3 >=1 Hz clamp runs after the
      // table loop: only the f1/f2/f3 Delta rows touch F1/F2/F3, so applying the
      // clamp after the intervening (B/TL/AH/GO/jitter) rows is order-equivalent.
      for (const row of AFFECT_PROJECTION_TABLE) {
        if (row.mode === "add") applyAdd(row.backendKey, row.affectField);
        else applyScale(row.backendKey, row.affectField, row.floor);
      }
      for (const key of ["F1", "F2", "F3"]) {
        const requested = params[key];
        if (typeof requested !== "number" || requested >= 1) continue;
        params[key] = 1;
        utterance.diagnostics.warn(
          "Affect projection clamped a formant frequency above zero",
          { itemId: item.id, key, requested, clamped: 1, min: 1 },
          "HRG_LOWER_VALUE_CLAMPED",
        );
      }
    }
  };

  /**
   * Columns a frame program computed for this Item (frame-program.ts): the
   * value of the frame that covers `segmentOffsetMs`. A negative offset reads
   * the lead-in frames before the Item.
   */
  const trackColumns = new WeakMap<object, [string, readonly number[]][]>();
  const applyFrameValues = (
    params: Record<string, number>,
    provenance: Record<string, string>,
    item: Item,
    segmentOffsetMs: number,
  ): void => {
    for (const feature of frameValueFeatures) {
      const values = item.get(feature);
      if (!isFrameValues(values)) continue;
      const decisionId = item.latestWrite(feature)?.decisionId;
      // The columns that reach the track, found once for a set of frame
      // values: every frame of the Item reads them.
      let columns = trackColumns.get(values);
      if (!columns) {
        columns = Object.entries(values.columns).filter(
          ([key, column]) => column.length > 0 && paramKeys.includes(key),
        );
        trackColumns.set(values, columns);
      }
      for (const [key, column] of columns) {
        params[key] = column[frameValueIndex(values, segmentOffsetMs, column.length)] as number;
        if (decisionId) provenance[key] = decisionId;
      }
      // What a frame adds to the track for the parameter scope it ran in.
      if (values.scopes && values.scopes.length > 0 && context.scopes) {
        const name = values.scopes[frameValueIndex(values, segmentOffsetMs, values.scopes.length)];
        const added = context.scopes[name ?? ""]?.frameParams;
        if (added) {
          for (const [key, value] of Object.entries(added)) {
            params[key] = value;
            if (decisionId) provenance[key] = decisionId;
          }
        }
      }
    }
  };
  /** Offsets from the Item's start at which a frame of its frame values begins. */
  const frameValueOffsets = (item: Item): number[] => {
    const offsets: number[] = [];
    for (const feature of frameValueFeatures) {
      const values = item.get(feature);
      if (!isFrameValues(values)) continue;
      const frames = Math.max(0, ...Object.values(values.columns).map((column) => column.length));
      for (let index = 0; index < frames; index += 1) {
        offsets.push(values.origin_ms + index * values.period_ms);
      }
    }
    return offsets;
  };
  /** Add `value` unless the set already holds that instant up to rounding. */
  const addEventTime = (times: Set<number>, value: number): void => {
    for (const existing of times) if (Math.abs(existing - value) <= 1e-6) return;
    times.add(value);
  };

  // Once a frame's time is NaN the track is no longer searched (firstFrameAfter).
  let framesHoldNaN = false;
  const appendFrame = (
    timeMs: number,
    item?: Item,
    phonemeOverride?: string,
    segmentOffsetMs = 0,
    outputTimeOverrideMs?: number,
    silenceEdge?: "initial" | "final",
  ): void => {
    const params: Record<string, number> = {};
    const provenance: Record<string, string> = {};
    if (!item && silenceEdge) {
      applySilenceEdgeParams(params, provenance, segmentOffsetMs, silenceEdge);
      // The initial silence is the lead-in of the first Segment's frames.
      if (silenceEdge === "initial" && timings[0]) {
        applyFrameValues(params, provenance, timings[0].item, segmentOffsetMs);
      }
      // After the last frame: the values a frame program declares for then.
      const lastItem = timings[timings.length - 1]?.item;
      if (silenceEdge === "final" && lastItem) {
        for (const feature of frameValueFeatures) {
          const values = lastItem.get(feature);
          if (!isFrameValues(values) || !values.after) continue;
          const decisionId = lastItem.latestWrite(feature)?.decisionId;
          for (const [key, value] of Object.entries(values.after)) {
            if (!paramKeys.includes(key)) continue;
            params[key] = value;
            if (decisionId) provenance[key] = decisionId;
          }
        }
      }
    }
    if (item) {
      applyItemParams(params, provenance, item);
      applyItemTransitions(params, provenance, item, segmentOffsetMs);
      for (const [key, curve] of holmes.curves.get(item) ?? []) {
        if (!paramKeys.includes(key)) continue;
        params[key] = sampleHolmesCurve(curve, segmentOffsetMs);
        provenance[key] = curve.decisionId;
      }
      applyControlWindows(params, provenance, item, segmentOffsetMs);
      applyFrameValues(params, provenance, item, segmentOffsetMs);
      applyItemF0Sample(params, provenance, item, timeMs);
      applyAffectProjection(params, provenance, item);
    }
    if (!item && silenceEdge && layeredF0 && f0Points.length > 0 && paramKeys.includes("F0")) {
      const resolvedF0 = resolveF0AtTime(f0Points, timeMs, f0Sampling);
      if (resolvedF0) {
        params.F0 = resolvedF0.valueHz;
        provenance.F0 = resolvedF0.decisionId;
      }
    }
    const outputTimeMs =
      outputTimeOverrideMs ??
      (item
        ? (outputTimingByItem.get(item)?.startMs ?? timeMs) +
          segmentOffsetMs * (outputTimingByItem.get(item)?.scale ?? 1)
        : timeMs);
    const frame: KlattFrame = {
      time: outputTimeMs / 1000,
      params,
      provenance,
    };
    if (item) {
      frame.segmentId = item.id;
      const phoneme = item.get(phonemeKey);
      if (typeof phoneme === "string") frame.phoneme = phoneme;
      const word = item.get("word");
      if (typeof word === "string") frame.word = word;
    } else if (phonemeOverride) {
      frame.phoneme = phonemeOverride;
    }
    if (Number.isNaN(frame.time)) framesHoldNaN = true;
    const insertionIndex = framesHoldNaN
      ? frames.findIndex((existing) => existing.time > frame.time)
      : firstFrameAfter(frames, frame.time);
    if (insertionIndex < 0) {
      frames.push(frame);
      provenanceByFrame.push(provenance);
    } else {
      frames.splice(insertionIndex, 0, frame);
      provenanceByFrame.splice(insertionIndex, 0, provenance);
    }
  };

  const initialEventTimes = new Set<number>([0]);
  const firstTiming = timings[0];
  if (options.timeline.event_points.include_control_boundaries && firstTiming) {
    for (const window of controlWindowsByItem.get(firstTiming.item) ?? []) {
      for (const offsetMs of [window.startMs, window.endMs]) {
        const timeMs = initialSilenceMs + offsetMs;
        if (timeMs > 1e-6 && timeMs < initialSilenceMs - 1e-6) initialEventTimes.add(timeMs);
      }
    }
  }
  if (layeredF0 && options.timeline.event_points.include_f0_anchors && paramKeys.includes("F0")) {
    for (const point of f0Points) {
      if (point.timeMs <= 1e-6 || point.timeMs >= initialSilenceMs - 1e-6) continue;
      initialEventTimes.add(point.timeMs);
    }
  }
  if (firstTiming) {
    for (const offsetMs of frameValueOffsets(firstTiming.item)) {
      const timeMs = initialSilenceMs + offsetMs;
      if (offsetMs < -1e-6 && timeMs > 1e-6) addEventTime(initialEventTimes, timeMs);
    }
  }
  for (const timeMs of [...initialEventTimes].sort((left, right) => left - right)) {
    appendFrame(
      timeMs,
      undefined,
      timeMs > 1e-6 ? context.silence?.symbol : undefined,
      timeMs - initialSilenceMs,
      timeMs * edgeOutputScale,
      "initial",
    );
  }
  for (const timing of timings) {
    const offsets = new Set<number>();
    if (options.timeline.event_points.include_segment_start) offsets.add(0);
    if (options.timeline.event_points.include_control_boundaries) {
      for (const window of controlWindowsByItem.get(timing.item) ?? []) {
        if (window.startMs > 1e-6 && window.startMs < timing.durationMs - 1e-6) {
          offsets.add(window.startMs);
        }
        if (window.endMs > 1e-6 && window.endMs < timing.durationMs - 1e-6) {
          offsets.add(window.endMs);
        }
      }
    }
    if (options.timeline.event_points.include_transition_steady_time) {
      for (const curve of holmes.curves.get(timing.item)?.values() ?? []) {
        for (const point of curve.points) {
          if (point.time > 0 && point.time < timing.durationMs) offsets.add(point.time);
        }
      }
      for (const transition of transitionsByItem.get(timing.item) ?? []) {
        if (transition.startMs > 1e-6 && transition.startMs < timing.durationMs - 1e-6) {
          offsets.add(transition.startMs);
        }
        if (
          transition.endMs != null &&
          transition.endMs > 1e-6 &&
          transition.endMs < timing.durationMs - 1e-6
        ) {
          offsets.add(transition.endMs);
        }
      }
    }
    if (
      options.timeline.event_points.include_f0_anchors &&
      (segmentCanVoice(timing.item) || layeredF0)
    ) {
      const segmentStartMs = initialSilenceMs + timing.startMs;
      const segmentEndMs = initialSilenceMs + timing.endMs;
      for (const point of pointsBetween(f0Points, segmentStartMs + 1e-6, segmentEndMs - 1e-6)) {
        offsets.add(point.timeMs - segmentStartMs);
      }
    }
    for (const offsetMs of frameValueOffsets(timing.item)) {
      if (offsetMs > 1e-6 && offsetMs < timing.durationMs - 1e-6) addEventTime(offsets, offsetMs);
    }
    for (const offsetMs of [...offsets].sort((left, right) => left - right)) {
      const controlTimeMs = initialSilenceMs + timing.startMs + offsetMs;
      appendFrame(controlTimeMs, timing.item, undefined, offsetMs);
    }
  }
  const finalResetMs = initialSilenceMs + segmentTotalMs;
  appendFrame(finalResetMs, undefined, context.silence?.symbol, 0, outputFinalResetMs, "final");
  const totalMs = finalResetMs + finalSilenceMs;
  if (layeredF0 && options.timeline.event_points.include_f0_anchors && paramKeys.includes("F0")) {
    for (const point of f0Points) {
      if (point.timeMs <= finalResetMs + 1e-6 || point.timeMs >= totalMs - 1e-6) continue;
      appendFrame(
        point.timeMs,
        undefined,
        context.silence?.symbol,
        0,
        outputFinalResetMs + (point.timeMs - finalResetMs) * edgeOutputScale,
        "final",
      );
    }
  }
  if (totalMs > finalResetMs)
    appendFrame(totalMs, undefined, context.silence?.symbol, 0, outputTotalMs, "final");

  return {
    frames,
    provenanceByFrame,
    totalMs: outputTotalMs,
    paramKeys,
    timings,
    utterance,
  };
}

/** Index of the frame covering `timeSec` (the greatest frame time <= timeSec). */
export function frameIndexAt(track: LoweredTrack, timeSec: number): number {
  if (track.frames.length === 0) return -1;
  const epsilon = 1e-9;
  let chosen = 0;
  for (let i = 0; i < track.frames.length; i++) {
    if (track.frames[i].time <= timeSec + epsilon) chosen = i;
    else break;
  }
  return chosen;
}
