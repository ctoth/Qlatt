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
import type { KlattFrame } from "../../tts-frontend-types";
import { getF0FilterExports, RENDER_OK } from "../../f0-filters-loader";
import type { Utterance } from "./utterance";
import type { Item } from "./item";
import type { FeatureValue } from "./types";
import { isPlainObject } from "../../yaml-loader";

type LocusEntry = {
  locus_hz: number;
  prcnt: number;
  durtran_ms: number;
};

type LocusTable = Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, LocusEntry>>>>>>;
type VowelCategoryTable = Readonly<Record<string, { forward?: number; backward?: number }>>;

type LayerType = "profile" | "persistent" | "impulse" | "glide";
type DecayMode = "halving" | "linear" | "exponential";

type LayerConfig = {
  type: LayerType;
  decay?: DecayMode;
  initial_decay_divisor?: number;
  termination_threshold?: number;
  exponential_factor?: number;
};

type LayeredFilterConfig = {
  type: "lowpass_2pole_coefficient";
  alpha_param?: string;
  default_alpha: number;
};

type SpeakerScaleConfig = {
  minimum_param: string;
  range_param: string;
  divisor: number;
  output_scale: number;
};

export type LayeredF0ModelConfig = {
  type: "layered_additive";
  frame_period_sec: number;
  filter: LayeredFilterConfig;
  layers: Readonly<Record<string, LayerConfig>>;
  speaker_scale?: SpeakerScaleConfig;
  output_clamp: { min_hz: number; max_hz: number };
};

type F0LayerCommand = {
  layer: string;
  time: number;
  value: number;
  durationFrames?: number;
  profilePoints?: number[];
  tag?: string;
};

