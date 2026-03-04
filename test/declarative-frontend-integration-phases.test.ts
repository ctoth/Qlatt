import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";
import { qlattInventoryResolver } from "./utils/qlatt-english-inventory";

describe("declarative frontend integration phases", () => {
  it("executes structural->duration->prosody->finalize with resolved point timing trace", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "ph0",
        stream: "phone",
        phoneme: "P_CL",
        type: "stop_closure",
        stress: 0,
        duration: 60,
        inherentDuration: 60,
        params: { AV: 0, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
      {
        id: "ph1",
        stream: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        inherentDuration: 100,
        params: { AV: 60, AVS: 0, F0_Factor: 1.0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
      {
        id: "ph2",
        stream: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        inherentDuration: 100,
        punctuationSymbol: "?",
        params: { AV: 0, AVS: 0, F0_Factor: 1.0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
      },
    ];

    const result = runDeclarativeFrontend(sequence, {
      includeTrace: true,
      phases: ["structural", "duration", "prosody", "finalize"],
      inventoryResolver: qlattInventoryResolver,
      parameters: {
        policy: {
          f0: {
            base_hz: 110,
            fall_rate_hz: 20,
            question_rise_hz: 30,
          },
        },
      },
    });

    const phaseStarts = result.trace
      .filter((event) => event.type === "phase_start")
      .map((event) => event.phase);
    expect(phaseStarts).toEqual(["structural", "duration", "prosody", "finalize"]);

    const finalized = result.trace.filter((event) => event.type === "times_resolved");
    const pointResolved = result.trace.filter((event) => event.type === "points_resolved");
    expect(finalized.length).toBe(1);
    expect(finalized[0].phase).toBe("finalize");
    expect(pointResolved.length).toBe(1);
    expect(pointResolved[0].phase).toBe("finalize");

    const points = result.sequence.filter((token) => token.stream === "f0");
    expect(points.length).toBeGreaterThan(0);
    expect(points.every((point) => Number.isFinite(point.time))).toBe(true);
  });
});
