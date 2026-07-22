/**
 * dump-compiled-frontend.ts
 *
 * Serializes the FULLY-COMPILED rulepack for a frontend deterministically
 * (stable, recursively-sorted key order) so two builds can be byte-compared.
 *
 * This is the effective-config identity gate for the cross-frontend
 * include/extends refactor (Phase 5.1): the compiled rulepack is what the
 * runtime pipeline consumes for rules, phases, parameters/policy, topology,
 * output.lowering, normalization, and every resolved config path. If the
 * compiled dump changes for a frontend, that frontend's behavior changed.
 *
 * Uses the SAME loader the runtime uses (loadBundledRulepackSpec ->
 * loadRulepackSpecFromPath in rule-pack.ts), so include/extends resolution and
 * the parameters merge are exercised exactly as in production.
 *
 * Usage:
 *   npx tsx scripts/dump-compiled-frontend.ts <frontendId> <outFile>
 */
import { writeFileSync } from "node:fs";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";

/** Recursively sort object keys so serialization is order-independent. */
function stableSort(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableSort);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = stableSort((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function main(): void {
  const [frontendId, outFile] = process.argv.slice(2);
  if (!frontendId || !outFile) {
    console.error("usage: dump-compiled-frontend.ts <frontendId> <outFile>");
    process.exit(1);
  }
  const spec = loadBundledRulepackSpec(frontendId);
  const serialized = JSON.stringify(stableSort(spec), null, 2);
  writeFileSync(outFile, serialized + "\n", "utf8");
  console.log(`wrote ${serialized.length} bytes for '${frontendId}' -> ${outFile}`);
}

main();
