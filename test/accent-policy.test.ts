import { describe, expect, it } from "vitest";
import { loadYamlSourceSync } from "../src/yaml-loader";
import { annotateProsody } from "../src/prosodic-annotator";
import { createProvenanceCollector } from "../src/provenance";
import {
  DEFAULT_ACCENT_POLICY_PATH,
  classifyWordProsody,
  loadAccentPolicySync,
  resolveAccentAssignment,
} from "../src/accent-policy";

type MinimalToken = Record<string, unknown>;

function phone(
  phoneme: string,
  word: string,
  stress: number | null = null,
  type: string = "vowel",
): MinimalToken {
  return { phoneme, word, stress, type, params: {} };
}

function sil(punctuation?: string): MinimalToken {
  return {
    phoneme: "SIL",
    word: "",
    stress: null,
    type: "silence",
    punctuationSymbol: punctuation ?? null,
    params: {},
  };
}

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

  it("records the applied accent policy in provenance", () => {
    const provenance = createProvenanceCollector();
    const tokens = [
      sil(),
      phone("DH", "the"),
      phone("AH", "the", 0),
      phone("K", "cat"),
      phone("AE", "cat", 1),
      phone("T", "cat"),
      sil("."),
    ];

    annotateProsody(tokens, { provenance });

    const decisions = provenance.getDecisions();
    const policyDecision = decisions.find((decision) => decision.type === "accent_policy_selected");

    expect(policyDecision).toBeDefined();
    expect(policyDecision?.stage).toBe("prosody");
    expect(policyDecision?.citations).toContain(DEFAULT_ACCENT_POLICY_PATH);
    expect(policyDecision?.reason).toContain("first_primary_stress");
  });
});
