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
import type { FeatureValue } from "./types";

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
    event_points: {
      include_segment_start: boolean;
      include_control_boundaries: boolean;
      include_f0_anchors: boolean;
      include_transition_steady_time: boolean;
    };
  };
  transitions: {
    default_transition_ms: { value: number };
    blend: {
      factor: { value: number };
      keys: readonly string[];
      smooth_types: readonly string[];
      smooth_all_boundaries?: boolean;
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

type ControlFieldOperation = "set" | "add" | "mul" | "max" | "min" | "unset";

type ResolvedControlField = {
  operation: ControlFieldOperation;
  value?: number;
};

type ResolvedControlWindow = {
  startMs: number;
  endMs: number;
  fields: Readonly<Record<string, ResolvedControlField>>;
  decisionId: string;
};

type ResolvedSegmentTransition = {
  startMs: number;
  fields: Readonly<Record<string, number>>;
};

function isFeatureObject(value: FeatureValue | undefined): value is { readonly [key: string]: FeatureValue } {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteFeatureNumber(value: FeatureValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseControlFields(value: FeatureValue | undefined): Record<string, ResolvedControlField> {
  if (!isFeatureObject(value)) {
    throw new Error("E_HRG_LOWER_CONTROL_WINDOW: fields must be a typed object");
  }
  const fields: Record<string, ResolvedControlField> = {};
  for (const [fieldName, fieldValue] of Object.entries(value)) {
    if (typeof fieldValue === "number" && Number.isFinite(fieldValue)) {
      fields[fieldName] = { operation: "set", value: fieldValue };
      continue;
    }
    if (!isFeatureObject(fieldValue) || typeof fieldValue.op !== "string") {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: field '${fieldName}' is invalid`);
    }
    const operation = fieldValue.op;
    if (
      operation !== "set"
      && operation !== "add"
      && operation !== "mul"
      && operation !== "max"
      && operation !== "min"
      && operation !== "unset"
    ) {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: field '${fieldName}' has invalid operation`);
    }
    if (operation === "unset") {
      fields[fieldName] = { operation };
      continue;
    }
    const operand = finiteFeatureNumber(fieldValue.value);
    if (operand == null) {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: field '${fieldName}' requires a finite value`);
    }
    fields[fieldName] = { operation, value: operand };
  }
  if (Object.keys(fields).length === 0) {
    throw new Error("E_HRG_LOWER_CONTROL_WINDOW: fields cannot be empty");
  }
  return fields;
}

function resolveWindowSpan(
  value: { readonly [key: string]: FeatureValue },
  durationMs: number,
): { startMs: number; endMs: number } | null {
  const prefixMs = finiteFeatureNumber(value.prefix_ms);
  if (prefixMs != null) {
    const endMs = Math.max(0, Math.min(durationMs, prefixMs));
    return endMs > 0 ? { startMs: 0, endMs } : null;
  }
  const suffixMs = finiteFeatureNumber(value.suffix_ms);
  if (suffixMs != null) {
    const spanMs = Math.max(0, Math.min(durationMs, suffixMs));
    const startMs = Math.max(0, durationMs - spanMs);
    return durationMs > startMs ? { startMs, endMs: durationMs } : null;
  }
  const startMsValue = finiteFeatureNumber(value.start_ms);
  const endMsValue = finiteFeatureNumber(value.end_ms);
  const startRatio = finiteFeatureNumber(value.start_ratio);
  const endRatio = finiteFeatureNumber(value.end_ratio);
  const rawStartMs = startMsValue ?? durationMs * Math.max(0, Math.min(1, startRatio ?? 0));
  const rawEndMs = endMsValue ?? durationMs * Math.max(0, Math.min(1, endRatio ?? 1));
  const startMs = Math.max(0, Math.min(durationMs, rawStartMs));
  const endMs = Math.max(startMs, Math.min(durationMs, rawEndMs));
  return endMs > startMs ? { startMs, endMs } : null;
}

function resolveControlField(baseValue: number | undefined, field: ResolvedControlField): number | undefined {
  switch (field.operation) {
    case "unset":
      return undefined;
    case "set":
      return field.value;
    case "add":
      return (baseValue ?? 0) + (field.value ?? 0);
    case "mul":
      return (baseValue ?? 0) * (field.value ?? 1);
    case "max":
      return Math.max(baseValue ?? Number.NEGATIVE_INFINITY, field.value ?? Number.NEGATIVE_INFINITY);
    case "min":
      return Math.min(baseValue ?? Number.POSITIVE_INFINITY, field.value ?? Number.POSITIVE_INFINITY);
  }
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
  const defaultTransitionMs = requirePolicyNumber(
    options.transitions.default_transition_ms.value,
    "transitions.default_transition_ms.value",
  );
  const blendFactor = options.transitions.blend.factor.value;
  if (!Number.isFinite(blendFactor) || blendFactor < 0 || blendFactor > 1) {
    throw new Error("E_HRG_LOWER_POLICY_NUMBER: 'transitions.blend.factor.value' must be within [0,1]");
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
  const smoothTypes = new Set(options.transitions.blend.smooth_types);
  const transitionsByItem = new Map<Item, ResolvedSegmentTransition[]>();
  timings.forEach((timing, index) => {
    const nextTiming = timings[index + 1];
    if (!nextTiming) return;
    const currentType = timing.item.get(typeKey);
    const nextType = nextTiming.item.get(typeKey);
    if (typeof currentType !== "string" || typeof nextType !== "string") return;
    if (!smoothTypes.has(currentType) || !smoothTypes.has(nextType)) return;
    const itemTransitionMs = finiteFeatureNumber(timing.item.get("transition_ms"));
    const transitionMs = itemTransitionMs ?? defaultTransitionMs;
    if (transitionMs <= 0) return;
    const startMs = Math.max(20, timing.durationMs - transitionMs);
    if (startMs <= 0 || startMs >= timing.durationMs) return;
    const fields: Record<string, number> = {};
    for (const key of options.transitions.blend.keys) {
      const currentValue = timing.item.get(key);
      const nextValue = nextTiming.item.get(key);
      if (typeof currentValue !== "number" || typeof nextValue !== "number") continue;
      fields[key] = currentValue + (nextValue - currentValue) * blendFactor;
    }
    if (Object.keys(fields).length > 0) {
      transitionsByItem.set(timing.item, [{ startMs, fields }]);
    }
  });
  const controlWindowsByItem = new Map<Item, ResolvedControlWindow[]>();
  segmentItems.forEach((sourceItem, sourceIndex) => {
    const rawWindows = sourceItem.get("control_windows");
    if (!Array.isArray(rawWindows)) return;
    const windowWrite = sourceItem.latestWrite("control_windows");
    if (!windowWrite) {
      throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: Segment '${sourceItem.id}' has unstamped controls`);
    }
    rawWindows.forEach((rawWindow) => {
      if (!isFeatureObject(rawWindow)) {
        throw new Error(`E_HRG_LOWER_CONTROL_WINDOW: Segment '${sourceItem.id}' has invalid controls`);
      }
      const targetName = typeof rawWindow.target === "string" ? rawWindow.target : "current";
      const targetIndex = targetName === "next"
        ? sourceIndex + 1
        : targetName === "prev"
          ? sourceIndex - 1
          : sourceIndex;
      const targetTiming = timings[targetIndex];
      if (!targetTiming) {
        utterance.diagnostics.warn(
          "Control window target falls outside the active Segment relation",
          { sourceItemId: sourceItem.id, target: targetName },
          "HRG_LOWER_CONTROL_WINDOW_TARGET",
        );
        return;
      }
      const span = resolveWindowSpan(rawWindow, targetTiming.durationMs);
      if (!span) {
        utterance.diagnostics.warn(
          "Control window has an empty resolved span",
          { sourceItemId: sourceItem.id, targetItemId: targetTiming.item.id },
          "HRG_LOWER_CONTROL_WINDOW_EMPTY",
        );
        return;
      }
      const resolved: ResolvedControlWindow = {
        ...span,
        fields: parseControlFields(rawWindow.fields),
        decisionId: windowWrite.decisionId,
      };
      const targetWindows = controlWindowsByItem.get(targetTiming.item);
      if (targetWindows) targetWindows.push(resolved);
      else controlWindowsByItem.set(targetTiming.item, [resolved]);
    });
  });

  const frames: KlattFrame[] = [];
  const provenanceByFrame: Array<Record<string, string>> = [];

  const appendFrame = (
    timeMs: number,
    item?: Item,
    phonemeOverride?: string,
    segmentOffsetMs = 0,
  ): void => {
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
      for (const transition of transitionsByItem.get(item) ?? []) {
        if (segmentOffsetMs < transition.startMs - 1e-6) continue;
        for (const [key, value] of Object.entries(transition.fields)) {
          params[key] = value;
          const write = item.latestWrite(key);
          if (write) provenance[key] = write.decisionId;
        }
      }
      for (const window of controlWindowsByItem.get(item) ?? []) {
        if (segmentOffsetMs < window.startMs - 1e-6 || segmentOffsetMs >= window.endMs - 1e-6) {
          continue;
        }
        for (const [key, field] of Object.entries(window.fields)) {
          const value = resolveControlField(params[key], field);
          if (value == null || !Number.isFinite(value)) {
            delete params[key];
            delete provenance[key];
          } else {
            params[key] = value;
            provenance[key] = window.decisionId;
          }
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
    const offsets = new Set<number>();
    if (options.timeline.event_points.include_segment_start) offsets.add(0);
    if (options.timeline.event_points.include_control_boundaries) {
      for (const window of controlWindowsByItem.get(timing.item) ?? []) {
        if (window.startMs > 1e-6 && window.startMs < timing.durationMs - 1e-6) {
          offsets.add(window.startMs);
        }
        if (window.endMs > 1e-6 && window.endMs < timing.durationMs - 1e-6) {
          offsets.add(window.endMs);
        }
      }
    }
    if (options.timeline.event_points.include_transition_steady_time) {
      for (const transition of transitionsByItem.get(timing.item) ?? []) {
        if (transition.startMs > 1e-6 && transition.startMs < timing.durationMs - 1e-6) {
          offsets.add(transition.startMs);
        }
      }
    }
    for (const offsetMs of [...offsets].sort((left, right) => left - right)) {
      appendFrame(initialSilenceMs + timing.startMs + offsetMs, timing.item, undefined, offsetMs);
    }
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
