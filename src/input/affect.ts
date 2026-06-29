/**
 * Affect compiler — named categorical presets → dimensional (V/A/D) + voice-
 * quality/prosody delta vector.
 *
 * This is the EmotionML parallel-vocabulary pattern made concrete (W3C
 * EmotionML 1.0): a single affect carries BOTH its author label (the
 * categorical preset name + degree) AND the engine's continuous substrate (a
 * `{valence, arousal, dominance}` dimensional vector plus a cited
 * `VoiceQualityDelta`). The author picks "tender, mild"; the compiler records
 * and traces it as a dimensional + voice-quality delta with citations.
 *
 * Per design/beauty-synthesis/03-emotion.md §2 and §4 the control model is a
 * *dimensional engine with categorical presets as named coordinates*: discrete
 * emotions are points in a continuous valence×arousal×power space (Scherer_1986
 * Table 5, Murray_1993 §I.B), and the voice-quality substrate carries valence
 * and the milder/intimate/depressed states that prosody alone cannot
 * (Gobl_2003, Burkhardt_2009).
 *
 * The preset tables are ported verbatim from
 * projects/voice-quality-synthesis/2-Parameter-Specifications.md §2.4–2.10.
 * Every preset carries the citations that justify its numbers (Principle 1: an
 * uncited affect delta is a bug).
 *
 * CLINICAL SEX-INVERSION (Kaczmarek-Majer_2024): male and female mania
 * acoustics are *exactly opposite*. Clinical presets therefore REQUIRE a sex
 * parameter and resolve to a sex-specific profile; a sex-agnostic clinical
 * preset is rejected.
 */

import type {
  DimensionalVector,
  SpeakerSex,
  VoiceQualityDelta,
} from "./direction-track";
import {
  NEUTRAL_DIMENSIONS,
  NEUTRAL_VQ,
  materializeVoiceQualityDelta,
  scaleDimensions,
  scaleVoiceQualityDelta,
} from "./direction-track";

/** High-level grouping of presets (affects the layer-application order downstream). */
export type AffectGroup =
  | "emotion"
  | "epistemic"
  | "pragmatic"
  | "speech_act"
  | "clinical";

/** The canonical preset names an author may write. */
export type AffectCategory = string;

/** One entry in the cited preset library. */
export interface AffectPreset {
  /** Author-facing preset name. */
  name: string;
  group: AffectGroup;
  /** The dimensional coordinate (V/A/D) this preset names. */
  dimensions: DimensionalVector;
  /** The voice-quality / prosody delta substrate (relative to neutral). */
  vq: Partial<VoiceQualityDelta>;
  /** Citations justifying the numbers. */
  citations: string[];
  /**
   * True if this preset's acoustics depend on speaker sex (clinical mania/
   * depression). Such presets MUST be resolved via a sex-specific variant and
   * cannot be compiled without a sex parameter.
   */
  requiresSex?: boolean;
  /** Free note (e.g. "engineering estimate" where uncited as a unit). */
  note?: string;
}

/** The compiled affect: author label + dimensional + VQ substrate, all traceable. */
export interface CompiledAffect {
  /** The author's label (e.g. "angry@0.7" form is split: label + degree). */
  label: string;
  group: AffectGroup;
  degree: number;
  /** Sex used to resolve a clinical preset, if any. */
  resolvedSex?: SpeakerSex;
  /** The dimensional substrate (degree-scaled). */
  dimensions: DimensionalVector;
  /** The voice-quality / prosody substrate (degree-scaled). */
  vq: VoiceQualityDelta;
  citations: string[];
}

export interface CompileAffectOptions {
  /** Required for clinical presets (manic/depressive). */
  sex?: SpeakerSex;
}

// ---------------------------------------------------------------------------
// §2.4 + doc 03 — Emotion presets
// ---------------------------------------------------------------------------

