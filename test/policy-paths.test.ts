import { describe, expect, it } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

// The accent / break / tune prosody policy loaders were removed in Phase 5.3:
// their data is now inlined in the declarative annotation-phase rules
// (assign_accent, assign_accent_types, break-index rules), so there are no
// longer DEFAULT_*_PATH constants to assert here.

describe("speaker and source policy ownership", () => {
  it.each(["qlatt-english", "qlatt-beauty"])("%s uses the Qlatt owner's policies", (frontend) => {
    const resources = loadFrontendResources(loadBundledRulepackSpec(frontend));
    expect(resources.speakerProfile?.path).toBe(
      "/rules/frontends/qlatt-english/policy/speaker-profile.yaml",
    );
    expect(resources.sourceContour?.path).toBe(
      "/rules/frontends/qlatt-english/policy/source-contour.yaml",
    );
  });

  it("keeps DECtalk's policies independently owned", () => {
    const resources = loadFrontendResources(loadBundledRulepackSpec("dectalk-english"));
    expect(resources.speakerProfile?.path).toBe(
      "/rules/frontends/dectalk-english/policy/speaker-profile.yaml",
    );
    expect(resources.sourceContour?.path).toBe(
      "/rules/frontends/dectalk-english/source-contour.yaml",
    );
  });
});
