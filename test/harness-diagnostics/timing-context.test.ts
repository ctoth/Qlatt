import { describe, expect, it } from "vitest";
import { resolveTimingSnapshot } from "../../src/harness-diagnostics/timing-context";
import type { TrackEvent } from "../../src/harness-diagnostics/types";

function makeTrack(times: number[]): TrackEvent[] {
  return times.map((t, i) => ({
    time: t,
    phoneme: `P${i}`,
    params: { F0: 100 + i * 10 },
  }));
}

describe("resolveTimingSnapshot", () => {
  const guardMs = 5;

  it("basic resolution — relTime 0.5 in [0, 0.3, 0.8] resolves to event at 0.3", () => {
    const track = makeTrack([0, 0.3, 0.8]);
    const runStart = 10;
    const now = runStart + 0.5;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(0.5);
    expect(snap.event).toEqual(track[1]);
    expect(snap.eventIndex).toBe(1);
    expect(snap.inWindow).toBe(true);
    expect(snap.inGuard).toBe(false);
    expect(snap.trackEnd).toBeCloseTo(0.8);
  });

  it("before first event — relTime -0.05 is within -0.1 tolerance", () => {
    const track = makeTrack([0, 0.3, 0.8]);
    const runStart = 10;
    const now = runStart - 0.05;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(-0.05);
    expect(snap.event).toBeNull();
    expect(snap.inWindow).toBe(true);
  });

  it("after last event within window — relTime = trackEnd + 0.3", () => {
    const track = makeTrack([0, 0.3, 0.8]);
    const runStart = 10;
    const now = runStart + 0.8 + 0.3;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(1.1);
    expect(snap.inWindow).toBe(true);
    expect(snap.event).toEqual(track[2]);
    expect(snap.eventIndex).toBe(2);
  });

  it("after window — relTime = trackEnd + 0.6", () => {
    const track = makeTrack([0, 0.3, 0.8]);
    const runStart = 10;
    const now = runStart + 0.8 + 0.6;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(1.4);
    expect(snap.inWindow).toBe(false);
  });

  it("guard zone — relTime within guardMs of boundary", () => {
    const track = makeTrack([0, 0.3, 0.8]);
    const runStart = 10;
    // 3ms after the 0.3 boundary, guard is 5ms
    const now = runStart + 0.303;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(0.303);
    expect(snap.inGuard).toBe(true);
  });

  it("not in guard zone — relTime well within an event", () => {
    const track = makeTrack([0, 0.3, 0.8]);
    const runStart = 10;
    // 150ms into the 0.3-0.8 segment, well away from boundaries
    const now = runStart + 0.45;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(0.45);
    expect(snap.inGuard).toBe(false);
  });

  it("empty track — returns sensible defaults", () => {
    const snap = resolveTimingSnapshot(10.5, 10, [], guardMs);

    expect(snap.relTime).toBeCloseTo(0.5);
    expect(snap.event).toBeNull();
    expect(snap.eventIndex).toBe(-1);
    expect(snap.trackEnd).toBe(0);
    expect(snap.inWindow).toBe(false);
  });

  it("single event track — event at 0, relTime=0.1", () => {
    const track = makeTrack([0]);
    const runStart = 10;
    const now = runStart + 0.1;
    const snap = resolveTimingSnapshot(now, runStart, track, guardMs);

    expect(snap.relTime).toBeCloseTo(0.1);
    expect(snap.event).toEqual(track[0]);
    expect(snap.eventIndex).toBe(0);
    expect(snap.inWindow).toBe(true);
  });
});