const EMOTION_PRESETS: AffectPreset[] = [
  {
    name: "neutral",
    group: "emotion",
    dimensions: { ...NEUTRAL_DIMENSIONS },
    vq: {},
    citations: ["Scherer_1986"],
  },
  {
    name: "angry",
    group: "emotion",
    // Hot anger: negative valence, very high arousal, dominant.
    dimensions: { valence: -0.8, arousal: 0.9, dominance: 0.6 },
    vq: {
      rdDelta: -0.5,
      f0Scale: 1.3,
      f0VarianceScale: 1.5,
      durationScale: 0.85,
      intensityBoost: 6,
      pauseScale: 0.7,
      spectralTiltBoost: -3, // Rutledge TL ×0.85 → reduced tilt (more HF energy)
      f1Delta: -20,
      f2Delta: -15,
      f3Delta: -30,
      fbw1Scale: 0.9,
      fbw2Scale: 1.1,
      fbw3Scale: 1.1,
    },
    citations: ["Cummings_1995", "France_2000", "Rutledge_1995", "Murray_1993", "Scherer_1986"],
  },
  {
    name: "loud",
    group: "emotion",
    dimensions: { valence: 0.0, arousal: 0.7, dominance: 0.7 },
    vq: {
      rdDelta: -0.4,
      f0Scale: 1.1,
      durationScale: 0.95,
      intensityBoost: 8,
      pauseScale: 0.8,
      spectralTiltBoost: -3, // Rutledge loud TL ×0.75
      f1Delta: -10,
      f2Delta: -10,
      f3Delta: -15,
      fbw1Scale: 0.95,
      fbw2Scale: 1.05,
      fbw3Scale: 1.05,
    },
    citations: ["Cummings_1995", "Rutledge_1995"],
  },
  {
    name: "soft",
    group: "emotion",
    dimensions: { valence: 0.4, arousal: -0.5, dominance: -0.4 },
    vq: {
      rdDelta: +1.2,
      f0Scale: 0.95,
      f0VarianceScale: 0.7,
      durationScale: 1.1,
      intensityBoost: -6,
      ahBoost: 8,
      pauseScale: 1.1,
      spectralTiltBoost: +3, // Rutledge soft TL ×1.18 (softer)
      f1Delta: +20,
      f2Delta: +15,
      f3Delta: +30,
      fbw1Scale: 1.15,
      fbw2Scale: 0.95,
      fbw3Scale: 0.95,
    },
    citations: ["Cummings_1995", "Gobl_2003", "Rutledge_1995"],
  },
  {
    name: "sad",
    group: "emotion",
    dimensions: { valence: -0.6, arousal: -0.5, dominance: -0.4 },
    vq: {
      rdDelta: +0.3,
      f0Scale: 1.0, // France_2000: F0 a weak discriminator; formants carry it
      f0VarianceScale: 0.6,
      durationScale: 1.2,
      intensityBoost: -3,
      ahBoost: 4,
      pauseScale: 1.3,
      f1Delta: +50,
      f2Delta: +40,
      f3Delta: +80,
      fbw1Scale: 1.3,
      fbw2Scale: 0.85,
      fbw3Scale: 0.85,
    },
    citations: ["France_2000", "Murray_1993", "Gobl_2003", "Scherer_1986"],
  },
  {
    name: "happy",
    group: "emotion",
    // Joy: high valence, high arousal. Hard to recognize on F0 alone (Scherer_2001).
    dimensions: { valence: 0.8, arousal: 0.6, dominance: 0.3 },
    vq: {
      rdDelta: -0.2,
      f0Scale: 1.15,
      f0VarianceScale: 1.3,
      durationScale: 0.9,
      intensityBoost: 3,
      pauseScale: 0.85,
      f1Delta: -10, // smiling formant raise approximated; see note
      f2Delta: -10,
      f3Delta: -15,
      fbw1Scale: 0.95,
    },
    citations: ["Murray_1993", "Banse_1996", "Scherer_2001"],
    note: "Joy under-recognizes on F0 alone (Scherer_2001 42%); needs smiling-formant + upward contour cues.",
  },
  {
    name: "anxious",
    group: "emotion",
    dimensions: { valence: -0.4, arousal: 0.5, dominance: -0.5 },
    vq: {
      rdDelta: +0.1,
      f0Scale: 1.1,
      f0VarianceScale: 0.85,
      durationScale: 1.0,
      intensityBoost: 0,
      pauseScale: 1.4, // PRIMARY CUE (Laukka_2008 η²=0.21)
      spectralTiltBoost: -2,
    },
    citations: ["Laukka_2008"],
  },
  {
    name: "fatigued",
    group: "emotion",
    dimensions: { valence: -0.3, arousal: -0.6, dominance: -0.3 },
    vq: {
      rdDelta: +0.2,
      f0Scale: 1.0, // F0 mean stable (Vogel_2010)
      f0VarianceScale: 1.3, // F0 variance INCREASED (opposite of anxious)
      durationScale: 1.15,
      ahBoost: 2,
      pauseScale: 1.3,
      spectralTiltBoost: +3, // alpha-ratio increase = steeper tilt
    },
    citations: ["Vogel_2010"],
  },
  {
    // doc 03 §6 composite: quiet-happiness (wide/relaxed) + breathy (Gobl) +
    // narrow non-fluctuating high F0 + portamento (Murray "affection").
    name: "tender",
    group: "emotion",
    dimensions: { valence: 0.6, arousal: -0.4, dominance: -0.2 },
    vq: {
      rdDelta: +1.0, // breathy (Gobl intimate/friendly)
      f0Scale: 1.05, // higher than neutral but does not fluctuate
      f0VarianceScale: 0.6,
      durationScale: 1.1,
      intensityBoost: -4,
      ahBoost: 6,
      pauseScale: 1.05,
      spectralTiltBoost: +3, // warm/soft
    },
    citations: ["Gobl_2003", "Murray_1993", "Scherer_1986"],
    note: "Engineering estimate (doc 03 §6): tenderness is not a Scherer category; composed, not cited as a unit.",
  },
];

