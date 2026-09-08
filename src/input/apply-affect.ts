/**
 * Apply a compiled affect (the V/A/D + voice-quality delta vector from
 * `compileAffect`) to an already-assembled KlattFrame track — the missing wire
 * that makes the synth EXPRESSIVE. The affect system (`./affect.ts`) compiles a
 * named, cited emotion preset + degree into a `VoiceQualityDelta`; this function
 * realizes that delta on the concrete acoustic track the frontend produced.
 *
 * Everything is a *delta over the neutral render* (Rutledge_1995 multiplicative
 * style-vectors; HAMLET/Murray_1993 rules as the final TTS stage): a neutral
 * affect (NEUTRAL_VQ / degree 0) is the identity — the track is returned
 * numerically unchanged, so a default no-affect render bit-matches a plain one.
 *
 * Channel mapping (per design/beauty-synthesis/13-direction-track-format.md §2
 * and the qlatt-beauty signal path):
 *
 *   rdDelta            -> params.RdPhraseOffset (ADD). The per-frame `Rd` is
 *                        clobbered by the assembly-time voice-quality overlay;
 *                        `RdPhraseOffset` is the surviving additive channel and
 *                        reaches the LF source via the backend's
 *                        effectiveRd = Rd + RdPhraseOffset, bounded by the
 *                        declared effective_rd policy in vq-channels.yaml.
 *                        Positive = breathier (lower HNR); negative = pressed.
 *   f0Scale            -> params.F0 (MUL), clamped > 0.
 *   durationScale      -> each speech-frame interval (MUL; >1 = slower).
 *   pauseScale         -> each SIL-frame interval (additional MUL), matching
 *                        HRG lowering's durationScale * pauseScale composition.
 *   f1/f2/f3Delta      -> params.F1/F2/F3 (ADD Hz), clamped > 0.
 *   fbw1/2/3Scale      -> params.B1/B2/B3 (MUL), clamped to a 20 Hz floor.
 *   spectralTiltBoost  -> params.TL (ADD dB; positive = darker/softer).
 *   ahBoost            -> params.AH (ADD dB; aspiration / breathiness).
 *   intensityBoost     -> params.GO (ADD dB; overall gain).
 *
 * f0VarianceScale rescales voiced F0 values around their voiced mean before
 * f0Scale is applied, matching HRG lowering. jitterScale remains deferred:
 * jitter is a per-frame source param the beauty inventory does not vary by token.
 *
 * Citations: Rutledge_1995, Murray_1993, Fant_1997 (Rd channel), plus whatever
 * the compiled affect carried (Scherer_1986, Gobl_2003, France_2000, …).
 */

import type { KlattFrame } from "../tts-frontend-types";
import type { CompiledAffect } from "./affect";
import { NEUTRAL_VQ, type VoiceQualityDelta } from "./direction-track";
import { projectRd } from "./rd-policy";
import { VQ_PARAM_CHANNELS } from "./vq-channels";

/** Result of applying an affect: the new track plus the citations consumed. */
export interface AffectApplication {
  track: KlattFrame[];
  citations: string[];
}

function isCompiledAffect(value: CompiledAffect | VoiceQualityDelta): value is CompiledAffect {
  return (value as CompiledAffect).vq !== undefined;
}

/**
 * Apply a compiled affect (or a bare voice-quality delta) to an assembled track,
 * returning a NEW track (the input is not mutated) plus the citations that
 * justify the modification. A neutral affect returns a numerically-identical
 * track (the (c) base case): every multiplicative field is 1 and every additive
 * field is 0, so all writes are no-ops.
 */
export function applyAffectToTrack(
  track: readonly KlattFrame[],
  affect: CompiledAffect | VoiceQualityDelta,
): AffectApplication {
  const vq: VoiceQualityDelta = isCompiledAffect(affect) ? affect.vq : affect;
  const baseCitations = isCompiledAffect(affect) ? affect.citations : [];
  const citations = Array.from(
    new Set([...baseCitations, "Rutledge_1995", "Murray_1993", "Fant_1997"]),
  );

  // Tempo dilation must be strictly positive (a non-positive scale would
  // collapse the timeline); clamp defensively.
  const durationScale = vq.durationScale > 0 ? vq.durationScale : 1;
  const pauseScale = vq.pauseScale > 0 ? vq.pauseScale : 1;
  const f0Scale = vq.f0Scale > 0 ? vq.f0Scale : 1;
  const voicedF0Values = track
    .filter(
      (frame) =>
        frame.phoneme !== "SIL" &&
        ((frame.params.AV ?? 0) > 0 || (frame.params.AVS ?? 0) > 0) &&
        typeof frame.params.F0 === "number" &&
        Number.isFinite(frame.params.F0) &&
        frame.params.F0 > 0,
    )
    .map((frame) => frame.params.F0);
  const f0VarianceCenter =
    voicedF0Values.length > 0
      ? voicedF0Values.reduce((sum, value) => sum + value, 0) / voicedF0Values.length
      : undefined;
  const timingIdentity = durationScale === 1 && pauseScale === 1;
  let inputCursor = 0;
  let outputCursor = 0;

  const out: KlattFrame[] = track.map((frame, index) => {
    const params: Record<string, number> = { ...frame.params };

    // --- F0 variance around the voiced mean, then mean-F0 multiplier -------
    if (typeof params.F0 === "number" && Number.isFinite(params.F0) && params.F0 > 0) {
      const voiced = frame.phoneme !== "SIL" && ((params.AV ?? 0) > 0 || (params.AVS ?? 0) > 0);
      if (voiced && f0VarianceCenter !== undefined && vq.f0VarianceScale !== 1) {
        params.F0 = Math.max(
          0.001,
          f0VarianceCenter + (params.F0 - f0VarianceCenter) * vq.f0VarianceScale,
        );
      }
      if (f0Scale !== 1) params.F0 = Math.max(0.001, params.F0 * f0Scale);
    }

    // --- Rd channel (breathy/pressed) via RdPhraseOffset ------------------
    if (vq.rdDelta !== 0) {
      Object.assign(params, projectRd(params, vq.rdDelta));
    }

    for (const row of VQ_PARAM_CHANNELS) {
      if (!row.apply_track) continue;
      const value = vq[row.channel] ?? row.neutral;
      const base = params[row.backend_param];
      if (value === row.neutral || typeof base !== "number" || !Number.isFinite(base)) continue;
      const projected = row.algebra === "mul" ? base * value : base + value;
      params[row.backend_param] = Math.max(row.floor ?? -Infinity, projected);
    }

    // --- Segment-aware timeline dilation ----------------------------------
    let time = frame.time;
    if (!timingIdentity) {
      const intervalOwner = index === 0 ? frame : track[index - 1];
      const intervalScale =
        intervalOwner.phoneme === "SIL" ? durationScale * pauseScale : durationScale;
      outputCursor += (frame.time - inputCursor) * intervalScale;
      inputCursor = frame.time;
      time = outputCursor;
    }

    return { ...frame, time, params };
  });

  return { track: out, citations };
}

/** True when this delta is the neutral identity (applying it is a no-op). */
export function isNeutralDelta(vq: VoiceQualityDelta): boolean {
  return (Object.keys(NEUTRAL_VQ) as Array<keyof VoiceQualityDelta>).every(
    (key) => vq[key] === NEUTRAL_VQ[key],
  );
}
