#!/usr/bin/env node

/**
 * split-inventory-phonology.ts
 * ============================
 * Migration: moves the phonological fields of every target out of one or more
 * inventories into one shared phonology document (docs/inventory-conventions.md,
 * "Layering an inventory over a phonology document").
 *
 * It works on the text, line by line, so that every comment stays with the
 * line it is on: a moved field's line is removed from each inventory and
 * written once, verbatim, to the phonology document. A field is moved only when
 * its line (value and trailing comment) is the same text in every inventory
 * that has the target; any other case stops the run with the list of
 * disagreements, and nothing is written.
 *
 * The top-level keys (`phonology_path`, and the convention keys the phonology
 * document may hold) are not this script's: they are a handful of lines, edited
 * by hand.
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/split-inventory-phonology.ts --phonology <out.yaml> \
 *     --fields type,voiced,... <inventory.yaml> [<inventory.yaml> ...] [--write]
 *
 * Without --write it reports what it would move. It refuses an inventory that
 * already names a `phonology_path`.
 */

import { readFileSync, writeFileSync } from "node:fs";

type Field = { name: string; lines: string[] };
type Target = { key: string; header: string; lead: string[]; fields: Field[] };
type Inventory = {
  path: string;
  newline: string;
  before: string[];
  targets: Target[];
  after: string[];
};

const args = process.argv.slice(2);
const optionValue = (flag: string): string | undefined => {
  const at = args.indexOf(flag);
  return at >= 0 ? args[at + 1] : undefined;
};
const phonologyOut = optionValue("--phonology");
const fields = new Set((optionValue("--fields") ?? "").split(",").filter(Boolean));
const write = args.includes("--write");
const flagValues = new Set(
  ["--phonology", "--fields"].flatMap((flag) => {
    const at = args.indexOf(flag);
    return at >= 0 ? [at, at + 1] : [];
  }),
);
const inventoryPaths = args.filter((arg, index) => !flagValues.has(index) && arg !== "--write");
if (!phonologyOut || fields.size === 0 || inventoryPaths.length === 0) {
  console.error(
    "usage: split-inventory-phonology.ts --phonology <out.yaml> --fields a,b,... <inventory.yaml>... [--write]",
  );
  process.exit(1);
}

