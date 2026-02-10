import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine.js";

describe("declarative frontend point actions and helpers", () => {
  it("inserts point tokens with midpoint anchors and computed values", () => {
    const spec = {
      parameters: { base_f0: 100 },
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
            value: "params.base_f0 + $index(current)",
            tag: "f0",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["f0_targets"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        type: "vowel",
        sync_left: "s0",
        sync_right: "s1",
        duration: 100,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        type: "stop",
        sync_left: "s1",
        sync_right: "s2",
        duration: 70,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        type: "vowel",
        sync_left: "s2",
        sync_right: "s3",
        duration: 120,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");
    expect(points).toHaveLength(2);
    expect(points[0].anchor_left).toBe("s0");
    expect(points[0].anchor_right).toBe("s1");
    expect(points[0].ratio).toBe(0.5);
    expect(points[0].value).toBe(100);
    expect(points[1].value).toBe(102);
  });

  it("supports $at_ratio and $at_sync anchor helpers", () => {
    const spec = {
      streams: { phone: { type: "base" }, f0: { type: "point" } },
      rules: {
        ratio_point: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          insert_point: {
            stream: "f0",
            at: "$at_ratio(current, 0.25)",
            value: "120",
            tag: "f0",
          },
        },
        sync_point: {
          select: { stream: "phone", where: "current.id = 'p2'" },
          insert_point: {
            stream: "f0",
            at: "$at_sync(current.sync_right)",
            value: "130",
            tag: "f0",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["ratio_point", "sync_point"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: "s0", sync_right: "s1", status: 1 },
      { id: "p2", stream: "phone", sync_left: "s1", sync_right: "s2", status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");
    expect(points).toHaveLength(2);
    expect(points[0].ratio).toBe(0.25);
    expect(points[1].anchor_left).toBe("s2");
    expect(points[1].anchor_right).toBe("s2");
    expect(points[1].ratio).toBe(0);
  });

  it("supports point navigation helpers and spanning helper", () => {
    const spec = {
      streams: {
        word: { type: "span" },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      rules: {
        insert_a: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          insert_point: {
            stream: "f0",
            at: "$midpoint(current)",
            value: "100",
            tag: "f0",
          },
        },
        insert_b: {
          select: { stream: "phone", where: "current.id = 'p2'" },
          insert_point: {
            stream: "f0",
            at: "$midpoint(current)",
            value: "$prev_point('f0').value + 10",
            tag: "f0",
          },
        },
        mark_spanned: {
          select: {
            stream: "phone",
            where: "$count($spanning(current, 'word')) = 1 and $next_point('f0').value = 100",
          },
          apply: [{ field: "duration", op: "add", value: "5", tag: "span" }],
        },
      },
      phases: [{ name: "prosody", rules: ["insert_a", "insert_b", "mark_spanned"] }],
    };

    const input = [
      { id: "w1", stream: "word", sync_left: 0, sync_right: 2, status: 1 },
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, duration: 100, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 2, duration: 120, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    expect(points).toHaveLength(2);
    expect(points[1].value).toBe(110);
    expect(p1?.duration).toBe(105);
    expect(p2?.duration).toBe(125);
  });

  it("throws E_INVALID_RATIO when point anchors use an out-of-range ratio", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
        f0: { type: "point" },
      },
      rules: {
        invalid_ratio: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          insert_point: {
            stream: "f0",
            at: { anchor_left: "s0", anchor_right: "s1", ratio: 1.2 },
            value: "100",
            tag: "f0",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["invalid_ratio"] }],
    };

    const input = [{ id: "p1", stream: "phone", sync_left: "s0", sync_right: "s1", status: 1 }];
    expect(() => runRuleEngine(input, spec)).toThrowError(/E_INVALID_RATIO/);
  });
});