// ---------------------------------------------------------------------------
// §2.6 — Epistemic presets (Goupil_2021)
// ---------------------------------------------------------------------------

const EPISTEMIC_PRESETS: AffectPreset[] = [
  {
    name: "confident",
    group: "epistemic",
    dimensions: { valence: 0.2, arousal: 0.1, dominance: 0.6 },
    vq: { rdDelta: 0.0, f0VarianceScale: 1.1, durationScale: 1.05, intensityBoost: 1, pauseScale: 0.85 },
    citations: ["Goupil_2021", "Jiang_2017"],
  },
  {
    name: "doubtful",
    group: "epistemic",
    dimensions: { valence: -0.1, arousal: 0.0, dominance: -0.5 },
    vq: { rdDelta: +0.1, f0VarianceScale: 0.9, durationScale: 0.95, intensityBoost: -1, pauseScale: 1.2 },
    citations: ["Goupil_2021", "Jiang_2017"],
  },
  {
    name: "competent",
    group: "epistemic",
    dimensions: { valence: 0.1, arousal: 0.1, dominance: 0.5 },
    vq: { rdDelta: -0.1, durationScale: 1.0, intensityBoost: 2, pauseScale: 0.9 },
    citations: ["Goupil_2021"],
  },
  {
    name: "hedging",
    group: "epistemic",
    dimensions: { valence: 0.0, arousal: 0.0, dominance: -0.3 },
    vq: { rdDelta: 0.0, durationScale: 0.97, intensityBoost: 0, pauseScale: 1.1 },
    citations: ["Goupil_2021"],
  },
];

// ---------------------------------------------------------------------------
// §2.7 — Pragmatic presets (Trott_2022, Caballero_2018, Fish_2017, Cheang_2008)
// ---------------------------------------------------------------------------

