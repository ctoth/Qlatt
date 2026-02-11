import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine.js";

describe("declarative frontend splice actions", () => {
  it("supports pattern replace_range with suppression + insertion", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      patterns: {
        cv: {
          stream: "phone",
          sequence: [
            { capture: "c", where: "current.type = 'stop'" },
            { capture: "v", where: "current.type = 'vowel'" },
          ],
        },
      },
      rules: {
        coalesce_cv: {
          match: "cv",
          splice: {
            type: "replace_range",
            range_left: "c.sync_left",
            range_right: "v.sync_right",
            suppress: ["c", "v"],
            insert: [{ name: "'CV'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["coalesce_cv"] }],
    };

    const input = [
      { id: "p1", stream: "phone", type: "stop", sync_left: 0, sync_right: 1, status: 1 },
      { id: "p2", stream: "phone", type: "vowel", sync_left: 1, sync_right: 2, status: 1 },
      { id: "p3", stream: "phone", type: "fricative", sync_left: 2, sync_right: 3, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    const inserted = out.find((t) => t.name === "CV");
    const activePhone = out.filter((t) => t.stream === "phone" && t.status === 1);

    expect(p1?.status).toBe(2);
    expect(p2?.status).toBe(2);
    expect(inserted).toBeTruthy();
    expect(inserted?.sync_left).toBe(0);
    expect(inserted?.sync_right).toBe(2);
    expect(activePhone).toHaveLength(2);
  });

  it("supports select insert_at_boundary on the right side", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        add_release: {
          select: {
            stream: "phone",
            where: "current.id = 'p1'",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'REL'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["add_release"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 2, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const inserted = out.find((t) => t.name === "REL");
    expect(inserted).toBeTruthy();
    expect(inserted?.sync_left).toBe(1);
    expect(inserted?.sync_right).toBe(1);
    expect(inserted?.status).toBe(1);
  });

  it("supports multi-token replace_range insertion on base36 boundaries", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        split_token: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          splice: {
            type: "replace_range",
            range_left: "current.sync_left",
            range_right: "current.sync_right",
            suppress: ["current"],
            insert: [{ name: "'A'" }, { name: "'B'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["split_token"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        sync_left: "000000000000",
        sync_right: "00000000000c",
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const inserted = out.filter((t) => t.stream === "phone" && t.status === 1 && (t.name === "A" || t.name === "B"));
    expect(inserted).toHaveLength(2);
    const first = inserted.find((t) => t.name === "A");
    const second = inserted.find((t) => t.name === "B");
    expect(first?.sync_left).toBe("000000000000");
    expect(second?.sync_right).toBe("00000000000c");
    expect(first?.sync_right).toBe(second?.sync_left);
    expect(typeof first?.sync_right).toBe("string");
    expect(first && first.sync_right > "000000000000").toBe(true);
    expect(first && first.sync_right < "00000000000c").toBe(true);
  });

  it("requires a resolved boundary for insert_at_boundary", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        add_release: {
          select: {
            stream: "phone",
            where: "current.id = 'p1'",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.missing_boundary",
            side: "after",
            insert: [{ name: "'REL'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["add_release"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 2, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("insert_at_boundary splice requires boundary");
  });

  it("preserves rule order for multiple after-boundary inserts at the same mark", () => {
    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        insert_a: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'A'" }],
          },
        },
        insert_b: {
          select: { stream: "phone", where: "current.id = 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'B'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["insert_a", "insert_b"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: 0, sync_right: 1, status: 1 },
      { id: "p2", stream: "phone", sync_left: 1, sync_right: 2, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const names = out.filter((t) => t.name === "A" || t.name === "B").map((t) => t.name);

    expect(names).toEqual(["A", "B"]);
  });
});
