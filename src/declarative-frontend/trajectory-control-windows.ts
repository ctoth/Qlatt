import { isPlainObject } from "../yaml-loader";

type TrajectoryPoint = { value: number; time: number | null };
type TrajectorySegment = { startMs: number; endMs: number; value: number };
type TrajectoryControlField = { op: "set"; value: number };

export type TrajectoryControlWindow = {
  start_ms: number;
  end_ms: number;
  fields: Record<string, TrajectoryControlField>;
};

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseTrajectoryPoints(raw: unknown): TrajectoryPoint[] {
  if (!Array.isArray(raw)) return [];
  const points: TrajectoryPoint[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) continue;
    const pointValue = toFiniteNumber(item.value);
    if (pointValue == null) continue;
    const pointTime = item.time == null ? null : (toFiniteNumber(item.time) ?? null);
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

function buildTrajectorySegments(
  points: readonly TrajectoryPoint[],
  durationMs: number,
  scale: number,
): TrajectorySegment[] {
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
    const segmentValue = index === 0 ? point.value : (previousPointValue + point.value) / 2;
    if (boundaryMs > previousBoundaryMs) {
      segments.push({ startMs: previousBoundaryMs, endMs: boundaryMs, value: segmentValue });
    }
    previousBoundaryMs = boundaryMs;
    previousPointValue = point.value;
    lastTimedPointValue = point.value;
    sawTimedPoint = true;
  }
  const finalValue = points[points.length - 1]?.value ?? previousPointValue;
  const tailValue = sawTimedPoint ? (lastTimedPointValue + finalValue) / 2 : finalValue;
  if (durationMs > previousBoundaryMs) {
    segments.push({ startMs: previousBoundaryMs, endMs: durationMs, value: tailValue });
  }
  return segments;
}

function fieldsEqual(
  left: Readonly<Record<string, TrajectoryControlField>>,
  right: Readonly<Record<string, TrajectoryControlField>>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        key in right && left[key].op === right[key].op && left[key].value === right[key].value,
    )
  );
}

function roundBoundary(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Project a frontend-neutral field trajectory into non-overlapping timed
 * control windows. Source trajectories are cited by the declarative rule that
 * invokes this pure projection (for DECtalk: ph_drwt0.c trajectory tables).
 */
export function trajectoryControlWindows(
  rawTrajectory: unknown,
  rawDurationMs: unknown,
): TrajectoryControlWindow[] {
  if (!isPlainObject(rawTrajectory)) return [];
  const durationMs = toFiniteNumber(rawDurationMs);
  if (durationMs == null || durationMs <= 0) return [];
  const parsed = Object.entries(rawTrajectory)
    .map(([fieldName, value]) => [fieldName, parseTrajectoryPoints(value)] as const)
    .filter(([, points]) => points.length > 0);
  if (parsed.length === 0) return [];
  const maxRawTime = parsed.reduce(
    (max, [, points]) =>
      points.reduce(
        (candidate, point) => (point.time == null ? candidate : Math.max(candidate, point.time)),
        max,
      ),
    0,
  );
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
  const orderedBoundaries = [...boundaries].map(roundBoundary).sort((left, right) => left - right);
  const windows: TrajectoryControlWindow[] = [];
  for (let index = 0; index + 1 < orderedBoundaries.length; index += 1) {
    const startMs = orderedBoundaries[index];
    const endMs = orderedBoundaries[index + 1];
    if (endMs <= startMs) continue;
    const midpointMs = startMs + (endMs - startMs) / 2;
    const fields: Record<string, TrajectoryControlField> = {};
    for (const [fieldName, segments] of segmentsByField) {
      const active = segments.find(
        (segment) => midpointMs >= segment.startMs && midpointMs <= segment.endMs,
      );
      if (active) fields[fieldName] = { op: "set", value: active.value };
    }
    if (Object.keys(fields).length === 0) continue;
    const previous = windows[windows.length - 1];
    if (previous && previous.end_ms === startMs && fieldsEqual(previous.fields, fields)) {
      previous.end_ms = endMs;
    } else {
      windows.push({ start_ms: startMs, end_ms: endMs, fields });
    }
  }
  return windows;
}
