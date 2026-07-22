#!/usr/bin/env node
/**
 * Phase 1 item 6 verification: prove the removed second parseDslSpec pass was a
 * no-op on the real bundled rulepacks.
 *
 * loadRulepackSpecFromPath now returns `resolveIncludes(parseDslSpec(source))`
 * (the merged, already-normalized spec) instead of re-parsing it. The old code
 * returned `parseDslSpec(merged)`. So old === new iff parseDslSpec is
 * idempotent on the merged result, i.e. parseDslSpec(spec) deep-equals spec for
 * each compiled bundled spec. This script checks exactly that.
 */
import { parseDslSpec } from "../src/declarative-frontend/parser";
import {
  BUNDLED_FRONTEND_RULEPACK_PATHS,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";

let failures = 0;

for (const [frontendId, specPath] of Object.entries(BUNDLED_FRONTEND_RULEPACK_PATHS)) {
  const compiled = loadRulepackSpecFromPath(specPath);
  const reparsed = parseDslSpec(compiled);
  const compiledJson = JSON.stringify(compiled);
  const reparsedJson = JSON.stringify(reparsed);
  const identical = compiledJson === reparsedJson;
  console.log(
    `${identical ? "PASS" : "FAIL"} ${frontendId} (${specPath}) ` +
      `bytes: compiled=${compiledJson.length} reparsed=${reparsedJson.length}`,
  );
  if (!identical) {
    failures += 1;
    // Show the first divergence to aid debugging.
    const limit = Math.min(compiledJson.length, reparsedJson.length);
    let i = 0;
    while (i < limit && compiledJson[i] === reparsedJson[i]) i += 1;
    console.log(`  first divergence at char ${i}:`);
    console.log(`  compiled: ...${compiledJson.slice(Math.max(0, i - 40), i + 40)}...`);
    console.log(`  reparsed: ...${reparsedJson.slice(Math.max(0, i - 40), i + 40)}...`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} frontend(s) NOT idempotent: second parse was NOT a no-op.`);
  process.exit(1);
}
console.log("\nAll bundled rulepacks: parseDslSpec is idempotent on the merged spec (second parse was a no-op).");
