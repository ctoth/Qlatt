/**
 * Lowering looks a time up in the F0 point list for every frame, and puts
 * every frame into the track by its time. Those lookups search a list in time
 * order where they used to scan it, which made lowering quadratic in the
 * length of the text. Each search is pinned here to the scan it replaced, on
 * lists as long as a half-minute text's.
 */

import { describe, expect, it } from "vitest";
import {
  firstFrameAfter,
  pointsBetween,
  resolveF0AtTime,
} from "../src/declarative-frontend/hrg/lowering";

type Point = { decisionId: string; timeMs: number; valueHz: number };

/** A fixed pseudo-random sequence (mulberry32). */
function sequence(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** The scan `resolveF0AtTime` was before it searched. */
function scanF0(points: readonly Point[], timeMs: number, sampling: "linear" | "step") {
  if (points.length === 0) return null;
  for (let index = 0; index < points.length - 1; index += 1) {
    const left = points[index];
    const right = points[index + 1];
    if (!left || !right || timeMs < left.timeMs || timeMs > right.timeMs) continue;
    const spanMs = right.timeMs - left.timeMs;
    if (Math.abs(spanMs) < 1e-6) return left;
    if (sampling === "step") {
      return Math.abs(timeMs - right.timeMs) < 1e-6 ? { ...right, timeMs } : { ...left, timeMs };
    }
    const fraction = (timeMs - left.timeMs) / spanMs;
    return {
      decisionId: fraction < 1 ? left.decisionId : right.decisionId,
      timeMs,
      valueHz: left.valueHz + (right.valueHz - left.valueHz) * fraction,
    };
  }
  const last = points[points.length - 1];
  return last ? { ...last, timeMs } : null;
}

/** A frame every 6.44 ms, some of them at the same time as the one before. */
function orderedPoints(count: number, random: () => number): Point[] {
  const points: Point[] = [];
  let timeMs = 0;
  for (let index = 0; index < count; index += 1) {
    if (index > 0 && random() > 0.1) timeMs += 6.439909297052154;
    points.push({ decisionId: `d${index.toString()}`, timeMs, valueHz: 80 + random() * 100 });
  }
  return points;
}

/** Times on the points, between them, at the ends and outside them. */
function probes(points: readonly Point[], random: () => number): number[] {
  const first = points[0]?.timeMs ?? 0;
  const last = points[points.length - 1]?.timeMs ?? 0;
  const times = [first - 1, first, last, last + 1, Number.NaN];
  for (let index = 0; index < 400 && points.length > 0; index += 1) {
    const point = points[Math.floor(random() * points.length)] as Point;
    times.push(point.timeMs, point.timeMs + 1e-7, point.timeMs - 1e-7, point.timeMs + random() * 7);
  }
  return times;
}

describe("F0 at a time", () => {
  it.each(["linear", "step"] as const)("%s: the search gives what the scan gave", (sampling) => {
    const random = sequence(sampling === "linear" ? 1 : 2);
    for (const count of [0, 1, 2, 3, 5200]) {
      const points = orderedPoints(count, random);
      for (const timeMs of probes(points, random)) {
        expect(resolveF0AtTime(points, timeMs, sampling)).toEqual(scanF0(points, timeMs, sampling));
      }
    }
  });

  it("a list that is not in time order is still scanned", () => {
    const random = sequence(3);
    const points = orderedPoints(300, random);
    [points[40], points[200]] = [points[200] as Point, points[40] as Point];
    for (const timeMs of probes(points, random)) {
      expect(resolveF0AtTime(points, timeMs, "step")).toEqual(scanF0(points, timeMs, "step"));
      expect(resolveF0AtTime(points, timeMs, "linear")).toEqual(scanF0(points, timeMs, "linear"));
    }
  });
});

describe("the points inside a Segment", () => {
  it("are the ones a scan of the whole list finds, in its order", () => {
    const random = sequence(4);
    const ordered = orderedPoints(5200, random);
    const shuffled = orderedPoints(300, random);
    [shuffled[10], shuffled[250]] = [shuffled[250] as Point, shuffled[10] as Point];
    for (const points of [[], ordered.slice(0, 1), ordered, shuffled]) {
      const times = probes(points, random);
      for (let index = 0; index + 1 < times.length; index += 1) {
        const after = times[index] as number;
        const before = after + (times[index + 1] as number) * 0.01;
        expect(pointsBetween(points, after, before)).toEqual(
          points.filter((point) => point.timeMs > after && point.timeMs < before),
        );
      }
    }
  });
});

describe("where a frame goes into the track", () => {
  it("is before the first later frame, as a scan finds it", () => {
    const random = sequence(5);
    for (const count of [0, 1, 2, 6000]) {
      const frames = orderedPoints(count, random).map((point) => ({ time: point.timeMs / 1000 }));
      const first = frames[0]?.time ?? 0;
      const last = frames[frames.length - 1]?.time ?? 0;
      const times = [first - 1, first, last, last + 1];
      for (let index = 0; index < 400 && frames.length > 0; index += 1) {
        const frame = frames[Math.floor(random() * frames.length)] as { time: number };
        times.push(frame.time, frame.time + 1e-9, frame.time - 1e-9);
      }
      for (const time of times) {
        expect(firstFrameAfter(frames, time)).toBe(
          frames.findIndex((existing) => existing.time > time),
        );
      }
    }
  });
});
