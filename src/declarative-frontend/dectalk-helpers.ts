import { isPlainObject } from "../yaml-loader";

type TokenLike = Record<string, any> | null | undefined;

type TrajectoryPoint = {
  value: number;
  time: number | null;
};

type TrajectorySegment = {
  startMs: number;
  endMs: number;
  value: number;
};

type ControlField = {
  op: "set";
  value: number;
};

type ControlWindow = {
  start_ms: number;
  end_ms: number;
  fields: Record<string, ControlField>;
};

const OBSTRUENT_TYPES = new Set([
  "fricative",
  "affricate",
  "stop_closure",
  "stop_release",
  "stop_aspiration",
]);

const BACK_ROUNDED_REF_PHONEMES = new Set([
  "AO0",
  "AO1",
  "OW0",
  "OW1",
  "OY0",
  "OY1",
  "UH0",
  "UH1",
  "UW0",
  "UW1",
  "OR0",
  "OR1",
  "UR0",
  "UR1",
  "W",
]);

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  return null;
}

function parseTrajectoryPoints(raw: unknown): TrajectoryPoint[] {
  if (!Array.isArray(raw)) return [];
  const points: TrajectoryPoint[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) continue;
    const pointValue = toFiniteNumber(item.value);
    if (pointValue == null) continue;
    const pointTime = item.time == null ? null : toFiniteNumber(item.time);
    points.push({
      value: pointValue,
      time: pointTime != null && pointTime >= 0 ? pointTime : null,
    });
  }
  return points;
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function average(left: number, right: number): number {
  return (left + right) / 2;
}

function buildTrajectorySegments(points: TrajectoryPoint[], durationMs: number, scale: number): TrajectorySegment[] {
  if (points.length === 0 || durationMs <= 0) return [];

  const segments: TrajectorySegment[] = [];
  let previousBoundaryMs = 0;
  let previousPointValue = points[0].value;
  let lastTimedPointValue = points[0].value;
  let sawTimedPoint = false;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    if (point.time == null) break;
    const boundaryMs = clamp(point.time * scale, previousBoundaryMs, durationMs);
    const segmentValue = index === 0 ? point.value : average(previousPointValue, point.value);
    if (boundaryMs > previousBoundaryMs) {
      segments.push({
        startMs: previousBoundaryMs,
        endMs: boundaryMs,
        value: segmentValue,
      });
    }
    previousBoundaryMs = boundaryMs;
    previousPointValue = point.value;
    lastTimedPointValue = point.value;
    sawTimedPoint = true;
  }

  const terminalPoint = points[points.length - 1];
  const finalValue = terminalPoint?.value ?? previousPointValue;
  const tailValue = sawTimedPoint ? average(lastTimedPointValue, finalValue) : finalValue;
  if (durationMs > previousBoundaryMs) {
    segments.push({
      startMs: previousBoundaryMs,
      endMs: durationMs,
      value: tailValue,
    });
  }

  return segments;
}

function valuesEqual(
  left: Record<string, ControlField>,
  right: Record<string, ControlField>
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    if (!(key in right)) return false;
    if (left[key].op !== right[key].op) return false;
    if (left[key].value !== right[key].value) return false;
  }
  return true;
}

function roundBoundary(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function buildTrajectoryControlWindows(
  rawTrajectory: unknown,
  rawDurationMs: unknown
): ControlWindow[] {
  if (!isPlainObject(rawTrajectory)) return [];
  const durationMs = toFiniteNumber(rawDurationMs);
  if (durationMs == null || durationMs <= 0) return [];

  const parsed = Object.entries(rawTrajectory)
    .map(([fieldName, value]) => [fieldName, parseTrajectoryPoints(value)] as const)
    .filter(([, points]) => points.length > 0);
  if (parsed.length === 0) return [];

  const maxRawTime = parsed.reduce((max, [, points]) => {
    const pointMax = points.reduce((candidate, point) => {
      if (point.time == null) return candidate;
      return Math.max(candidate, point.time);
    }, 0);
    return Math.max(max, pointMax);
  }, 0);
  const scale = maxRawTime > 0 ? durationMs / maxRawTime : 1;

  const segmentsByField = new Map<string, TrajectorySegment[]>();
  const boundaries = new Set<number>([0, durationMs]);

  for (const [fieldName, points] of parsed) {
    const segments = buildTrajectorySegments(points, durationMs, scale);
    if (segments.length === 0) continue;
    segmentsByField.set(fieldName, segments);
    for (const segment of segments) {
      boundaries.add(segment.startMs);
      boundaries.add(segment.endMs);
    }
  }

  const orderedBoundaries = [...boundaries]
    .map((value) => roundBoundary(value))
    .sort((left, right) => left - right);
  const windows: ControlWindow[] = [];

  for (let index = 0; index + 1 < orderedBoundaries.length; index += 1) {
    const startMs = orderedBoundaries[index];
    const endMs = orderedBoundaries[index + 1];
    if (endMs <= startMs) continue;
    const midpointMs = startMs + (endMs - startMs) / 2;
    const fields: Record<string, ControlField> = {};

    for (const [fieldName, segments] of segmentsByField.entries()) {
      const activeSegment = segments.find(
        (segment) => midpointMs >= segment.startMs && midpointMs <= segment.endMs
      );
      if (!activeSegment) continue;
      fields[fieldName] = {
        op: "set",
        value: activeSegment.value,
      };
    }

    if (Object.keys(fields).length === 0) continue;
    const previous = windows[windows.length - 1];
    if (
      previous &&
      previous.end_ms === startMs &&
      valuesEqual(previous.fields, fields)
    ) {
      previous.end_ms = endMs;
      continue;
    }

    windows.push({
      start_ms: startMs,
      end_ms: endMs,
      fields,
    });
  }

  return windows;
}

function pickReferenceToken(current: TokenLike, previous: TokenLike, next: TokenLike): TokenLike {
  if (next && next.phoneme !== "SIL") return next;
  if (previous && previous.phoneme !== "SIL") return previous;
  return current;
}

function resolveFollowingClass(current: TokenLike, previous: TokenLike, next: TokenLike): string {
  const reference = pickReferenceToken(current, previous, next);
  if (!reference || typeof reference !== "object") {
    return "back_unrounded_vowel";
  }
  const referenceType = typeof reference.type === "string" ? reference.type : "";
  const referencePhoneme = typeof reference.phoneme === "string" ? reference.phoneme : "";
  if (OBSTRUENT_TYPES.has(referenceType)) {
    return "obstruent";
  }
  if (
    referenceType === "vowel" &&
    Object.prototype.hasOwnProperty.call(reference, "front") &&
    reference.front === true
  ) {
    return "front_vowel";
  }
  if (BACK_ROUNDED_REF_PHONEMES.has(referencePhoneme)) {
    return "back_rounded_vowel";
  }
  return "back_unrounded_vowel";
}

export function selectDectalkObstruentProfile(
  rawProfiles: unknown,
  current: TokenLike,
  previous: TokenLike,
  next: TokenLike
): Record<string, number> {
  if (!isPlainObject(rawProfiles)) return {};
  const className = resolveFollowingClass(current, previous, next);
  const selected = rawProfiles[className];
  if (!isPlainObject(selected)) return {};

  const profile: Record<string, number> = {};
  for (const [fieldName, value] of Object.entries(selected)) {
    const numericValue = toFiniteNumber(value);
    if (numericValue == null || !Number.isFinite(numericValue)) continue;
    profile[fieldName] = numericValue;
  }
  return profile;
}
