import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

describe("declarative frontend finalize stages", () => {
  it("computes sync times from active base durations and resolves point times", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
        f0: { type: "point" },
      },
      rules: {
        f0_targets: {
          select: { relation: "phone", where: "current.type == 'vowel'" },
          insert_point: {
            relation: "f0",
            at: "midpoint(current)",
            value: "100",
            tag: "f0",
          },
        },
      },
      phases: [
        { name: "prosody", rules: ["f0_targets"] },
        { name: "finalize", after: ["prosody"], rules: [], compute_times: true, resolve_points: ["f0"] },
      ],
    };

    const input = [
      {
        id: "p1",
        relation: "phone",
        type: "vowel",
        sync_left: s0,
        sync_right: s1,
        duration: 100,
        status: 1,
      },
      {
        id: "p2",
        relation: "phone",
        type: "stop",
        sync_left: s1,
        sync_right: s2,
        duration: 50,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const point = out.find((t) => t.relation === "f0");
    expect(point).toBeTruthy();
    expect(point?.time).toBe(50);
  });

  it("keeps point resolution deterministic when compute_times and resolve_points are in separate phases", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
        f0: { type: "point" },
      },
      rules: {
        first: {
          select: { relation: "phone", where: "current.id == 'p1'" },
          insert_point: {
            relation: "f0",
            at: "at_ratio(current, 0.25)",
            value: "110",
            tag: "f0",
          },
        },
      },
      phases: [
        { name: "structure", rules: ["first"] },
        { name: "timing", after: ["structure"], rules: [], compute_times: true },
        { name: "points", after: ["timing"], rules: [], resolve_points: ["f0"] },
      ],
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: s0, sync_right: s1, duration: 120, status: 1 },
      { id: "p2", relation: "phone", sync_left: s1, sync_right: s2, duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const point = out.find((t) => t.relation === "f0");
    expect(point).toBeTruthy();
    expect(point?.time).toBe(30);
  });

  it("interpolates interior base36 marks during compute_times", () => {
    const s0 = startOrder();
    const s1 = finiteOrder("00000000000c");
    const s2 = endOrder();

    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
        f0: { type: "point" },
      },
      rules: {
        target: {
          select: { relation: "phone", where: "current.id == 'p1'" },
          insert_point: {
            relation: "f0",
            at: {
              anchor_left: finiteOrder("000000000006"),
              anchor_right: finiteOrder("000000000006"),
              ratio: 0,
            },
            value: "120",
            tag: "f0",
          },
        },
      },
      phases: [
        { name: "prosody", rules: ["target"] },
        { name: "finalize", after: ["prosody"], rules: [], compute_times: true, resolve_points: ["f0"] },
      ],
    };

    const input = [
      {
        id: "p1",
        relation: "phone",
        sync_left: s0,
        sync_right: s1,
        duration: 120,
        status: 1,
      },
      {
        id: "p2",
        relation: "phone",
        sync_left: s1,
        sync_right: s2,
        duration: 120,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const point = out.find((t) => t.relation === "f0");
    expect(point).toBeTruthy();
    expect(point?.time).toBe(60);
  });

  it("throws E_TIME_NO_BASE_SUPPORT when referenced marks cannot be timed", () => {
    const s0 = startOrder();
    const s1 = endOrder();

    const spec = {
      relations: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
        f0: { type: "point" },
      },
      rules: {
        target: {
          select: { relation: "phone", where: "true" },
          insert_point: {
            relation: "f0",
            at: {
              anchor_left: { kind: "FINITE", rank: "not-orderable-mark" },
              anchor_right: { kind: "FINITE", rank: "not-orderable-mark" },
              ratio: 0,
            },
            value: "100",
            tag: "f0",
          },
        },
      },
      phases: [
        { name: "prosody", rules: ["target"] },
        { name: "finalize", after: ["prosody"], rules: [], compute_times: true, resolve_points: ["f0"] },
      ],
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: s0, sync_right: s1, duration: 100, status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_TIME_NO_BASE_SUPPORT/);
  });
});
