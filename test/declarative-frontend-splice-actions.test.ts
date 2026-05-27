import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

describe("declarative frontend splice actions", () => {
  it("supports pattern replace_range with suppression + insertion", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base", features: { type: ["stop", "vowel", "fricative"] } },
      },
      patterns: {
        cv: {
          stream: "phone",
          sequence: [
            { capture: "c", where: "current.type == 'stop'" },
            { capture: "v", where: "current.type == 'vowel'" },
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
      { id: "p1", stream: "phone", type: "stop", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", type: "vowel", sync_left: s1, sync_right: s2, status: 1 },
      { id: "p3", stream: "phone", type: "fricative", sync_left: s2, sync_right: s3, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const p1 = out.find((t) => t.id === "p1");
    const p2 = out.find((t) => t.id === "p2");
    const inserted = out.find((t) => t.name === "CV");
    const activePhone = out.filter((t) => t.stream === "phone" && t.status === 1);

    expect(p1?.status).toBe(2);
    expect(p2?.status).toBe(2);
    expect(inserted).toBeTruthy();
    expect(inserted?.sync_left).toEqual(s0);
    expect(inserted?.sync_right).toEqual(s2);
    expect(activePhone).toHaveLength(2);
  });

  it("rejects unsuppressed right-side insert_at_boundary overlap", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        add_release: {
          select: {
            stream: "phone",
            where: "current.id == 'p1'",
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
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_OVERLAP");
  });

  it("rejects unsuppressed left-side insert_at_boundary overlap", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        add_preboundary: {
          select: {
            stream: "phone",
            where: "current.id == 'p2'",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_left",
            side: "before",
            insert: [{ name: "'PRE'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["add_preboundary"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_OVERLAP");
  });

  it("uses injected inventory resolver for $target materialization", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        add_release: {
          select: {
            stream: "phone",
            where: "current.id == 'p1'",
          },
          define: {
            rel: "target('REL')",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [
              {
                name: "'REL'",
                type: "rel.type",
                duration: "rel.duration",
                params: "rel.params",
              },
            ],
          },
        },
        suppress_right_neighbor: {
          select: {
            stream: "phone",
            where: "current.id == 'p2'",
          },
          suppress: true,
        },
      },
      phases: [{ name: "sandhi", rules: ["add_release", "suppress_right_neighbor"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const out = runRuleEngine(input, spec, {
      inventoryResolver: (phoneme) =>
        phoneme === "REL"
          ? {
              phoneme: "REL",
              type: "stop_release",
              duration: 17,
              params: { AF: 55, F1: 720 },
            }
          : {
              phoneme: "SIL",
              type: "silence",
              duration: 30,
              params: {},
            },
    }).sequence;
    const inserted = out.find((t) => t.name === "REL");

    expect(inserted).toBeTruthy();
    expect(inserted?.type).toBe("stop_release");
    expect(inserted?.duration).toBe(17);
    expect(inserted?.params?.AF).toBe(55);
    expect(inserted?.params?.F1).toBe(720);
    expect(inserted?.sync_left).toEqual(s1);
    expect(inserted?.sync_right).toEqual(s2);
  });

  it("splits [L,R] for multi-token insert_at_boundary when overlap is explicitly suppressed", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        insert_pair: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'A'" }, { name: "'B'" }],
          },
        },
        suppress_right_neighbor: {
          select: { stream: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "sandhi", rules: ["insert_pair", "suppress_right_neighbor"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const a = out.find((t) => t.name === "A" && t.status === 1);
    const b = out.find((t) => t.name === "B" && t.status === 1);

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a?.sync_left).toEqual(s1);
    expect(b?.sync_right).toEqual(s2);
    expect(a?.sync_right).toBe(b?.sync_left);
    expect(a?.sync_right?.kind).toBe("FINITE");
  });

  it("supports splice insert copy_from + copy_fields with null-on-missing semantics", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        copy_right_neighbor: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [
              {
                name: "'COPY'",
                copy_from: "next",
                copy_fields: [
                  "phoneme",
                  "stress",
                  "word",
                  "weak",
                  "params",
                  "duration",
                  "inherentDuration",
                  "type",
                  "punctuationSymbol",
                ],
              },
            ],
          },
        },
        suppress_right_neighbor: {
          select: { stream: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "sandhi", rules: ["copy_right_neighbor", "suppress_right_neighbor"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      {
        id: "p2",
        stream: "phone",
        phoneme: "AE",
        type: "vowel",
        word: "cat",
        duration: 90,
        params: { F1: 710 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const inserted = out.find((t) => t.name === "COPY" && t.status === 1);

    expect(inserted).toBeTruthy();
    expect(inserted?.phoneme).toBe("AE");
    expect(inserted?.type).toBe("vowel");
    expect(inserted?.word).toBe("cat");
    expect(inserted?.duration).toBe(90);
    expect(inserted?.params).toEqual({ F1: 710 });
    expect(inserted?.stress).toBeNull();
    expect(inserted?.weak).toBeNull();
    expect(inserted?.inherentDuration).toBeNull();
    expect(inserted?.punctuationSymbol).toBeNull();
    expect(inserted?.sync_left).toEqual(s1);
    expect(inserted?.sync_right).toEqual(s2);
  });

  it("materializes inventory segment templates with copied fields and overrides", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        add_release: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          define: {
            rel_target: "target('REL')",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [
              {
                segment: {
                  target: "rel_target",
                  copy_from: "current",
                  copy_fields: ["stress", "word"],
                  fields: {
                    weak: "true",
                    duration: "12",
                    inherentDuration: "12",
                    params: "merge(rel_target.params, {'AH': 20.0})",
                  },
                },
              },
            ],
          },
        },
        suppress_right_neighbor: {
          select: { stream: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "sandhi", rules: ["add_release", "suppress_right_neighbor"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        sync_left: s0,
        sync_right: s1,
        status: 1,
        stress: 1,
        word: "top",
      },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const out = runRuleEngine(input, spec, {
      inventoryResolver: (phoneme) =>
        phoneme === "REL"
          ? {
              phoneme: "REL",
              type: "stop_release",
              duration: 17,
              inherentDuration: 17,
              params: { AF: 55, AH: 35 },
              inventorySW: 1,
              voiceless: true,
              alveolar: true,
            }
          : null,
    }).sequence;
    const inserted = out.find((t) => t.phoneme === "REL");

    expect(inserted).toMatchObject({
      type: "stop_release",
      stress: 1,
      word: "top",
      weak: true,
      duration: 12,
      inherentDuration: 12,
      params: { AF: 55, AH: 20 },
      inventorySW: 1,
      voiceless: true,
      alveolar: true,
    });
    expect(inserted?.sync_left).toEqual(s1);
    expect(inserted?.sync_right).toEqual(s2);
  });

  it("supports dispatch in splice insert field expressions", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        insert_release: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          define: {
            weak: "next != null && next.phoneme == 'SIL'",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [
              {
                phoneme: "'REL'",
                duration: {
                  dispatch: [
                    { when: "weak", value: 15 },
                    { default: 30 },
                  ],
                },
              },
            ],
          },
        },
        suppress_right_neighbor: {
          select: { stream: "phone", where: "current.id == 'p2'" },
          suppress: true,
        },
      },
      phases: [{ name: "sandhi", rules: ["insert_release", "suppress_right_neighbor"] }],
    };

    const input = [
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", phoneme: "SIL", sync_left: s1, sync_right: s2, status: 1 },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const inserted = out.find((t) => t.phoneme === "REL" && t.status === 1);

    expect(inserted).toBeTruthy();
    expect(inserted?.duration).toBe(15);
    expect(inserted?.sync_left).toEqual(s1);
    expect(inserted?.sync_right).toEqual(s2);
  });

  it("supports multi-token replace_range insertion on object-order boundaries", () => {
    const s0 = startOrder();
    const s1 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        split_token: {
          select: { stream: "phone", where: "current.id == 'p1'" },
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
        sync_left: s0,
        sync_right: s1,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const inserted = out.filter((t) => t.stream === "phone" && t.status === 1 && (t.name === "A" || t.name === "B"));
    expect(inserted).toHaveLength(2);
    const first = inserted.find((t) => t.name === "A");
    const second = inserted.find((t) => t.name === "B");
    expect(first?.sync_left).toEqual(s0);
    expect(second?.sync_right).toEqual(s1);
    expect(first?.sync_right).toBe(second?.sync_left);
    expect(first?.sync_right?.kind).toBe("FINITE");
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
            where: "current.id == 'p1'",
          },
          splice: {
            type: "insert_at_boundary",
            boundary: "'missing_boundary'",
            side: "after",
            insert: [{ name: "'REL'" }],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["add_release"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        sync_left: startOrder(),
        sync_right: finiteOrder(1),
        status: 1,
      },
      {
        id: "p2",
        stream: "phone",
        sync_left: finiteOrder(1),
        sync_right: endOrder(),
        status: 1,
      },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("insert_at_boundary splice requires boundary");
  });

  it("rejects overlapping inserts from multiple after-boundary rules at the same mark", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        insert_a: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "insert_at_boundary",
            boundary: "current.sync_right",
            side: "after",
            insert: [{ name: "'A'" }],
          },
        },
        insert_b: {
          select: { stream: "phone", where: "current.id == 'p1'" },
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
      { id: "p1", stream: "phone", sync_left: s0, sync_right: s1, status: 1 },
      { id: "p2", stream: "phone", sync_left: s1, sync_right: s2, status: 1 },
    ];

    expect(() => runRuleEngine(input, spec)).toThrow("E_BASE_OVERLAP");
  });

  // NOTE: replace_range overlap test removed — the original test injected raw order-mark
  // objects as splice boundaries (not CEL expressions). With CEL-only splice fields,
  // the sequential rule execution means the second rule sees post-splice state, making
  // the overlap unreproducible. Overlap detection is still covered by the two
  // insert_at_boundary overlap tests above.

  it("preserves copied control_windows when a splice template adds more", () => {
    const s0 = startOrder();
    const s1 = endOrder();

    const spec = {
      streams: {
        phone: { type: "base" },
      },
      rules: {
        rewrite: {
          select: { stream: "phone", where: "current.id == 'p1'" },
          splice: {
            type: "replace_range",
            range_left: "current.sync_left",
            range_right: "current.sync_right",
            insert: [
              {
                copy_from: "current",
                copy_fields: ["name", "control_windows"],
                control_windows: [
                  {
                    start_ms: 10,
                    end_ms: 20,
                    fields: {
                      F2: { op: "'set'", value: 1200 },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      phases: [{ name: "sandhi", rules: ["rewrite"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        sync_left: s0,
        sync_right: s1,
        status: 1,
        name: "seed",
        control_windows: [
          {
            start_ms: 0,
            end_ms: 10,
            fields: {
              F1: { op: "set", value: 500 },
            },
          },
        ],
      },
    ];

    const out = runRuleEngine(input, spec).sequence;
    const inserted = out.find((token) => token.status === 1 && token.id !== "p1");

    expect(inserted?.control_windows).toEqual([
      {
        start_ms: 0,
        end_ms: 10,
        fields: {
          F1: { op: "set", value: 500 },
        },
      },
      {
        start_ms: 10,
        end_ms: 20,
        fields: {
          F2: { op: "set", value: 1200 },
        },
      },
    ]);
  });
});
