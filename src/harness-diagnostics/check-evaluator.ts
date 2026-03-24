// Check evaluator — evaluates a CheckDef against measurement values and timing context.
// Produces a CheckResult for each poll tick.

import type {
  CheckDef,
  CheckResult,
  CheckStatus,
  Severity,
  WhenClause,
  CollectedEvent,
  ParamRangeAccum,
  TrackEvent,
  TrackSelectClause,
  TrackAnalysisCheckDef,
} from "./types";
import type { TimingSnapshot } from "./timing-context";

/** Internal state for a single check across poll ticks. */
export interface CheckState {
  /** For collect: true checks — accumulated events. */
  collected: CollectedEvent[];
  /** Last collection time for cooldown. */
  lastCollectedAt: number;
  /** For param_range checks — accumulated min/max. */
  paramRange: ParamRangeAccum | null;
  /** For peak checks — maximum peak observed across all ticks. */
  maxPeak: number;
}

/** Create initial state for a check. */
export function createCheckState(): CheckState {
  return {
    collected: [],
    lastCollectedAt: -Infinity,
    paramRange: null,
    maxPeak: 0,
  };
}

/** Check if a WhenClause matches the current timing snapshot. */
export function matchesWhen(
  when: WhenClause | undefined,
  snapshot: TimingSnapshot,
): boolean {
  if (when === undefined) return true;
  if (snapshot.event === null) return false;

  const params = snapshot.event.params ?? {};

  if (when.SW !== undefined) {
    if (params.SW !== when.SW) return false;
  }

  if (when.phoneme !== undefined) {
    const phoneme = snapshot.event.phoneme;
    if (phoneme === undefined) return false;
    if (when.phoneme.endsWith("*")) {
      const prefix = when.phoneme.slice(0, -1);
      if (!phoneme.startsWith(prefix)) return false;
    } else {
      if (phoneme !== when.phoneme) return false;
    }
  }

  if (when.voiced !== undefined) {
    const av = (params.AV as number) ?? 0;
    const avs = (params.AVS as number) ?? 0;
    const isVoiced = av > 0 || avs > 0;
    if (when.voiced !== isVoiced) return false;
  }

  return true;
}

/**
 * Evaluate a check definition against current state.
 * Returns a CheckResult.
 */
export function evaluateCheck(
  name: string,
  def: CheckDef,
  measurements: Map<string, number>,
  snapshot: TimingSnapshot,
  state: CheckState,
  now: number,
): CheckResult {
  const base: Omit<CheckResult, "status" | "value"> = {
    name,
    severity: def.severity,
    message: def.message,
  };

  // Skip conditions
  if (snapshot.inGuard) {
    return { ...base, status: "skip" };
  }
  if (!snapshot.inWindow) {
    return { ...base, status: "skip" };
  }
  if (!matchesWhen(def.when, snapshot)) {
    return { ...base, status: "skip" };
  }

  const checkType = def.type ?? "tap_check";

  // param_range
  if (checkType === "param_range") {
    return evaluateParamRange(name, def, state, base);
  }

  // event_check — evaluated elsewhere
  if (checkType === "event_check") {
    return { ...base, status: "pending" };
  }

  // across_plays — evaluated by across-plays accumulator
  if (checkType === "across_plays") {
    return { ...base, status: "pending" };
  }

  // Default: tap_check
  return evaluateTapCheck(name, def, measurements, snapshot, state, now, base);
}

function evaluateParamRange(
  name: string,
  def: CheckDef,
  state: CheckState,
  base: Omit<CheckResult, "status" | "value">,
): CheckResult {
  if (state.paramRange === null) {
    return { ...base, status: "pending" };
  }

  const range = state.paramRange.max - state.paramRange.min;
  const failedRange = def.assert.range_min !== undefined && range < def.assert.range_min;
  const failedMax = def.assert.max_min !== undefined && state.paramRange.max < def.assert.max_min;
  const failed = failedRange || failedMax;

  let value = range;
  let valueLabel = "range";

  if (def.assert.max_min !== undefined && def.assert.range_min === undefined) {
    value = state.paramRange.max;
    valueLabel = "max";
  } else if (failedMax && !failedRange) {
    value = state.paramRange.max;
    valueLabel = "max";
  }

  if (failed) {
    return {
      ...base,
      status: severityToStatus(def.severity),
      value,
      valueLabel,
      assertionFailed: true,
    };
  }
  return { ...base, status: "pass", value, valueLabel };
}

function evaluateTapCheck(
  name: string,
  def: CheckDef,
  measurements: Map<string, number>,
  snapshot: TimingSnapshot,
  state: CheckState,
  now: number,
  base: Omit<CheckResult, "status" | "value">,
): CheckResult {
  let value: number;

  if (def.measure === "rms_ratio_db" && def.taps && def.taps.length >= 2) {
    const a = measurements.get(def.taps[0]) ?? 0;
    const b = measurements.get(def.taps[1]) ?? 0;
    if (b === 0) {
      value = Infinity;
    } else {
      value = 20 * Math.log10(a / b);
    }
    // Assert on absolute ratio
    value = Math.abs(value);
  } else {
    const tapName = def.tap ?? "";
    value = measurements.get(tapName) ?? 0;
  }

  // For peak measurements, track the maximum observed value across all ticks.
  // Report maxPeak instead of instantaneous value so the result survives
  // post-playback polling (where the buffer decays to near-zero).
  if (def.measure === "peak") {
    if (value > state.maxPeak) {
      state.maxPeak = value;
    }
    value = state.maxPeak;
  }

  const failed = checkAssert(value, def.assert);

  if (failed) {
    const status = severityToStatus(def.severity);

    // Handle collect
    if (def.collect) {
      const cooldown = def.cooldown_ms ?? 0;
      if (now - state.lastCollectedAt >= cooldown) {
        const maxCollected = def.max_collected ?? 100;
        if (state.collected.length < maxCollected) {
          state.collected.push({
            time: now,
            value,
            phoneme: snapshot.event?.phoneme,
          });
        }
        state.lastCollectedAt = now;
      }
    }

    return {
      ...base,
      status,
      value,
      assertionFailed: true,
      collected: def.collect ? state.collected : undefined,
    };
  }

  return { ...base, status: "pass", value };
}

