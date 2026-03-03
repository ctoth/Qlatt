import {
  materializePhonemeTarget,
  loadInventorySpecFromPath,
  type InventorySpec,
} from "./declarative-frontend/inventory";
import { normalizeText } from "./g2p/text-normalize";
import { loadBundledRulepackSpec } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";
import { transcribeText } from "./transcribe-text";
import { assembleKlattTrack, PHONEME_TARGET_MAP } from "./track-assembler";
import type { OutputConfig, VoiceQualityOverrides, LayeredF0ModelConfig } from "./track-assembler";
import type { TranscriptionConfig, KlattFrame } from "./tts-frontend-types";
import {
  recordInventoryDecision,
  runPhasesWithProvenance,
} from "./tts-frontend-provenance";
import { annotateProsody } from "./prosodic-annotator";

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

type ResolvedSpeakerProfile = {
  base_f0_hz: number;
  formant_scale: number;
  rd_default: number;
  spectral_tilt_offset_db: number;
};

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
};

export type FrontendPhoneSummary = {
  index: number;
  phoneme: string;
  word?: string;
  durationMs: number;
  minimumDurationMs?: number;
};

export type TextToKlattTrackDetailedResult = {
  track: KlattFrame[];
  frontendPhones: FrontendPhoneSummary[];
};

// Plain stop symbols are intentionally rewritten in the structural phase
// (Klatt 1980 stop model: closure + release).
const STRUCTURAL_STOP_BASES = new Set(["P", "T", "K", "B", "D", "G"]);

