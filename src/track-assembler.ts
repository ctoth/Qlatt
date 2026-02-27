/**
 * Track Assembler -- converts a finalized phone sequence + F0 contour
 * into a KlattFrame[] (the "track") suitable for the interpreter.
 *
 * Pure function: data in, frames out.  No side effects, no global state.
 *
 * Extracted from tts-frontend.ts (Phase 5 refactor).
 */
import {
  PHONEME_TARGETS,
  fillDefaultParams,
} from "./declarative-frontend/inventory";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FrontendToken = Record<string, any>;
type KlattParams = Record<string, number>;

const PHONEME_TARGET_MAP = PHONEME_TARGETS as Record<string, Record<string, any> | undefined>;

/** An F0 contour point (time in seconds, f0 in Hz). */
export type F0Point = { time: number; f0: number };

/** YAML-sourced output configuration for track assembly. */
export type OutputConfig = {
  blend?: {
    factor?: number;
    keys?: string[];
    smooth_types?: string[];
  };
  min_duration?: {
    stop_release_ms?: number;
    default_ms?: number;
  };
  transition_ms?: number;
  final_silence_ms?: number;
};

/** Options passed to {@link assembleKlattTrack}. */
export type AssembleTrackOptions = {
  /** Base F0 in Hz (default 110). */
  baseF0?: number;
  /** Transition duration in milliseconds (default 30). */
  transitionMs?: number;
  /** Output configuration from YAML (overrides hardcoded defaults). */
  outputConfig?: OutputConfig;
};

// ---------------------------------------------------------------------------
// Helpers -- F0 contour construction
// ---------------------------------------------------------------------------

