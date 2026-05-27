import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

const loweringOutput = {
  lowering: {
    id: "test-track-lowering",
    timeline: {
      initial_silence_ms: { value: 0, citations: ["test"] },
      final_silence_ms: { value: 0, citations: ["test"] },
      duration_floors: {
        stop_release_ms: { value: 5, citations: ["test"] },
        default_ms: { value: 20, citations: ["test"] },
      },
      event_points: {
        include_segment_start: true,
        include_control_boundaries: true,
        include_f0_anchors: true,
        include_transition_steady_time: true,
      },
    },
    transitions: {
      default_transition_ms: { value: 30, citations: ["test"] },
      blend: {
        factor: { value: 0.35, citations: ["test"] },
        keys: ["F1"],
        smooth_types: ["vowel"],
      },
    },
    f0: {
      renderer: { type: "point_interpolation" },
      sag: {
        operator: "disabled",
        depth_hz: { value: 0, citations: ["test"] },
        min_span_ms: { value: 150, citations: ["test"] },
      },
      output_clamp: {
        min_hz: { value: 0, citations: ["test"] },
        max_hz: { value: 500, citations: ["test"] },
      },
    },
    overlays: {
      operation_order: ["voice_quality", "timed_controls", "f0"],
    },
  },
};

describe("declarative frontend point actions and helpers", () => {
  it("inserts point tokens with midpoint anchors and computed values", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const spec = {
      parameters: {
        policy: {
          f0: {
            base_hz: {
              value: 100,
              citations: ["test fixture"],
            },
          },
        },
      },
      streams: {
        phone: {
          type: "base",
          features: { type: ["vowel", "stop"] },
          scalars: { duration: { unit: "ms" } },
        },
        f0: { type: "point" },
      },
      rules: {
        f0_targets: {
          select: { stream: "phone", where: "current.type == 'vowel'" },
          insert_point: {
            stream: "f0",
            at: "midpoint(current)",
            value: "params.policy.f0.base_hz + current_index",
            tag: "f0",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["f0_targets"] }],
      output: loweringOutput,
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        type: "vowel",
        sync_left: s0,
        sync_right: s1,
        duration: 100,
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        type: "stop",
        sync_left: s1,
        sync_right: s2,
        duration: 70,
        status: 1,
      },
      {
        id: "p3",
        stream: "phone",
        type: "vowel",
        sync_left: s2,
        sync_right: s3,
        duration: 120,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");
    expect(points).toHaveLength(2);
    expect(points[0].anchor_left).toEqual(s0);
    expect(points[0].anchor_right).toEqual(s1);
    expect(points[0].ratio).toBe(0.5);
    expect(points[0].value).toBe(100);
    expect(points[1].value).toBe(102);
  });

  it("supports at_ratio and at_sync anchor helpers", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      parameters: {
        policy: {
          f0: {
            ratio_point_hz: 120,
            sync_point_hz: 130,
          },
        },
      },
      streams: { phone: { type: "base" }, f0: { type: "point" } },
      rules: {
        ratio_point: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          insert_point: {
            stream: "f0",
            at: "at_ratio(current, 0.25)",
            value: "params.policy.f0.ratio_point_hz",
            tag: "f0",
          },
        },
        sync_point: {
          select: { stream: "phone", where: "current.id == 'p2'" },
          insert_point: {
            stream: "f0",
            at: "at_sync(current.sync_right)",
            value: "params.policy.f0.sync_point_hz",
            tag: "f0",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["ratio_point", "sync_point"] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");
    expect(points).toHaveLength(2);
    expect(points[0].ratio).toBe(0.25);
    expect(points[1].anchor_left).toEqual(s2);
    expect(points[1].anchor_right).toEqual(s2);
    expect(points[1].ratio).toBe(0);
  });

  it("inserts multiple point tokens from one contour rule", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      parameters: {
        policy: {
          f0: {
            low_hz: 95,
            high_hz: 145,
          },
        },
      },
      streams: { phone: { type: "base" }, f0: { type: "point" } },
      rules: {
        rise_fall: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          insert_points: [
            {
              stream: "f0",
              at: "at_ratio(current, 0.25)",
              value: "params.policy.f0.high_hz",
              tag: "f0_peak",
            },
            {
              stream: "f0",
              at: "at_sync(current.sync_right)",
              value: "params.policy.f0.low_hz",
              tag: "f0_tail",
            },
          ],
        },
      },
      phases: [{ name: "prosody", rules: ["rise_fall"] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");

    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ ratio: 0.25, value: 145, tag: "f0_peak" });
    expect(points[1]).toMatchObject({ anchor_left: s1, anchor_right: s1, value: 95, tag: "f0_tail" });
  });

  it("can insert contour points by point phase across all selected tokens", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const spec = {
      parameters: {
        policy: {
          f0: {
            base_hz: 100,
            step_hz: 5,
          },
        },
      },
      streams: { phone: { type: "base" }, f0: { type: "point" } },
      rules: {
        paired_targets: {
          select: { stream: "phone", where: "current.id in ['p1', 'p2']" },
          insert_points_order: "by_point",
          insert_points: [
            {
              stream: "f0",
              at: "at_sync(current.sync_left)",
              value: "params.policy.f0.base_hz + current_index",
              tag: "lead",
            },
            {
              stream: "f0",
              at: "at_sync(current.sync_right)",
              value: "(prev_point('f0') == null ? params.policy.f0.base_hz : prev_point('f0').value) + params.policy.f0.step_hz",
              tag: "tail",
            },
          ],
        },
      },
      phases: [{ name: "prosody", rules: ["paired_targets"] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "gap", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
      { id: "p2", stream: "phone", sync_left: s2, sync_right: s3, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const points = out.filter((t) => t.stream === "f0");

    expect(points.map((point) => point.tag)).toEqual(["lead", "lead", "tail", "tail"]);
    expect(points.map((point) => point.value)).toEqual([100, 102, 107, 107]);
  });

  it("supports prev_point and total helpers", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      parameters: {
        policy: {
          duration: {
            total_bonus_ms: 5,
          },
          f0: {
            base_hz: 100,
            step_hz: 10,
          },
        },
      },
      streams: {
        word: { type: "span" },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
        f0: { type: "point" },
      },
      rules: {
        insert_a: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          insert_point: {
            stream: "f0",
            at: "midpoint(current)",
            value: "params.policy.f0.base_hz",
            tag: "f0",
          },
        },
        insert_b: {
          select: { stream: "phone", where: "current.id == 'p2'" },
          define: {
            prev_f0: "prev_point('f0')",
          },
          insert_point: {
            stream: "f0",
            at: "midpoint(current)",
            value: "prev_f0 == null ? params.policy.f0.base_hz : prev_f0.value + params.policy.f0.step_hz",
            tag: "f0",
          },
        },
        mark_total: {
          select: {
            stream: "phone",
            where: "total('word') == 1",
          },
          apply: [
            {
              field: "duration",
              op: "add",
              value: "params.policy.duration.total_bonus_ms",
              tag: "span",
            },
          ],
        },
      },
      phases: [{ name: "prosody", rules: ["insert_a", "insert_b", "mark_total"] }],
      output: loweringOutput,
    };

    const input = [
      { id: "w1", stream: "word", sync_left: s0, sync_right: s2, status: 1 },
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, duration: 100, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, duration: 120, status: 1 },
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
    const s0 = startOrder();
    const s1 = endOrder();

    const spec = {
      parameters: {
        policy: {
          f0: {
            base_hz: 100,
          },
        },
      },
      streams: {
        phone: { type: "base" },
        f0: { type: "point" },
      },
      rules: {
        invalid_ratio: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          insert_point: {
            stream: "f0",
            at: { anchor_left: s0, anchor_right: s1, ratio: 1.2 },
            value: "params.policy.f0.base_hz",
            tag: "f0",
          },
        },
      },
      phases: [{ name: "prosody", rules: ["invalid_ratio"] }],
      output: loweringOutput,
    };

    const input = [{ id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 }];
    expect(() => runRuleEngine(input, spec)).toThrowError(/E_INVALID_RATIO/);
  });
});
