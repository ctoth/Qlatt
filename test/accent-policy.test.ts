import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import {
  DEFAULT_ACCENT_POLICY_PATH,
  classifyWordProsody,
  loadAccentPolicySync,
  resolveAccentAssignment,
} from "../src/accent-policy";


describe("accent policy", () => {
  it("declares the canonical accent policy document", () => {
    const source = loadYamlSourceSync(DEFAULT_ACCENT_POLICY_PATH);
    const policy = loadAccentPolicySync();

    expect(source).toContain("version: v1");
    expect(policy.version).toBe("v1");
    expect(policy.function_words.length).toBeGreaterThanOrEqual(100);
    expect(policy.accent_assignment.required_stress).toBe(1);
    expect(policy.accent_assignment.carrier_selection).toBe("first_primary_stress");
  });

  it("classifies function and content words from the declarative lexicon", () => {
    const policy = loadAccentPolicySync();

    expect(classifyWordProsody(policy, "the")).toEqual({
      isFunctionWord: true,
      isContentWord: false,
    });
    expect(classifyWordProsody(policy, "cat")).toEqual({
      isFunctionWord: false,
      isContentWord: true,
    });
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
