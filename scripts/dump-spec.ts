/**
 * Dump the fully-parsed frontend rulepack spec as JSON to stdout.
 *
 * Usage:
 *   npx tsx scripts/dump-spec.ts > tmp/baseline-spec.json
 *
 * This is used to capture a canonical snapshot of the spec before
 * restructuring the YAML files, so we can diff after each step to
 * verify nothing changed semantically.
 */
import {
  DEFAULT_RULEPACK_PATH,
  loadRulepackSpecFromPath,
} from "../src/declarative-frontend/rule-pack";

const spec = loadRulepackSpecFromPath(DEFAULT_RULEPACK_PATH);
process.stdout.write(JSON.stringify(spec, null, 2) + "\n");
