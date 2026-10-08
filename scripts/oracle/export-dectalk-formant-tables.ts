#!/usr/bin/env node

/**
 * export-dectalk-formant-tables.ts
 * ================================
 * The tables under `parameters.policy.formant_drawing` of the dectalk-english
 * frontend that come from DECtalk 4.63's ROM, reshaped so a rule can look a
 * phone up by name:
 *
 *   begtyp, endtyp  PH/p_us_rom.h us_begtyp, us_endtyp
 *   target          us_maltar[code + 59 * k], k = F1 F2 F3 B1 B2 B3
 *                   (p_us_st1.c:92-103). -1 is "no target"; a value under -1
 *                   is minus an index into us_maldip and is kept as it is.
 *   diphthong       us_maldip from that index: v0, t1, v1, t2, ..., vn, -1
 *                   (ph_setar.c:1234-1386) as values [v0..vn] and times
 *                   [t1..tn] in ms; the last value is reached at the phone's end.
 *   locus           us_maleloc through us_plocu[code + 59 * (sontyx - 1)]
 *                   (ph_sttr2.c:161, 250-276): per obstruent and sonorant type
 *                   1..3, per formant, [locus Hz, percent, duration ms].
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-dectalk-formant-tables.ts [--check] [--dectalk <root>]
 *
 * Without a flag it prints the YAML for those five keys. With --write it
 * puts them between the BEGIN and END marker lines of frontend.yaml. With
 * --check it compares them with the frontend's and prints every difference;
 * exit code 1 if there is one.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const dectalkFlag = argv.indexOf("--dectalk");
const dectalkRoot = path.resolve(
  (dectalkFlag >= 0 ? argv[dectalkFlag + 1] : undefined) ??
    process.env.DECTALK_SOURCE_ROOT ??
    "C:/Users/Q/src/dectalk/463",
);

const PARAMETERS = ["F1", "F2", "F3", "B1", "B2", "B3"] as const;
const FORMANTS = ["F1", "F2", "F3"] as const;

const rom = fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "PH", "p_us_rom.h"), "utf8");
function romTable(name: string): number[] {
  const match = new RegExp(`const\\s+short\\s+${name}\\s*\\[\\]\\s*=\\s*\\{([^}]*)\\}`).exec(rom);
  if (!match) throw new Error(`E_ROM_TABLE_MISSING: ${name}`);
  return (match[1] as string)
    .split(",")
    .map((cell) =>
      cell
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*#.*$/gm, "")
        .trim(),
    )
    .filter((cell) => cell.length > 0)
    .map((cell) => {
      const value = Number(cell);
      if (!Number.isInteger(value)) throw new Error(`E_ROM_CELL: ${name}: '${cell}'`);
      return value;
    });
}

const frontendPath = path.join(
  repoRoot,
  "public",
  "rules",
  "frontends",
  "dectalk-english",
  "frontend.yaml",
);
const frontend = yaml.load(fs.readFileSync(frontendPath, "utf8")) as {
  parameters: { policy: { timing: { phonemes: string[] }; formant_drawing?: unknown } };
};
// l_all_ph.h US_<name> in code order, as check-dectalk-timing-policy.ts verifies.
const names = frontend.parameters.policy.timing.phonemes;
const total = names.length;

const begtyp = romTable("us_begtyp");
const endtyp = romTable("us_endtyp");
const maltar = romTable("us_maltar");
const maldip = romTable("us_maldip");
const plocu = romTable("us_plocu");
const maleloc = romTable("us_maleloc");

function at(table: number[], index: number, what: string): number {
  const value = table[index];
  if (value === undefined) throw new Error(`E_ROM_INDEX: ${what}[${index}]`);
  return value;
}

type Diphthong = { values: number[]; times: number[] };
function diphthongAt(pointer: number): Diphthong {
  const values = [at(maldip, pointer, "us_maldip")];
  const times: number[] = [];
  for (let index = pointer + 1; at(maldip, index, "us_maldip") !== -1; index += 2) {
    times.push(at(maldip, index, "us_maldip"));
    values.push(at(maldip, index + 1, "us_maldip"));
  }
  return { values, times };
}

const tables = {
  begtyp: {} as Record<string, number>,
  endtyp: {} as Record<string, number>,
  target: {} as Record<string, Record<string, number>>,
  diphthong: {} as Record<string, Record<string, Diphthong>>,
  locus: {} as Record<string, Record<string, Record<string, number[]>>>,
};
names.forEach((name, code) => {
  tables.begtyp[name] = at(begtyp, code, "us_begtyp");
  tables.endtyp[name] = at(endtyp, code, "us_endtyp");
  const target: Record<string, number> = {};
  const diphthong: Record<string, Diphthong> = {};
  PARAMETERS.forEach((parameter, k) => {
    const value = at(maltar, code + k * total, "us_maltar");
    target[parameter] = value;
    if (value < -1) diphthong[parameter] = diphthongAt(-value);
  });
  tables.target[name] = target;
  if (Object.keys(diphthong).length > 0) tables.diphthong[name] = diphthong;
  const locus: Record<string, Record<string, number[]>> = {};
  for (const sontyx of [1, 2, 3]) {
    const pointer = at(plocu, code + total * (sontyx - 1), "us_plocu");
    if (pointer === 0) continue;
    locus[String(sontyx)] = Object.fromEntries(
      FORMANTS.map((formant, k) => [
        formant,
        [0, 1, 2].map((offset) => at(maleloc, pointer + 3 * k + offset, "us_maleloc")),
      ]),
    );
  }
  if (Object.keys(locus).length > 0) tables.locus[name] = locus;
});

if (argv.includes("--check")) {
  const current = (frontend.parameters.policy.formant_drawing ?? {}) as Record<string, unknown>;
  const differences: string[] = [];
  const compare = (expected: unknown, actual: unknown, where: string): void => {
    if (expected !== null && typeof expected === "object") {
      if (actual === null || typeof actual !== "object") {
        differences.push(`${where}: missing or not a table`);
        return;
      }
      const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
      for (const key of keys) {
        compare(
          (expected as Record<string, unknown>)[key],
          (actual as Record<string, unknown>)[key],
          `${where}.${key}`,
        );
      }
      return;
    }
    if (expected !== actual) {
      differences.push(`${where}: DECtalk ${String(expected)}, frontend ${String(actual)}`);
    }
  };
  for (const [key, table] of Object.entries(tables)) compare(table, current[key], key);
  for (const difference of differences) process.stdout.write(`${difference}\n`);
  process.stdout.write(
    differences.length === 0
      ? "formant_drawing tables match p_us_rom.h\n"
      : `${differences.length} differences\n`,
  );
  process.exit(differences.length === 0 ? 0 : 1);
}

const flow = (value: unknown): string => yaml.dump(value, { flowLevel: 0, lineWidth: -1 }).trim();
const lines: string[] = [];
for (const [key, table] of Object.entries(tables)) {
  lines.push(`      ${key}:`);
  for (const [name, row] of Object.entries(table)) {
    lines.push(`        ${name}: ${flow(row)}`);
  }
}

if (argv.includes("--write")) {
  // Replaces the lines between the two markers in frontend.yaml, which a
  // person puts under `parameters.policy.formant_drawing`.
  const begin =
    "      # BEGIN p_us_rom.h tables (scripts/oracle/export-dectalk-formant-tables.ts --write)";
  const end = "      # END p_us_rom.h tables";
  const text = fs.readFileSync(frontendPath, "utf8");
  const newline = text.includes("\r\n") ? "\r\n" : "\n";
  const source = text.split(newline);
  const first = source.indexOf(begin);
  const last = source.indexOf(end);
  if (first < 0 || last < first) throw new Error(`E_MARKERS_MISSING: ${frontendPath}`);
  fs.writeFileSync(
    frontendPath,
    [...source.slice(0, first + 1), ...lines, ...source.slice(last)].join(newline),
  );
  process.stdout.write(`wrote ${lines.length} lines to ${frontendPath}\n`);
} else {
  process.stdout.write(`${lines.join("\n")}\n`);
}