const targetKey = (header: string): string =>
  header
    .trim()
    .replace(/\s*#.*$/, "")
    .replace(/:$/, "")
    .replace(/^(['"])(.*)\1$/, "$2");

function readInventory(path: string): Inventory {
  const text = readFileSync(path, "utf8");
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  if (lines.some((line) => /^phonology_path:/.test(line))) {
    throw new Error(`${path} already names a phonology_path`);
  }
  const start = lines.findIndex((line) => /^phoneme_targets:\s*$/.test(line));
  if (start < 0) throw new Error(`${path} has no block-style phoneme_targets`);
  let end = lines.findIndex((line, index) => index > start && /^\S/.test(line));
  if (end < 0) end = lines.length;
  const targets: Target[] = [];
  // Comment and blank lines wait here for the line they precede.
  let pending: string[] = [];
  for (const line of lines.slice(start + 1, end)) {
    const current = targets.at(-1);
    if (/^ {2}\S/.test(line) && !/^ {2}#/.test(line)) {
      targets.push({ key: targetKey(line), header: line, lead: pending, fields: [] });
      pending = [];
    } else if (/^ {4}[A-Za-z_][A-Za-z_0-9]*:/.test(line)) {
      if (!current) throw new Error(`${path}: field before any target: ${line}`);
      const name = (line.trim().match(/^[A-Za-z_][A-Za-z_0-9]*/) as RegExpMatchArray)[0];
      current.fields.push({ name, lines: [...pending, line] });
      pending = [];
    } else if (
      // A deeper line, or a list item at the field's own indent, continues it.
      (/^ {5,}\S/.test(line) || /^ {4}- /.test(line)) &&
      !/^ *#/.test(line) &&
      pending.length === 0
    ) {
      const field = current?.fields.at(-1);
      if (!field) throw new Error(`${path}: continuation before any field: ${line}`);
      field.lines.push(line);
    } else {
      pending.push(line);
    }
  }
  return {
    path,
    newline,
    before: lines.slice(0, start + 1),
    targets,
    after: [...pending, ...lines.slice(end)],
  };
}

/** A field's lines without indentation: the same text however a list is indented. */
const sameText = (lines: string[]): string => lines.map((line) => line.trim()).join("\n");

const inventories = inventoryPaths.map(readInventory);
const problems: string[] = [];
const order: string[] = [];
const moved = new Map<string, Field[]>();
for (const inventory of inventories) {
  for (const target of inventory.targets) {
    if (!moved.has(target.key)) {
      moved.set(target.key, []);
      order.push(target.key);
    }
    const shared = moved.get(target.key) as Field[];
    for (const field of target.fields.filter((entry) => fields.has(entry.name))) {
      // A comment line above a field is ambiguous: it may describe the field or
      // the block it opens. Such a line is not moved by this script.
      if (field.lines.length > 1 && /^ *(#|$)/.test(field.lines[0])) {
        problems.push(
          `${inventory.path} ${target.key}.${field.name}: comment above the field: ${field.lines[0].trim()}`,
        );
      }
      const known = shared.find((entry) => entry.name === field.name);
      if (!known) shared.push(field);
      else if (sameText(known.lines) !== sameText(field.lines)) {
        problems.push(
          `${target.key}.${field.name}: '${known.lines.join("\\n").trim()}' vs '${field.lines.join("\\n").trim()}' in ${inventory.path}`,
        );
      }
    }
  }
}
// A field one inventory has for a target and another lacks is not shared.
for (const inventory of inventories) {
  for (const target of inventory.targets) {
    for (const field of moved.get(target.key) ?? []) {
      if (!target.fields.some((entry) => entry.name === field.name)) {
        problems.push(`${target.key}.${field.name}: absent from ${inventory.path}`);
      }
    }
  }
  for (const target of inventory.targets) {
    // An inventory target left with no field would parse as null.
    if (target.fields.every((entry) => fields.has(entry.name))) {
      problems.push(`${target.key}: no field would remain in ${inventory.path}`);
    }
  }
  for (const key of order) {
    if (!inventory.targets.some((target) => target.key === key)) {
      problems.push(`${key}: no such target in ${inventory.path}`);
    }
  }
}

const count = [...moved.values()].reduce((sum, entries) => sum + entries.length, 0);
console.log(
  `${order.length} targets, ${count} field lines to move out of ${inventories.length} inventories`,
);
const perField = new Map<string, number>();
for (const entries of moved.values()) {
  for (const entry of entries) perField.set(entry.name, (perField.get(entry.name) ?? 0) + 1);
}
console.log([...perField].map(([name, total]) => `${name}=${total}`).join(" "));
for (const name of fields) if (!perField.has(name)) problems.push(`${name}: no target has it`);
if (problems.length > 0) {
  console.error(`${problems.length} problems; nothing written:`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
if (!write) {
  console.log("dry run: pass --write to rewrite the inventories and the phonology document");
  process.exit(0);
}

const newline = inventories[0].newline;
const headerOf = (key: string): string =>
  (inventories[0].targets.find((target) => target.key === key) as Target).header.replace(
    /\s*#.*$/,
    "",
  );
writeFileSync(
  phonologyOut,
  [
    "phoneme_targets:",
    ...order.flatMap((key) => [
      headerOf(key),
      ...(moved.get(key) as Field[]).flatMap((field) => field.lines),
    ]),
    "",
  ].join(newline),
  "utf8",
);
console.log(`wrote ${phonologyOut} (target table only; add the header by hand)`);
for (const inventory of inventories) {
  const body = inventory.targets.flatMap((target) => [
    ...target.lead,
    target.header,
    ...target.fields.filter((field) => !fields.has(field.name)).flatMap((field) => field.lines),
  ]);
  writeFileSync(
    inventory.path,
    [...inventory.before, ...body, ...inventory.after].join(inventory.newline),
    "utf8",
  );
  console.log(`rewrote ${inventory.path}`);
}