export interface LowerOptions {
  /** Required backend parameter columns, in declared output order. */
  columns: readonly string[];
  /** Selected frontend timing policy. No bundled fallback is permitted. */
  timeline: {
    initial_silence_ms: { value: number };
    final_silence_ms: { value: number };
    duration_floors: {
      stop_release_ms: { value: number };
      default_ms: { value: number };
    };
    event_points: {
      include_segment_start: boolean;
      include_control_boundaries: boolean;
      include_f0_anchors: boolean;
      include_transition_steady_time: boolean;
    };
  };
  transitions: {
    default_transition_ms: { value: number };
    blend: {
      factor: { value: number };
      keys: readonly string[];
      smooth_types: readonly string[];
      smooth_all_boundaries?: boolean;
    };
    sonorant_f2?: {
      key: string;
      span_ms: { value: number };
      neighbor_weight: { value: number };
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
      min_hz: { value: number };
      max_hz: { value: number };
    };
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
  speakerParams?: Readonly<Record<string, unknown>>;
  speakerSex?: string;
  silence?: {
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
  if (!Array.isArray(value.columns) || !value.columns.every((column) => typeof column === "string")) {
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
  return value.columns.every((column) => typeof column === "string")
    && isPlainObject(timeline.initial_silence_ms)
    && isPlainObject(timeline.final_silence_ms)
    && isPlainObject(timeline.duration_floors)
    && isPlainObject(timeline.event_points)
    && isPlainObject(transitions.default_transition_ms)
    && isPlainObject(transitions.blend);
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

const AFFECT_FIELDS = [
  "rdDelta",
  "f0Scale",
  "f0VarianceScale",
  "durationScale",
  "intensityBoost",
  "ahBoost",
  "spectralTiltBoost",
  "pauseScale",
  "f1Delta",
  "f2Delta",
  "f3Delta",
  "fbw1Scale",
  "fbw2Scale",
  "fbw3Scale",
  "jitterScale",
] as const;

type AffectField = (typeof AFFECT_FIELDS)[number];
type AffectValues = Record<AffectField, number>;

type ResolvedAffect = {
  values: AffectValues;
  decisions: Partial<Record<AffectField, string>>;
};

type AffectDirective = {
  declarationOrder: number;
  decisionId: string;
  fields: ReadonlySet<AffectField>;
  precedence: number;
  scope: { kind: "utterance" } | { kind: "token_range"; startToken: number; endToken: number };
  values: AffectValues;
};

const NEUTRAL_AFFECT: AffectValues = {
  rdDelta: 0,
  f0Scale: 1,
  f0VarianceScale: 1,
  durationScale: 1,
  intensityBoost: 0,
  ahBoost: 0,
  spectralTiltBoost: 0,
  pauseScale: 1,
  f1Delta: 0,
  f2Delta: 0,
  f3Delta: 0,
  fbw1Scale: 1,
  fbw2Scale: 1,
  fbw3Scale: 1,
  jitterScale: 1,
};

const MULTIPLICATIVE_AFFECT_FIELDS = new Set<AffectField>([
  "f0Scale",
  "f0VarianceScale",
  "durationScale",
  "pauseScale",
  "fbw1Scale",
  "fbw2Scale",
  "fbw3Scale",
  "jitterScale",
]);

function isFeatureObject(value: FeatureValue | undefined): value is { readonly [key: string]: FeatureValue } {
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
      operation !== "set"
      && operation !== "add"
      && operation !== "mul"
      && operation !== "max"
      && operation !== "min"
      && operation !== "unset"
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
  const startMs = Math.max(0, Math.min(durationMs, rawStartMs));
  const endMs = Math.max(startMs, Math.min(durationMs, rawEndMs));
  return endMs > startMs ? { startMs, endMs } : null;
}

function resolveControlField(baseValue: number | undefined, field: ResolvedControlField): number | undefined {
  switch (field.operation) {
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
  if (!loci || !categories || typeof vowelPhoneme !== "string" || typeof obstruentPhoneme !== "string") {
    return [];
  }
  const category = categories[vowelPhoneme];
  const categoryId = edge === "forward" ? category?.forward : category?.backward;
  const formants = categoryId == null ? undefined : loci[obstruentPhoneme]?.[String(categoryId)];
  if (!formants) return [];
  const rounded = options.transitions.rounded_sonorant_consonant?.includes(vowelPhoneme) ?? false;
  const palatalOrDental = options.transitions.obstruent_place?.[obstruentPhoneme]?.palatal_or_dental ?? false;
  const f2Back = edge === "forward"
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
 * Realize selected PhraseCommand/Tilt Items through the f0-filters ABI.
 *
 * Citations: DECtalk 4.63 Ph_drwt02.c (command cadence, two-pole coefficient
 * smoothing, speaker scaling); Klatt 1982 (hat-pattern layers); Fujisaki,
 * Information, Prosody, and Modeling (additive phrase/accent commands).
 */
function renderLayeredF0(
  commands: readonly F0LayerCommand[],
  model: LayeredF0ModelConfig,
  totalDurationSec: number,
  speakerParams?: Readonly<Record<string, unknown>>,
): Array<{ time: number; f0: number }> {
  const framePeriod = requirePositiveNumber(model.frame_period_sec, "f0_model.frame_period_sec");
  const frameCount = Math.ceil(totalDurationSec / framePeriod) + 1;
  const alpha = requireFiniteNumber(model.filter.default_alpha, "f0_model.filter.default_alpha");
  const resolvedAlpha = model.filter.alpha_param
    ? optionalSpeakerNumber(speakerParams, model.filter.alpha_param) ?? alpha
    : alpha;
  const scale = model.speaker_scale;
  const f0Minimum = scale ? resolveSpeakerNumber(speakerParams, scale.minimum_param) : 0;
  const f0ScaleFactor = scale ? resolveSpeakerNumber(speakerParams, scale.range_param) : 1;
  const divisor = scale ? requirePositiveNumber(scale.divisor, "f0_model.speaker_scale.divisor") : 1;
  const outputScale = scale
    ? requirePositiveNumber(scale.output_scale, "f0_model.speaker_scale.output_scale")
    : 1;
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
  let initialTotal = 0;
  for (const name of layerNames) {
    const config = model.layers[name];
    if (!config) continue;
    for (const command of commandsByLayer.get(name) ?? []) {
      if (command.time > framePeriod * 0.5) break;
      if (config.type === "persistent") initialTotal += command.value;
      if (config.type === "profile" && command.profilePoints) {
        initialTotal += interpolateProfile(command.profilePoints, 0);
      }
    }
  }

  const layerTypeCodes: Record<LayerType, number> = { profile: 0, persistent: 1, impulse: 2, glide: 3 };
  const decayCodes: Record<DecayMode, number> = { halving: 0, linear: 1, exponential: 2 };
  // f0-filters ABI constants; keep synchronized with crates/f0-filters/src/lib.rs.
  const commandDescriptorWidth = 5;
  const coefficientTwoPoleFilterMode = 2;
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
    const decayCode = impulse && config.decay
      ? decayCodes[config.decay]
      : 0;
    const initialDecayDivisor = impulse
      ? requirePositiveNumber(config.initial_decay_divisor, `f0_model.layers.${name}.initial_decay_divisor`)
      : 0;
    const terminationThreshold = impulse
      ? requirePositiveNumber(config.termination_threshold, `f0_model.layers.${name}.termination_threshold`)
      : 0;
    const exponentialFactor = impulse && config.decay === "exponential"
      ? requirePositiveNumber(config.exponential_factor, `f0_model.layers.${name}.exponential_factor`)
      : 0;
    let cursorLive = true;
    for (const command of layerCommands) {
      const reachable = cursorLive && command.time <= maximumCommandTime;
      if (!reachable) cursorLive = false;
      const durationFrames = impulse && reachable
        ? requirePositiveNumber(command.durationFrames, `f0_control.${name}.durationFrames`)
        : typeof command.durationFrames === "number" && Number.isFinite(command.durationFrames)
          ? command.durationFrames
          : 0;
      const profileStart = profilePool.length;
      const profileCount = config.type === "profile" ? command.profilePoints?.length ?? 0 : 0;
      if (profileCount > 0 && command.profilePoints) profilePool.push(...command.profilePoints);
      commandDescriptors.push(command.time, command.value, durationFrames, profileStart, profileCount);
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
    totalDurationSec,
    coefficientTwoPoleFilterMode,
    resolvedAlpha,
    0, 0, 0, 0, 0,
    scale ? 1 : 0,
    f0Minimum,
    f0ScaleFactor,
    divisor,
    outputScale,
    minHz,
    maxHz,
    initialTotal,
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
    if (status !== RENDER_OK) throw new Error(`E_HRG_LOWER_F0_RENDER: status ${status}`);
    const values = new Float64Array(new Float64Array(exports.memory.buffer, outputPtr, frameCount));
    return Array.from(values, (f0, index) => ({ time: index * framePeriod, f0 }));
  } finally {
    if (scalarBuffer.ptr) exports.dealloc_f64(scalarBuffer.ptr, scalarBuffer.len);
    if (layerBuffer.ptr) exports.dealloc_f64(layerBuffer.ptr, layerBuffer.len);
    if (commandBuffer.ptr) exports.dealloc_f64(commandBuffer.ptr, commandBuffer.len);
    if (profileBuffer.ptr) exports.dealloc_f64(profileBuffer.ptr, profileBuffer.len);
    exports.dealloc_f64(outputPtr, frameCount);
  }
}

function resolveF0AtTime(points: readonly ResolvedF0Point[], timeMs: number): ResolvedF0Point | null {
  if (points.length === 0) return null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    if (!left || !right || timeMs < left.timeMs || timeMs > right.timeMs) continue;
    const spanMs = right.timeMs - left.timeMs;
    if (Math.abs(spanMs) < 1e-6) return left;
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
  const initialSilenceMs = requirePolicyNumber(
    options.timeline.initial_silence_ms.value,
    "timeline.initial_silence_ms.value",
    utterance,
  );
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
  const defaultTransitionMs = requirePolicyNumber(
    options.transitions.default_transition_ms.value,
    "transitions.default_transition_ms.value",
    utterance,
  );
  const blendFactor = options.transitions.blend.factor.value;
  if (!Number.isFinite(blendFactor) || blendFactor < 0 || blendFactor > 1) {
    utterance.diagnostics.error(
      "Selected transition blend factor must be within [0,1]",
      { path: "transitions.blend.factor.value", value: blendFactor },
      "HRG_LOWER_POLICY_REJECTED",
    );
    throw new Error("E_HRG_LOWER_POLICY_NUMBER: 'transitions.blend.factor.value' must be within [0,1]");
  }

  const segmentItems = utterance.segments.listItems()
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
      throw new Error(`E_HRG_LOWER_TIME_REQUIRED: Segment '${item.id}' requires resolved interval timing`);
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
      resolvedDurationMs <= 0
      || Math.abs(resolvedDurationMs - effectiveDurationMs) > 1e-6
      || (previousEndMs != null && Math.abs(startMs - previousEndMs) > 1e-6)
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
  const smoothTypes = new Set(options.transitions.blend.smooth_types);
  const transitionsByItem = new Map<Item, ResolvedSegmentTransition[]>();
  const appendTransition = (item: Item, transition: ResolvedSegmentTransition): void => {
    const existing = transitionsByItem.get(item);
    if (existing) existing.push(transition);
    else transitionsByItem.set(item, [transition]);
  };
  timings.forEach((timing, index) => {
    const nextTiming = timings[index + 1];
    if (!nextTiming) return;
    const currentType = timing.item.get(typeKey);
    const nextType = nextTiming.item.get(typeKey);
    if (typeof currentType !== "string" || typeof nextType !== "string") return;
    const bothSmoothed = smoothTypes.has(currentType) && smoothTypes.has(nextType);
    if (!bothSmoothed && options.transitions.blend.smooth_all_boundaries !== true) return;
    const itemTransitionMs = finiteFeatureNumber(timing.item.get("transition_ms"));
    const transitionMs = itemTransitionMs ?? defaultTransitionMs;
    if (transitionMs <= 0) return;
    const startMs = Math.max(20, timing.durationMs - transitionMs);
    if (startMs <= 0 || startMs >= timing.durationMs) return;
    const fields: Record<string, number> = {};
    for (const key of options.transitions.blend.keys) {
      const currentValue = timing.item.get(key);
      const nextValue = nextTiming.item.get(key);
      if (typeof currentValue !== "number" || typeof nextValue !== "number") continue;
      fields[key] = currentValue + (nextValue - currentValue) * blendFactor;
    }
    if (Object.keys(fields).length > 0) {
      appendTransition(timing.item, { startMs, fields });
    }
  });
  if (options.transitions.blend.smooth_all_boundaries === true) {
    timings.forEach((timing, index) => {
      const previous = timings[index - 1];
      if (!previous) return;
      const itemTransitionMs = finiteFeatureNumber(timing.item.get("transition_ms"));
      const transitionMs = itemTransitionMs ?? defaultTransitionMs;
      const endMs = Math.min(timing.durationMs - 20, transitionMs);
      if (endMs <= 0) return;
      const fields: Record<string, number> = {};
      for (const key of options.transitions.blend.keys) {
        const currentValue = timing.item.get(key);
        const previousValue = previous.item.get(key);
        if (typeof currentValue !== "number" || typeof previousValue !== "number") continue;
        fields[key] = currentValue + (previousValue - currentValue) * blendFactor;
      }
      if (Object.keys(fields).length > 0) {
        appendTransition(timing.item, { startMs: 0, endMs, fields });
      }
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
        const endMs = Math.min(spanMs, timing.durationMs - 20);
        if (typeof previousValue === "number" && endMs > 0) {
          appendTransition(timing.item, {
            startMs: 0,
            endMs,
            fields: {},
            linearFields: {
              [sonorantF2.key]: {
                startValue: currentValue + (previousValue - currentValue) * neighborWeight,
                endValue: currentValue,
              },
            },
          });
        }
      }
      const next = timings[index + 1];
      if (sonorantF2.backward && next && neighborTypes.has(String(next.item.get(typeKey)))) {
        const nextValue = next.item.get(sonorantF2.key);
        const transitionSpanMs = Math.min(spanMs, timing.durationMs);
        const startMs = Math.max(20, timing.durationMs - transitionSpanMs);
        if (typeof nextValue === "number" && startMs < timing.durationMs) {
          appendTransition(timing.item, {
            startMs,
            endMs: timing.durationMs,
            fields: {},
            linearFields: {
              [sonorantF2.key]: {
                startValue: currentValue,
                endValue: currentValue + (nextValue - currentValue) * neighborWeight,
              },
            },
          });
        }
      }
    });
  }
  const locusGlueTypes = new Set(options.transitions.locus_glue_types ?? []);
  const selectedLoci = context.speakerSex === "female" && options.transitions.loci_female
    ? options.transitions.loci_female
    : options.transitions.loci;
  const adjacentLocusObstruent = (index: number, direction: -1 | 1): Item | undefined => {
    let neighborIndex = index + direction;
    while (timings[neighborIndex] && locusGlueTypes.has(String(timings[neighborIndex].item.get(typeKey)))) {
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
        for (const formant of resolveLocusFormants(
          timing.item,
          previousObstruent,
          "forward",
          selectedLoci,
          options,
          phonemeKey,
        )) {
          const endMs = Math.min(timing.durationMs - 20, formant.spanMs);
          const currentValue = timing.item.get(formant.key);
          if (typeof currentValue !== "number" || endMs <= 0) continue;
          appendTransition(timing.item, {
            startMs: 0,
            endMs,
            fields: {},
            linearFields: {
              [formant.key]: {
                startValue: formant.boundaryValue,
                endValue: currentValue,
              },
            },
          });
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
          const startMs = Math.max(20, timing.durationMs - spanMs);
          const currentValue = timing.item.get(formant.key);
          if (typeof currentValue !== "number" || startMs >= timing.durationMs) continue;
          appendTransition(timing.item, {
            startMs,
            endMs: timing.durationMs,
            fields: {},
            linearFields: {
              [formant.key]: {
                startValue: currentValue,
                endValue: formant.boundaryValue,
              },
            },
          });
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
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: Segment '${sourceItem.id}' has unstamped controls`);
    }
    rawWindows.forEach((rawWindow) => {
      if (!isFeatureObject(rawWindow)) {
        utterance.diagnostics.error(
          "Control window is not a typed object",
          { itemId: sourceItem.id },
          "HRG_LOWER_CONTROL_WINDOW_REJECTED",
        );
        throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: Segment '${sourceItem.id}' has invalid controls`);
      }
      const targetName = typeof rawWindow.target === "string" ? rawWindow.target : "current";
      const targetIndex = targetName === "next"
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
      const span = resolveWindowSpan(rawWindow, targetTiming.durationMs);
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
      const resolved: ResolvedControlWindow = { ...span, fields, decisionId: windowWrite.decisionId };
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
      !deltaWrite
      || !Array.isArray(rawFields)
      || !isFeatureObject(rawScope)
      || declarationOrder == null
      || precedence == null
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
    const scope = rawScope.kind === "utterance"
      ? { kind: "utterance" as const }
      : rawScope.kind === "token_range"
          && finiteFeatureNumber(rawScope.startToken) != null
          && finiteFeatureNumber(rawScope.endToken) != null
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
    return [{
      declarationOrder,
      decisionId: deltaWrite.decisionId,
      fields,
      precedence,
      scope,
      values,
    }];
  });
  const globalAffectDirectives = affectDirectives.filter((directive) => directive.scope.kind === "utterance");
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
    const local = affectDirectives.filter((directive) => (
      directive.scope.kind === "token_range"
      && tokenIndex != null
      && tokenIndex >= directive.scope.startToken
      && tokenIndex <= directive.scope.endToken
    ));
    if (tokenIndex == null && affectDirectives.some((directive) => directive.scope.kind === "token_range")) {
      utterance.diagnostics.error(
        "Local Affect cannot resolve a Segment through Word/SylStructure identity",
        { itemId: item.id },
        "HRG_LOWER_AFFECT_ATTACHMENT_REQUIRED",
      );
      throw new Error(`E_HRG_LOWER_AFFECT_ATTACHMENT_REQUIRED: Segment '${item.id}' has no Word attachment`);
    }
    for (const field of AFFECT_FIELDS) {
      const winner = local
        .filter((directive) => directive.fields.has(field))
        .sort((left, right) => (
          right.precedence - left.precedence
          || right.declarationOrder - left.declarationOrder
        ))[0];
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
      { durationScale: globalAffect.values.durationScale, pauseScale: globalAffect.values.pauseScale },
      "HRG_LOWER_AFFECT_TIME_REJECTED",
    );
    throw new Error("E_HRG_LOWER_AFFECT_TIME: global duration/pause scale must be positive");
  }
  const leadingAxisMs = timings[0]?.startMs ?? 0;
  let outputCursorMs = initialSilenceMs * globalPauseScale
    + leadingAxisMs * globalAffect.values.durationScale;
  for (const timing of timings) {
    const affect = affectByItem.get(timing.item) ?? globalAffect;
    const segmentScale = affect.values.durationScale
      * (timing.item.get(typeKey) === "silence" ? affect.values.pauseScale : 1);
    if (!Number.isFinite(segmentScale) || segmentScale <= 0) {
      utterance.diagnostics.error(
        "Segment Affect duration/pause projection must be finite and positive",
        { itemId: timing.item.id, scale: segmentScale },
        "HRG_LOWER_AFFECT_TIME_REJECTED",
      );
      throw new Error(`E_HRG_LOWER_AFFECT_TIME: Segment '${timing.item.id}' scale must be positive`);
    }
    outputTimingByItem.set(timing.item, { startMs: outputCursorMs, scale: segmentScale });
    outputCursorMs += timing.durationMs * segmentScale;
  }
  const outputFinalResetMs = outputCursorMs;
  const outputTotalMs = outputFinalResetMs + finalSilenceMs * globalPauseScale;

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
        resolvedTimeMs == null
        || !Number.isFinite(resolvedTimeMs)
        || typeof valueHz !== "number"
        || !Number.isFinite(valueHz)
        || !valueWrite
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
    throw new Error("E_HRG_LOWER_F0_INITIAL_POINT: point_interpolation requires an explicit point at 0 ms");
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
      throw new Error("E_HRG_LOWER_F0_RENDERER: PhraseCommand/Tilt requires the layered_additive policy");
    }
    if (!context.f0Model || context.f0Model.type !== "layered_additive") {
      utterance.diagnostics.error(
        "Layered intonation requires the selected backend F0 model",
        { modelType: context.f0Model?.type },
        "HRG_LOWER_F0_MODEL_REQUIRED",
      );
      throw new Error("E_HRG_LOWER_F0_MODEL: layered_additive requires the selected F0 model");
    }
    const commands = f0ControlItems.map((item): F0LayerCommand => {
      const timeMs = utterance.resolveAnchorTime(item);
      const layer = item.get("layer");
      const value = item.get("value");
      const valueWrite = item.latestWrite("value");
      if (
        timeMs == null
        || !Number.isFinite(timeMs)
        || typeof layer !== "string"
        || layer.length === 0
        || typeof value !== "number"
        || !Number.isFinite(value)
        || !valueWrite
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
        ? rawProfilePoints.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
        : undefined;
      const tag = item.get("tag");
      return {
        layer,
        time: Math.max(0, timeMs) / 1000,
        value,
        ...(durationFrames != null ? { durationFrames } : {}),
        ...(profilePoints && profilePoints.length > 0 ? { profilePoints } : {}),
        ...(typeof tag === "string" ? { tag } : {}),
      };
    });
    let rendered: Array<{ time: number; f0: number }>;
    try {
      rendered = renderLayeredF0(
        commands,
        context.f0Model,
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
      .map((item) => ({
        decisionId: item.latestWrite("value")?.decisionId,
        timeMs: utterance.resolveAnchorTime(item),
      }))
      .filter((entry): entry is { decisionId: string; timeMs: number } => (
        typeof entry.decisionId === "string" && typeof entry.timeMs === "number" && Number.isFinite(entry.timeMs)
      ))
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
      throw new Error(`E_HRG_LOWER_F0_VARIANCE: Segment '${timing.item.id}' scale must be non-negative`);
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
      const atFinalBoundary = index === timings.length - 1 && Math.abs(point.timeMs - endMs) <= 1e-6;
      if (point.timeMs >= startMs - 1e-6 && (point.timeMs < endMs - 1e-6 || atFinalBoundary)) {
        if (point.valueHz > 0) samples.push(point.valueHz);
      }
    }
    if (samples.length === sampleCountBeforeSegment) {
      const contourValue = f0Points.length > 0
        ? resolveF0AtTime(f0Points, startMs)?.valueHz
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
    if (!item && silenceEdge && context.silence) {
      const resourceKnown = utterance.provenance.getDecisions().some(
        (decision) => decision.id === context.silence?.decisionId,
      );
      if (!resourceKnown) {
        utterance.diagnostics.error(
          "Selected silence/source resource decision is absent from the Utterance",
          { decisionId: context.silence.decisionId, edge: silenceEdge },
          "HRG_LOWER_SILENCE_PROVENANCE_REQUIRED",
        );
        throw new Error("E_HRG_LOWER_SILENCE_PROVENANCE: selected silence decision is unknown");
      }
      const sourceParams = silenceEdge === "initial"
        ? context.silence.initialParams
        : context.silence.finalParams;
      for (const key of paramKeys) {
        const value = sourceParams[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          params[key] = value;
          provenance[key] = context.silence.decisionId;
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
        }
      }
    }
    if (item) {
      for (const key of paramKeys) {
        const value = item.get(key);
        if (typeof value === "number") {
          params[key] = value;
          const write = item.latestWrite(key);
          if (write) provenance[key] = write.decisionId;
        }
      }
      for (const transition of transitionsByItem.get(item) ?? []) {
        if (segmentOffsetMs < transition.startMs - 1e-6) continue;
        const staticFieldsActive = transition.endMs == null || segmentOffsetMs <= transition.endMs + 1e-6;
        if (staticFieldsActive) {
          for (const [key, value] of Object.entries(transition.fields)) {
            params[key] = value;
            const write = item.latestWrite(key);
            if (write) provenance[key] = write.decisionId;
          }
        }
        if (transition.linearFields && transition.endMs != null) {
          const durationMs = transition.endMs - transition.startMs;
          const fraction = durationMs <= 0
            ? 1
            : Math.max(0, Math.min(1, (segmentOffsetMs - transition.startMs) / durationMs));
          for (const [key, values] of Object.entries(transition.linearFields)) {
            params[key] = values.startValue + (values.endValue - values.startValue) * fraction;
            const write = item.latestWrite(key);
            if (write) provenance[key] = write.decisionId;
          }
        }
      }
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
      if (f0Points.length > 0 && paramKeys.includes("F0")) {
        const phoneme = item.get(phonemeKey);
        const voiced = (params.AV ?? 0) > 0 || (params.AVS ?? 0) > 0;
        if (phoneme === "SIL" || !voiced) {
          params.F0 = 0;
        } else {
          const resolvedF0 = resolveF0AtTime(f0Points, timeMs);
          if (resolvedF0) {
            params.F0 = resolvedF0.valueHz;
            provenance.F0 = resolvedF0.decisionId;
          }
        }
      }
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
              throw new Error(`E_HRG_LOWER_F0_VARIANCE: Segment '${item.id}' has no voiced contour reference`);
            }
            const requestedF0 = center + (params.F0 - center) * affect.values.f0VarianceScale;
            params.F0 = Math.max(0.001, requestedF0);
            provenance.F0 = decision;
            if (params.F0 !== requestedF0) {
              utterance.diagnostics.warn(
                "Affect F0-variance projection clamped voiced F0 above zero",
                { itemId: item.id, key: "F0", requested: requestedF0, clamped: params.F0, min: 0.001 },
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
        if (affect.values.rdDelta !== 0 && typeof params.Rd === "number") {
          const priorOffset = params.RdPhraseOffset ?? 0;
          // Fant 1997 effective-Rd range.
          const requestedEffective = params.Rd + priorOffset + affect.values.rdDelta;
          const effective = Math.max(0.3, Math.min(2.7, requestedEffective));
          params.RdPhraseOffset = effective - params.Rd;
          const decision = affect.decisions.rdDelta;
          if (decision) provenance.RdPhraseOffset = decision;
          if (effective !== requestedEffective) {
            utterance.diagnostics.warn(
              "Affect projection clamped effective Rd to the cited Fant range",
              {
                itemId: item.id,
                key: "RdPhraseOffset",
                requested: requestedEffective,
                clamped: effective,
                min: 0.3,
                max: 2.7,
              },
              "HRG_LOWER_VALUE_CLAMPED",
            );
          }
        }
        // 1 Hz formant and 20 Hz bandwidth floors are explicit engineering bounds.
        applyAdd("F1", "f1Delta");
        applyAdd("F2", "f2Delta");
        applyAdd("F3", "f3Delta");
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
        applyScale("B1", "fbw1Scale", 20);
        applyScale("B2", "fbw2Scale", 20);
        applyScale("B3", "fbw3Scale", 20);
        applyAdd("TL", "spectralTiltBoost");
        applyAdd("AH", "ahBoost");
        applyAdd("GO", "intensityBoost");
        applyScale("jitter", "jitterScale", 0);
      }
    }
    const outputTimeMs = outputTimeOverrideMs
      ?? (item
        ? (outputTimingByItem.get(item)?.startMs ?? timeMs)
          + segmentOffsetMs * (outputTimingByItem.get(item)?.scale ?? 1)
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
    frames.push(frame);
    provenanceByFrame.push(provenance);
  };

  appendFrame(0, undefined, undefined, 0, undefined, "initial");
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
      for (const transition of transitionsByItem.get(timing.item) ?? []) {
        if (transition.startMs > 1e-6 && transition.startMs < timing.durationMs - 1e-6) {
          offsets.add(transition.startMs);
        }
        if (
          transition.endMs != null
          && transition.endMs > 1e-6
          && transition.endMs < timing.durationMs - 1e-6
        ) {
          offsets.add(transition.endMs);
        }
      }
    }
    if (options.timeline.event_points.include_f0_anchors && segmentCanVoice(timing.item)) {
      const segmentStartMs = initialSilenceMs + timing.startMs;
      const segmentEndMs = initialSilenceMs + timing.endMs;
      for (const point of f0Points) {
        if (point.timeMs > segmentStartMs + 1e-6 && point.timeMs < segmentEndMs - 1e-6) {
          offsets.add(point.timeMs - segmentStartMs);
        }
      }
    }
    for (const offsetMs of [...offsets].sort((left, right) => left - right)) {
      appendFrame(initialSilenceMs + timing.startMs + offsetMs, timing.item, undefined, offsetMs);
    }
  }
  const finalResetMs = initialSilenceMs + segmentTotalMs;
  appendFrame(finalResetMs, undefined, "SIL", 0, outputFinalResetMs, "final");
  const totalMs = finalResetMs + finalSilenceMs;
  if (totalMs > finalResetMs) appendFrame(totalMs, undefined, "SIL", 0, outputTotalMs, "final");

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
