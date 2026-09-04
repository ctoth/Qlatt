/**
 * Direction Track — the INPUT CONTRACT for the beautiful Klatt synth.
 *
 * Architecture (b) with (c) as its empty base case, per
 * design/beauty-synthesis/10-sota-control-surface.md §5 and
 * 12-fe-architecture-recommendation.md §1: a clean text SCORE plus a separate,
 * declarative DIRECTION TRACK of typed, aligned, relative-to-neutral
 * performance modifiers.
 *
 *   - GLOBAL STATE (one per utterance): voice/timbre identity + a global affect
 *     state authored as `{ preset, degree }`. Empty/absent ⇒ neutral render ⇒
 *     pure (c) plain-text base case.
 *   - LOCAL OVERRIDES: spans anchored to the score by token/word/phrase range,
 *     carrying emphasis, break, local pitch/rate/voice-quality deltas, and named
 *     performance gestures, with explicit span precedence so composition is
 *     *defined*, not vendor-folklore.
 *
 * Everything here is a *delta over a neutral baseline* (Rutledge 1995
 * multiplicative style-vectors; HAMLET/Murray 1993 rules as the final stage):
 * a direction is a modifier applied by cited rules, never an absolute acoustic
 * command. Each direction lowers (see parse.ts) into a provenance
 * `DecisionRecord` so the surface stays engine-independent and explainable.
 *
 * Citations:
 *  - Cahn 1990 (Affect Editor) — clean text + structured affect/VQ params.
 *  - Murray_1993 (HAMLET) — rule layer as final TTS stage; relative modifiers.
 *  - Rutledge_1995 — style as multiplicative scaling factors over a neutral render.
 *  - W3C EmotionML — orthogonal affect layer; parallel category+dimension vocab.
 *  - Loquendo VTML — named library of performance gestures (sigh, creak, breath).
 *  - design/beauty-synthesis/10-sota-control-surface.md, 12-fe-architecture-recommendation.md.
 */

import type { AffectCategory } from "./affect";

/** A leaf scalar modifier value. */
export type DeltaValue = number;

/**
 * The voice-quality / prosody delta vector — the rule-drivable acoustic
 * substrate every affect preset and gesture compiles down to. All fields are
 * *relative to a neutral baseline*: `*Scale` fields are multiplicative (neutral
 * = 1), `*Delta`/`*Boost` fields are additive (neutral = 0). Ported from
 * projects/voice-quality-synthesis §2.4–2.10.
 */
export interface VoiceQualityDelta {
  /** Glottal source shape delta (Fant Rd). Negative = pressed, positive = breathy. */
  rdDelta: DeltaValue;
  /** Mean-F0 multiplier (Rutledge_1995 F0×norm column). */
  f0Scale: DeltaValue;
  /** Within-phrase F0 excursion / variability multiplier. */
  f0VarianceScale: DeltaValue;
  /** Segment-duration multiplier (Rutledge vowel-dur×norm; >1 = slower). */
  durationScale: DeltaValue;
  /** Overall intensity boost in dB. */
  intensityBoost: DeltaValue;
  /** Aspiration-noise boost in dB (breathiness; Klatt_1990 AH). */
  ahBoost: DeltaValue;
  /** Spectral-tilt boost in dB (positive = darker/softer; Rutledge TL). */
  spectralTiltBoost: DeltaValue;
  /** Pause frequency/duration multiplier (Laukka_2008 temporal cue). */
  pauseScale: DeltaValue;
  /** Additive formant-frequency offsets in Hz (France_2000). */
  f1Delta: DeltaValue;
  f2Delta: DeltaValue;
  f3Delta: DeltaValue;
  /** Formant-bandwidth multipliers (France_2000 precision/tension). */
  fbw1Scale: DeltaValue;
  fbw2Scale: DeltaValue;
  fbw3Scale: DeltaValue;
  /** Source jitter multiplier (Kaczmarek-Majer_2024 roughness). */
  jitterScale: DeltaValue;
}

