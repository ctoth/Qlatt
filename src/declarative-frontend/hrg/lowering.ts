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

type LocusEntry = {
  locus_hz: number;
  prcnt: number;
  durtran_ms: number;
};

type LocusTable = Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, LocusEntry>>>>>>;
type VowelCategoryTable = Readonly<Record<string, { forward?: number; backward?: number }>>;

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
    sonorant_f2?: {
      key: string;
      span_ms: { value: number };
      neighbor_weight: { value: number };
      current_type: string;
      neighbor_types: readonly string[];
      forward: boolean;
      backward: boolean;
    };
    loci?: LocusTable;
    vowel_category?: VowelCategoryTable;
    obstruent_place?: Readonly<Record<string, { palatal_or_dental?: boolean }>>;
    rounded_sonorant_consonant?: readonly string[];
    f2_back?: Readonly<Record<string, { forward?: boolean; backward?: boolean }>>;
    locus_glue_types?: readonly string[];
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
  endMs?: number;
  linearFields?: Readonly<Record<string, { startValue: number; endValue: number }>>;
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

function resolveLocusFormants(
  vowel: Item,
  obstruent: Item,
  edge: "forward" | "backward",
  options: LowerOptions,
  phonemeKey: string,
): Array<{ key: string; boundaryValue: number; spanMs: number }> {
  const loci = options.transitions.loci;
  const categories = options.transitions.vowel_category;
  const vowelPhoneme = vowel.get(phonemeKey);
  const obstruentPhoneme = obstruent.get(phonemeKey);
  if (!loci || !categories || typeof vowelPhoneme !== "string" || typeof obstruentPhoneme !== "string") {
    return [];
  }
  const category = categories[vowelPhoneme];
  const categoryId = edge === "forward" ? category?.forward : category?.backward;
  const formants = categoryId == null ? undefined : loci[obstruentPhoneme]?.[String(categoryId)];
  if (!formants) return [];
  const rounded = options.transitions.rounded_sonorant_consonant?.includes(vowelPhoneme) ?? false;
  const palatalOrDental = options.transitions.obstruent_place?.[obstruentPhoneme]?.palatal_or_dental ?? false;
  const f2Back = edge === "forward"
    ? options.transitions.f2_back?.[vowelPhoneme]?.forward === true
    : options.transitions.f2_back?.[vowelPhoneme]?.backward === true;
  const resolved: Array<{ key: string; boundaryValue: number; spanMs: number }> = [];
  for (const key of options.transitions.blend.keys) {
    const entry = formants[key];
    const currentValue = vowel.get(key);
    if (!entry || typeof currentValue !== "number") continue;
    let percent = entry.prcnt;
    let spanMs = entry.durtran_ms;
    if (rounded && (key === "F2" || key === "F3") && !palatalOrDental) {
      percent = Math.floor(percent / 2) + 50;
    }
    if (key === "F2" && f2Back) {
      percent += 25 - Math.floor(percent / 4);
      spanMs = Math.floor(spanMs / 2) + 2;
    }
    const boundaryValue = entry.locus_hz + (percent * (currentValue - entry.locus_hz)) / 100;
    if (Number.isFinite(boundaryValue) && Number.isFinite(spanMs) && spanMs > 0) {
      resolved.push({ key, boundaryValue, spanMs });
    }
  }
  return resolved;
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
  const appendTransition = (item: Item, transition: ResolvedSegmentTransition): void => {
    const existing = transitionsByItem.get(item);
    if (existing) existing.push(transition);
    else transitionsByItem.set(item, [transition]);
  };
  timings.forEach((timing, index) => {
    const nextTiming = timings[index + 1];
    if (!nextTiming) return;
    const currentType = timing.item.get(typeKey);
    const nextType = nextTiming.item.get(typeKey);
    if (typeof currentType !== "string" || typeof nextType !== "string") return;
    const bothSmoothed = smoothTypes.has(currentType) && smoothTypes.has(nextType);
    if (!bothSmoothed && options.transitions.blend.smooth_all_boundaries !== true) return;
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
      appendTransition(timing.item, { startMs, fields });
    }
  });
  if (options.transitions.blend.smooth_all_boundaries === true) {
    timings.forEach((timing, index) => {
      const previous = timings[index - 1];
      if (!previous) return;
      const itemTransitionMs = finiteFeatureNumber(timing.item.get("transition_ms"));
      const transitionMs = itemTransitionMs ?? defaultTransitionMs;
      const endMs = Math.min(timing.durationMs - 20, transitionMs);
      if (endMs <= 0) return;
      const fields: Record<string, number> = {};
      for (const key of options.transitions.blend.keys) {
        const currentValue = timing.item.get(key);
        const previousValue = previous.item.get(key);
        if (typeof currentValue !== "number" || typeof previousValue !== "number") continue;
        fields[key] = currentValue + (previousValue - currentValue) * blendFactor;
      }
      if (Object.keys(fields).length > 0) {
        appendTransition(timing.item, { startMs: 0, endMs, fields });
      }
    });
  }
  const sonorantF2 = options.transitions.sonorant_f2;
  if (sonorantF2) {
    const spanMs = requirePolicyNumber(sonorantF2.span_ms.value, "transitions.sonorant_f2.span_ms.value");
    const neighborWeight = sonorantF2.neighbor_weight.value;
    if (!Number.isFinite(neighborWeight) || neighborWeight < 0 || neighborWeight > 1) {
      throw new Error(
        "E_HRG_LOWER_POLICY_NUMBER: 'transitions.sonorant_f2.neighbor_weight.value' must be within [0,1]",
      );
    }
    const neighborTypes = new Set(sonorantF2.neighbor_types);
    timings.forEach((timing, index) => {
      if (timing.item.get(typeKey) !== sonorantF2.current_type) return;
      const currentValue = timing.item.get(sonorantF2.key);
      if (typeof currentValue !== "number") return;
      const previous = timings[index - 1];
      if (sonorantF2.forward && previous && neighborTypes.has(String(previous.item.get(typeKey)))) {
        const previousValue = previous.item.get(sonorantF2.key);
        const endMs = Math.min(spanMs, timing.durationMs - 20);
        if (typeof previousValue === "number" && endMs > 0) {
          appendTransition(timing.item, {
            startMs: 0,
            endMs,
            fields: {},
            linearFields: {
              [sonorantF2.key]: {
                startValue: currentValue + (previousValue - currentValue) * neighborWeight,
                endValue: currentValue,
              },
            },
          });
        }
      }
      const next = timings[index + 1];
      if (sonorantF2.backward && next && neighborTypes.has(String(next.item.get(typeKey)))) {
        const nextValue = next.item.get(sonorantF2.key);
        const transitionSpanMs = Math.min(spanMs, timing.durationMs);
        const startMs = Math.max(20, timing.durationMs - transitionSpanMs);
        if (typeof nextValue === "number" && startMs < timing.durationMs) {
          appendTransition(timing.item, {
            startMs,
            endMs: timing.durationMs,
            fields: {},
            linearFields: {
              [sonorantF2.key]: {
                startValue: currentValue,
                endValue: currentValue + (nextValue - currentValue) * neighborWeight,
              },
            },
          });
        }
      }
    });
  }
  const locusGlueTypes = new Set(options.transitions.locus_glue_types ?? []);
  const adjacentLocusObstruent = (index: number, direction: -1 | 1): Item | undefined => {
    let neighborIndex = index + direction;
    while (timings[neighborIndex] && locusGlueTypes.has(String(timings[neighborIndex].item.get(typeKey)))) {
      neighborIndex += direction;
    }
    const neighbor = timings[neighborIndex]?.item;
    if (!neighbor || smoothTypes.has(String(neighbor.get(typeKey)))) return undefined;
    const phoneme = neighbor.get(phonemeKey);
    return typeof phoneme === "string" && options.transitions.loci?.[phoneme] ? neighbor : undefined;
  };
  if (options.transitions.loci && options.transitions.vowel_category) {
    timings.forEach((timing, index) => {
      if (!smoothTypes.has(String(timing.item.get(typeKey)))) return;
      const previousObstruent = adjacentLocusObstruent(index, -1);
      if (previousObstruent) {
        for (const formant of resolveLocusFormants(
          timing.item,
          previousObstruent,
          "forward",
          options,
          phonemeKey,
        )) {
          const endMs = Math.min(timing.durationMs - 20, formant.spanMs);
          const currentValue = timing.item.get(formant.key);
          if (typeof currentValue !== "number" || endMs <= 0) continue;
          appendTransition(timing.item, {
            startMs: 0,
            endMs,
            fields: {},
            linearFields: {
              [formant.key]: {
                startValue: formant.boundaryValue,
                endValue: currentValue,
              },
            },
          });
        }
      }
      const nextObstruent = adjacentLocusObstruent(index, 1);
      if (nextObstruent) {
        for (const formant of resolveLocusFormants(
          timing.item,
          nextObstruent,
          "backward",
          options,
          phonemeKey,
        )) {
          const spanMs = Math.min(timing.durationMs, formant.spanMs);
          const startMs = Math.max(20, timing.durationMs - spanMs);
          const currentValue = timing.item.get(formant.key);
          if (typeof currentValue !== "number" || startMs >= timing.durationMs) continue;
          appendTransition(timing.item, {
            startMs,
            endMs: timing.durationMs,
            fields: {},
            linearFields: {
              [formant.key]: {
                startValue: currentValue,
                endValue: formant.boundaryValue,
              },
            },
          });
        }
      }
    });
  }
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
        const staticFieldsActive = transition.endMs == null || segmentOffsetMs <= transition.endMs + 1e-6;
        if (staticFieldsActive) {
          for (const [key, value] of Object.entries(transition.fields)) {
            params[key] = value;
            const write = item.latestWrite(key);
            if (write) provenance[key] = write.decisionId;
          }
        }
        if (transition.linearFields && transition.endMs != null) {
          const durationMs = transition.endMs - transition.startMs;
          const fraction = durationMs <= 0
            ? 1
            : Math.max(0, Math.min(1, (segmentOffsetMs - transition.startMs) / durationMs));
          for (const [key, values] of Object.entries(transition.linearFields)) {
            params[key] = values.startValue + (values.endValue - values.startValue) * fraction;
            const write = item.latestWrite(key);
            if (write) provenance[key] = write.decisionId;
          }
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
        if (
          transition.endMs != null
          && transition.endMs > 1e-6
          && transition.endMs < timing.durationMs - 1e-6
        ) {
          offsets.add(transition.endMs);
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
