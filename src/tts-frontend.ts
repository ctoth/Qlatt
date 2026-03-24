import {
  materializePhonemeTarget,
  loadFrontendResources,
  type InventorySpec,
  type FrontendResources,
} from "./declarative-frontend/inventory";
import { normalizeText } from "./g2p/text-normalize";
import { loadBundledRulepackSpec } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";
import { transcribeText } from "./transcribe-text";
import {
  assembleKlattTrack,
  buildSyncTimeMap,
  extractLayerCommands,
} from "./track-assembler";
import type {
  OutputConfig,
  VoiceQualityOverrides,
  LayeredF0ModelConfig,
  F0LayerCommand,
} from "./track-assembler";
import type { TranscriptionConfig, KlattFrame } from "./tts-frontend-types";
import {
  recordInventoryDecision,
  runPhasesWithProvenance,
} from "./tts-frontend-provenance";
import { annotateProsody } from "./prosodic-annotator";
import type { Diagnostics } from "./diagnostics";
import { emitNasalSubsystemExplainability } from "./nasal-subsystem";
import {
  buildDeclarativeControlScore,
  validateDeclarativeControlScore,
} from "./control-score";
import type { DeclarativeControlScore } from "./tts-frontend-types";
import {
  DEFAULT_SPEAKER_PROFILE_PATH,
  collectSpeakerProfileCitations,
  loadSpeakerProfileSync,
  resolveSpeakerProfile,
  type ResolvedSpeakerProfile,
} from "./speaker-profile";
import {
  DEFAULT_SOURCE_CONTOUR_PATH,
  loadSourceContourSync,
  resolveSourceContour,
} from "./source-contour";

/**
 * Loose token type for intermediate pipeline stages.
 * Starts as TranscriptionToken shape, gains fields through inventory lookup
 * and rule application, eventually becomes a PhoneToken or F0PointToken.
 *
 * Internal to the pipeline — module boundaries use {@link KlattFrame}.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PipelineToken = Record<string, any>;

/** Voice quality preset names.
 *  Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009 */
export type VoiceQuality = 'modal' | 'breathy' | 'pressed' | 'creaky' | 'whispery' | 'falsetto';

/** Resolved voice quality preset values (from the selected frontend spec's voice_quality_presets). */
export interface VoiceQualityPreset {
  rd: number;
  oq: number;
  tl: number;
  ah_offset_db: number;
  flutter: number;
  jitter: number;
  f0_scale: number;
}

export type TextToKlattTrackOptions = {
  provenance?: ProvenanceCollector | null;
  frontendId?: string;
  /** Speech rate multiplier: 1.0 = normal, 2.0 = double speed, 0.5 = half speed.
   *  Clamped to [0.5, 2.0]. Citation: Klatt 1976 §III */
  rate?: number;
  /** Speaker profile overrides. Merged into params.policy.speaker in the CEL context.
   *  Defaults are defined in the selected frontend spec under parameters.policy.speaker.
   *  Citations: O'Shaughnessy 1976, Kent & Vorperian 2018, Fant 1997, Klatt & Klatt 1990 */
  speaker?: {
    /** Baseline fundamental frequency in Hz. Male default: 110, Female: ~200, Child: ~260.
     *  Citation: O'Shaughnessy 1976 */
    base_f0_hz?: number;
    /** Uniform formant frequency multiplier. Male: 1.0, Female: ~1.17, Child: ~1.3.
     *  Citation: Kent & Vorperian 2018 (approximation; real scaling is non-uniform) */
    formant_scale?: number;
    /** Default Rd parameter for LF glottal source. Male: 0.7, Female: ~1.4.
     *  Citation: Fant 1997 Table 1 */
    rd_default?: number;
    /** Additive spectral tilt offset in dB. Male: 0, Female: ~6.
     *  Citation: Klatt & Klatt 1990 (H1-H2 gender difference) */
    spectral_tilt_offset_db?: number;
  };
  /** Voice quality preset. Controls glottal source shape (Rd), aspiration noise (AH),
   *  spectral tilt (TL), flutter, and jitter. 'modal' or undefined = no change.
   *  Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009 */
  voiceQuality?: VoiceQuality;
  diagnostics?: Diagnostics | null;
};

export type FrontendPhoneSummary = {
  index: number;
  phoneme: string;
  stress?: number | null;
  word?: string;
  durationMs: number;
  minimumDurationMs?: number;
};