/** The neutral baseline: applying this to any render is a no-op (the (c) case). */
export const NEUTRAL_VQ: Readonly<VoiceQualityDelta> = Object.freeze({
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
});

/**
 * Which fields are multiplicative (neutral = 1) vs additive (neutral = 0).
 * Used by the degree-interpolation math so a `degree` knob moves smoothly from
 * neutral to the full preset (the Azure `styledegree` / Alexa `intensity`
 * continuous-degree pattern).
 */
export const MULTIPLICATIVE_VQ_FIELDS: ReadonlyArray<keyof VoiceQualityDelta> = [
  "f0Scale",
  "f0VarianceScale",
  "durationScale",
  "pauseScale",
  "fbw1Scale",
  "fbw2Scale",
  "fbw3Scale",
  "jitterScale",
];

/** The dimensional substrate: valence × arousal × dominance, each in [-1, 1]. */
export interface DimensionalVector {
  /** Pleasant ↔ unpleasant (Scherer hedonic valence; the acoustically weak axis). */
  valence: number;
  /** Activation / arousal (Scherer activation; the robustly-encoded axis). */
  arousal: number;
  /** Potency / power (Scherer power; thin↔full voice, dominance). */
  dominance: number;
}

/** The neutral dimensional point. */
export const NEUTRAL_DIMENSIONS: Readonly<DimensionalVector> = Object.freeze({
  valence: 0,
  arousal: 0,
  dominance: 0,
});

/**
 * Speaker biological sex — REQUIRED for clinical presets because the
 * Kaczmarek-Majer 2024 mania acoustics invert by sex (see affect.ts).
 */
export type SpeakerSex = "male" | "female";

/** Voice / timbre identity — separable from performance (the voice-cloning lesson). */
export interface VoiceIdentity {
  /** Author-facing name for this voice (free label). */
  name?: string;
  /** Biological sex; mandatory before any clinical affect preset can resolve. */
  sex?: SpeakerSex;
  /** Base fundamental frequency in Hz (speaker reference line). */
  baseF0Hz?: number;
}

/**
 * A global affect authoring spec: a *named categorical preset* with a
 * *continuous degree* (the EmotionML category + the Azure styledegree knob).
 * Absent ⇒ neutral.
 */
export interface AffectSpec {
  /** Named preset (see affect.ts AFFECT_PRESETS). */
  preset: AffectCategory;
  /** Intensity in [0, 1]; 0 ⇒ neutral, 1 ⇒ full preset. Defaults to 1. */
  degree?: number;
}

/** The (c) base case: one record per utterance. Empty ⇒ neutral render. */
export interface GlobalState {
  voice?: VoiceIdentity;
  affect?: AffectSpec;
}

/** How a span is anchored to the clean score. */
export type AnchorUnit = "token" | "word" | "phrase";

/**
 * An inclusive index range into the score, in `unit`s. `token` and `word` index
 * the whitespace-delimited word list; `phrase` indexes punctuation-delimited
 * phrases (resolved to a token range at parse time).
 */
export interface AnchorRange {
  unit: AnchorUnit;
  /** Inclusive start index (0-based). */
  start: number;
  /** Inclusive end index (0-based). Defaults to `start` (single unit). */
  end?: number;
}

/** Emphasis directive (pitch-accent strength). Cited Pierrehumbert_1980. */
export interface EmphasisDirective {
  /** "reduced" | "none" | "moderate" | "strong" — accent prominence. */
  level: "reduced" | "none" | "moderate" | "strong";
}

/** Prosodic break directive (pre-boundary lengthening + pause). Cited Crystal_House_1988. */
export interface BreakDirective {
  /** Break strength index 0..4 (ToBI-style). */
  strength: 0 | 1 | 2 | 3 | 4;
  /** Optional explicit pause duration in ms. */
  timeMs?: number;
}

