#!/usr/bin/env node

/**
 * compare-inventory-fields.ts
 * ===========================
 * Compares two frontends' materialized inventories field by field: for every
 * field name a target carries in either, the number of targets where both carry
 * it with the same value, where both carry it with different values, and where
 * only one carries it. Top-level keys are compared the same way.
 *
 * It answers which fields two inventories share exactly, which is what a
 * shared document (`phonology_path`) may hold, and what stays duplicated.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/compare-inventory-fields.ts <frontendA> <frontendB>
 */

import {
  loadBundledRulepackSpec,
  loadFrontendResources,
} from "../src/declarative-frontend/rule-pack.ts";

const [idA, idB] = process.argv.slice(2);
if (!idA || !idB) {
  console.error("usage: compare-inventory-fields.ts <frontendA> <frontendB>");
  process.exit(1);
}

const load = (id: string) => loadFrontendResources(loadBundledRulepackSpec(id)).inventory;
const a = load(idA);
const b = load(idB);
const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);

const namesA = Object.keys(a.phoneme_targets);
const namesB = Object.keys(b.phoneme_targets);
console.log(
  `targets: ${idA}=${namesA.length} ${idB}=${namesB.length} shared=${namesA.filter((name) => name in b.phoneme_targets).length}`,
);
for (const name of namesA) if (!(name in b.phoneme_targets)) console.log(`  only ${idA}: ${name}`);
for (const name of namesB) if (!(name in a.phoneme_targets)) console.log(`  only ${idB}: ${name}`);

type Count = { same: number; differ: number; onlyA: number; onlyB: number; kinds: Set<string> };
const counts = new Map<string, Count>();
const countOf = (field: string): Count => {
  let count = counts.get(field);
  if (!count) {
    count = { same: 0, differ: 0, onlyA: 0, onlyB: 0, kinds: new Set() };
    counts.set(field, count);
  }
  return count;
};
const kindOf = (value: unknown) =>
  Array.isArray(value) ? "array" : value === null ? "null" : typeof value;

for (const name of new Set([...namesA, ...namesB])) {
  const targetA = a.phoneme_targets[name] ?? {};
  const targetB = b.phoneme_targets[name] ?? {};
  for (const field of new Set([...Object.keys(targetA), ...Object.keys(targetB)])) {
    const count = countOf(field);
    const inA = Object.hasOwn(targetA, field);
    const inB = Object.hasOwn(targetB, field);
    if (inA) count.kinds.add(kindOf(targetA[field]));
    if (inB) count.kinds.add(kindOf(targetB[field]));
    if (inA && inB) {
      if (same(targetA[field], targetB[field])) count.same += 1;
      else count.differ += 1;
    } else if (inA) count.onlyA += 1;
    else count.onlyB += 1;
  }
}

console.log(`\nfield\tsame\tdiffer\tonly-${idA}\tonly-${idB}\tvalue kinds`);
for (const [field, count] of [...counts].sort(
  (x, y) =>
    Number(x[1].differ + x[1].onlyA + x[1].onlyB > 0) -
      Number(y[1].differ + y[1].onlyA + y[1].onlyB > 0) ||
    y[1].same - x[1].same ||
    x[0].localeCompare(y[0]),
)) {
  console.log(
    `${field}\t${count.same}\t${count.differ}\t${count.onlyA}\t${count.onlyB}\t${[...count.kinds].sort().join("|")}`,
  );
}

console.log("\ntop-level key\tstatus");
const topA = a as unknown as Record<string, unknown>;
const topB = b as unknown as Record<string, unknown>;
for (const key of new Set([...Object.keys(topA), ...Object.keys(topB)])) {
  if (key === "phoneme_targets") continue;
  const status =
    topA[key] === undefined
      ? `only ${idB}`
      : topB[key] === undefined
        ? `only ${idA}`
        : same(topA[key], topB[key])
          ? "same"
          : "differ";
  console.log(`${key}\t${status}`);
}
