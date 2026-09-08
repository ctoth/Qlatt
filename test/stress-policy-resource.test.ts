import { expect, it } from "vitest";
import { loadFrontendResources } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { loadStressPolicy } from "../src/g2p/stress-policy";

it("rejects a generated-pronunciation frontend without a resolved stress policy", () => {
  expect(() =>
    loadFrontendResources({
      inventory_path: "/rules/frontends/qlatt-english/inventory.yaml",
      lts_path: "/rules/frontends/qlatt-english/lts-rules.yaml",
    }),
  ).toThrow(/E_STRESS_POLICY/);
});
it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
  "resolves the inherited stress resource for %s",
  (frontend) => {
    const resources = loadFrontendResources(loadBundledRulepackSpec(frontend));
    expect(resources.stressPolicyPath).toBe("/rules/frontends/qlatt-english/stress-policy.yaml");
  },
);
it("reports a missing resolved resource as a policy load error", () => {
  expect(() =>
    loadStressPolicy("/rules/frontends/qlatt-english/no-such-stress-policy.yaml"),
  ).toThrow(/E_STRESS_POLICY/);
});
