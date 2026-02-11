import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend finalize stages", () => {
  it("computes sync times from active base durations and resolves point times", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      rules: {
        f0_targets: {
          select: { stream: "phone", where: "current.type = 'vowel'" },
          insert_point: {
            stream: "f0",
            at: "$midpoint(current)",
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
        stream: "phone",
        type: "vowel",
        sync_left: 0,
        sync_right: 1,
        duration: 100,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        type: "stop",
        sync_left: 1,
        sync_right: 2,
        duration: 50,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const point = out.find((t) => t.stream === "f0");
    expect(point).toBeTruthy();
    expect(point?.time).toBe(50);
  });

  it("keeps point resolution deterministic when compute_times and resolve_points are in separate phases", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      rules: {
        first: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          insert_point: {
            stream: "f0",
            at: "$at_ratio(current, 0.25)",
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
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, duration: 120, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 2, duration: 80, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const point = out.find((t) => t.stream === "f0");
    expect(point).toBeTruthy();
    expect(point?.time).toBe(30);
  });

  it("interpolates interior base36 marks during compute_times", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      rules: {
        target: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          insert_point: {
            stream: "f0",
            at: "$at_sync('000000000006')",
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
        stream: "phone",
        sync_left: "000000000000",
        sync_right: "00000000000c",
        duration: 120,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const point = out.find((t) => t.stream === "f0");
    expect(point).toBeTruthy();
    expect(point?.time).toBe(60);
  });

  it("throws E_TIME_NO_BASE_SUPPORT when referenced marks cannot be timed", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      rules: {
        target: {
          select: { stream: "phone", where: "true" },
          insert_point: {
            stream: "f0",
            at: "$at_sync('not-orderable-mark')",
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
      { id: "p1", stream: "phone", sync_left: "a", sync_right: "b", duration: 100, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrowError(/E_TIME_NO_BASE_SUPPORT/);
  });
});
