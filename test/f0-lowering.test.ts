/**
 * Lowering's F0 path, on made-up numbers: where a command lands on a
 * clause's controller clock, which clause it belongs to, and what the range
 * and floor layers do to the rendered contour. No frontend is involved.
 */

import { describe, expect, it } from "vitest";
import {
  f0CommandClause,
  f0CommandControllerTime,
  f0CommandsInTimeOrder,
  type LayeredF0ModelConfig,
  renderLayeredF0,
} from "../src/declarative-frontend/hrg/lowering";

const FRAME = 0.01;

describe("f0CommandsInTimeOrder", () => {
  it("orders clause starts by time, not by the order they were issued in", () => {
    // Commands 2 and 5 open clauses and come from one rule; command 7 opens
    // a clause between them and comes from a later rule.
    const times = [0, 0, 0, 0.3, 0.5, 2.0, 2.1, 1.0];
    expect(f0CommandsInTimeOrder([2, 5, 7], times)).toEqual([2, 7, 5]);
  });

  it("keeps the issue order of commands at the same time", () => {
    expect(f0CommandsInTimeOrder([4, 1, 3], [0, 1, 0, 1, 1])).toEqual([1, 3, 4]);
  });
});

describe("f0CommandControllerTime", () => {
  // An opening pause of 4 frames, then allophones of 10 and 6 frames. The
  // pause and the first allophone begin at the same acoustic time (the pause
  // is not on the acoustic axis), so their anchor is the later controller
  // time, the allophone's.
  const anchors = [
    { acousticTime: 0, controllerTime: 4 * FRAME },
    { acousticTime: 0.1, controllerTime: 14 * FRAME },
    { acousticTime: 0.16, controllerTime: 20 * FRAME },
  ];

  it("keeps a command's distance from the allophone that starts at or after it", () => {
    // 3 frames before the second allophone.
    expect(f0CommandControllerTime(anchors, 0.07, FRAME)).toBeCloseTo(11 * FRAME, 9);
    // On the third allophone's start.
    expect(f0CommandControllerTime(anchors, 0.16, FRAME)).toBeCloseTo(20 * FRAME, 9);
  });

  it("places a command meant inside the opening pause in the pause", () => {
    // 2 frames before the first phone: 2 frames into the 4-frame pause.
    expect(f0CommandControllerTime(anchors, -0.02, FRAME)).toBeCloseTo(2 * FRAME, 9);
  });

  it("clamps a command meant before the clause's first frame to that frame", () => {
    // 8 frames before the first phone: 4 frames before the pause begins. It
    // goes to frame 0, not to the phone's frame 4.
    expect(f0CommandControllerTime(anchors, -0.08, FRAME)).toBe(0);
  });

  it("measures a command after the last anchor from that anchor", () => {
    expect(f0CommandControllerTime(anchors, 0.2, FRAME)).toBeCloseTo(24 * FRAME, 9);
  });

  it("has no time to give without anchors", () => {
    expect(f0CommandControllerTime([], 0.1, FRAME)).toBeUndefined();
  });
});

describe("f0CommandClause", () => {
  // Three clauses; the second starts at 1.0 s (its first phone at 1.04 s).
  const starts = [Number.NEGATIVE_INFINITY, 1.0, 2.5];

  it("is the last clause that has started by the command's anchor", () => {
    expect(f0CommandClause(starts, 0.3)).toBe(0);
    expect(f0CommandClause(starts, 1.04)).toBe(1);
    expect(f0CommandClause(starts, 2.5)).toBe(2);
    expect(f0CommandClause(starts, 9)).toBe(2);
  });

  it("goes by the anchor, so a command timed before its clause stays in it", () => {
    // Issued on the second clause's first phone (anchor 1.04 s) with an
    // offset of -8 frames: its own time, 0.96 s, is before that clause's
    // start, and by that time it would be the first clause's.
    const anchorTime = 1.04;
    const ownTime = anchorTime - 8 * FRAME;
    expect(f0CommandClause(starts, ownTime)).toBe(0);
    expect(f0CommandClause(starts, anchorTime)).toBe(1);
  });
});

describe("renderLayeredF0 range and floor layers", () => {
  // A level of 1000 held by a two-point profile; scaled as
  // floor + (level - 0) * range / 4096 with range 4096, so the output is the
  // floor plus the level. The coefficient renderer adds its fixed pseudojitter,
  // -1, -1, -2, -2 in the first four frames it emits (f0-filters,
  // coefficient_2pole_matches_dectalk_output_phase_jitter_and_integer_scale).
  const model: LayeredF0ModelConfig = {
    type: "layered_additive",
    frame_period_sec: FRAME,
    filter: { type: "lowpass_2pole_coefficient", default_alpha: 0.5 },
    layers: {
      level: { type: "profile" },
      range: { type: "range" },
      floor: { type: "floor" },
    },
    speaker_scale: {
      minimum_param: "floor",
      range_param: "range",
      pivot: 0,
      divisor: 4096,
      output_scale: 1,
    },
    output_clamp: { min_hz: -100000, max_hz: 100000 },
  };
  const speaker = { floor: 500, range: 4096 };
  const level = { layer: "level", time: 0, value: 0, profilePoints: [1000, 1000] };
  const firstFour = (commands: Parameters<typeof renderLayeredF0>[0]): number[] =>
    renderLayeredF0(commands, model, 0.05, speaker)
      .slice(0, 4)
      .map((point) => point.f0);

  it("scales from the speaker's floor and range when no command says otherwise", () => {
    expect(firstFour([level])).toEqual([1499, 1499, 1498, 1498]);
  });

  it("adds a range command's value to the range", () => {
    // Range 4096 + 4096: (1000 - 1) * 8192 >> 12 = 1998, then 1996.
    expect(firstFour([level, { layer: "range", time: 0, value: 4096 }])).toEqual([
      2498, 2498, 2496, 2496,
    ]);
  });

  it("replaces the floor with a floor command's value", () => {
    expect(firstFour([level, { layer: "floor", time: 0, value: -12 }])).toEqual([
      987, 987, 986, 986,
    ]);
  });
});
