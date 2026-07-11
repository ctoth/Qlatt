import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

// Chunk 7 — `for_each_field:` is a parse-time template expansion that lets a
// single effect block stand in for N concrete effect blocks where only the
// field name varies. The substring `{field}` in `field`, `value`, dispatch
// values, etc., is replaced by each literal field name from the list at
// rule-load time (NOT runtime — by the time the engine sees the rule, the
// expanded effects are already in `apply`).
describe("declarative frontend for_each_field expansion", () => {
  it("expands a templated effect into one effect per listed field", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        copy_bursts: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              for_each_field: ["A1", "A2", "A3"],
              field: "params.{field}",
              op: "set",
              value: "current.params.bursts.{field}",
              tag: "burst_test",
            },
          ],
        },
      },
      phases: [{ name: "formant", rules: ["copy_bursts"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "P",
        type: "stop_release",
        status: 1,
        params: {
          bursts: { A1: 11, A2: 22, A3: 33 },
        },
      },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].params.A1).toBe(11);
    expect(out[0].params.A2).toBe(22);
    expect(out[0].params.A3).toBe(33);
  });

  it("leaves rules WITHOUT for_each_field unaffected", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      rules: {
        plain_rule: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              field: "params.A1",
              op: "set",
              value: 7,
              tag: "plain",
            },
          ],
        },
      },
      phases: [{ name: "formant", rules: ["plain_rule"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "P",
        type: "stop_release",
        status: 1,
        params: {},
      },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].params.A1).toBe(7);
  });

  it("rejects malformed for_each_field shape (non-array)", () => {
    const spec = {
      streams: { phone: { type: "base", scalars: {} } },
      rules: {
        bad: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              for_each_field: "A1",
              field: "params.{field}",
              op: "set",
              value: 0,
            },
          ],
        },
      },
      phases: [{ name: "formant", rules: ["bad"] }],
    };
    expect(() => runRuleEngine([], compileRuleEngineSpec(spec))).toThrow(/E_FOR_EACH_FIELD_INVALID/);
  });

  it("rejects malformed for_each_field shape (non-string entry)", () => {
    const spec = {
      streams: { phone: { type: "base", scalars: {} } },
      rules: {
        bad: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              for_each_field: ["A1", 2],
              field: "params.{field}",
              op: "set",
              value: 0,
            },
          ],
        },
      },
      phases: [{ name: "formant", rules: ["bad"] }],
    };
    expect(() => runRuleEngine([], compileRuleEngineSpec(spec))).toThrow(/E_FOR_EACH_FIELD_INVALID/);
  });

  it("substitutes {field} inside dispatch row values", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        is_bilabial: "current.place == 'bilabial'",
      },
      rules: {
        burst_dispatch: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              for_each_field: ["A2", "A3"],
              field: "params.{field}",
              op: "set",
              dispatch: [
                {
                  when: { predicate: "is_bilabial" },
                  value: "current.params.table.{field}.bilabial",
                },
                { default: 0 },
              ],
              tag: "burst_dispatch_test",
            },
          ],
        },
      },
      phases: [{ name: "formant", rules: ["burst_dispatch"] }],
    };

    const input = [
      {
        id: "p1",
        stream: "phone",
        phoneme: "P",
        type: "stop_release",
        place: "bilabial",
        status: 1,
        params: {
          table: {
            A2: { bilabial: 50 },
            A3: { bilabial: 40 },
          },
        },
      },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].params.A2).toBe(50);
    expect(out[0].params.A3).toBe(40);
  });
});