/** Local pitch delta (relative-to-neutral). */
export interface PitchDelta {
  /** Mean-F0 shift in semitones. */
  semitones?: number;
  /** F0 range/excursion multiplier. */
  rangeScale?: number;
}

/** A named performance gesture reference (Loquendo "expressive cues"). */
export interface GestureRef {
  /** Named gesture from GESTURE_LIBRARY. */
  name: GestureName;
  /** Strength in [0, 1]. Defaults to 1. */
  degree?: number;
}

/**
 * A local-override span. Carries any subset of the override channels; `id` and
 * `precedence` make composition over overlapping spans *defined* (higher
 * precedence wins per field; ties broken by later-declared).
 */
export interface DirectionSpan {
  id: string;
  anchor: AnchorRange;
  /** Higher wins on overlap. Defaults to 0. */
  precedence?: number;
  emphasis?: EmphasisDirective;
  break?: BreakDirective;
  pitch?: PitchDelta;
  /** Local speaking-rate multiplier (>1 = faster; lowers to inverse durationScale). */
  rate?: number;
  /** Local affect override (preset + degree), distinct from global. */
  affect?: AffectSpec;
  /** Direct voice-quality delta override (partial; merged onto NEUTRAL_VQ). */
  voiceQuality?: Partial<VoiceQualityDelta>;
  gesture?: GestureRef;
}

/** The full Direction Track: global state + ordered local override spans. */
export interface DirectionTrack {
  /** Schema version. */
  version: "1";
  global?: GlobalState;
  spans?: DirectionSpan[];
}

/** A clean text score (the canonical, diffable, AT-friendly artifact). */
export interface Score {
  text: string;
}

/** The complete authored input: score + its direction track. */
export interface DirectionInput {
  score: Score;
  directionTrack: DirectionTrack;
}

// ---------------------------------------------------------------------------
// Performance gesture library (cited; à la Loquendo VTML expressive cues)
// ---------------------------------------------------------------------------

export type GestureName = "sigh" | "creak" | "breath" | "falsetto_onset";

export interface GestureDefinition {
  name: GestureName;
  /** Human description of the performed gesture. */
  description: string;
  /** The VQ/prosody delta this gesture imposes locally (relative to neutral). */
  delta: Partial<VoiceQualityDelta>;
  citations: string[];
}

/**
 * Named performance gestures. Each is a small, cited bundle of voice-quality /
 * prosody deltas applied over the span it anchors to. These are paralinguistic
 * performance events, not affect states.
 */
export const GESTURE_LIBRARY: Readonly<Record<GestureName, GestureDefinition>> = Object.freeze({
  // Audible exhale + breathy relaxation + lengthening (Gobl breathy source; Murray vocalization).
  sigh: {
    name: "sigh",
    description: "Breathy falling exhale with lengthening — relaxation/resignation.",
    delta: { rdDelta: +1.0, ahBoost: +10, durationScale: 1.2, intensityBoost: -3, f0Scale: 0.95 },
    citations: ["Gobl_2003", "Murray_1993"],
  },
  // Lax-creaky onset (vocal fry) — Gobl lax-creaky; Keating creaky acoustics.
  creak: {
    name: "creak",
    description: "Lax-creaky (vocal fry) onset — low, relaxed, intimate/bored.",
    delta: { rdDelta: +0.3, f0Scale: 0.8, jitterScale: 1.5, ahBoost: -10 },
    citations: ["Gobl_2003", "Keating_2015"],
  },
  // Audible inbreath / aspiration noise (Klatt aspiration).
  breath: {
    name: "breath",
    description: "Audible breath / aspiration burst at a boundary.",
    delta: { ahBoost: +15, rdDelta: +0.5 },
    citations: ["Klatt_1990"],
  },
  // Falsetto register flip (Burkhardt falsetto rate; raises F0, flutter).
  falsetto_onset: {
    name: "falsetto_onset",
    description: "Brief falsetto register flip — surprise/whine.",
    delta: { f0Scale: 1.5, rdDelta: +1.0, jitterScale: 1.3, spectralTiltBoost: +3 },
    citations: ["Burkhardt_2009"],
  },
});

