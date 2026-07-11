import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

type TokenLike = {
  id?: string;
  name?: string;
  sync_left?: { kind?: string; rank?: string } | null;
  sync_right?: { kind?: string; rank?: string } | null;
};

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

describe("declarative frontend sync axis bootstrap", () => {
  it("initializes missing base sync marks using START/FINITE/END order keys", () => {
    const spec = {
      relations: {
        phone: { type: "base" },
      },
      rules: {},
      phases: [{ name: "structural", rules: [] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", relation: "phone", status: 1 },
      { id: "p2", relation: "phone", status: 1 },
      { id: "p3", relation: "phone", status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const p1 = out.find((t: TokenLike) => t.id === "p1");
    const p2 = out.find((t: TokenLike) => t.id === "p2");
    const p3 = out.find((t: TokenLike) => t.id === "p3");

    expect(p1?.sync_left?.kind).toBe("START");
    expect(p1?.sync_right?.kind).toBe("FINITE");
    expect(typeof p1?.sync_right?.rank).toBe("string");
    expect(p1?.sync_right?.rank).toMatch(/^[0-9a-z]{12}$/);

    expect(p2?.sync_left).toBe(p1?.sync_right);
    expect(p2?.sync_right?.kind).toBe("FINITE");
    expect(p3?.sync_left).toBe(p2?.sync_right);
    expect(p3?.sync_right?.kind).toBe("END");
  });

  it("supports multi-token boundary insertion on initialized finite boundaries", () => {
    const spec = {
      relations: {
        phone: { type: "base" },
      },
      rules: {
        insert_pair: {
          select: { relation: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'A'" }, { name: "'B'" }],
          },
        },
        suppress_right_neighbor: {
          select: { relation: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "structural", rules: ["insert_pair", "suppress_right_neighbor"] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", relation: "phone", status: 1 },
      { id: "p2", relation: "phone", status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const ids = out.map((t: TokenLike) => t.id ?? t.name);
    const a = out.find((t: TokenLike) => t.name === "A");
    const b = out.find((t: TokenLike) => t.name === "B");
    const p1 = out.find((t: TokenLike) => t.id === "p1");
    const p2 = out.find((t: TokenLike) => t.id === "p2");

    expect(ids).toEqual(["p1", "phone_ins_0", "phone_ins_1", "p2"]);
    expect(a?.sync_left).toBe(p1?.sync_right);
    expect(b?.sync_right).toBe(p2?.sync_right);
    expect(a?.sync_right).toBe(b?.sync_left);
    expect(a?.sync_right?.kind).toBe("FINITE");
  });

  it("rebalances finite ranks when boundary insertion has no interior split space", () => {
    const spec = {
      relations: {
        phone: { type: "base" },
      },
      rules: {
        insert_pair: {
          select: { relation: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'A'" }, { name: "'B'" }],
          },
        },
        suppress_middle: {
          select: { relation: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "structural", rules: ["insert_pair", "suppress_middle"] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: { kind: "START" }, sync_right: { kind: "FINITE", rank: "000000000001" }, status: 1 },
      {
        id: "p2",
        relation: "phone",
        sync_left: { kind: "FINITE", rank: "000000000001" },
        sync_right: { kind: "FINITE", rank: "000000000002" },
        status: 1,
      },
      { id: "p3", relation: "phone", sync_left: { kind: "FINITE", rank: "000000000002" }, sync_right: { kind: "END" }, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    const a = out.find((t: TokenLike) => t.name === "A");
    const b = out.find((t: TokenLike) => t.name === "B");
    expect(a?.sync_right?.kind).toBe("FINITE");
    expect(a?.sync_right?.rank).toMatch(/^[0-9a-z]{12}$/);
    expect(a?.sync_right).toBe(b?.sync_left);
  });

  it("rejects legacy non-object sync marks", () => {
    const spec = {
      relations: {
        phone: { type: "base" },
      },
      rules: {},
      phases: [{ name: "structural", rules: [] }],
      output: loweringOutput,
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: 0, sync_right: 1, status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_SYNC_MARK_INVALID/);
  });
});
