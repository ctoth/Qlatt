/**
 * HRG lowering — the single final pass: project leaf `Segment` features into a
 * sparse timestamped Klatt automation-event track (the synthesizer's input vocabulary,
 * `KlattFrame` from tts-frontend-types). Each emitted param carries the
 * decision id of the write that produced it, so the lowered track is itself
 * queryable (see provenance-query.ts).
 *
 * This is the basic segment -> duration -> param round-trip. Intonation / Tilt /
 * PhraseCommand / Affect relations are designed for but not yet projected here;
 * the per-frame provenance index is the seam they will plug into.
 *
 * Citations: Klatt 1980 (time-varying control parameters); Allen 1987 MITalk PHONET (flatten
 * the structure to a parameter track only at the end);
 * design/beauty-synthesis/11-sota-frontend-architecture.md §5 (one final lowering).
 */
import type { KlattFrame } from "../../tts-frontend-types";
import type { Utterance } from "./utterance";
import type { Item } from "./item";

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
  };
  /** Feature key holding each segment's realized duration in ms (default "duration"). */
  durationKey?: string;
  /** Feature key holding each segment's phoneme label (default "phoneme"). */
  phonemeKey?: string;
  /** Feature key holding the segment class used by duration policy (default "type"). */
  typeKey?: string;
}

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

function requirePolicyNumber(value: number, path: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`E_HRG_LOWER_POLICY_NUMBER: '${path}' must be finite and non-negative`);
  }
  return value;
}

/** Lower an utterance's Segment relation into a KlattFrame[] track. */
export function lowerToFrames(utterance: Utterance, options: LowerOptions): LoweredTrack {
  const durationKey = options.durationKey ?? "duration";
  const phonemeKey = options.phonemeKey ?? "phoneme";
  const typeKey = options.typeKey ?? "type";
  const initialSilenceMs = requirePolicyNumber(
    options.timeline.initial_silence_ms.value,
    "timeline.initial_silence_ms.value",
  );
  const finalSilenceMs = requirePolicyNumber(
    options.timeline.final_silence_ms.value,
    "timeline.final_silence_ms.value",
  );
  const stopReleaseFloorMs = requirePolicyNumber(
    options.timeline.duration_floors.stop_release_ms.value,
    "timeline.duration_floors.stop_release_ms.value",
  );
  const defaultFloorMs = requirePolicyNumber(
    options.timeline.duration_floors.default_ms.value,
    "timeline.duration_floors.default_ms.value",
  );

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

  const frames: KlattFrame[] = [];
  const provenanceByFrame: Array<Record<string, string>> = [];

  const appendFrame = (timeMs: number, item?: Item, phonemeOverride?: string): void => {
    const params: Record<string, number> = {};
    const provenance: Record<string, string> = {};
    if (item) {
      for (const key of paramKeys) {
        const value = item.get(key);
        if (typeof value === "number") {
          params[key] = value;
          const write = item.latestWrite(key);
          if (write) provenance[key] = write.decisionId;
        }
      }
    }
    const frame: KlattFrame = {
      time: timeMs / 1000,
      params,
      provenance,
    };
    if (item) {
      frame.segmentId = item.id;
      const phoneme = item.get(phonemeKey);
      if (typeof phoneme === "string") frame.phoneme = phoneme;
    } else if (phonemeOverride) {
      frame.phoneme = phonemeOverride;
    }
    frames.push(frame);
    provenanceByFrame.push(provenance);
  };

  appendFrame(0);
  for (const timing of timings) {
    appendFrame(initialSilenceMs + timing.startMs, timing.item);
  }
  const finalResetMs = initialSilenceMs + segmentTotalMs;
  appendFrame(finalResetMs, undefined, "SIL");
  const totalMs = finalResetMs + finalSilenceMs;
  if (totalMs > finalResetMs) appendFrame(totalMs, undefined, "SIL");

  return {
    frames,
    provenanceByFrame,
    totalMs,
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
