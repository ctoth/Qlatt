import { describe, expect, it } from "vitest";
import { runRuleEngine } from "../src/declarative-frontend/engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";

// Chunk 3 — Additive engine schema features:
//
//   string_sets:        # pipeline-level, sibling of `predicates:`
//     ascii_letter: ['a', 'b', 'c']
//
//   maps:               # pipeline-level, sibling of `predicates:`
//     letter_to_word:
//       a: ALPHA
//       b: BRAVO
//
// Both blocks are surfaced into the CEL evaluation context as `sets` and
// `maps` top-level identifiers, so that rule expressions can write
//   current.word in sets.ascii_letter
//   maps.letter_to_word[current.word]
// directly inside `select.where`, `define`, and effect `value` strings.
//
// Justification: kills the verbatim 26-letter literal that currently appears
// four times in orthography.yaml plus a 26-arm ternary picking LETTER_<X>.
describe("declarative frontend string_sets:/maps: engine schema", () => {
  it("admits membership tests against sets.<name> declared in string_sets:", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
        phone: { type: "base", scalars: { duration: { unit: "ms" } } },
      },
      string_sets: {
        ascii_letter: ["a", "b", "c"],
      },
      rules: {
        tag_letters: {
          select: {
            relation: "orthography",
            where: "has(current.word) && current.word in sets.ascii_letter",
          },
          apply: [
            { field: "isLetter", op: "set", value: "true", tag: "spelling" },
          ],
        },
      },
      phases: [{ name: "orthography", rules: ["tag_letters"] }],
    };

    const input = [
      // 'a' is in the set → fires.
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
      // 'q' is not in the set → does not fire.
      { id: "t2", relation: "orthography", tokenType: "word", word: "q", status: 1 },
      // 'b' is in the set → fires.
      { id: "t3", relation: "orthography", tokenType: "word", word: "b", status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].isLetter).toBe(true);
    expect(out[1].isLetter).toBeUndefined();
    expect(out[2].isLetter).toBe(true);
  });

  it("admits lookup against maps.<name>[key] declared in maps:", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      string_sets: {
        ascii_letter: ["a", "b"],
      },
      maps: {
        letter_to_word: { a: "ALPHA", b: "BRAVO" },
      },
      rules: {
        spell_letters: {
          select: {
            relation: "orthography",
            where: "has(current.word) && current.word in sets.ascii_letter",
          },
          apply: [
            {
              field: "pronunciationKey",
              op: "set",
              value: "maps.letter_to_word[current.word]",
              tag: "spelling",
            },
          ],
        },
      },
      phases: [{ name: "orthography", rules: ["spell_letters"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
      { id: "t2", relation: "orthography", tokenType: "word", word: "b", status: 1 },
    ];

    const out = runRuleEngine(input, compileRuleEngineSpec(spec)).sequence;
    expect(out[0].pronunciationKey).toBe("ALPHA");
    expect(out[1].pronunciationKey).toBe("BRAVO");
  });

  it("propagates the cel-js 'No such key' throw when maps.<name>[k] uses an absent key", () => {
    // Documents the chosen behavior for missing-key map access.
    //
    // Decision: PROPAGATE the cel-js "No such key" exception. This matches the
    // existing CEL convention used everywhere else in the engine: bracket
    // access on a missing object key throws (preflight Q9 — `current.bilabial`
    // on a token without that field throws). Authors are expected to guard
    // lookups behind a `where:` membership test against `sets.<name>` (or
    // `has()` on the map), as orthography.yaml's rewrite does.
    //
    // The test deliberately does NOT guard the value expression so the
    // missing-key behavior surfaces. In real rules the `select.where`
    // membership test prevents this path from being taken.
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      maps: {
        letter_to_word: { a: "ALPHA" },
      },
      rules: {
        unguarded_lookup: {
          select: {
            relation: "orthography",
            where: "has(current.word)",
          },
          apply: [
            {
              field: "pronunciationKey",
              op: "set",
              value: "maps.letter_to_word[current.word]",
              tag: "spelling",
            },
          ],
        },
      },
      phases: [{ name: "orthography", rules: ["unguarded_lookup"] }],
    };

    const input = [
      // 'q' is not a key of the map → bracket access throws inside the rule.
      { id: "t1", relation: "orthography", tokenType: "word", word: "q", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/No such key/);
  });

  it("rejects malformed string_sets: at validation time (value must be array of strings)", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      string_sets: {
        // Not an array → reject.
        ascii_letter: "abc",
      },
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(
      /E_STRING_SET_INVALID/
    );
  });

  it("rejects malformed top-level string_sets: at validation time", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      string_sets: "abc",
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_STRING_SET_INVALID/);
  });

  it("rejects malformed string_sets: when an element is not a string", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      string_sets: {
        ascii_letter: ["a", 1, "c"],
      },
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(
      /E_STRING_SET_INVALID/
    );
  });

  it("rejects malformed maps: at validation time (value must be object of string→string)", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      maps: {
        // Not an object → reject.
        letter_to_word: ["a", "b"],
      },
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_MAP_INVALID/);
  });

  it("rejects malformed top-level maps: at validation time", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      maps: ["a", "b"],
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_MAP_INVALID/);
  });

  it("rejects malformed maps: when a value is not a string", () => {
    const spec = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      maps: {
        letter_to_word: { a: "ALPHA", b: 42 },
      },
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(spec))).toThrowError(/E_MAP_INVALID/);
  });

  it("rejects empty name keys in string_sets: and maps:", () => {
    const specSets = {
      relations: {
        orthography: { type: "base", features: { tokenType: ["word"] } },
      },
      string_sets: {
        "": ["a"],
      },
      rules: {
        noop: {
          select: { relation: "orthography", where: "true" },
          apply: [{ field: "x", op: "set", value: "1", tag: "t" }],
        },
      },
      phases: [{ name: "orthography", rules: ["noop"] }],
    };

    const input = [
      { id: "t1", relation: "orthography", tokenType: "word", word: "a", status: 1 },
    ];

    expect(() => runRuleEngine(input, compileRuleEngineSpec(specSets))).toThrowError(/E_STRING_SET_INVALID/);

    const specMaps = {
      ...specSets,
      string_sets: { ascii_letter: ["a"] },
      maps: { "": { a: "ALPHA" } },
    };
    expect(() => runRuleEngine(input, compileRuleEngineSpec(specMaps))).toThrowError(/E_MAP_INVALID/);
  });
});