const PRAGMATIC_PRESETS: AffectPreset[] = [
  {
    name: "indirect_request",
    group: "pragmatic",
    dimensions: { valence: 0.1, arousal: 0.2, dominance: 0.2 },
    vq: { rdDelta: 0.0, f0Scale: 1.08, durationScale: 1.1, intensityBoost: 0, pauseScale: 0.95 },
    citations: ["Trott_2022"],
  },
  {
    name: "direct_request",
    group: "pragmatic",
    dimensions: { valence: 0.0, arousal: 0.3, dominance: 0.5 },
    vq: { rdDelta: -0.1, durationScale: 0.95, intensityBoost: 2, pauseScale: 0.9 },
    citations: ["Trott_2022"],
  },
  {
    name: "polite_question",
    group: "pragmatic",
    dimensions: { valence: 0.2, arousal: 0.1, dominance: -0.2 },
    vq: { rdDelta: 0.0, durationScale: 1.08, intensityBoost: -1, pauseScale: 1.0 },
    citations: ["Trott_2022"],
  },
  {
    name: "sarcastic",
    group: "pragmatic",
    dimensions: { valence: -0.3, arousal: -0.1, dominance: 0.3 },
    vq: { rdDelta: 0.0, f0Scale: 0.92, f0VarianceScale: 0.8, durationScale: 1.15, pauseScale: 1.1 },
    citations: ["Cheang_2008", "Trott_2022"],
  },
  {
    // CRITICAL (Caballero_2018): impoliteness is NOT low-intensity anger — it is
    // LOW F0, SLOW rate, LOW arousal, high dominance (contempt).
    name: "rude",
    group: "pragmatic",
    dimensions: { valence: -0.5, arousal: -0.1, dominance: 0.7 },
    vq: { rdDelta: -0.15, f0Scale: 0.9, f0VarianceScale: 0.85, durationScale: 1.15, pauseScale: 1.1 },
    citations: ["Caballero_2018"],
  },
  {
    name: "dismissive",
    group: "pragmatic",
    dimensions: { valence: -0.4, arousal: -0.3, dominance: 0.5 },
    vq: { rdDelta: -0.1, f0Scale: 0.95, f0VarianceScale: 0.8, durationScale: 1.1, intensityBoost: -1, pauseScale: 1.0 },
    citations: ["Caballero_2018"],
  },
  {
    name: "curt",
    group: "pragmatic",
    dimensions: { valence: -0.4, arousal: 0.1, dominance: 0.5 },
    vq: { rdDelta: -0.2, f0Scale: 0.92, f0VarianceScale: 0.75, durationScale: 0.9, pauseScale: 0.8 },
    citations: ["Caballero_2018"],
  },
  {
    name: "insincere",
    group: "pragmatic",
    dimensions: { valence: 0.1, arousal: -0.2, dominance: 0.0 },
    vq: { rdDelta: 0.0, f0Scale: 0.96, f0VarianceScale: 0.85, durationScale: 1.27, pauseScale: 1.0 },
    citations: ["Fish_2017"],
    note: "Primary marker is slow rate (Fish_2017 η²=.22); initial F0 drop + amplitude crescendo are position-dependent.",
  },
];

// ---------------------------------------------------------------------------
// §2.8 — Speech-act presets (Hellbernd_2016; explicit arousal/valence labels)
// ---------------------------------------------------------------------------

