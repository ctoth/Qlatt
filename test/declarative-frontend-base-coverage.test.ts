import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

describe("declarative frontend base coverage invariants", () => {
  const spec = {
    streams: {
      phone: { type: "base" },
    },
    rules: {},
    phases: [{ name: "structural", rules: [] }],
  };

  it("accepts contiguous active base coverage", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
      { id: "p3", stream: "phone", sync_left: s2, sync_right: s3, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).not.toThrow();
  });

  it("accepts empty utterance base stream coverage", () => {
    expect(() => runRuleEngine([], spec)).not.toThrow();
  });

  it("rejects overlapping active base tokens", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s2, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s3, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_OVERLAP");
  });

  it("rejects gapped active base coverage", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s2, sync_right: s3, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });

  it("rejects non-empty stream with no ACTIVE base coverage", () => {
    const s0 = startOrder();
    const s1 = endOrder();

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 2 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });

  it("accepts anchored START/END object-order coverage", () => {
    const start = startOrder();
    const mid = finiteOrder(1);
    const end = endOrder();
    const input = [
      { id: "p1", stream: "phone", sync_left: start, sync_right: mid, status: 1 },
      { id: "p2", stream: "phone", sync_left: mid, sync_right: end, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).not.toThrow();
  });

  it("rejects object-order coverage that does not start at START", () => {
    const left = finiteOrder(1);
    const right = endOrder();
    const input = [
      { id: "p1", stream: "phone", sync_left: left, sync_right: right, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });

  it("rejects object-order coverage that does not end at END", () => {
    const start = startOrder();
    const right = finiteOrder("00000000000z");
    const input = [
      { id: "p1", stream: "phone", sync_left: start, sync_right: right, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });
});
