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
 *                        effectiveRd = clamp(Rd + RdPhraseOffset, 0.3, 2.7).
 *                        Positive = breathier (lower HNR); negative = pressed.
 *   f0Scale            -> params.F0 (MUL), clamped > 0.
 *   durationScale      -> frame.time (MUL) — a uniform global tempo dilation of
 *                        the whole assembled timeline (>1 = slower). Applied
 *                        post-assembly because the track is already a flat list
 *                        of absolute event times; scaling every time uniformly
 *                        stretches segments, F0 anchors and control windows
 *                        together. pauseScale is folded into this global tempo
 *                        (a separate per-pause expansion would require
 *                        pre-assembly segment surgery — out of scope here).
 *   f1/f2/f3Delta      -> params.F1/F2/F3 (ADD Hz), clamped > 0.
 *   fbw1/2/3Scale      -> params.B1/B2/B3 (MUL), clamped to a 20 Hz floor.
 *   spectralTiltBoost  -> params.TL (ADD dB; positive = darker/softer).
 *   ahBoost            -> params.AH (ADD dB; aspiration / breathiness).
 *   intensityBoost     -> params.GO (ADD dB; overall gain).
 *
 * f0VarianceScale and jitterScale are not realized here: F0
 * excursion is baked into the assembled contour (re-scaling variance needs the
 * pre-contour F0 anchors), and jitter is a per-frame source param the beauty
 * inventory does not vary by token. They are documented as deferred so
 * the mapping stays honest rather than silently dropping them.
 *
 * Citations: Rutledge_1995, Murray_1993, Fant_1997 (Rd channel), plus whatever
 * the compiled affect carried (Scherer_1986, Gobl_2003, France_2000, …).
 */

import type { KlattFrame } from "../tts-frontend-types";
import {
  NEUTRAL_VQ,
  type VoiceQualityDelta,
} from "./direction-track";
import type { CompiledAffect } from "./affect";

/** Effective-Rd clamp bounds (Fant 1997 Rd range), mirrored from the backend. */
const RD_MIN = 0.3;
const RD_MAX = 2.7;
/** Formant-bandwidth floor in Hz (a resonator with B < 20 Hz rings unphysically). */
const BW_FLOOR_HZ = 20;
/** The Rd value the beauty voice uses when a frame carries no explicit Rd. */
const RD_FALLBACK = 0.7;

/** Result of applying an affect: the new track plus the citations consumed. */
export interface AffectApplication {
  track: KlattFrame[];
  citations: string[];
}

function isCompiledAffect(value: CompiledAffect | VoiceQualityDelta): value is CompiledAffect {
  return (value as CompiledAffect).vq !== undefined;
}

function clampNumber(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

/** Add `delta` Hz to a positive formant param, keeping it > 0. */
function addFormant(params: Record<string, number>, key: string, delta: number): void {
  if (delta === 0) return;
  const base = params[key];
  if (typeof base !== "number" || !Number.isFinite(base)) return;
  params[key] = Math.max(1, base + delta);
}

/** Scale a bandwidth param, keeping it above the physical floor. */
function scaleBandwidth(params: Record<string, number>, key: string, scale: number): void {
  if (scale === 1) return;
  const base = params[key];
  if (typeof base !== "number" || !Number.isFinite(base)) return;
  params[key] = Math.max(BW_FLOOR_HZ, base * scale);
}

/** Add a dB offset to an additive level param if present. */
function addDb(params: Record<string, number>, key: string, delta: number): void {
  if (delta === 0) return;
  const base = params[key];
  if (typeof base !== "number" || !Number.isFinite(base)) return;
  params[key] = base + delta;
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
  const f0Scale = vq.f0Scale > 0 ? vq.f0Scale : 1;

  const out: KlattFrame[] = track.map((frame) => {
    const params: Record<string, number> = { ...frame.params };

    // --- F0 (mean-F0 multiplier), clamped > 0 -----------------------------
    if (f0Scale !== 1 && typeof params.F0 === "number" && Number.isFinite(params.F0)) {
      params.F0 = Math.max(0.001, params.F0 * f0Scale);
    }

    // --- Rd channel (breathy/pressed) via RdPhraseOffset ------------------
    if (vq.rdDelta !== 0) {
      const rdBase = typeof params.Rd === "number" && Number.isFinite(params.Rd)
        ? params.Rd
        : RD_FALLBACK;
      const prevOffset = typeof params.RdPhraseOffset === "number" &&
        Number.isFinite(params.RdPhraseOffset)
        ? params.RdPhraseOffset
        : 0;
      // Clamp the EFFECTIVE Rd (what the backend will actually use) to the Fant
      // range, then write back the offset that achieves it.
      const desiredEffective = rdBase + prevOffset + vq.rdDelta;
      const clampedEffective = clampNumber(desiredEffective, RD_MIN, RD_MAX);
      params.RdPhraseOffset = clampedEffective - rdBase;
    }

    // --- Formants (additive Hz) and bandwidths (multiplicative) -----------
    addFormant(params, "F1", vq.f1Delta);
    addFormant(params, "F2", vq.f2Delta);
    addFormant(params, "F3", vq.f3Delta);
    scaleBandwidth(params, "B1", vq.fbw1Scale);
    scaleBandwidth(params, "B2", vq.fbw2Scale);
    scaleBandwidth(params, "B3", vq.fbw3Scale);

    // --- Level / spectral params (additive dB) ----------------------------
    addDb(params, "TL", vq.spectralTiltBoost);
    addDb(params, "AH", vq.ahBoost);
    addDb(params, "GO", vq.intensityBoost);

    // --- Global tempo dilation (frame timing) -----------------------------
    const time = durationScale === 1 ? frame.time : frame.time * durationScale;

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
