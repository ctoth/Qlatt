import { describe, expect, it } from "vitest";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import {
  BUNDLED_FRONTEND_RULEPACK_PATHS,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";

/**
 * Phase 1 item 6 invariant, promoted from scripts/verify-rulepack-single-parse.ts
 * into the suite so it runs in CI.
 *
 * loadRulepackSpecFromPath now returns `resolveIncludes(parseDslSpec(source))`
 * (the merged, already-normalized spec) instead of re-parsing it. The old code
 * returned `parseDslSpec(merged)`. So old === new iff parseDslSpec is idempotent
 * on the merged result, i.e. parseDslSpec(spec) deep-equals spec for each
 * compiled bundled spec. This test proves that invariant for every bundled
 * frontend rulepack (qlatt-english / dectalk-english / qlatt-beauty).
 */
describe("declarative frontend rulepack single-parse", () => {
  for (const [frontendId, specPath] of Object.entries(BUNDLED_FRONTEND_RULEPACK_PATHS)) {
    it(`parseDslSpec is idempotent on the merged ${frontendId} spec`, () => {
      const compiled = loadRulepackSpecFromPath(specPath);
      const reparsed = parseDslSpec(compiled);
      expect(JSON.stringify(reparsed)).toBe(JSON.stringify(compiled));
    });
  }
});