// Extract output and transcription configuration from the loaded YAML rulepack.
// These override hardcoded defaults in track-assembler and transcribe-text.
function getRulepackOutputConfig(specSource: unknown): OutputConfig | undefined {
  return (specSource as any)?.output ?? undefined;
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

function resolveSpeakerProfile(
  baseF0: number | undefined,
  speakerOverride: TextToKlattTrackOptions["speaker"],
  specSource: unknown,
): ResolvedSpeakerProfile {
  const speakerPolicy = (specSource as any)?.parameters?.policy?.speaker;
  const baseFromPolicy = readPolicyNumber(speakerPolicy?.base_f0_hz);
  const formantScaleFromPolicy = readPolicyNumber(speakerPolicy?.formant_scale);
  const rdFromPolicy = readPolicyNumber(speakerPolicy?.rd_default);
  const tiltFromPolicy = readPolicyNumber(speakerPolicy?.spectral_tilt_offset_db);
  const baseF0Override = speakerOverride?.base_f0_hz;
  const formantScaleOverride = speakerOverride?.formant_scale;
  const rdOverride = speakerOverride?.rd_default;
  const tiltOverride = speakerOverride?.spectral_tilt_offset_db;

  return {
    base_f0_hz: typeof baseF0Override === "number" && Number.isFinite(baseF0Override)
      ? baseF0Override
      : (typeof baseF0 === "number" && Number.isFinite(baseF0)
          ? baseF0
          : (baseFromPolicy ?? 110)),
    formant_scale: typeof formantScaleOverride === "number" && Number.isFinite(formantScaleOverride)
      ? formantScaleOverride
      : (formantScaleFromPolicy ?? 1.0),
    rd_default: typeof rdOverride === "number" && Number.isFinite(rdOverride)
      ? rdOverride
      : (rdFromPolicy ?? 0.7),
    spectral_tilt_offset_db: typeof tiltOverride === "number" && Number.isFinite(tiltOverride)
      ? tiltOverride
      : (tiltFromPolicy ?? 0),
  };
}

const SPEAKER_FORMANT_KEYS = [
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "FNP", "FNZ",
] as const;

function applySpeakerProfileToParams(
  params: Record<string, number> | null | undefined,
  speaker: ResolvedSpeakerProfile
): void {
  if (!params) return;

  // Fant 1997 / Klatt & Klatt 1990 source controls only affect the LF source.
  // The paper-backed frontend therefore makes LF the active default source.
  params.sourceMode = 1;
  params.Rd = speaker.rd_default;
  params.RdRef = speaker.rd_default;
  if (speaker.spectral_tilt_offset_db !== 0) {
    params.TL = (params.TL ?? 0) + speaker.spectral_tilt_offset_db;
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

function isActivePhoneToken(token: PipelineToken | null | undefined): boolean {
  return !!token && token.stream !== "f0" && token.status !== 2;
}

function isVoicedPhoneToken(token: PipelineToken | null | undefined): boolean {
  if (!isActivePhoneToken(token) || token?.phoneme === "SIL") return false;
  const params = token?.params;
  if (!params || typeof params !== "object" || Array.isArray(params)) return false;
  const av = typeof params.AV === "number" ? params.AV : 0;
  const avs = typeof params.AVS === "number" ? params.AVS : 0;
  return av > 0 || avs > 0;
}

// Fant 1997 phrase-contour defaults for connected speech.
// Ee onset rise ~50 ms; main declination ~2 dB/s; final 300-500 ms falls at ~6 dB/s.
// The Rd phrase-final softening is an engineering companion to the documented Ee fall.
const FANT_EE_ONSET_RISE_SEC = 0.05;
const FANT_EE_DECLINATION_DB_PER_SEC = 2.0;
const FANT_EE_FINAL_FALL_DB_PER_SEC = 6.0;
const FANT_EE_FINAL_WINDOW_MIN_SEC = 0.3;
const FANT_EE_FINAL_WINDOW_MAX_SEC = 0.5;
const FANT_RD_FINAL_OFFSET = 0.18;

function applyFantConnectedSpeechContour(tokens: PipelineToken[]): void {
  const phraseTokenIndices: number[] = [];

  const flushPhrase = (): void => {
    if (phraseTokenIndices.length === 0) return;

    const phraseDurationMs = phraseTokenIndices.reduce((sum, idx) => {
      const duration = Number(tokens[idx]?.duration ?? 0);
      return sum + (Number.isFinite(duration) && duration > 0 ? duration : 0);
    }, 0);
    if (phraseDurationMs <= 0) {
      phraseTokenIndices.length = 0;
      return;
    }

    const phraseDurationSec = phraseDurationMs / 1000;
    const finalWindowSec = Math.min(
      FANT_EE_FINAL_WINDOW_MAX_SEC,
      Math.max(FANT_EE_FINAL_WINDOW_MIN_SEC, phraseDurationSec * 0.35),
    );
    const finalWindowStartSec = Math.max(
      FANT_EE_ONSET_RISE_SEC,
      phraseDurationSec - finalWindowSec,
    );
    const extraFinalFallDbPerSec = FANT_EE_FINAL_FALL_DB_PER_SEC - FANT_EE_DECLINATION_DB_PER_SEC;

    let elapsedMs = 0;
    for (const idx of phraseTokenIndices) {
      const token = tokens[idx];
      const durationMs = Number(token?.duration ?? 0);
      const safeDurationMs = Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
      const midpointSec = (elapsedMs + safeDurationMs * 0.5) / 1000;
      elapsedMs += safeDurationMs;

      if (!isVoicedPhoneToken(token)) continue;
      const params = token.params as Record<string, number>;

      const onsetRiseDb = midpointSec < FANT_EE_ONSET_RISE_SEC
        ? -1.0 * (1.0 - midpointSec / FANT_EE_ONSET_RISE_SEC)
        : 0.0;
      const declinationDb = -FANT_EE_DECLINATION_DB_PER_SEC * midpointSec;
      const finalFallDb = midpointSec > finalWindowStartSec
        ? -extraFinalFallDbPerSec * (midpointSec - finalWindowStartSec)
        : 0.0;
      const finalProgress = midpointSec <= finalWindowStartSec
        ? 0.0
        : Math.min(1.0, (midpointSec - finalWindowStartSec) / finalWindowSec);

      params.EePhraseDb = (params.EePhraseDb ?? 0) + onsetRiseDb + declinationDb + finalFallDb;
      params.RdPhraseOffset = (params.RdPhraseOffset ?? 0) + FANT_RD_FINAL_OFFSET * finalProgress;
    }

    phraseTokenIndices.length = 0;
  };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!isActivePhoneToken(token)) continue;

    if (token.phoneme === "SIL") {
      if (token.breakIndex >= 4) {
        flushPhrase();
      }
      continue;
    }

    phraseTokenIndices.push(i);
  }

  flushPhrase();
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
  const frontendSpec = loadBundledRulepackSpec(options.frontendId);
  const rulepackOutputConfig = getRulepackOutputConfig(frontendSpec);
  const rulepackTranscriptionConfig = getRulepackTranscriptionConfig(frontendSpec);

  // Per-frontend inventory and LTS path overrides.
  const inventoryPath = (frontendSpec as any)?.inventory_path as string | undefined;
  const ltsPath = (frontendSpec as any)?.lts_path as string | undefined;
  const customInventory: InventorySpec | undefined = inventoryPath
    ? loadInventorySpecFromPath(inventoryPath)
    : undefined;

  // No-op dictionary lookup for frontends with custom LTS rules (their phoneme set
  // won't match CMU dictionary entries).
  const noOpDictLookup = (): null => null;

  const provenance = options.provenance ?? null;
  const requestedRate = options.rate ?? 1.0;
  const resolvedSpeaker = resolveSpeakerProfile(baseF0, options.speaker, frontendSpec);
  let effectiveBaseF0 = resolvedSpeaker.base_f0_hz;
  // Speaker profile overrides — merged into policy.speaker for all rule phases.
  // Citations: O'Shaughnessy 1976, Kent & Vorperian 2018, Fant 1997, Klatt & Klatt 1990
  const speakerOverrides = { speaker: resolvedSpeaker };

  // --- Voice Quality Preset Resolution ---
  // Resolve voiceQuality preset BEFORE rule phases run.
  // Presets are defined in the selected frontend spec under params.policy.speaker.voice_quality_presets.
  // Citations: Fant 1997 Table 1, Gobl 2003, Klatt & Klatt 1990, Burkhardt 2009
  let voiceQualityOverrides: VoiceQualityOverrides | undefined;
  const requestedQuality = options.voiceQuality;
  if (requestedQuality && requestedQuality !== 'modal') {
    const presetTable = (frontendSpec as any)?.parameters?.policy?.speaker
      ?.voice_quality_presets as Record<string, Record<string, unknown>> | undefined;
    const presetRaw = presetTable?.[requestedQuality];
    if (presetRaw) {
      const preset: VoiceQualityPreset = {
        rd: typeof presetRaw.rd === 'number' ? presetRaw.rd : resolvedSpeaker.rd_default,
        oq: typeof presetRaw.oq === 'number' ? presetRaw.oq : 0,
        tl: typeof presetRaw.tl === 'number' ? presetRaw.tl : 0,
        ah_offset_db: typeof presetRaw.ah_offset_db === 'number' ? presetRaw.ah_offset_db : 0,
        flutter: typeof presetRaw.flutter === 'number' ? presetRaw.flutter : 0,
        jitter: typeof presetRaw.jitter === 'number' ? presetRaw.jitter : 0,
        f0_scale: typeof presetRaw.f0_scale === 'number' ? presetRaw.f0_scale : 1.0,
      };

      // Apply F0 scaling: multiply baseF0 by preset's f0_scale.
      // Citation: Burkhardt 2009 (falsetto F0 increase)
      if (preset.f0_scale !== 1.0) {
        effectiveBaseF0 = Math.round(effectiveBaseF0 * preset.f0_scale);
      }

      // Build voice quality overrides for the track assembler.
      // These inject Rd, OQ, TL, flutter, jitter into every frame's params,
      // and add ah_offset_db to every frame's AH value.
      voiceQualityOverrides = {
        rd: preset.rd,
        oq: preset.oq,
        tl: preset.tl,
        ah_offset_db: preset.ah_offset_db,
        flutter: preset.flutter,
        jitter: preset.jitter,
      };

      // Emit provenance record for voice quality preset application
      provenance?.add({
        stage: 'frontend',
        type: 'voice_quality_preset',
        subject: 'voice_quality',
        reason: `voiceQuality='${requestedQuality}' applied: Rd=${preset.rd}, AH offset=${preset.ah_offset_db} dB`,
        citations: ['Fant 1997', 'Gobl 2003', 'Klatt & Klatt 1990'],
        parents: [],
      });
    } else {
      console.warn(
        `[TTS Frontend] Unknown voice quality preset '${requestedQuality}'. Using modal defaults.`
      );
    }
  }

  const tokenDecisionIds = new Map<string, string>();
  const normalized = normalizeText(inputText);
  // Transcribe returns a flat list of phoneme objects with word info
  let parameterSequence: PipelineToken[] = transcribeText(normalized, {
    provenance,
    transcriptionConfig: rulepackTranscriptionConfig,
    ltsPath,
    dictLookup: ltsPath ? noOpDictLookup : undefined,
  });

  // --- Prepare Parameter Sequence (Map phonemes to targets, fill params) ---
  parameterSequence = parameterSequence.map((ph: PipelineToken, index: number) => {
    let targetKeyBase = ph.phoneme;

    // Delegate stress-aware inventory lookup to materializePhonemeTarget
    const materialized = materializePhonemeTarget(targetKeyBase, {
      stress: ph.stress,
      inventorySpec: customInventory,
    });

    // Warn if phoneme was not found (materialized falls back to SIL internally)
    const isStructuralStopBase = STRUCTURAL_STOP_BASES.has(targetKeyBase);
    if (
      !isStructuralStopBase &&
      !PHONEME_TARGET_MAP[materialized.phoneme] &&
      !PHONEME_TARGET_MAP[targetKeyBase]
    ) {
      console.warn(
        `[TTS Frontend] No baseline target found for ${targetKeyBase} (Stress: ${ph.stress}, Word: ${ph.word}). Using SIL.`
      );
    }

    const tokenId = `ph_${index}`;
    const decisionId = recordInventoryDecision(
      provenance,
      index,
      targetKeyBase,
      ph.phoneme,
      ph._pronDecisionId,
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
  // When a custom inventory is active, wrap materializePhonemeTarget to inject it.
  const effectiveMaterialize = customInventory
    ? (phoneme: unknown, opts?: { stress?: number | null }) =>
        materializePhonemeTarget(phoneme, { ...opts, inventorySpec: customInventory })
    : materializePhonemeTarget;

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
  const speakerPolicy = { policy: { ...speakerOverrides } };
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
  parameterSequence = runPhases(parameterSequence, ["duration"], {
    policy: {
      ...speakerOverrides,
      duration: { rate_scale: rate },
      // Vowel centralization increases at fast rates (Lindblom 1963).
      // At rate=1.0: factor=0 → undershoot rule guard prevents matching.
      formant: { rate_undershoot_factor: Math.max(0, (rate - 1.0) * 0.3) },
    },
  });
  parameterSequence = runPhases(parameterSequence, ["formant"], {
    policy: {
      ...speakerOverrides,
      formant: { rate_undershoot_factor: Math.max(0, (rate - 1.0) * 0.3) },
    },
  });
  // F0 range narrows at fast speaking rates (Ladd 2008 Ch.9).
  // At rate=1.0, f0RangeFactor=1.0 and all values are unchanged.
  const f0RangeFactor = 1.0 / Math.sqrt(rate);
  parameterSequence = runPhases(parameterSequence, ["prosody", "finalize"], {
    policy: {
      ...speakerOverrides,
      f0: {
        base_hz: effectiveBaseF0,
        fall_rate_hz: 20 * f0RangeFactor,
        declination_tau: 0.12 * f0RangeFactor,
        stress_rise: 1.0 + (0.15 * f0RangeFactor),
        question_rise_hz: 30 * f0RangeFactor,
        continuation_rise_hz: 8 * f0RangeFactor,
        continuation_minor_rise_hz: 5 * f0RangeFactor,
      },
    },
  });
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
    applySpeakerProfileToParams(nextToken.params, resolvedSpeaker);
    return nextToken;
  });
  applyFantConnectedSpeechContour(parameterSequence);
  const phoneSequence = parameterSequence.filter(
    (token: PipelineToken) => token?.stream !== "f0" && token?.status !== 2
  );

  // --- Assemble final Klatt track (delegated to track-assembler) ---
  // Transition durations scale inversely with rate (Broad & Fertig 1970).
  // At rate=1.0: transitionMs/1.0 = transitionMs (unchanged).

  // Read sagging transition parameters from policy.
  // Citation: Pierrehumbert 1980 (H*-H* nonmonotonic interpolation)
  // Citation: Ladd 2008 pp.155-157 (sagging transition between H* accents)
  const f0Policy = (frontendSpec as any)?.parameters?.policy?.f0;
  const sagDepthHz: number | undefined =
    typeof f0Policy?.sag_depth_hz?.value === "number"
      ? f0Policy.sag_depth_hz.value
      : undefined;
  const sagMinSpanMs: number | undefined =
    typeof f0Policy?.sag_min_span_ms?.value === "number"
      ? f0Policy.sag_min_span_ms.value
      : undefined;

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
  let speakerParams: Record<string, unknown> | undefined;
  if (f0Model) {
    const speakerPolicy = (frontendSpec as any)?.parameters?.policy?.speaker;
    if (speakerPolicy && typeof speakerPolicy === "object") {
      const extracted: Record<string, unknown> = {};
      for (const key of Object.keys(speakerPolicy)) {
        const val = readPolicyNumber(speakerPolicy[key]);
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
    baseF0: effectiveBaseF0,
    transitionMs: transitionMs / rate,
    outputConfig: rulepackOutputConfig,
    voiceQuality: voiceQualityOverrides,
    sagDepthHz,
    sagMinSpanMs,
    f0Model,
    speakerParams,
  });

  return {
    track,
    frontendPhones,
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