function checkAssert(
  value: number,
  assert: CheckDef["assert"],
): boolean {
  if (assert.min !== undefined && value < assert.min) return true;
  if (assert.max !== undefined && value > assert.max) return true;
  return false;
}

function severityToStatus(severity: Severity): CheckStatus {
  switch (severity) {
    case "warn":
      return "warn";
    case "error":
      return "fail";
    case "info":
      return "pass";
  }
}

/** Check if a track frame matches a TrackSelectClause. */
export function matchesTrackSelect(
  frame: TrackEvent,
  select: TrackSelectClause,
): boolean {
  const params = frame.params ?? {};

  for (const [key, condition] of Object.entries(select)) {
    if (condition === undefined) continue;

    // Special keys with dedicated logic
    if (key === "phoneme") {
      const phoneme = frame.phoneme;
      if (phoneme === undefined) return false;
      const pattern = condition as string;
      if (pattern.startsWith("*")) {
        // suffix glob: *_REL matches K_REL
        const suffix = pattern.slice(1);
        if (!phoneme.endsWith(suffix)) return false;
      } else if (pattern.endsWith("*")) {
        // prefix glob: IY* matches IY1
        const prefix = pattern.slice(0, -1);
        if (!phoneme.startsWith(prefix)) return false;
      } else {
        if (phoneme !== pattern) return false;
      }
      continue;
    }

    if (key === "voiced") {
      const av = (params.AV as number) ?? 0;
      const avs = (params.AVS as number) ?? 0;
      const isVoiced = av > 0 || avs > 0;
      if ((condition as boolean) !== isVoiced) return false;
      continue;
    }

    // Numeric filters: exact number or { min?, max? }
    const paramVal = (params[key] as number) ?? 0;
    if (typeof condition === "number") {
      if (paramVal !== condition) return false;
    } else if (typeof condition === "object" && condition !== null) {
      const range = condition as { min?: number; max?: number };
      if (range.min !== undefined && paramVal < range.min) return false;
      if (range.max !== undefined && paramVal > range.max) return false;
    }
  }

  return true;
}

/** Evaluate a track_analysis check against the full track. */
export function evaluateTrackAnalysis(
  name: string,
  def: TrackAnalysisCheckDef,
  track: TrackEvent[],
): CheckResult {
  const base = {
    name,
    severity: def.severity,
    message: def.message,
  };

  // Filter frames matching select clause
  const matching = track.filter((frame) => matchesTrackSelect(frame, def.select));

  if (matching.length === 0) {
    return { ...base, status: "skip", message: "No frames matched select" };
  }

  const failures: CollectedEvent[] = [];

  for (const frame of matching) {
    const params = frame.params ?? {};

    if (def.compute) {
      const value = (params[def.compute] as number) ?? 0;
      if (!assertValuePasses(value, def.assert)) {
        failures.push({ time: frame.time, phoneme: frame.phoneme, value });
      }
    }

    if (def.assert_any_of) {
      const anyPasses = def.assert_any_of.some((field) =>
        assertValuePasses((params[field] as number) ?? 0, def.assert),
      );
      if (!anyPasses) {
        failures.push({ time: frame.time, phoneme: frame.phoneme, value: 0 });
      }
    }
  }

  if (failures.length === 0) {
    return {
      ...base,
      status: "pass",
      message: `${def.message} (${matching.length} frames checked)`,
    };
  }

  // Find worst value (minimum for min assertions, maximum for max assertions)
  const worstValue = def.assert.min !== undefined
    ? Math.min(...failures.map((f) => f.value))
    : Math.max(...failures.map((f) => f.value));

  const status = severityToStatus(def.severity);

  return {
    ...base,
    status,
    value: worstValue,
    assertionFailed: true,
    collected: failures.slice(0, 6),
    message: `${def.message} (${failures.length}/${matching.length} frames)`,
  };
}

/** Check if a value passes an assertion (inverse of checkAssert). */
function assertValuePasses(
  value: number,
  assert: { min?: number; max?: number },
): boolean {
  if (assert.min !== undefined && value < assert.min) return false;
  if (assert.max !== undefined && value > assert.max) return false;
  return true;
}

/** Update param_range accumulator with current track event params. */
export function updateParamRange(
  state: CheckState,
  paramName: string,
  track: TrackEvent[],
): void {
  for (const event of track) {
    const val = event.params?.[paramName];
    if (typeof val !== "number") continue;
    if (paramName === "F0" && val <= 0) continue;

    if (state.paramRange === null) {
      state.paramRange = { min: val, max: val };
    } else {
      if (val < state.paramRange.min) state.paramRange.min = val;
      if (val > state.paramRange.max) state.paramRange.max = val;
    }
  }
}
