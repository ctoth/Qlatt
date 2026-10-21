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

import {
  createProvenanceCollector,
  type DecisionRecord,
  type ProvenanceCollector,
} from "../provenance";
import { type AffectLibrary, affectDegree } from "./affect-presets";
import type { DimensionalVector, SpeakerSex, VoiceQualityDelta } from "./direction-track";
import {
  materializeVoiceQualityDelta,
  scaleDimensions,
  scaleVoiceQualityDelta,
} from "./direction-track";
import type { VoiceQualityChannel } from "./vq-channels";

/** High-level grouping of presets (affects the layer-application order downstream). */
export type AffectGroup = "emotion" | "epistemic" | "pragmatic" | "speech_act" | "clinical";

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
  engineeringEstimate?: boolean;
  /** Free note (e.g. "engineering estimate" where uncited as a unit). */
  note?: string;
}

/** The compiled affect: author label + dimensional + VQ substrate, all traceable. */
export interface CompiledAffect {
  decision?: DecisionRecord;
  decisions?: DecisionRecord[];
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
  provenance?: ProvenanceCollector;
  subject?: string;
  parents?: string[];
}

/** List every authorable preset name (clinical bare names included). */
export function listAffectPresetNames(library: AffectLibrary): string[] {
  return [...library.presets.keys(), ...library.variants.keys()];
}

/** True if `name` is a clinical state that needs a sex to resolve. */
export function isClinicalSexRequired(library: AffectLibrary, name: string): boolean {
  return library.variants.has(name);
}

/**
 * Resolve an author preset name + sex into a concrete AffectPreset. Clinical
 * bare names ("manic","depressive") resolve to `${name}_${sex}` and THROW if no
 * sex is supplied (Kaczmarek-Majer_2024 sex-inversion). Also accepts the
 * already-specific clinical variant names directly.
 */
export function resolveAffectPreset(
  library: AffectLibrary,
  name: string,
  sex?: SpeakerSex,
): AffectPreset {
  const variants = library.variants.get(name);
  if (variants && !sex)
    throw new Error(
      `Clinical affect preset '${name}' requires a speaker sex. Provide options.sex or voice.sex.`,
    );
  const resolved = variants ? variants.get(sex!) : name;
  const preset = resolved === undefined ? undefined : library.presets.get(resolved);
  if (!preset)
    throw new Error(
      `Unknown affect preset '${name}'. Known: ${listAffectPresetNames(library).join(", ")}`,
    );
  return preset;
}

/**
 * Compile a named preset + degree into the dimensional + voice-quality
 * substrate (the core compiler). degree ∈ [0,1] scales BOTH the dimensions and
 * the VQ delta toward neutral; degree 0 (or the "neutral" preset) ⇒ identity.
 */
export function compileAffect(
  library: AffectLibrary,
  channels: readonly VoiceQualityChannel[],
  name: string,
  degree = 1,
  options: CompileAffectOptions = {},
): CompiledAffect {
  const preset = resolveAffectPreset(library, name, options.sex);
  const scaledDegree = affectDegree(degree, library.degree);
  const provenance = options.provenance ?? createProvenanceCollector();
  const curve = provenance.add({
    stage: "frontend",
    type: "affect_degree_scaled",
    subject: options.subject ?? "utterance",
    reason: `Affect '${name}' degree ${degree} mapped to ${scaledDegree} by the declared degree curve (engineering estimate).`,
    citations: [...library.degree.citations],
    parents: options.parents,
  });
  const records = [curve];
  if (preset.engineeringEstimate)
    records.push(
      provenance.add({
        stage: "frontend",
        type: "affect_engineering_estimate",
        subject: options.subject ?? "utterance",
        reason: `Affect preset '${preset.name}' contains engineering estimates marked in its YAML fields.`,
        citations: [],
        parents: [curve.id],
      }),
    );
  const decision = provenance.add({
    stage: "frontend",
    type: "affect_preset_applied",
    subject: options.subject ?? "utterance",
    reason: `Affect preset '${name}' resolved to '${preset.name}' at degree ${scaledDegree}`,
    citations: [...preset.citations],
    parents: records.map((record) => record.id),
  });
  return {
    label: name,
    group: preset.group,
    degree: scaledDegree,
    resolvedSex: preset.requiresSex || preset.group === "clinical" ? options.sex : undefined,
    dimensions: scaleDimensions(preset.dimensions, scaledDegree),
    vq: scaleVoiceQualityDelta(
      channels,
      materializeVoiceQualityDelta(channels, preset.vq),
      scaledDegree,
    ),
    citations: [...preset.citations],
    decision,
    decisions: [...records, decision],
  };
}

/** The neutral compiled affect (the (c) empty-direction base case). */
export function neutralAffect(
  library: AffectLibrary,
  channels: readonly VoiceQualityChannel[],
): CompiledAffect {
  return compileAffect(library, channels, "neutral", 0);
}
