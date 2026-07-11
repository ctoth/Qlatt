/**
 * HRG lowering — the single final pass: project leaf `Segment` features into a
 * flat 5 ms Klatt control-frame track (the synthesizer's input vocabulary,
 * `KlattFrame` from tts-frontend-types). Each emitted param carries the
 * decision id of the write that produced it, so the lowered track is itself
 * queryable (see provenance-query.ts).
 *
 * This is the basic segment -> duration -> param round-trip. Intonation / Tilt /
 * PhraseCommand / Affect relations are designed for but not yet projected here;
 * the per-frame provenance index is the seam they will plug into.
 *
 * Citations: Klatt 1980 (5 ms control frames); Allen 1987 MITalk PHONET (flatten
 * the structure to a parameter track only at the end);
 * design/beauty-synthesis/11-sota-frontend-architecture.md §5 (one final lowering).
 */
import type { KlattFrame } from "../../tts-frontend-types";
import type { Utterance } from "./utterance";
import type { Item } from "./item";

export interface LowerOptions {
  /** Required backend parameter columns, in declared output order. */
  columns: readonly string[];
  /** Frame period in seconds (default 0.005 = 5 ms). */
  framePeriodSec?: number;
  /** Feature key holding each segment's realized duration in ms (default "duration"). */
  durationKey?: string;
  /** Feature key holding each segment's phoneme label (default "phoneme"). */
  phonemeKey?: string;
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
  framePeriodSec: number;
  totalMs: number;
  paramKeys: string[];
  timings: SegmentTiming[];
  utterance: Utterance;
}

function findCovering(timings: SegmentTiming[], tMs: number): SegmentTiming | null {
  const epsilon = 1e-6;
  for (const timing of timings) {
    if (tMs >= timing.startMs - epsilon && tMs < timing.endMs - epsilon) {
      return timing;
    }
  }
  // Clamp the final boundary (t == totalMs) to the last segment.
  const last = timings[timings.length - 1];
  if (last && tMs >= last.endMs - epsilon) return last;
  return null;
}

/** Lower an utterance's Segment relation into a KlattFrame[] track. */
export function lowerToFrames(utterance: Utterance, options: LowerOptions): LoweredTrack {
  const framePeriodSec = options.framePeriodSec ?? 0.005;
  const framePeriodMs = framePeriodSec * 1000;
  const durationKey = options.durationKey ?? "duration";
  const phonemeKey = options.phonemeKey ?? "phoneme";
  if (!Number.isFinite(framePeriodSec) || framePeriodSec <= 0) {
    throw new Error("E_HRG_LOWER_FRAME_PERIOD: frame period must be finite and positive");
  }

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
    const resolvedDurationMs = endMs - startMs;
    if (
      resolvedDurationMs <= 0
      || Math.abs(resolvedDurationMs - rawDuration) > 1e-6
      || (previousEndMs != null && Math.abs(startMs - previousEndMs) > 1e-6)
    ) {
      utterance.diagnostics.error(
        "Segment duration and resolved interval timing disagree",
        { itemId: item.id, durationMs: rawDuration, startMs, endMs, previousEndMs },
        "HRG_LOWER_TIMING_MISMATCH",
      );
      throw new Error(`E_HRG_LOWER_TIMING_MISMATCH: Segment '${item.id}' has inconsistent timing`);
    }
    timings.push({ item, startMs, endMs, durationMs: rawDuration });
    previousEndMs = endMs;
  }
  const totalMs = previousEndMs ?? 0;

  const paramKeys = options.columns.slice();

  const frames: KlattFrame[] = [];
  const provenanceByFrame: Array<Record<string, string>> = [];

  const epsilon = 1e-6;
  const frameCount = totalMs <= 0 ? 0 : Math.floor(totalMs / framePeriodMs + epsilon) + 1;

  for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
    const tMs = frameIndex * framePeriodMs;
    const timing = findCovering(timings, tMs);
    if (!timing) continue;

    const item = timing.item;
    const params: Record<string, number> = {};
    const provenance: Record<string, string> = {};
    for (const key of paramKeys) {
      const value = item.get(key);
      if (typeof value === "number") {
        params[key] = value;
        const write = item.latestWrite(key);
        if (write) provenance[key] = write.decisionId;
      }
    }

    const phoneme = item.get(phonemeKey);
    const frame: KlattFrame = {
      time: tMs / 1000,
      params,
      segmentId: item.id,
      provenance,
    };
    if (typeof phoneme === "string") frame.phoneme = phoneme;
    frames.push(frame);
    provenanceByFrame.push(provenance);
  }

  return {
    frames,
    provenanceByFrame,
    framePeriodSec,
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
