import {
  materializePhonemeTarget,
} from "./declarative-frontend/inventory";
import { normalizeText } from "./g2p/text-normalize";
import { QLATT_V12_CEL_RULEPACK } from "./declarative-frontend/rule-pack";
import type { ProvenanceCollector } from "./provenance";
import { transcribeText } from "./transcribe-text";
import { assembleKlattTrack, PHONEME_TARGET_MAP } from "./track-assembler";
import type { OutputConfig } from "./track-assembler";
import type { TranscriptionConfig, KlattFrame } from "./tts-frontend-types";
import {
  recordInventoryDecision,
  runPhasesWithProvenance,
} from "./tts-frontend-provenance";

/**
 * Loose token type for intermediate pipeline stages.
 * Starts as TranscriptionToken shape, gains fields through inventory lookup
 * and rule application, eventually becomes a PhoneToken or F0PointToken.
 *
 * Internal to the pipeline — module boundaries use {@link KlattFrame}.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PipelineToken = Record<string, any>;

export type TextToKlattTrackOptions = {
  provenance?: ProvenanceCollector | null;
  /** Speech rate multiplier: 1.0 = normal, 2.0 = double speed, 0.5 = half speed.
   *  Clamped to [0.5, 2.0]. Citation: Klatt 1976 §III */
  rate?: number;
  /** Speaker profile overrides. Merged into params.policy.speaker in the CEL context.
   *  Defaults are defined in frontend.yaml parameters.policy.speaker.
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
};

// Plain stop symbols are intentionally rewritten in the structural phase
// (Klatt 1980 stop model: closure + release).
const STRUCTURAL_STOP_BASES = new Set(["P", "T", "K", "B", "D", "G"]);

// Extract output and transcription configuration from the loaded YAML rulepack.
// These override hardcoded defaults in track-assembler and transcribe-text.
const RULEPACK_OUTPUT_CONFIG: OutputConfig | undefined =
  (QLATT_V12_CEL_RULEPACK as any)?.output ?? undefined;
const RULEPACK_TRANSCRIPTION_CONFIG: TranscriptionConfig | undefined =
  (QLATT_V12_CEL_RULEPACK as any)?.transcription ?? undefined;

// Re-export normalizeText from g2p/text-normalize
export { normalizeText } from "./g2p/text-normalize";

// Re-export transcribeText from transcribe-text (backward compatibility)
export { transcribeText } from "./transcribe-text";

// --- Main Pipeline ---
export function textToKlattTrack(
  inputText: string,
  baseF0 = 110,
  transitionMs = 30,
  options: TextToKlattTrackOptions = {}
): KlattFrame[] {
  const provenance = options.provenance ?? null;
  const rate = Math.max(0.5, Math.min(2.0, options.rate ?? 1.0));
  // Speaker profile overrides — merged into policy.speaker for all rule phases.
  // Citations: O'Shaughnessy 1976, Kent & Vorperian 2018, Fant 1997, Klatt & Klatt 1990
  const speakerOverrides = options.speaker
    ? { speaker: options.speaker }
    : {};
  const tokenDecisionIds = new Map<string, string>();
  const normalized = normalizeText(inputText);
  // Transcribe returns a flat list of phoneme objects with word info
  let parameterSequence: PipelineToken[] = transcribeText(normalized, {
    provenance,
    transcriptionConfig: RULEPACK_TRANSCRIPTION_CONFIG,
  });

  // --- Prepare Parameter Sequence (Map phonemes to targets, fill params) ---
  parameterSequence = parameterSequence.map((ph: PipelineToken, index: number) => {
    let targetKeyBase = ph.phoneme;

    // Delegate stress-aware inventory lookup to materializePhonemeTarget
    const materialized = materializePhonemeTarget(targetKeyBase, { stress: ph.stress });

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
  const runPhases = (
    sequence: PipelineToken[],
    phases: string[],
    parameters?: Record<string, unknown>,
  ): PipelineToken[] =>
    runPhasesWithProvenance(
      sequence,
      phases,
      materializePhonemeTarget,
      provenance,
      tokenDecisionIds,
      parameters,
    );

  // Run postlexical rules first (t-flapping, the-reduction operate on raw phonemes).
  // t_flapping must see raw T between vowels; structural would split T into
  // T_CL + T_REL + T_ASP, breaking the adjacency check.
  // Citation: Miller 1998, Pronunciation Modeling in Speech Synthesis
  // Speaker overrides flow into postlexical/structural only when present.
  const speakerPolicy = options.speaker ? { policy: { ...speakerOverrides } } : undefined;
  parameterSequence = runPhases(parameterSequence, ["postlexical"], speakerPolicy);
  parameterSequence = runPhases(parameterSequence, ["structural"], speakerPolicy);
  parameterSequence = runPhases(parameterSequence, ["duration"], {
    policy: {
      ...speakerOverrides,
      duration: { rate_scale: rate },
      // Vowel centralization increases at fast rates (Lindblom 1963).
      // At rate=1.0: factor=0 → undershoot rule guard prevents matching.
      formant: { rate_undershoot_factor: Math.max(0, (rate - 1.0) * 0.3) },
    },
  });
  parameterSequence = parameterSequence.map((token: PipelineToken, index: number) => ({
    ...token,
    id: token.id ?? `ph_${index}`,
    stream: "phone",
    status: token.status ?? 1,
  }));
  // F0 range narrows at fast speaking rates (Ladd 2008 Ch.9).
  // At rate=1.0, f0RangeFactor=1.0 and all values are unchanged.
  const f0RangeFactor = 1.0 / Math.sqrt(rate);
  parameterSequence = runPhases(parameterSequence, ["prosody", "finalize"], {
    policy: {
      ...speakerOverrides,
      f0: {
        base_hz: baseF0,
        fall_rate_hz: 20 * f0RangeFactor,
        declination_tau: 0.12 * f0RangeFactor,
        stress_rise: 1.0 + (0.15 * f0RangeFactor),
        question_rise_hz: 30 * f0RangeFactor,
        continuation_rise_hz: 8 * f0RangeFactor,
        continuation_minor_rise_hz: 5 * f0RangeFactor,
      },
    },
  });
  const phoneSequence = parameterSequence.filter(
    (token: PipelineToken) => token?.stream !== "f0" && token?.status !== 2
  );

  // --- Assemble final Klatt track (delegated to track-assembler) ---
  // Transition durations scale inversely with rate (Broad & Fertig 1970).
  // At rate=1.0: transitionMs/1.0 = transitionMs (unchanged).
  return assembleKlattTrack(phoneSequence, parameterSequence, {
    baseF0,
    transitionMs: transitionMs / rate,
    outputConfig: RULEPACK_OUTPUT_CONFIG,
  });
}