const SPEECH_ACT_PRESETS: AffectPreset[] = [
  {
    name: "naming",
    group: "speech_act",
    dimensions: { valence: 0.0, arousal: -0.4, dominance: 0.0 }, // calm/neutral baseline
    vq: { f0Scale: 1.0, durationScale: 1.0, intensityBoost: 0, rdDelta: 0.0 },
    citations: ["Hellbernd_2016"],
  },
  {
    name: "criticism",
    group: "speech_act",
    dimensions: { valence: -0.6, arousal: 0.7, dominance: 0.4 }, // excited/negative
    vq: { f0Scale: 1.73, durationScale: 1.32, intensityBoost: 8, rdDelta: -0.2 },
    citations: ["Hellbernd_2016"],
  },
  {
    name: "speech_act_doubt",
    group: "speech_act",
    dimensions: { valence: 0.0, arousal: -0.2, dominance: -0.2 }, // calm/neutral
    vq: { f0Scale: 1.42, durationScale: 1.42, intensityBoost: 0, rdDelta: +0.1 },
    citations: ["Hellbernd_2016"],
  },
  {
    name: "suggestion",
    group: "speech_act",
    dimensions: { valence: 0.5, arousal: 0.3, dominance: 0.2 }, // moderate/positive
    vq: { f0Scale: 1.55, durationScale: 0.94, intensityBoost: 6, rdDelta: 0.0 },
    citations: ["Hellbernd_2016"],
  },
  {
    name: "warning",
    group: "speech_act",
    dimensions: { valence: -0.7, arousal: 0.9, dominance: 0.7 }, // excited/negative, loudest
    vq: { f0Scale: 2.01, durationScale: 1.26, intensityBoost: 15, rdDelta: -0.3 },
    citations: ["Hellbernd_2016"],
  },
  {
    name: "wish",
    group: "speech_act",
    dimensions: { valence: 0.5, arousal: -0.3, dominance: -0.1 }, // calm/positive
    vq: { f0Scale: 1.11, durationScale: 1.42, intensityBoost: 2, rdDelta: +0.2 },
    citations: ["Hellbernd_2016"],
  },
];

// ---------------------------------------------------------------------------
// §2.10 — Clinical presets (Kaczmarek-Majer_2024) — SEX-SPECIFIC, INVERTED
// ---------------------------------------------------------------------------
//
// These are resolved by `${state}_${sex}` and are NOT directly authorable as a
// bare name without a sex. The bare clinical names ("manic","depressive") are
// registered as requiresSex sentinels so the compiler can demand a sex and pick
// the right variant.

const CLINICAL_PRESETS: AffectPreset[] = [
  {
    name: "manic_male",
    group: "clinical",
    dimensions: { valence: 0.3, arousal: 0.7, dominance: 0.6 },
    vq: {
      intensityBoost: 6,
      f0Scale: 1.15,
      durationScale: 0.9,
      pauseScale: 0.7,
      rdDelta: -0.15,
      jitterScale: 1.15,
      shimmerScale: 1.13,
      f1Delta: +40,
      f2Delta: +40,
      fbw1Scale: 0.85,
      fbw2Scale: 0.9,
      spectralTiltBoost: -3,
    },
    citations: ["Kaczmarek-Majer_2024"],
  },
  {
    name: "manic_female",
    group: "clinical",
    // INVERTED from male: quieter, lower, less clear, smoother.
    dimensions: { valence: 0.1, arousal: -0.3, dominance: -0.2 },
    vq: {
      intensityBoost: -2,
      f0Scale: 0.97,
      durationScale: 1.0,
      pauseScale: 1.0,
      rdDelta: +0.1,
      jitterScale: 0.85,
      shimmerScale: 0.9,
      f1Delta: -20,
      f2Delta: -20,
      fbw1Scale: 1.15,
      fbw2Scale: 1.1,
      spectralTiltBoost: +2,
    },
    citations: ["Kaczmarek-Majer_2024"],
  },
  {
    name: "depressive_male",
    group: "clinical",
    dimensions: { valence: -0.6, arousal: -0.4, dominance: -0.4 },
    vq: {
      intensityBoost: -5,
      f0Scale: 1.0,
      durationScale: 1.05,
      pauseScale: 0.85,
      rdDelta: +0.2,
      jitterScale: 0.9, // paradoxically LESS rough (Kaczmarek-Majer_2024 β=-0.63)
      fbw1Scale: 1.25,
      fbw2Scale: 1.15,
      spectralTiltBoost: +2,
    },
    citations: ["Kaczmarek-Majer_2024"],
  },
  {
    name: "depressive_female",
    group: "clinical",
    // Weak female depression markers; minimal modulation.
    dimensions: { valence: -0.3, arousal: -0.1, dominance: -0.2 },
    vq: { intensityBoost: 0, f0Scale: 1.0, durationScale: 1.0, pauseScale: 1.1, rdDelta: +0.1 },
    citations: ["Kaczmarek-Majer_2024"],
  },
];

