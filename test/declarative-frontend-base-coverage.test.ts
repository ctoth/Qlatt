import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend base coverage invariants", () => {
  const spec = {
    streams: {
      phone: { type: "base" },
    },
    rules: {},
    phases: [{ name: "structural", rules: [] }],
  };

  it("accepts contiguous active base coverage", () => {
    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 2, status: 1 },
      { id: "p3", stream: "phone", sync_left: 2, sync_right: 3, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).not.toThrow();
  });

  it("rejects overlapping active base tokens", () => {
    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 2, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 3, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_OVERLAP");
  });

  it("rejects gapped active base coverage", () => {
    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, status: 1 },
      { id: "p2", stream: "phone", sync_left: 2, sync_right: 3, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });

  it("accepts anchored START/END object-order coverage", () => {
    const start = { kind: "START" };
    const mid = { kind: "FINITE", rank: "000000000001" };
    const end = { kind: "END" };
    const input = [
      { id: "p1", stream: "phone", sync_left: start, sync_right: mid, status: 1 },
      { id: "p2", stream: "phone", sync_left: mid, sync_right: end, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).not.toThrow();
  });

  it("rejects object-order coverage that does not start at START", () => {
    const left = { kind: "FINITE", rank: "000000000001" };
    const right = { kind: "END" };
    const input = [
      { id: "p1", stream: "phone", sync_left: left, sync_right: right, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });

  it("rejects object-order coverage that does not end at END", () => {
    const start = { kind: "START" };
    const right = { kind: "FINITE", rank: "00000000000z" };
    const input = [
      { id: "p1", stream: "phone", sync_left: start, sync_right: right, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_NOT_CONTIGUOUS");
  });
});
