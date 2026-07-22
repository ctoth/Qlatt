import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import {
  DEFAULT_ACCENT_POLICY_PATH,
  loadAccentPolicySync,
  resolveAccentAssignment,
} from "../src/accent-policy";

// The function-word membership list moved to pipeline.yaml `string_sets`
// (single source of truth for the declarative `mark_function_words` rule), so
// the former `function_words` / `classifyWordProsody` assertions here were
// relocated to declarative-frontend-function-words.test.ts. This file now
// covers only the accent-assignment rule that remains in accent-policy.yaml.

describe("accent policy", () => {
  it("declares the canonical accent policy document", () => {
    const source = loadYamlSourceSync(DEFAULT_ACCENT_POLICY_PATH);
    const policy = loadAccentPolicySync();

    expect(source).toContain("version: v1");
    expect(policy.version).toBe("v1");
    expect(policy.accent_assignment.required_stress).toBe(1);
    expect(policy.accent_assignment.carrier_selection).toBe("first_primary_stress");
  });

  it("encodes the current accent-priority rule", () => {
    const policy = loadAccentPolicySync();

    expect(
      resolveAccentAssignment(policy, {
        isContentWord: true,
        stresses: [null, 1, null],
      }),
    ).toEqual({
      accented: true,
      carrierStress: 1,
      carrierOrdinal: 0,
    });

    expect(
      resolveAccentAssignment(policy, {
        isContentWord: false,
        stresses: [1],
      }),
    ).toEqual({
      accented: false,
      carrierStress: null,
      carrierOrdinal: null,
    });
  });

});