// ---------------------------------------------------------------------------
// Delta algebra
// ---------------------------------------------------------------------------

/** True if `field` is a multiplicative (neutral = 1) VQ field. */
export function isMultiplicativeField(field: keyof VoiceQualityDelta): boolean {
  return MULTIPLICATIVE_VQ_FIELDS.includes(field);
}

/**
 * Scale a full VQ delta toward neutral by `degree` ∈ [0, 1]. Multiplicative
 * fields interpolate from 1, additive fields from 0, so degree=0 ⇒ NEUTRAL_VQ
 * and degree=1 ⇒ the input unchanged. This is the continuous-degree knob.
 */
export function scaleVoiceQualityDelta(
  delta: VoiceQualityDelta,
  degree: number,
): VoiceQualityDelta {
  const d = clampUnit(degree);
  const out = { ...NEUTRAL_VQ } as VoiceQualityDelta;
  for (const key of Object.keys(NEUTRAL_VQ) as Array<keyof VoiceQualityDelta>) {
    const value = delta[key];
    out[key] = nz(isMultiplicativeField(key) ? 1 + (value - 1) * d : value * d);
  }
  return out;
}

/** Scale a dimensional vector toward the neutral origin by `degree`. */
export function scaleDimensions(vector: DimensionalVector, degree: number): DimensionalVector {
  const d = clampUnit(degree);
  return {
    valence: nz(vector.valence * d),
    arousal: nz(vector.arousal * d),
    dominance: nz(vector.dominance * d),
  };
}

/** Normalize negative zero to positive zero (so -0 deep-equals 0). */
function nz(value: number): number {
  return value === 0 ? 0 : value;
}

/**
 * Compose two VQ deltas (`base` then `over`). Multiplicative fields multiply;
 * additive fields add. Used to stack a local span over a global affect, and to
 * fold a partial span override onto a full vector.
 */
export function composeVoiceQualityDelta(
  base: VoiceQualityDelta,
  over: Partial<VoiceQualityDelta>,
): VoiceQualityDelta {
  const out = { ...base };
  for (const key of Object.keys(NEUTRAL_VQ) as Array<keyof VoiceQualityDelta>) {
    const o = over[key];
    if (o === undefined) continue;
    out[key] = isMultiplicativeField(key) ? base[key] * o : base[key] + o;
  }
  return out;
}