/** Bare clinical state names that require a sex to resolve to a variant. */
const CLINICAL_SEX_REQUIRED: ReadonlySet<string> = new Set(["manic", "depressive"]);

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

function buildRegistry(): Map<string, AffectPreset> {
  const map = new Map<string, AffectPreset>();
  for (const preset of [
    ...EMOTION_PRESETS,
    ...EPISTEMIC_PRESETS,
    ...PRAGMATIC_PRESETS,
    ...SPEECH_ACT_PRESETS,
    ...CLINICAL_PRESETS,
  ]) {
    if (map.has(preset.name)) {
      throw new Error(`Duplicate affect preset name: ${preset.name}`);
    }
    map.set(preset.name, preset);
  }
  return map;
}

/** The full cited preset library, keyed by author-facing name. */
export const AFFECT_PRESETS: ReadonlyMap<string, AffectPreset> = buildRegistry();

/** List every authorable preset name (clinical bare names included). */
export function listAffectPresetNames(): string[] {
  return [...AFFECT_PRESETS.keys(), ...CLINICAL_SEX_REQUIRED];
}

/** True if `name` is a clinical state that needs a sex to resolve. */
export function isClinicalSexRequired(name: string): boolean {
  return CLINICAL_SEX_REQUIRED.has(name);
}

/**
 * Resolve an author preset name + sex into a concrete AffectPreset. Clinical
 * bare names ("manic","depressive") resolve to `${name}_${sex}` and THROW if no
 * sex is supplied (Kaczmarek-Majer_2024 sex-inversion). Also accepts the
 * already-specific clinical variant names directly.
 */
export function resolveAffectPreset(name: string, sex?: SpeakerSex): AffectPreset {
  if (CLINICAL_SEX_REQUIRED.has(name)) {
    if (!sex) {
      throw new Error(
        `Clinical affect preset '${name}' requires a speaker sex: male/female mania ` +
          `acoustics invert (Kaczmarek-Majer_2024). Provide options.sex or voice.sex.`,
      );
    }
    const variant = `${name}_${sex}`;
    const preset = AFFECT_PRESETS.get(variant);
    if (!preset) throw new Error(`No clinical preset variant '${variant}'`);
    return preset;
  }

  const preset = AFFECT_PRESETS.get(name);
  if (!preset) {
    throw new Error(`Unknown affect preset '${name}'. Known: ${listAffectPresetNames().join(", ")}`);
  }
  return preset;
}

/**
 * Compile a named preset + degree into the dimensional + voice-quality
 * substrate (the core compiler). degree ∈ [0,1] scales BOTH the dimensions and
 * the VQ delta toward neutral; degree 0 (or the "neutral" preset) ⇒ identity.
 */
export function compileAffect(
  name: string,
  degree = 1,
  options: CompileAffectOptions = {},
): CompiledAffect {
  const preset = resolveAffectPreset(name, options.sex);
  const fullVq = materializeVoiceQualityDelta(preset.vq);
  const scaledVq = scaleVoiceQualityDelta(fullVq, degree);
  const scaledDims = scaleDimensions(preset.dimensions, degree);

  const resolvedSex = preset.requiresSex || preset.group === "clinical" ? options.sex : undefined;

  return {
    label: name,
    group: preset.group,
    degree: clampUnit(degree),
    resolvedSex,
    dimensions: scaledDims,
    vq: scaledVq,
    citations: [...preset.citations],
  };
}

/** The neutral compiled affect (the (c) empty-direction base case). */
export function neutralAffect(): CompiledAffect {
  return {
    label: "neutral",
    group: "emotion",
    degree: 0,
    dimensions: { ...NEUTRAL_DIMENSIONS },
    vq: { ...NEUTRAL_VQ },
    citations: ["Scherer_1986"],
  };
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
