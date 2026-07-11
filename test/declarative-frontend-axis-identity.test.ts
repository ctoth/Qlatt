import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import type { SyncAxis } from "../src/declarative-frontend/hrg/temporal-axis";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

type TokenLike = {
  id?: string;
  name?: string;
  sync_left?: unknown;
  sync_right?: unknown;
};

function isSyncAxis(axis: unknown): axis is SyncAxis {
  return (
    axis != null &&
    typeof axis === "object" &&
    typeof (axis as SyncAxis).getMarkId === "function" &&
    typeof (axis as SyncAxis).getMarkTime === "function"
  );
}

function requireAxis(result: ReturnType<typeof runRuleEngine>): SyncAxis {
  const axis = (result as { axis?: unknown }).axis;
  if (!isSyncAxis(axis)) {
    throw new Error("E_TEST_AXIS_MISSING: expected non-null runtime axis");
  }
  return axis;
}

describe("declarative frontend SyncAxis identity", () => {
  it("canonicalizes token sync refs onto stable mark IDs", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      relations: { phone: { type: "base" } },
      rules: {},
      phases: [{ name: "structural", rules: [] }],
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", relation: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const result = runRuleEngine(input, compileRuleEngineSpec(spec));
    const axis = requireAxis(result);
    const p1 = result.sequence.find((t: TokenLike) => t.id === "p1");
    const p2 = result.sequence.find((t: TokenLike) => t.id === "p2");
    const p1LeftId = axis.getMarkId(p1?.sync_left);
    const p1RightId = axis.getMarkId(p1?.sync_right);
    const p2LeftId = axis.getMarkId(p2?.sync_left);

    expect("sync_left_id" in (p1 ?? {})).toBe(false);
    expect("sync_right_id" in (p1 ?? {})).toBe(false);
    expect(typeof p1LeftId).toBe("string");
    expect(typeof p1RightId).toBe("string");
    expect(p1RightId).toBe(p2LeftId);

    const rightMark = axis.getMarkById(p1RightId);
    expect(rightMark?.order).toBe(p1?.sync_right);
    expect(rightMark?.order).toBe(p2?.sync_left);
  });

  it("drives insert_at_boundary [L,R] assignment with mark identity", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      relations: { phone: { type: "base" } },
      rules: {
        insert_release: {
          select: { relation: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'REL'" }],
          },
        },
        suppress_right_neighbor: {
          select: { relation: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "structural", rules: ["insert_release", "suppress_right_neighbor"] }],
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", relation: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const result = runRuleEngine(input, compileRuleEngineSpec(spec));
    const axis = requireAxis(result);
    const p1 = result.sequence.find((t: TokenLike) => t.id === "p1");
    const rel = result.sequence.find((t: TokenLike) => t.name === "REL");
    const p2 = result.sequence.find((t: TokenLike) => t.id === "p2");
    const p1RightId = axis.getMarkId(p1?.sync_right);
    const relLeftId = axis.getMarkId(rel?.sync_left);
    const relRightId = axis.getMarkId(rel?.sync_right);
    const p2RightId = axis.getMarkId(p2?.sync_right);

    expect(relLeftId).toBe(p1RightId);
    expect(relRightId).toBe(p2RightId);
    expect(rel?.sync_left).toBe(p1?.sync_right);
    expect(rel?.sync_right).toBe(p2?.sync_right);
  });

  it("stores finalize timing on SyncAxis marks", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      relations: { phone: { type: "base" } },
      rules: {},
      phases: [{ name: "finalize", rules: [], compute_times: true }],
    };

    const input = [
      { id: "p1", relation: "phone", sync_left: s0, sync_right: s1, duration: 120, status: 1 },
      { id: "p2", relation: "phone", sync_left: s1, sync_right: s2, duration: 80, status: 1 },
    ];

    const result = runRuleEngine(input, compileRuleEngineSpec(spec));
    const axis = requireAxis(result);
    const p1 = result.sequence.find((t: TokenLike) => t.id === "p1");
    const p2 = result.sequence.find((t: TokenLike) => t.id === "p2");
    const p1LeftId = axis.getMarkId(p1?.sync_left);
    const p1RightId = axis.getMarkId(p1?.sync_right);
    const p2RightId = axis.getMarkId(p2?.sync_right);

    const tLeft = axis.getMarkTime(p1LeftId);
    const tMid = axis.getMarkTime(p1RightId);
    const tRight = axis.getMarkTime(p2RightId);

    expect(tLeft).toBe(0);
    expect(tMid).toBe(120);
    expect(tRight).toBe(200);
  });
});
