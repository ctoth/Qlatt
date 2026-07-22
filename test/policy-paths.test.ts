import { describe, expect, it } from "vitest";
import { QLATT_ENGLISH_RULEPACK } from "../src/declarative-frontend/rule-pack";
import { DEFAULT_SOURCE_CONTOUR_PATH } from "../src/source-contour";
import { DEFAULT_SPEAKER_PROFILE_PATH } from "../src/speaker-profile";

// The accent / break / tune prosody policy loaders were removed in Phase 5.3:
// their data is now inlined in the declarative annotation-phase rules
// (assign_accent, assign_accent_types, break-index rules), so there are no
// longer DEFAULT_*_PATH constants to assert here.

describe("policy path layout", () => {
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