/** Fold a partial VQ override onto the neutral baseline into a full vector. */
export function materializeVoiceQualityDelta(
  partial: Partial<VoiceQualityDelta>,
): VoiceQualityDelta {
  return composeVoiceQualityDelta({ ...NEUTRAL_VQ }, partial);
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

// ---------------------------------------------------------------------------
// Schema validation / round-trip
// ---------------------------------------------------------------------------

/**
 * Validate and normalize an untyped object into a DirectionTrack. Throws on a
 * malformed shape. Combined with JSON serialization this gives a schema
 * round-trip: parse(JSON.parse(JSON.stringify(track))) deep-equals track.
 */
export function parseDirectionTrack(input: unknown): DirectionTrack {
  if (typeof input !== "object" || input === null) {
    throw new Error("DirectionTrack must be an object");
  }
  const obj = input as Record<string, unknown>;
  if (obj.version !== "1") {
    throw new Error(`DirectionTrack.version must be "1", got ${JSON.stringify(obj.version)}`);
  }

  const track: DirectionTrack = { version: "1" };

  if (obj.global !== undefined) {
    track.global = parseGlobalState(obj.global);
  }
  if (obj.spans !== undefined) {
    if (!Array.isArray(obj.spans)) {
      throw new Error("DirectionTrack.spans must be an array");
    }
    track.spans = obj.spans.map((span, i) => parseSpan(span, i));
  }
  return track;
}

function parseGlobalState(input: unknown): GlobalState {
  if (typeof input !== "object" || input === null) {
    throw new Error("global must be an object");
  }
  const obj = input as Record<string, unknown>;
  const global: GlobalState = {};
  if (obj.voice !== undefined) {
    if (typeof obj.voice !== "object" || obj.voice === null) {
      throw new Error("global.voice must be an object");
    }
    const v = obj.voice as Record<string, unknown>;
    const voice: VoiceIdentity = {};
    if (v.name !== undefined) voice.name = String(v.name);
    if (v.sex !== undefined) {
      if (v.sex !== "male" && v.sex !== "female") {
        throw new Error(`global.voice.sex must be "male" | "female", got ${JSON.stringify(v.sex)}`);
      }
      voice.sex = v.sex;
    }
    if (v.baseF0Hz !== undefined)
      voice.baseF0Hz = requireFiniteNumber(v.baseF0Hz, "global.voice.baseF0Hz");
    global.voice = voice;
  }
  if (obj.affect !== undefined) {
    global.affect = parseAffectSpec(obj.affect, "global.affect");
  }
  return global;
}

function parseAffectSpec(input: unknown, where: string): AffectSpec {
  if (typeof input !== "object" || input === null) {
    throw new Error(`${where} must be an object`);
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.preset !== "string" || obj.preset.length === 0) {
    throw new Error(`${where}.preset must be a non-empty string`);
  }
  const spec: AffectSpec = { preset: obj.preset as AffectCategory };
  if (obj.degree !== undefined) {
    spec.degree = requireFiniteNumber(obj.degree, `${where}.degree`);
  }
  return spec;
}

function parseSpan(input: unknown, index: number): DirectionSpan {
  if (typeof input !== "object" || input === null) {
    throw new Error(`spans[${index}] must be an object`);
  }
  const obj = input as Record<string, unknown>;
  if (typeof obj.id !== "string" || obj.id.length === 0) {
    throw new Error(`spans[${index}].id must be a non-empty string`);
  }
  const anchor = parseAnchor(obj.anchor, index);
  const span: DirectionSpan = { id: obj.id, anchor };
  if (obj.precedence !== undefined) {
    span.precedence = requireFiniteNumber(obj.precedence, `spans[${index}].precedence`);
  }
  if (obj.emphasis !== undefined) span.emphasis = obj.emphasis as EmphasisDirective;
  if (obj.break !== undefined) span.break = obj.break as BreakDirective;
  if (obj.pitch !== undefined) span.pitch = obj.pitch as PitchDelta;
  if (obj.rate !== undefined) span.rate = requireFiniteNumber(obj.rate, `spans[${index}].rate`);
  if (obj.affect !== undefined) span.affect = parseAffectSpec(obj.affect, `spans[${index}].affect`);
  if (obj.voiceQuality !== undefined)
    span.voiceQuality = obj.voiceQuality as Partial<VoiceQualityDelta>;
  if (obj.gesture !== undefined) span.gesture = obj.gesture as GestureRef;
  return span;
}

function parseAnchor(input: unknown, index: number): AnchorRange {
  if (typeof input !== "object" || input === null) {
    throw new Error(`spans[${index}].anchor must be an object`);
  }
  const obj = input as Record<string, unknown>;
  if (obj.unit !== "token" && obj.unit !== "word" && obj.unit !== "phrase") {
    throw new Error(`spans[${index}].anchor.unit must be token|word|phrase`);
  }
  const start = requireFiniteNumber(obj.start, `spans[${index}].anchor.start`);
  const anchor: AnchorRange = { unit: obj.unit, start };
  if (obj.end !== undefined)
    anchor.end = requireFiniteNumber(obj.end, `spans[${index}].anchor.end`);
  return anchor;
}

function requireFiniteNumber(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${where} must be a finite number, got ${JSON.stringify(value)}`);
  }
  return value;
}

/** Serialize a DirectionTrack to canonical JSON (pairs with parseDirectionTrack). */
export function serializeDirectionTrack(track: DirectionTrack): string {
  return JSON.stringify(track);
}