export function compareAxisMark(left: unknown, right: unknown): number {
  if (left === right) return 0;
  if (typeof left === "number" && typeof right === "number") {
    return left < right ? -1 : 1;
  }
  const a = left == null ? "" : String(left);
  const b = right == null ? "" : String(right);
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function parseTrailingInteger(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildF0ContourFromDeclarative(
  sequence: FrontendToken[],
  baseF0: number
): F0Point[] {
  const points = sequence
    .filter(
      (token) =>
        token?.stream === "f0" &&
        token?.status !== 2 &&
        Number.isFinite(token?.value)
    )
    .slice()
    .sort((left: FrontendToken, right: FrontendToken) => {
      const leftTime = Number.isFinite(left?.time) ? Number(left.time) : null;
      const rightTime = Number.isFinite(right?.time) ? Number(right.time) : null;
      if (leftTime != null && rightTime != null && leftTime !== rightTime) {
        return leftTime < rightTime ? -1 : 1;
      }
      const byLeft = compareAxisMark(left?.anchor_left, right?.anchor_left);
      if (byLeft !== 0) return byLeft;
      const byRight = compareAxisMark(left?.anchor_right, right?.anchor_right);
      if (byRight !== 0) return byRight;
      const leftRatio = Number.isFinite(left?.ratio) ? Number(left.ratio) : 0;
      const rightRatio = Number.isFinite(right?.ratio) ? Number(right.ratio) : 0;
      if (leftRatio !== rightRatio) return leftRatio < rightRatio ? -1 : 1;
      const leftIdNum = parseTrailingInteger(left?.id ?? null);
      const rightIdNum = parseTrailingInteger(right?.id ?? null);
      if (leftIdNum != null && rightIdNum != null && leftIdNum !== rightIdNum) {
        return leftIdNum < rightIdNum ? -1 : 1;
      }
      return compareAxisMark(left?.id ?? "", right?.id ?? "");
    });

  if (points.length === 0) {
    return [{ time: 0, f0: baseF0 }];
  }

  const contour = points
    .map((point: FrontendToken) => ({
      time: Number.isFinite(point.time) ? Number(point.time) / 1000 : 0,
      f0: Number(point.value),
    }))
    .filter((point: { time: number; f0: number }) => point.time >= 0 && Number.isFinite(point.f0));

  if (contour.length === 0) return [{ time: 0, f0: baseF0 }];
  if (contour[0].time > 0) {
    contour.unshift({ time: 0, f0: baseF0 });
  }

  const cleaned = [contour[0]];
  for (let i = 1; i < contour.length; i += 1) {
    const prev = cleaned[cleaned.length - 1];
    const curr = contour[i];
    if (curr.time <= prev.time + 1e-6) {
      cleaned[cleaned.length - 1] = {
        time: prev.time,
        f0: curr.f0,
      };
      continue;
    }
    cleaned.push(curr);
  }

  return cleaned;
}

// ---------------------------------------------------------------------------
// Helpers -- frame-level F0 interpolation and formant blending
// ---------------------------------------------------------------------------

function getF0AtTime(f0Contour: F0Point[], time: number): number {
  if (!f0Contour || f0Contour.length === 0) return 0;
  for (let i = 0; i < f0Contour.length - 1; i++) {
    const p1 = f0Contour[i];
    const p2 = f0Contour[i + 1];
    if (time >= p1.time && time <= p2.time) {
      if (Math.abs(p2.time - p1.time) < 1e-6) return p1.f0;
      const fraction = (time - p1.time) / (p2.time - p1.time);
      return p1.f0 + fraction * (p2.f0 - p1.f0);
    }
  }
  return f0Contour[f0Contour.length - 1].f0;
}

// Hardcoded defaults — overridden by YAML output config when available
const DEFAULT_BLEND_FACTOR = 0.35;
const DEFAULT_SMOOTH_TYPES = new Set(["vowel", "nasal", "liquid", "glide"]);
const DEFAULT_BLEND_KEYS = ["F1", "F2", "F3", "B1", "B2", "B3"];
const DEFAULT_MIN_DURATION_STOP_RELEASE_MS = 5;
const DEFAULT_MIN_DURATION_MS = 20;
const DEFAULT_FINAL_SILENCE_MS = 100;

function blendParams(
  baseParams: KlattParams,
  nextParams: KlattParams | null | undefined,
  blendKeys: string[],
  blendFactor: number,
): KlattParams {
  if (!nextParams) return { ...baseParams };
  const blended = { ...baseParams };
  for (const key of blendKeys) {
    const a = baseParams[key];
    const b = nextParams[key];
    if (Number.isFinite(a) && Number.isFinite(b)) {
      blended[key] = a + (b - a) * blendFactor;
    }
  }
  return blended;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Convert a phone sequence and full parameter sequence (including F0 stream)
 * into an array of Klatt frames (the "track").
 *
 * @param phoneSequence  Phones only (stream !== "f0", status !== 2).
 * @param parameterSequence  Full sequence including F0 stream tokens.
 * @param options  Base F0 and transition duration.
 * @returns KlattFrame[] with monotonically increasing times.
 */
export function assembleKlattTrack(
  phoneSequence: FrontendToken[],
  parameterSequence: FrontendToken[],
  options: AssembleTrackOptions = {}
): FrontendToken[] {
  const baseF0 = options.baseF0 ?? 110;
  const cfg = options.outputConfig;
  const transitionMs = options.transitionMs ?? cfg?.transition_ms ?? 30;

  // Resolve blend config from YAML, falling back to hardcoded defaults.
  const blendFactor = cfg?.blend?.factor ?? DEFAULT_BLEND_FACTOR;
  const blendKeys = cfg?.blend?.keys ?? DEFAULT_BLEND_KEYS;
  const smoothTypes = cfg?.blend?.smooth_types
    ? new Set(cfg.blend.smooth_types)
    : DEFAULT_SMOOTH_TYPES;
  const minDurationStopReleaseMs =
    cfg?.min_duration?.stop_release_ms ?? DEFAULT_MIN_DURATION_STOP_RELEASE_MS;
  const minDurationDefaultMs =
    cfg?.min_duration?.default_ms ?? DEFAULT_MIN_DURATION_MS;
  const finalSilenceMs = cfg?.final_silence_ms ?? DEFAULT_FINAL_SILENCE_MS;

  // Build the F0 contour from declarative points.
  const f0Contour = buildF0ContourFromDeclarative(parameterSequence, baseF0);

  const klattTrack: FrontendToken[] = [];
  let currentTime = 0;
  const transitionSec = Math.max(0, transitionMs) / 1000.0;

  // Start silent.
  klattTrack.push({
    time: 0,
    params: fillDefaultParams(PHONEME_TARGET_MAP["SIL"]),
  });

  for (let i = 0; i < phoneSequence.length; i++) {
    const ph = phoneSequence[i] as FrontendToken;
    // Stop releases/aspiration must use their fixed MITalk durations (5-25ms)
    const isStopRelease = ph.type === "stop_release" || ph.type === "stop_aspiration";
    const minDuration = isStopRelease ? minDurationStopReleaseMs : minDurationDefaultMs;
    const targetDur = isStopRelease ? PHONEME_TARGET_MAP[ph.phoneme]?.dur : null;
    const phDurationMs = Number.isFinite(targetDur) ? targetDur : (ph.duration || 100);
    const phDuration = Math.max(minDuration, phDurationMs) / 1000.0;
    const segmentStart = currentTime;

    if (phDuration <= 0) {
      console.warn(
        `[TTS Frontend DEBUG] Calculated duration is non-positive (${phDuration.toFixed(
          4
        )}s) for ${ph.phoneme}. Original duration: ${ph.duration}ms. Skipping.`
      );
      continue;
    }
    const targetTime = segmentStart + phDuration;

    // Use the params object directly from the sequence (already filled and potentially modified by rules)
    const finalParams: KlattParams = ph.params
      ? { ...ph.params }
      : fillDefaultParams(PHONEME_TARGET_MAP["SIL"]);

    // Determine and set F0.
    const isTargetVoiced = finalParams.AV > 0 || finalParams.AVS > 0;
    const f0FromContour = getF0AtTime(f0Contour, targetTime);
    let calculatedF0 = isTargetVoiced ? f0FromContour : 0;
    if (ph.phoneme === "SIL") calculatedF0 = 0;
    if (isTargetVoiced && calculatedF0 < 1) {
      calculatedF0 = baseF0 / 2;
    }
    finalParams.F0 = calculatedF0;

    if (targetTime > segmentStart) {
      const nextPh = phoneSequence[i + 1] as FrontendToken | undefined;
      const canSmooth =
        transitionSec > 0 &&
        smoothTypes.has(ph.type) &&
        smoothTypes.has(nextPh?.type);
      const steadyTime = canSmooth
        ? Math.max(segmentStart + 0.02, targetTime - transitionSec)
        : null;

      klattTrack.push({
        time: segmentStart,
        phoneme: ph.phoneme,
        word: ph.word,
        params: finalParams,
      });

      if (steadyTime && steadyTime > segmentStart && steadyTime < targetTime) {
        const transitionParams = blendParams(finalParams, nextPh?.params, blendKeys, blendFactor);
        const transitionF0 = isTargetVoiced ? getF0AtTime(f0Contour, steadyTime) : 0;
        transitionParams.F0 = ph.phoneme === "SIL" ? 0 : transitionF0;
        klattTrack.push({
          time: steadyTime,
          phoneme: ph.phoneme,
          word: ph.word,
          params: transitionParams,
        });
      }
      currentTime = targetTime;
    }
  }

  // Add final silence.
  const finalTime = currentTime + finalSilenceMs / 1000.0;
  klattTrack.push({
    time: finalTime,
    phoneme: "SIL",
    params: fillDefaultParams(PHONEME_TARGET_MAP["SIL"]),
  });

  return klattTrack;
}
