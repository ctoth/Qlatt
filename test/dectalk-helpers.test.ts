import { describe, expect, it } from "vitest";
import {
  buildTrajectoryControlWindows,
  selectDectalkObstruentProfile,
} from "../src/declarative-frontend/dectalk-helpers";

describe("DECtalk declarative helpers", () => {
  it("builds scaled piecewise control windows from trajectory metadata", () => {
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

    expect(windows).toHaveLength(3);
    expect(windows[0]).toMatchObject({
      start_ms: 0,
      end_ms: 40,
      fields: {
        F1: { op: "set", value: 500 },
        F2: { op: "set", value: 1000 },
      },
    });
    expect(windows[1]).toMatchObject({
      start_ms: 40,
      end_ms: 100,
      fields: {
        F1: { op: "set", value: 400 },
        F2: { op: "set", value: 1000 },
      },
    });
    expect(windows[2]).toMatchObject({
      start_ms: 100,
      end_ms: 200,
      fields: {
        F1: { op: "set", value: 400 },
        F2: { op: "set", value: 1250 },
      },
    });
  });

  it("selects stop-release obstruent profiles by DECtalk following class", () => {
    const profiles = {
      front_vowel: { A2: 0, A3: 50, A5: 36 },
      back_unrounded_vowel: { A2: 50, A3: 0, A5: 35 },
      back_rounded_vowel: { A2: 50, A3: 0, A5: 35 },
      obstruent: { A2: 50, A3: 0, A5: 38 },
    };

    expect(
      selectDectalkObstruentProfile(
        profiles,
        { phoneme: "K", type: "stop_closure" },
        { phoneme: "AE1", type: "vowel", front: true },
        { phoneme: "IY1", type: "vowel", front: true }
      )
    ).toEqual({ A2: 0, A3: 50, A5: 36 });

    expect(
      selectDectalkObstruentProfile(
        profiles,
        { phoneme: "K", type: "stop_closure" },
        { phoneme: "AA1", type: "vowel" },
        { phoneme: "S", type: "fricative" }
      )
    ).toEqual({ A2: 50, A3: 0, A5: 38 });

    expect(
      selectDectalkObstruentProfile(
        profiles,
        { phoneme: "K", type: "stop_closure" },
        { phoneme: "OW1", type: "vowel", back: true },
        { phoneme: "SIL", type: "silence" }
      )
    ).toEqual({ A2: 50, A3: 0, A5: 35 });
  });
});
