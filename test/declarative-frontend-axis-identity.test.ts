import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

describe("declarative frontend SyncAxis identity", () => {
  it("canonicalizes token sync refs onto stable mark IDs", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: { phone: { type: "base" } },
      rules: {},
      phases: [{ name: "structural", rules: [] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const result = runRuleEngine(input, spec);
    const p1 = result.sequence.find((t) => t.id === "p1");
    const p2 = result.sequence.find((t) => t.id === "p2");
    const p1LeftId = result.axis.getMarkId(p1?.sync_left);
    const p1RightId = result.axis.getMarkId(p1?.sync_right);
    const p2LeftId = result.axis.getMarkId(p2?.sync_left);

    expect("sync_left_id" in (p1 ?? {})).toBe(false);
    expect("sync_right_id" in (p1 ?? {})).toBe(false);
    expect(typeof p1LeftId).toBe("string");
    expect(typeof p1RightId).toBe("string");
    expect(p1RightId).toBe(p2LeftId);

    const rightMark = result.axis.getMarkById(p1RightId);
    expect(rightMark?.order).toBe(p1?.sync_right);
    expect(rightMark?.order).toBe(p2?.sync_left);
  });

  it("drives insert_at_boundary with mark identity", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: { phone: { type: "base" } },
      rules: {
        insert_release: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'REL'" }],
          },
        },
      },
      phases: [{ name: "structural", rules: ["insert_release"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const result = runRuleEngine(input, spec);
    const p1 = result.sequence.find((t) => t.id === "p1");
    const rel = result.sequence.find((t) => t.name === "REL");
    const p1RightId = result.axis.getMarkId(p1?.sync_right);
    const relLeftId = result.axis.getMarkId(rel?.sync_left);
    const relRightId = result.axis.getMarkId(rel?.sync_right);

    expect(relLeftId).toBe(p1RightId);
    expect(relRightId).toBe(p1RightId);
    expect(rel?.sync_left).toBe(p1?.sync_right);
    expect(rel?.sync_right).toBe(p1?.sync_right);
  });

  it("stores finalize timing on SyncAxis marks", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: { phone: { type: "base" } },
      rules: {},
      phases: [{ name: "finalize", rules: [], compute_times: true }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, duration: 120, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, duration: 80, status: 1 },
    ];

    const result = runRuleEngine(input, spec);
    const p1 = result.sequence.find((t) => t.id === "p1");
    const p2 = result.sequence.find((t) => t.id === "p2");
    const p1LeftId = result.axis.getMarkId(p1?.sync_left);
    const p1RightId = result.axis.getMarkId(p1?.sync_right);
    const p2RightId = result.axis.getMarkId(p2?.sync_right);

    const tLeft = result.axis.getMarkTime(p1LeftId);
    const tMid = result.axis.getMarkTime(p1RightId);
    const tRight = result.axis.getMarkTime(p2RightId);

    expect(tLeft).toBe(0);
    expect(tMid).toBe(120);
    expect(tRight).toBe(200);
  });
});