export type TextToKlattTrackDetailedResult = {
  track: KlattFrame[];
  frontendPhones: FrontendPhoneSummary[];
  f0LayerCommands?: F0LayerCommand[];
  controlScore: DeclarativeControlScore;
};

// Plain stop symbols are intentionally rewritten in the structural phase
// (Klatt 1980 stop model: closure + release).
const STRUCTURAL_STOP_BASES = new Set(["P", "T", "K", "B", "D", "G"]);

// Extract output and transcription configuration from the loaded YAML rulepack.
// Unwraps {value, citations} objects into plain numbers so downstream OutputConfig
// consumers see the same shape they always did.
function unwrapOutputNumber(entry: unknown): number | undefined {
  if (typeof entry === "number" && Number.isFinite(entry)) return entry;
  if (
    entry &&
    typeof entry === "object" &&
    typeof (entry as { value?: unknown }).value === "number" &&
    Number.isFinite((entry as { value: number }).value)
  ) {
    return (entry as { value: number }).value;
  }
  return undefined;
}

function getRulepackOutputConfig(specSource: unknown): OutputConfig {
  const raw = (specSource as any)?.output;
  if (!raw || typeof raw !== "object") {
    throw new Error("outputConfig: frontend spec must contain an 'output:' section");
  }
  const blend = raw.blend;
  const minDuration = raw.min_duration;
  const config: OutputConfig = {
    blend: blend
      ? {
          factor: unwrapOutputNumber(blend.factor),
          keys: Array.isArray(blend.keys) ? blend.keys : undefined,
          smooth_types: Array.isArray(blend.smooth_types) ? blend.smooth_types : undefined,
        }
      : undefined,
    min_duration: minDuration
      ? {
          stop_release_ms: unwrapOutputNumber(minDuration.stop_release_ms),
          default_ms: unwrapOutputNumber(minDuration.default_ms),
        }
      : undefined,
    initial_silence_ms: unwrapOutputNumber(raw.initial_silence_ms),
    final_silence_ms: unwrapOutputNumber(raw.final_silence_ms),
  };
  return config;
}

function getRulepackTranscriptionConfig(specSource: unknown): TranscriptionConfig | undefined {
  return (specSource as any)?.transcription ?? undefined;
}

function readPolicyNumber(entry: unknown): number | undefined {
  if (typeof entry === "number" && Number.isFinite(entry)) return entry;
  if (
    entry &&
    typeof entry === "object" &&
    typeof (entry as { value?: unknown }).value === "number" &&
    Number.isFinite((entry as { value: number }).value)
  ) {
    return (entry as { value: number }).value;
  }
  return undefined;
}

const SPEAKER_FORMANT_KEYS = [
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10",
] as const;

function applySpeakerProfileToParams(
  params: Record<string, number> | null | undefined,
  speaker: ResolvedSpeakerProfile,
  sourceContourBaseline: {
    source_mode: number;
    rd: number;
    rd_ref: number;
    spectral_tilt_offset_db: number;
  },
): void {
  if (!params) return;

  params.sourceMode = sourceContourBaseline.source_mode;
  params.Rd = sourceContourBaseline.rd;
  params.RdRef = sourceContourBaseline.rd_ref;
  if (sourceContourBaseline.spectral_tilt_offset_db !== 0) {
    params.TL = (params.TL ?? 0) + sourceContourBaseline.spectral_tilt_offset_db;
  }
  if (speaker.formant_scale !== 1.0) {
    for (const key of SPEAKER_FORMANT_KEYS) {
      const value = params[key];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        params[key] = value * speaker.formant_scale;
      }
    }
  }
}

// Re-export normalizeText from g2p/text-normalize
export { normalizeText } from "./g2p/text-normalize";

// Re-export transcribeText from transcribe-text (backward compatibility)
export { transcribeText } from "./transcribe-text";

