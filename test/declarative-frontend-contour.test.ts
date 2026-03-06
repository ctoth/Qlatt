import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend contour primitive", () => {
  it("computes phrase-local progress from token midpoint time", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { x: { unit: "ratio" } } },
      },
      rules: {
        contour_progress: {
          select: { stream: "phone", where: "current.phoneme != 'SIL'" },
          contour: {
            domain: "phrase",
            reset_break_index: 4,
            apply: [{ field: "x", op: "set", value: "contour.progress" }],
          },
        },
      },
      phases: [{ name: "duration", rules: ["contour_progress"], resolve_scalars: ["x"] }],
    };

    const input = [
      { id: "a", stream: "phone", phoneme: "AA", duration: 100, x: 0, status: 1 },
      { id: "b", stream: "phone", phoneme: "L", duration: 300, x: 0, status: 1 },
      {
        id: "s1",
        stream: "phone",
        phoneme: "SIL",
        duration: 50,
        breakIndex: 4,
        x: 0,
        status: 1,
      },
      { id: "c", stream: "phone", phoneme: "IY", duration: 200, x: 0, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].x).toBeCloseTo(0.125, 6);
    expect(out[1].x).toBeCloseTo(0.625, 6);
    expect(out[3].x).toBeCloseTo(0.5, 6);
  });

  it("resets phrase contour at configurable break index", () => {
    const mkSpec = (resetBreakIndex: number) => ({
      streams: {
        phone: { type: "base", scalars: { x: { unit: "ratio" } } },
      },
      rules: {
        contour_progress: {
          select: { stream: "phone", where: "current.phoneme != 'SIL'" },
          contour: {
            domain: "phrase",
            reset_break_index: resetBreakIndex,
            apply: [{ field: "x", op: "set", value: "contour.progress" }],
          },
        },
      },
      phases: [{ name: "duration", rules: ["contour_progress"], resolve_scalars: ["x"] }],
    });

    const input = [
      { id: "a", stream: "phone", phoneme: "AA", duration: 100, x: 0, status: 1 },
      {
        id: "s1",
        stream: "phone",
        phoneme: "SIL",
        duration: 50,
        breakIndex: 3,
        x: 0,
        status: 1,
      },
      { id: "b", stream: "phone", phoneme: "IY", duration: 100, x: 0, status: 1 },
    ];

    const noResetAtBi3 = runRuleEngine(input, mkSpec(4)).sequence;
    const resetAtBi3 = runRuleEngine(input, mkSpec(3)).sequence;

    expect(noResetAtBi3[0].x).toBeCloseTo(0.25, 6);
    expect(noResetAtBi3[2].x).toBeCloseTo(0.75, 6);
    expect(resetAtBi3[0].x).toBeCloseTo(0.5, 6);
    expect(resetAtBi3[2].x).toBeCloseTo(0.5, 6);
  });

  it("exposes contour variables to define expressions", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { x: { unit: "ratio" } } },
      },
      rules: {
        contour_define: {
          select: { stream: "phone", where: "current.phoneme != 'SIL'" },
          contour: {
            domain: "phrase",
            reset_break_index: 4,
            apply: [{ field: "x", op: "set", value: "position_ratio" }],
          },
          define: {
            position_ratio:
              "contour.phrase_duration_sec > 0 ? contour.elapsed_sec / contour.phrase_duration_sec : 0",
          },
        },
      },
      phases: [{ name: "duration", rules: ["contour_define"], resolve_scalars: ["x"] }],
    };

    const input = [
      { id: "a", stream: "phone", phoneme: "AA", duration: 100, x: 0, status: 1 },
      { id: "b", stream: "phone", phoneme: "IY", duration: 100, x: 0, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].x).toBeCloseTo(0.25, 6);
    expect(out[1].x).toBeCloseTo(0.75, 6);
  });
});
