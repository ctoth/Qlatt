import { describe, expect, it } from "vitest";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";
import { DEFAULT_ACCENT_POLICY_PATH } from "../src/accent-policy";
import { DEFAULT_BREAK_POLICY_PATH } from "../src/break-policy";
import { DEFAULT_SOURCE_CONTOUR_PATH } from "../src/source-contour";
import { DEFAULT_SPEAKER_PROFILE_PATH } from "../src/speaker-profile";
import { DEFAULT_TUNE_GRAMMAR_PATH } from "../src/tune-grammar";

describe("policy path layout", () => {
  it("keeps frontend-specific prosody policy under the frontend policy directory", () => {
    expect(DEFAULT_TUNE_GRAMMAR_PATH).toBe("/rules/frontends/qlatt-english/policy/tune-grammar.yaml");
    expect(DEFAULT_ACCENT_POLICY_PATH).toBe("/rules/frontends/qlatt-english/policy/accent-policy.yaml");
    expect(DEFAULT_BREAK_POLICY_PATH).toBe("/rules/frontends/qlatt-english/policy/break-policy.yaml");
  });

  it("keeps reusable policy under the shared policy directory", () => {
    expect(DEFAULT_SPEAKER_PROFILE_PATH).toBe("/rules/policy/speaker-profile.yaml");
    expect(DEFAULT_SOURCE_CONTOUR_PATH).toBe("/rules/policy/source-contour.yaml");
  });

  it("points the qlatt english frontend at the relocated shared policy specs", () => {
    const spec = QLATT_ENGLISH_RULEPACK as Record<string, unknown>;

    expect(spec.speaker_profile_path).toBe("/rules/policy/speaker-profile.yaml");
    expect(spec.source_contour_path).toBe("/rules/policy/source-contour.yaml");
  });
});
