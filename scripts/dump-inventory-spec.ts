#!/usr/bin/env node

/**
 * dump-inventory-spec.ts
 * ======================
 * Prints the complete materialized InventorySpec of a frontend as JSON, loaded
 * the way the app loads it: the compiled rulepack names the inventory
 * (`resources.inventory`) and `loadFrontendResources` resolves it, with every
 * document the inventory layers over (`phonology_path`) already merged.
 *
 * It is the identity control for a change to how inventories are stored: the
 * dump of a frontend before and after such a change must be byte-identical.
 *
 * Keys are sorted recursively, so two dumps compare by value. `--source-order`
 * keeps the order the loader produced instead, which shows whether a change
 * reordered the fields of a target.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/dump-inventory-spec.ts <frontendId> --out <file> [--source-order]
 */

import { writeFileSync } from "node:fs";
import {
  loadFrontendResources,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack.ts";

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

const args = process.argv.slice(2);
const outAt = args.indexOf("--out");
const outFile = outAt >= 0 ? args[outAt + 1] : undefined;
const sourceOrder = args.includes("--source-order");
const frontendId = args.find((arg, index) => !arg.startsWith("--") && index !== outAt + 1);
if (!frontendId) {
  console.error("usage: dump-inventory-spec.ts <frontendId> --out <file> [--source-order]");
  process.exit(1);
}

const { inventory, inventoryPath } = loadFrontendResources(loadBundledRulepackSpec(frontendId));
const document = { inventoryPath, inventory };
const serialized = `${JSON.stringify(sourceOrder ? document : stableSort(document), null, 2)}\n`;
if (outFile) {
  writeFileSync(outFile, serialized, "utf8");
  console.log(
    `wrote ${serialized.length} bytes for '${frontendId}' (${Object.keys(inventory.phoneme_targets).length} targets) -> ${outFile}`,
  );
} else {
  process.stdout.write(serialized);
}
