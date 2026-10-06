#!/usr/bin/env node

/**
 * check-dectalk-vtm-tables.ts
 * ===========================
 * Compare the constant tables in crates/dectalk-vtm/src/tables.rs, entry by
 * entry, with the arrays they were copied from in the DECtalk 4.63 source
 * tree. Read-only: it reports differences and exits 1 if there are any.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/check-dectalk-vtm-tables.ts [--source-root C:/Users/Q/src/dectalk/463]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Rust constant, the C array it transcribes, and the file that array is in. */
const TABLES: { rust: string; c: string; file: string }[] = [
  { rust: "B0", c: "B0", file: "dapi/src/VTM/vtmtable.h" },
  { rust: "AMPTABLE", c: "amptable", file: "dapi/src/VTM/vtmtable.h" },
  { rust: "COSINE_TABLE", c: "cosine_table", file: "dapi/src/VTM/vtmtable.h" },
  { rust: "RADIUS_TABLE", c: "radius_table", file: "dapi/src/VTM/vtmtable.h" },
  { rust: "NTILTF", c: "ntiltf", file: "dapi/src/VTM/vtm3.c" },
  { rust: "INT_VOLUME_TABLE", c: "int_volume_table", file: "dapi/src/VTM/vtm3.c" },
];

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const sourceRoot = path.resolve(
  flag("source-root") ?? process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463",
);
const rustSource = fs.readFileSync(
  path.join(repoRoot, "crates", "dectalk-vtm", "src", "tables.rs"),
  "utf8",
);

const integers = (body: string): number[] => (body.match(/-?\d+/g) ?? []).map(Number);

function cArray(file: string, name: string): number[] {
  // latin1: the DECtalk sources carry non-UTF-8 bytes in their comments.
  const source = fs
    .readFileSync(path.join(sourceRoot, file), "latin1")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const match = new RegExp(`\\b${name}\\s*\\[[^\\]]*\\]\\s*=\\s*\\{([^}]*)\\}`).exec(source);
  if (!match) throw new Error(`E_VTM_TABLES: ${name} not found in ${file}`);
  return integers(match[1]);
}

function rustArray(name: string): number[] {
  const match = new RegExp(`pub const ${name}: \\[i(?:16|32); \\d+\\] = \\[([^\\]]*)\\];`).exec(
    rustSource,
  );
  if (!match) throw new Error(`E_VTM_TABLES: ${name} not found in tables.rs`);
  return integers(match[1]);
}

let differences = 0;
for (const table of TABLES) {
  const expected = cArray(table.file, table.c);
  const actual = rustArray(table.rust);
  const mismatches: string[] = [];
  if (expected.length !== actual.length) {
    mismatches.push(`length ${actual.length}, source has ${expected.length}`);
  }
  for (let index = 0; index < Math.min(expected.length, actual.length); index += 1) {
    if (expected[index] !== actual[index]) {
      mismatches.push(`[${index}] ${actual[index]}, source has ${expected[index]}`);
    }
  }
  differences += mismatches.length;
  console.log(
    `${table.rust} vs ${table.file} ${table.c}: ${expected.length} entries, ${mismatches.length} differences`,
  );
  for (const mismatch of mismatches) console.log(`  ${mismatch}`);
}
if (differences > 0) process.exit(1);
