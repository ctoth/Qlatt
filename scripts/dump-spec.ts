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
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

const spec = loadBundledRulepackSpec("qlatt-english");
process.stdout.write(JSON.stringify(spec, null, 2) + "\n");
