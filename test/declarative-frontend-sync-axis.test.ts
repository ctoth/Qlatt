import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

describe("declarative frontend sync axis bootstrap", () => {
  it("initializes missing base sync marks using START/FINITE/END order keys", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {},
      phases: [{ name: "structural", rules: [] }],
    };

    const input = [
      { id: "p1", stream: "phone", status: 1 },
      { id: "p2", stream: "phone", status: 1 },
      { id: "p3", stream: "phone", status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    const p3 = out.find((t) => t.id === "p3");

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
      streams: {
        phone: { type: "base" },
      },
      rules: {
        insert_pair: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'A'" }, { name: "'B'" }],
          },
        },
      },
      phases: [{ name: "structural", rules: ["insert_pair"] }],
    };

    const input = [
      { id: "p1", stream: "phone", status: 1 },
      { id: "p2", stream: "phone", status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const ids = out.map((t) => t.id ?? t.name);
    const a = out.find((t) => t.name === "A");
    const b = out.find((t) => t.name === "B");
    const p1 = out.find((t) => t.id === "p1");

    expect(ids).toEqual(["p1", "phone_ins_0", "phone_ins_1", "p2"]);
    expect(a?.sync_left).toBe(p1?.sync_right);
    expect(a?.sync_right).toBe(p1?.sync_right);
    expect(b?.sync_left).toBe(p1?.sync_right);
    expect(b?.sync_right).toBe(p1?.sync_right);
  });

  it("rejects legacy non-object sync marks", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {},
      phases: [{ name: "structural", rules: [] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrowError(/E_SYNC_MARK_INVALID/);
  });
});
