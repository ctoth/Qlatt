import { describe, expect, it } from "vitest";
import { buildTrajectoryControlWindows } from "../src/control-score";

describe("trajectory control-window lowering", () => {
  it("builds frontend-neutral scaled piecewise control windows", () => {
    const windows = buildTrajectoryControlWindows(
      {
        F1: [
          { value: 500, time: 20 },
          { value: 300, time: 100 },
          { value: 200, time: null },
        ],
        F2: [
          { value: 1000, time: 50 },
          { value: 1500, time: null },
        ],
      },
      200
    );

    expect(windows).toEqual([
      {
        start_ms: 0,
        end_ms: 40,
        fields: {
          F1: { op: "set", value: 500 },
          F2: { op: "set", value: 1000 },
        },
      },
      {
        start_ms: 40,
        end_ms: 100,
        fields: {
          F1: { op: "set", value: 400 },
          F2: { op: "set", value: 1000 },
        },
      },
      {
        start_ms: 100,
        end_ms: 200,
        fields: {
          F1: { op: "set", value: 400 },
          F2: { op: "set", value: 1250 },
        },
      },
    ]);
  });
});
