import { describe, it, expect } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";

/**
 * Phase 5.2 sub-task A: the `foreach:` rule-template primitive.
 *
 * A `foreach:` directive is an array element of the form
 *   { foreach: [ {k: v, ...}, ... ], template: { ... } }
 * that expands in-place into one substituted copy of `template` per binding
 * map, replacing the literal substring `{k}` in every nested string with the
 * binding value. Literal sibling entries (before/after the directive) are
 * preserved in order. It works anywhere an array appears in a rule body,
 * including inside `apply[*].dispatch`.
 */
describe("foreach template expansion", () => {
  it("expands a dispatch cross-product to the exact longhand entries in order", () => {
    const spec = parseDslSpec({
      version: "v1",
      rules: {
        r: {
          kind: "scalar",
          select: { relation: "Segment", where: "true" },
          apply: [
            {
              field: "F2",
              op: "set",
              dispatch: [
                {
                  foreach: [
                    { place: "velar", cond: "back_vowel", locus: "locus_back" },
                    { place: "velar", cond: "front_vowel", locus: "locus_front" },
                    { place: "bilabial", cond: "front_vowel", locus: "locus_front" },
                  ],
                  template: {
                    when: "place == '{place}' && {cond}",
                    value: "params.policy.place_loci.{place}.{locus}",
                  },
                },
                { default: "0" },
              ],
              tag: "place_locus",
            },
          ],
          citations: ["Stevens & House 1956"],
        },
      },
    });

    const dispatch = (spec.rules as any).r.apply[0].dispatch;
    expect(dispatch).toEqual([
      { when: "place == 'velar' && back_vowel", value: "params.policy.place_loci.velar.locus_back" },
      { when: "place == 'velar' && front_vowel", value: "params.policy.place_loci.velar.locus_front" },
      { when: "place == 'bilabial' && front_vowel", value: "params.policy.place_loci.bilabial.locus_front" },
      { default: "0" },
    ]);
  });

  it("leaves rules without a foreach directive untouched", () => {
    const dispatch = [
      { when: "a", value: "1" },
      { default: "2" },
    ];
    const spec = parseDslSpec({
      version: "v1",
      rules: {
        r: {
          kind: "scalar",
          select: { relation: "Segment", where: "true" },
          apply: [{ field: "F2", op: "set", dispatch, tag: "t" }],
          citations: ["x"],
        },
      },
    });
    expect((spec.rules as any).r.apply[0].dispatch).toEqual(dispatch);
  });

  it("throws on a malformed foreach (empty list)", () => {
    expect(() =>
      parseDslSpec({
        version: "v1",
        rules: {
          r: {
            apply: [{ field: "F2", op: "set", dispatch: [{ foreach: [], template: { when: "x" } }] }],
            citations: ["x"],
          },
        },
      })
    ).toThrow(/E_FOREACH_INVALID/);
  });

  it("throws when template is missing", () => {
    expect(() =>
      parseDslSpec({
        version: "v1",
        rules: {
          r: {
            apply: [{ field: "F2", op: "set", dispatch: [{ foreach: [{ place: "velar" }] }] }],
            citations: ["x"],
          },
        },
      })
    ).toThrow(/E_FOREACH_INVALID/);
  });
});
