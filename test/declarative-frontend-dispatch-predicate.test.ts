import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

// Chunk 0.5 — `dispatch when:` must accept `{ predicate: <name> }` objects so
// that the predicate library is reachable from dispatch rows the same way it
// is reachable from `select.where`, top-level `constraint`, and pattern step
// `where`. Without this, predicates can only be referenced via their inline
// CEL expansion when used in dispatch rows.
describe("declarative frontend dispatch when: predicate support", () => {
  it("fires a row when the predicate condition is true", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        is_voiceless_fricative:
          "has(current.voiceless) && current.voiceless == true && current.type == 'fricative'",
      },
      rules: {
        per_segment_scale: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [
                { when: { predicate: "is_voiceless_fricative" }, value: 0.5 },
                { default: 1.0 },
              ],
              tag: "segmental",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["per_segment_scale"] }],
    };

    const input = [
      // Should match the predicate → duration * 0.5.
      {
        id: "p1",
        stream: "phone",
        phoneme: "S",
        type: "fricative",
        voiceless: true,
        duration: 100,
        status: 1,
      },
      // Should NOT match → duration unchanged.
      {
        id: "p2",
        stream: "phone",
        phoneme: "AA",
        type: "vowel",
        duration: 100,
        status: 1,
      },
      // Should NOT match (voiced fricative) → duration unchanged.
      {
        id: "p3",
        stream: "phone",
        phoneme: "Z",
        type: "fricative",
        voiceless: false,
        duration: 100,
        status: 1,
      },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].duration).toBeCloseTo(50);
    expect(out[1].duration).toBeCloseTo(100);
    expect(out[2].duration).toBeCloseTo(100);
  });

  // Chunk 0.5.1 — verify the new evaluator path plumbs `prev`/`next` into the
  // predicate context the same way existing predicate sites do. A predicate
  // that reads `prev.voiced` must fire only on tokens whose previous neighbor
  // is voiced.
  it("evaluates predicates that reference prev/next neighbors", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        prev_is_voiced: "has(prev.voiced) && prev.voiced == true",
      },
      rules: {
        scale_after_voiced: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [
                { when: { predicate: "prev_is_voiced" }, value: 0.5 },
                { default: 1.0 },
              ],
              tag: "neighbor",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["scale_after_voiced"] }],
    };

    const input = [
      // No prev → predicate false → unchanged.
      { id: "p1", stream: "phone", phoneme: "S", voiced: false, duration: 100, status: 1 },
      // prev (p1) is voiceless → predicate false → unchanged.
      { id: "p2", stream: "phone", phoneme: "AA", voiced: true, duration: 100, status: 1 },
      // prev (p2) is voiced → predicate true → duration * 0.5.
      { id: "p3", stream: "phone", phoneme: "N", voiced: true, duration: 100, status: 1 },
      // prev (p3) is voiced → predicate true → duration * 0.5.
      { id: "p4", stream: "phone", phoneme: "T", voiced: false, duration: 100, status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].duration).toBeCloseTo(100);
    expect(out[1].duration).toBeCloseTo(100);
    expect(out[2].duration).toBeCloseTo(50);
    expect(out[3].duration).toBeCloseTo(50);
  });

  // Chunk 0.5.1 — a dispatch row that references a predicate name not defined
  // in the spec's `predicates:` block must surface as E_PREDICATE_UNKNOWN.
  // (Validator-side cross-check exists in validateConditionSpec for other
  // predicate entry points; the dispatch path currently surfaces this at run
  // time only — see chunk-0.5-analyst Finding 2.)
  it("throws E_PREDICATE_UNKNOWN when dispatch when: references an unknown predicate", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        // Define one predicate so the predicates block exists but does not
        // contain the name we will reference.
        is_vowel: "current.type == 'vowel'",
      },
      rules: {
        bad_reference: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [
                { when: { predicate: "predicate_that_does_not_exist" }, value: 0.5 },
                { default: 1.0 },
              ],
              tag: "segmental",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["bad_reference"] }],
    };

    const input = [
      { id: "p1", stream: "phone", phoneme: "S", duration: 100, status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_PREDICATE_UNKNOWN/);
  });

  // Chunk 0.5.1 — the validator must reject a `when: { predicate: <name> }`
  // object whose shape is malformed (non-string predicate value or extra keys
  // beyond `predicate`). This is the fail-early gate so bad specs cannot
  // silently slip through to runtime.
  it("rejects malformed predicate shape at validation time", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        is_vowel: "current.type == 'vowel'",
      },
      rules: {
        malformed_shape: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [
                { when: { predicate: 123, junk: "x" }, value: 0.5 },
                { default: 1.0 },
              ],
              tag: "segmental",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["malformed_shape"] }],
    };

    const input = [
      { id: "p1", stream: "phone", phoneme: "S", duration: 100, status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(
      /E_RULE_EXPRESSION_INVALID.*when object must be \{ predicate: <non-empty name> \} with no extra keys/s
    );
  });

  // Chunk 0.5.1 — empty-string predicate name is provably never valid; reject
  // at validation rather than waiting for the run-time E_CONDITION_INVALID at
  // engine.ts:929. Closes analyst Finding 1.
  it("rejects { predicate: \"\" } at validation time", () => {
    const spec = {
      streams: {
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      predicates: {
        is_vowel: "current.type == 'vowel'",
      },
      rules: {
        empty_predicate_name: {
          select: { stream: "phone", where: "true" },
          apply: [
            {
              field: "duration",
              op: "mul",
              dispatch: [
                { when: { predicate: "" }, value: 0.5 },
                { default: 1.0 },
              ],
              tag: "segmental",
            },
          ],
        },
      },
      phases: [{ name: "duration", rules: ["empty_predicate_name"] }],
    };

    const input = [
      { id: "p1", stream: "phone", phoneme: "S", duration: 100, status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(
      /E_RULE_EXPRESSION_INVALID.*when object must be \{ predicate: <non-empty name> \} with no extra keys/s
    );
  });
});
