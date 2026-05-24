import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";

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

    const out = runRuleEngine(input, spec).sequence;
    expect(out[0].duration).toBeCloseTo(50);
    expect(out[1].duration).toBeCloseTo(100);
    expect(out[2].duration).toBeCloseTo(100);
  });
});