// --- Main Pipeline ---
function buildTextToKlattTrackDetailed(
  inputText: string,
  baseF0: number | undefined = undefined,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {}
): TextToKlattTrackDetailedResult {
  const frontendId = options.frontendId ?? "qlatt-english";
  const frontendSpec = loadBundledRulepackSpec(frontendId);
  const rulepackOutputConfig: OutputConfig = getRulepackOutputConfig(frontendSpec);
  const rulepackTranscriptionConfig = getRulepackTranscriptionConfig(frontendSpec);

  // Load inventory, LTS, and morphology paths from the frontend spec.
  // Every resource path originates in frontend.yaml — no hardcoded defaults.
  const resources = loadFrontendResources(frontendSpec as Record<string, unknown>);
  const { inventory: frontendInventory, ltsPath, morphologyPath } = resources;
  const inventoryCitation = resources.inventoryPath;

  // No-op dictionary lookup for frontends with custom LTS rules (their phoneme set
  // won't match CMU dictionary entries).
  const noOpDictLookup = (): null => null;

  const provenance = options.provenance ?? null;
  const requestedRate = options.rate ?? 1.0;
  const diagnostics = options.diagnostics ?? null;
  const speakerProfilePath =
    typeof (frontendSpec as { speaker_profile_path?: unknown })?.speaker_profile_path === "string"
      ? (frontendSpec as { speaker_profile_path: string }).speaker_profile_path
      : DEFAULT_SPEAKER_PROFILE_PATH;
  const speakerProfileSpec = loadSpeakerProfileSync(speakerProfilePath);
  const resolvedSpeaker = resolveSpeakerProfile({
    baseF0,
    speakerOverride: options.speaker,
    profileSpec: speakerProfileSpec,
  });
  let effectiveBaseF0 = resolvedSpeaker.base_f0_hz;
  // Speaker profile overrides — merged into policy.speaker for all rule phases.
  // Citations: O'Shaughnessy 1976, Kent & Vorperian 2018, Fant 1997, Klatt & Klatt 1990
  const speakerOverrides = { speaker: resolvedSpeaker };
  provenance?.add({
    stage: "frontend",
    type: "speaker_profile_selected",
    subject: "speaker_profile",
    reason: `Resolved speaker profile base_f0_hz=${resolvedSpeaker.base_f0_hz}, formant_scale=${resolvedSpeaker.formant_scale}, rd_default=${resolvedSpeaker.rd_default}, spectral_tilt_offset_db=${resolvedSpeaker.spectral_tilt_offset_db}`,
    citations: collectSpeakerProfileCitations(speakerProfileSpec, speakerProfilePath),
  });

  const sourceContourPath =
    typeof (frontendSpec as { source_contour_path?: unknown })?.source_contour_path === "string"
      ? (frontendSpec as { source_contour_path: string }).source_contour_path
      : DEFAULT_SOURCE_CONTOUR_PATH;
  const sourceContourSpec = loadSourceContourSync(sourceContourPath);
  const sourceContour = resolveSourceContour({
    spec: sourceContourSpec,
    requestedQuality: options.voiceQuality,
    speaker: resolvedSpeaker,
    baseF0Hz: effectiveBaseF0,
  });
  let voiceQualityOverrides: VoiceQualityOverrides | undefined = sourceContour.voiceQualityOverrides;
  effectiveBaseF0 = sourceContour.effectiveBaseF0Hz;
  provenance?.add({
    stage: "frontend",
    type: "source_contour_selected",
    subject: "source_contour",
    reason: `Resolved source contour preset=${sourceContour.presetName}, source_mode=${sourceContour.baseline.source_mode}, rd=${sourceContour.baseline.rd}, rd_ref=${sourceContour.baseline.rd_ref}, base_f0_hz=${effectiveBaseF0}`,
    citations: sourceContour.citations,
  });

  const tokenDecisionIds = new Map<string, string>();
  const normalized = normalizeText(inputText);
  // Transcribe returns a flat list of phoneme objects with word info
  let parameterSequence: PipelineToken[] = transcribeText(normalized, {
    provenance,
    transcriptionConfig: rulepackTranscriptionConfig,
    ltsPath,
    morphologyPath,
    dictLookup: (frontendSpec as Record<string, unknown>).skip_dictionary ? noOpDictLookup : undefined,
    specSource: frontendSpec,
  });

  // --- Prepare Parameter Sequence (Map phonemes to targets, fill params) ---
  parameterSequence = parameterSequence.map((ph: PipelineToken, index: number) => {
    let targetKeyBase = ph.phoneme;

    // Delegate stress-aware inventory lookup to materializePhonemeTarget
    const materialized = materializePhonemeTarget(targetKeyBase, {
      stress: ph.stress,
      inventorySpec: frontendInventory,
    });

    // Warn if phoneme was not found (materialized falls back to SIL internally)
    const phonemeTargets = frontendInventory.phoneme_targets;
    const isStructuralStopBase = STRUCTURAL_STOP_BASES.has(targetKeyBase);
    if (
      !isStructuralStopBase &&
      !phonemeTargets[materialized.phoneme] &&
      !phonemeTargets[targetKeyBase]
    ) {
      diagnostics?.warn(
        `No baseline target found for phoneme '${targetKeyBase}'. Using SIL.`,
        { phoneme: targetKeyBase, stress: ph.stress, word: ph.word },
        "W_PHONEME_NOT_IN_INVENTORY",
      );
    }

    const tokenId = `ph_${index}`;
    const decisionId = recordInventoryDecision(
      provenance,
      index,
      targetKeyBase,
      ph.phoneme,
      ph._pronDecisionId,
      inventoryCitation,
    );
    if (decisionId) {
      tokenDecisionIds.set(tokenId, decisionId);
    }

    // Return the enriched phoneme data object for the sequence.
    // Spread materialized (params, duration, inherentDuration, type, boolean flags,
    // inventorySW) then override phoneme with the base key (stress suffix stripped).
    return {
      id: tokenId,
      ...materialized,
      phoneme: targetKeyBase,
      stress: ph.stress,
      punctuationSymbol: ph.isPunctuation ? ph.symbol : null,
      word: ph.word,
    };
  });

  // --- Apply Rules (Rules operate on the enriched parameterSequence) ---
  // Wrap materializePhonemeTarget to always inject the frontend inventory.
  const effectiveMaterialize = (phoneme: unknown, opts?: { stress?: number | null }) =>
    materializePhonemeTarget(phoneme, { ...opts, inventorySpec: frontendInventory });

  const runPhases = (
    sequence: PipelineToken[],
    phases: string[],
    parameters?: Record<string, unknown>,
  ): PipelineToken[] =>
    runPhasesWithProvenance(
      sequence,
      phases,
      effectiveMaterialize,
      provenance,
      tokenDecisionIds,
      parameters,
      frontendSpec,
    );

  const policyDefaults =
    frontendSpec?.parameters &&
    typeof frontendSpec.parameters === "object" &&
    "policy" in frontendSpec.parameters &&
    frontendSpec.parameters.policy &&
    typeof frontendSpec.parameters.policy === "object"
      ? (frontendSpec.parameters.policy as Record<string, unknown>)
      : null;
  const durationPolicyDefaults =
    policyDefaults &&
    "duration" in policyDefaults &&
    policyDefaults.duration &&
    typeof policyDefaults.duration === "object"
      ? (policyDefaults.duration as Record<string, unknown>)
      : null;

  const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === "object" && !Array.isArray(value);

  const mergePhaseParameters = (
    overrides?: Record<string, unknown>,
  ): Record<string, unknown> | undefined => {
    if (!isPlainRecord(overrides) && !isPlainRecord(policyDefaults)) {
      return overrides;
    }

    const next: Record<string, unknown> = isPlainRecord(overrides) ? { ...overrides } : {};
    const overridePolicy = isPlainRecord(next.policy) ? next.policy : {};
    const mergedPolicy: Record<string, unknown> = isPlainRecord(policyDefaults)
      ? { ...policyDefaults }
      : {};

    for (const [key, value] of Object.entries(overridePolicy)) {
      const baseValue = mergedPolicy[key];
      if (isPlainRecord(baseValue) && isPlainRecord(value)) {
        mergedPolicy[key] = { ...baseValue, ...value };
        continue;
      }
      mergedPolicy[key] = value;
    }

    if (Object.keys(mergedPolicy).length > 0) {
      next.policy = mergedPolicy;
    }

    return next;
  };
  const rateReference =
    durationPolicyDefaults &&
    "rate_reference" in durationPolicyDefaults &&
    typeof durationPolicyDefaults.rate_reference === "number"
      ? durationPolicyDefaults.rate_reference
      : null;
  const normalizedRate =
    rateReference != null && Number.isFinite(rateReference) && rateReference > 0
      ? requestedRate / rateReference
      : requestedRate;
  const rate = Math.max(0.5, Math.min(2.0, normalizedRate));

  // Run postlexical rules first (t-flapping, the-reduction operate on raw phonemes).
  // t_flapping must see raw T between vowels; structural would split T into
  // T_CL + T_REL + T_ASP, breaking the adjacency check.
  // Citation: Miller 1998, Pronunciation Modeling in Speech Synthesis
  // Speaker defaults/overrides are always present so declarative rules can
  // reference the same policy surface as the runtime defaults.
  const speakerPolicy = mergePhaseParameters({ policy: { ...speakerOverrides } });
  parameterSequence = runPhases(parameterSequence, ["postlexical"], speakerPolicy);
  parameterSequence = runPhases(parameterSequence, ["structural"], speakerPolicy);
  // Ensure id/stream/status fields exist before prosodic annotation.
  // The annotator reads phoneme, word, stress, punctuationSymbol — all present
  // after structural rules. It only ADDS new properties (breakIndex, isAccented,
  // isNuclearAccent, accentType, isFunctionWord, isContentWord, phraseAccent,
  // boundaryTone) so this is safe to run before duration rules.
  parameterSequence = parameterSequence.map((token: PipelineToken, index: number) => ({
    ...token,
    id: token.id ?? `ph_${index}`,
    stream: "phone",
    status: token.status ?? 1,
  }));

  // --- Syllable Count & Cluster Position Annotation ---
  // Now handled declaratively by the annotation phase (phases/annotation.yaml).
  // CEL functions count_word_vowels() and cluster_position_in_word() replicate
  // the logic that was previously in imperative loops here.
  // Citations: Klatt 1976 Rule 4 (polysyllabic shortening), Klatt 1973 (cluster shortening)
  parameterSequence = runPhases(parameterSequence, ["annotation"], speakerPolicy);

  // --- Prosodic Structure Annotation ---
  // Annotate tokens with prosodic structure (break indices, accent types,
  // function/content word classification, nuclear accent) BEFORE duration rules.
  // Moved before duration phase so that breakIndex, isAccented, isNuclearAccent
  // are available for break-index pre-boundary lengthening and accent lengthening.
  // Citations: Silverman 1992, Pierrehumbert 1980, O'Shaughnessy 1976, Allen 1987
  parameterSequence = annotateProsody(parameterSequence, {
    provenance: provenance ?? undefined,
    baseF0: effectiveBaseF0,
  });
  parameterSequence = runPhases(parameterSequence, ["duration"], mergePhaseParameters({
    policy: {
      ...speakerOverrides,
      duration: { rate_scale: rate },
      // Vowel centralization increases at fast rates (Lindblom 1963).
      // At rate=1.0: factor=0 → undershoot rule guard prevents matching.
      formant: { rate_undershoot_factor: Math.max(0, (rate - 1.0) * 0.3) },
    },
  }));
  parameterSequence = runPhases(parameterSequence, ["formant"], mergePhaseParameters({
    policy: {
      ...speakerOverrides,
      formant: { rate_undershoot_factor: Math.max(0, (rate - 1.0) * 0.3) },
    },
  }));
  // F0 range narrows at fast speaking rates (Ladd 2008 Ch.9).
  // At rate=1.0, f0RangeFactor=1.0 and all values are unchanged.
  const f0RangeFactor = 1.0 / Math.sqrt(rate);
  const f0Policy = (frontendSpec as any)?.parameters?.policy?.f0;
  parameterSequence = runPhases(parameterSequence, ["prosody", "finalize"], mergePhaseParameters({
    policy: {
      ...speakerOverrides,
      f0: {
        base_hz: effectiveBaseF0,
        continuation_rise_hz: (readPolicyNumber(f0Policy?.continuation_rise_hz) ?? 8) * f0RangeFactor,
        continuation_minor_rise_hz: (readPolicyNumber(f0Policy?.continuation_minor_rise_hz) ?? 5) * f0RangeFactor,
      },
    },
  }));
  parameterSequence = parameterSequence.map((token: PipelineToken) => {
    if (
      token?.stream === "f0" ||
      !token?.params ||
      typeof token.params !== "object" ||
      Array.isArray(token.params)
    ) {
      return token;
    }
    const nextToken = {
      ...token,
      params: { ...(token.params as Record<string, number>) },
    };
    applySpeakerProfileToParams(nextToken.params, resolvedSpeaker, sourceContour.baseline);
    return nextToken;
  });
  const phoneSequence = parameterSequence.filter(
    (token: PipelineToken) => token?.stream !== "f0" && token?.status !== 2
  );
  const controlScore = buildDeclarativeControlScore(frontendId, parameterSequence);
  validateDeclarativeControlScore(controlScore);
  provenance?.add({
    stage: "frontend",
    type: "control_score_created",
    subject: `control_score:${frontendId}`,
    reason: `Created declarative control score with ${controlScore.tokens.length} phone tokens and ${controlScore.f0_events.length} F0 events`,
    citations: ["/rules/control-score.yaml"],
  });

  // --- Assemble final Klatt track (delegated to track-assembler) ---
  // Transition durations scale inversely with rate (Broad & Fertig 1970).
  // At rate=1.0: transitionMs/1.0 = transitionMs (unchanged).

  // Read sagging transition parameters from policy.
  // Citation: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
  // Citation: Ladd 2008 pp.155-157 (sagging transition between H* accents)
  const sagDepthHz = readPolicyNumber(f0Policy?.sag_depth_hz);
  const sagMinSpanMs = readPolicyNumber(f0Policy?.sag_min_span_ms);

  // Read layered additive F0 model config from the frontend spec.
  // When present, the track assembler uses the layered renderer instead of
  // the declarative point-interpolation path.
  // Citations: Fujisaki (command-response), Klatt 1982 (hat-pattern),
  //            Rabiner 1968 (three-component F0)
  const f0ModelRaw = (frontendSpec as any)?.f0_model;
  const f0Model: LayeredF0ModelConfig | undefined =
    f0ModelRaw && typeof f0ModelRaw === "object" && f0ModelRaw.type === "layered_additive"
      ? (f0ModelRaw as LayeredF0ModelConfig)
      : undefined;

  // Build speakerParams for the layered F0 model's speaker scaling.
  // Extracts numeric values from the frontend spec's speaker policy entries
  // (which may be plain numbers or { value: N, citations: [...] } objects).
  // Citation: DECtalk 4.63 ph_vset.c (speaker-dependent F0 parameters)
  const frontendSpeakerPolicy = (frontendSpec as any)?.parameters?.policy?.speaker;
  let speakerParams: Record<string, unknown> | undefined;
  if (f0Model) {
    if (frontendSpeakerPolicy && typeof frontendSpeakerPolicy === "object") {
      const extracted: Record<string, unknown> = {};
      for (const key of Object.keys(frontendSpeakerPolicy)) {
        const val = readPolicyNumber(frontendSpeakerPolicy[key]);
        if (val !== undefined) {
          extracted[key] = val;
        }
      }
      extracted.base_f0_hz = resolvedSpeaker.base_f0_hz;
      if (Object.keys(extracted).length > 0) {
        speakerParams = extracted;
      }
    }
  }

  const frontendPhones: FrontendPhoneSummary[] = phoneSequence.map(
    (token: PipelineToken, index: number) => {
      const duration = Number(token?.duration ?? 0);
      const minimumDuration = Number(token?.minimumDuration ?? NaN);
      const summary: FrontendPhoneSummary = {
        index,
        phoneme: String(token?.phoneme ?? ""),
        durationMs: Number.isFinite(duration) ? duration : 0,
      };
      if (typeof token?.stress === "number" && Number.isFinite(token.stress)) {
        summary.stress = token.stress;
      }
      if (typeof token?.word === "string" && token.word.length > 0) {
        summary.word = token.word;
      }
      if (Number.isFinite(minimumDuration)) {
        summary.minimumDurationMs = minimumDuration;
      }
      return summary;
    }
  );

  const track = assembleKlattTrack(phoneSequence, parameterSequence, {
    inventorySpec: frontendInventory,
    baseF0: effectiveBaseF0,
    transitionMs: transitionMs / rate,
    outputConfig: rulepackOutputConfig,
    voiceQuality: voiceQualityOverrides,
    sagDepthHz,
    sagMinSpanMs,
    f0Model,
    speakerParams,
  });

  emitNasalSubsystemExplainability(
    phoneSequence,
    track,
    provenance,
    diagnostics,
    tokenDecisionIds,
  );

  const syncTimeByKey = buildSyncTimeMap(
    phoneSequence,
    rulepackOutputConfig.min_duration?.stop_release_ms ?? 5,
    rulepackOutputConfig.min_duration?.default_ms ?? 20,
    frontendInventory.phoneme_targets,
  );

  return {
    track,
    frontendPhones,
    controlScore,
    ...(f0Model
      ? { f0LayerCommands: extractLayerCommands(parameterSequence, syncTimeByKey) }
      : {}),
  };
}

export function textToKlattTrackDetailed(
  inputText: string,
  baseF0: number | undefined = undefined,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {}
): TextToKlattTrackDetailedResult {
  return buildTextToKlattTrackDetailed(inputText, baseF0, transitionMs, options);
}

export function textToKlattTrack(
  inputText: string,
  baseF0: number | undefined = undefined,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {}
): KlattFrame[] {
  return buildTextToKlattTrackDetailed(inputText, baseF0, transitionMs, options).track;
}

export function textToControlScore(
  inputText: string,
  baseF0: number | undefined = undefined,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {}
): DeclarativeControlScore {
  return buildTextToKlattTrackDetailed(inputText, baseF0, transitionMs, options).controlScore;
}
