import { describe, expect, it } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { validateDslSpec } from "../src/declarative-frontend/validation";

function diagnosticsFor(source: Record<string, unknown>) {
  return validateDslSpec(parseDslSpec({ parameters: {}, ...source }), {
    inventoryPhonemes: ["AA", "SIL"],
  });
}

const relations = {
  Segment: {
    type: "base",
    features: { phoneme: [], type: ["vowel"] },
    scalars: { duration: {}, energy: {} },
  },
  F0: { type: "point" },
};

const tags = {
  duration: "changes segment duration",
  energy: "changes segment energy",
};

function scalarRule(overrides: Record<string, unknown> = {}) {
  return {
    kind: "scalar",
    select: { relation: "Segment", where: "true" },
    apply: [{ field: "duration", op: "set", value: "1", tag: "duration" }],
    citations: ["Klatt 1976"],
    ...overrides,
  };
}

describe("rulepack load-time validation gaps", () => {
  it("rejects unknown rule fields, select keys, missing apply fields, and unknown kinds", () => {
    const diagnostics = diagnosticsFor({
      tags,
      relations,
      rules: {
        misspelled_apply: scalarRule({ aply: [] }),
        misspelled_select: scalarRule({
          select: { relation: "Segment", where: "true", wher: "false" },
        }),
        missing_field: scalarRule({
          apply: [{ op: "set", value: "1", tag: "duration" }],
        }),
        unknown_kind: scalarRule({ kind: "scaler" }),
      },
      phases: [
        {
          name: "duration",
          rules: ["misspelled_apply", "misspelled_select", "missing_field", "unknown_kind"],
        },
      ],
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "E_RULE_FIELD_UNKNOWN",
          path: "rules.misspelled_apply.aply",
        }),
        expect.objectContaining({
          code: "E_RULE_SELECT_FIELD_UNKNOWN",
          path: "rules.misspelled_select.select.wher",
        }),
        expect.objectContaining({
          code: "E_RULE_APPLY_FIELD_REQUIRED",
          path: "rules.missing_field.apply[0].field",
        }),
        expect.objectContaining({ code: "E_RULE_KIND_UNKNOWN", path: "rules.unknown_kind.kind" }),
      ]),
    );
  });

  it("requires citations and vocabulary-backed tags on every apply entry", () => {
    const diagnostics = diagnosticsFor({
      tags,
      relations,
      rules: {
        uncited: scalarRule({ citations: [] }),
        untagged: scalarRule({ apply: [{ field: "duration", op: "set", value: "1" }] }),
        unknown_tag: scalarRule({
          apply: [{ field: "duration", op: "set", value: "1", tag: "verification_method" }],
        }),
      },
      phases: [{ name: "duration", rules: ["uncited", "untagged", "unknown_tag"] }],
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "E_RULE_CITATIONS_REQUIRED",
          path: "rules.uncited.citations",
        }),
        expect.objectContaining({
          code: "E_RULE_TAG_REQUIRED",
          path: "rules.untagged.apply[0].tag",
        }),
        expect.objectContaining({
          code: "E_RULE_TAG_UNKNOWN",
          path: "rules.unknown_tag.apply[0].tag",
        }),
      ]),
    );
  });

  it("validates fields, point relations, relation paths, and implemented pattern options", () => {
    const diagnostics = diagnosticsFor({
      tags,
      relations,
      patterns: {
        unsupported: {
          relation: "Segment",
          sequence: [{ capture: "x", where: "true", optional: true }],
        },
      },
      rules: {
        unknown_feature: scalarRule({
          apply: [{ field: "missing", op: "set", value: "1", tag: "duration" }],
        }),
        unknown_point_relation: {
          kind: "point",
          select: { relation: "Segment", where: "true" },
          insert_point: { relation: "Missing", at: "midpoint(current)", value: "1" },
          citations: ["Pierrehumbert 1980"],
        },
        unknown_path_relation: scalarRule({
          select: { relation: "Segment", where: "path(current, 'R:Missing') != null" },
        }),
      },
      phases: [
        {
          name: "duration",
          rules: ["unknown_feature", "unknown_point_relation", "unknown_path_relation"],
        },
      ],
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "E_RULE_FEATURE_UNKNOWN",
          path: "rules.unknown_feature.apply[0].field",
        }),
        expect.objectContaining({
          code: "E_POINT_RELATION_UNKNOWN",
          path: "rules.unknown_point_relation.insert_point.relation",
        }),
        expect.objectContaining({
          code: "E_CEL_INVALID",
          path: "rules.unknown_path_relation.select.where",
        }),
        expect.objectContaining({
          code: "E_PATTERN_OPTION_UNSUPPORTED",
          path: "patterns.unsupported.sequence[0].optional",
        }),
      ]),
    );
  });

  it("rejects unknown CEL identifiers and phoneme literals", () => {
    const diagnostics = diagnosticsFor({
      tags,
      relations,
      rules: {
        unknown_identifier: scalarRule({
          select: { relation: "Segment", where: "curent.phoneme == 'AA'" },
        }),
        unknown_value_identifier: scalarRule({
          apply: [{ field: "energy", op: "set", value: "curent.energy", tag: "energy" }],
        }),
        unknown_feature_read: scalarRule({
          select: { relation: "Segment", where: "current.phonem == 'AA'" },
        }),
        unknown_parameter_path: scalarRule({
          apply: [{ field: "energy", op: "set", value: "params.polcy.x", tag: "energy" }],
        }),
        unknown_literal: scalarRule({
          select: { relation: "Segment", where: "current.phoneme == 'AEE'" },
        }),
        unknown_membership_literal: scalarRule({
          select: { relation: "Segment", where: "current.phoneme in ['AA', 'AEE']" },
        }),
        unknown_target: scalarRule({
          apply: [{ field: "energy", op: "set", value: "target('AEE').F1", tag: "energy" }],
        }),
      },
      phases: [
        {
          name: "duration",
          rules: [
            "unknown_identifier",
            "unknown_value_identifier",
            "unknown_feature_read",
            "unknown_parameter_path",
            "unknown_literal",
            "unknown_membership_literal",
            "unknown_target",
          ],
        },
      ],
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "E_CEL_INVALID",
          path: "rules.unknown_identifier.select.where",
        }),
        expect.objectContaining({
          code: "E_CEL_INVALID",
          path: "rules.unknown_value_identifier.apply[0].value",
        }),
        expect.objectContaining({
          code: "E_RULE_FEATURE_UNKNOWN",
          path: "rules.unknown_feature_read.select.where",
        }),
        expect.objectContaining({
          code: "E_PARAM_UNKNOWN",
          path: "rules.unknown_parameter_path.apply[0].value",
        }),
        expect.objectContaining({
          code: "E_PHONEME_UNKNOWN",
          path: "rules.unknown_literal.select.where",
        }),
        expect.objectContaining({
          code: "E_PHONEME_UNKNOWN",
          path: "rules.unknown_membership_literal.select.where",
        }),
        expect.objectContaining({
          code: "E_PHONEME_UNKNOWN",
          path: "rules.unknown_target.apply[0].value",
        }),
      ]),
    );
  });

  it("warns about dead rules and same-phase writes to the same field", () => {
    const diagnostics = diagnosticsFor({
      tags,
      relations,
      rules: {
        first: scalarRule(),
        second: scalarRule(),
        dead: scalarRule(),
      },
      phases: [{ name: "duration", rules: ["first", "second"] }],
    });

    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "W_RULE_DEAD", path: "rules.dead", severity: "warning" }),
        expect.objectContaining({
          code: "W_PHASE_WRITE_CONFLICT",
          path: "phases[0].rules",
          severity: "warning",
        }),
      ]),
    );
  });
});
