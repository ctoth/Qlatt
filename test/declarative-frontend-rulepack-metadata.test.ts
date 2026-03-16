import { describe, expect, it } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";

describe("rulepack metadata preservation", () => {
  it("preserves non-DSL top-level metadata fields", () => {
    const spec = parseDslSpec(`
version: v1
inventory_path: /rules/frontends/qlatt-english/inventory.yaml
speaker_profile_path: /rules/policy/speaker-profile.yaml
source_contour_path: /rules/policy/source-contour.yaml
custom_policy_path: /rules/frontends/qlatt-english/policy/custom.yaml
parameters: {}
streams: {}
topology: {}
predicates: {}
patterns: {}
phases: []
rules: {}
interpolation: {}
output: {}
transcription: {}
`);

    expect((spec as Record<string, unknown>).speaker_profile_path).toBe(
      "/rules/policy/speaker-profile.yaml",
    );
    expect((spec as Record<string, unknown>).source_contour_path).toBe(
      "/rules/policy/source-contour.yaml",
    );
    expect((spec as Record<string, unknown>).custom_policy_path).toBe(
      "/rules/frontends/qlatt-english/policy/custom.yaml",
    );
  });
});
