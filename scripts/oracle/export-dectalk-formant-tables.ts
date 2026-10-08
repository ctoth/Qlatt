#!/usr/bin/env node

/**
 * export-dectalk-formant-tables.ts
 * ================================
 * The tables under `parameters.policy.formant_drawing` of the dectalk-english
 * frontend that come from DECtalk 4.63's ROM (PH/p_us_rom.h), reshaped so a
 * rule can look a phone up by name:
 *
 *   begtyp, endtyp  us_begtyp, us_endtyp
 *   tables.male, tables.female
 *                   what gettar() and setloc() read by the speaker's sex
 *                   (ph_setar.c:1684-1697, ph_sttr2.c:162-169):
 *     target        us_maltar / us_femtar [code + 59 * k], k = F1 F2 F3 B1 B2
 *                   B3 (p_us_st1.c:92-103). -1 is "no target"; a value under
 *                   -1 is minus an index into the diphthong table and is kept.
 *     diphthong     us_maldip / us_femdip from that index: v0, t1, v1, t2,
 *                   ..., vn, -1 (ph_setar.c:1234-1386) as values [v0..vn] and
 *                   times [t1..tn] in ms; the last value is reached at the
 *                   phone's end.
 *     locus         us_maleloc / us_femloc through us_plocu[code + 59 *
 *                   (sontyx - 1)] (ph_sttr2.c:161, 250-276): per obstruent and
 *                   sonorant type 1..3, per formant, [locus Hz, percent, ms].
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-dectalk-formant-tables.ts [--write | --check] [--dectalk <root>]
 *
 * Without a flag it prints the YAML. With --write it puts it between the
 * BEGIN and END marker lines of frontend.yaml. With --check it compares the
 * frontend's tables with the header and prints every difference; exit code 1
 * if there is one. test/dectalk-formant-tables.test.ts runs --check.
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
/** Where each table read so far stands in the header: "first-last". */
const romLines: Record<string, string> = {};
function romTable(name: string): number[] {
  const match = new RegExp(`const\\s+short\\s+${name}\\s*\\[\\]\\s*=\\s*\\{([^}]*)\\}`).exec(rom);
  if (!match) throw new Error(`E_ROM_TABLE_MISSING: ${name}`);
  const lineOf = (offset: number): number => rom.slice(0, offset).split("\n").length;
  romLines[name] = `${lineOf(match.index)}-${lineOf(match.index + match[0].length)}`;
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

function at(table: number[], index: number, what: string): number {
  const value = table[index];
  if (value === undefined) throw new Error(`E_ROM_INDEX: ${what}[${index}]`);
  return value;
}

type Diphthong = { values: number[]; times: number[] };
type SexTables = {
  target: Record<string, Record<string, number>>;
  diphthong: Record<string, Record<string, Diphthong>>;
  locus: Record<string, Record<string, Record<string, number[]>>>;
};

const plocu = romTable("us_plocu");

function sexTables(tarName: string, dipName: string, locName: string): SexTables {
  const tar = romTable(tarName);
  const dip = romTable(dipName);
  const loc = romTable(locName);
  const diphthongAt = (pointer: number): Diphthong => {
    const values = [at(dip, pointer, dipName)];
    const times: number[] = [];
    for (let index = pointer + 1; at(dip, index, dipName) !== -1; index += 2) {
      times.push(at(dip, index, dipName));
      values.push(at(dip, index + 1, dipName));
    }
    return { values, times };
  };
  const tables: SexTables = { target: {}, diphthong: {}, locus: {} };
  names.forEach((name, code) => {
    const target: Record<string, number> = {};
    const diphthong: Record<string, Diphthong> = {};
    PARAMETERS.forEach((parameter, k) => {
      const value = at(tar, code + k * total, tarName);
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
          [0, 1, 2].map((offset) => at(loc, pointer + 3 * k + offset, locName)),
        ]),
      );
    }
    if (Object.keys(locus).length > 0) tables.locus[name] = locus;
  });
  return tables;
}

const begtyp = romTable("us_begtyp");
const endtyp = romTable("us_endtyp");
const byName = (table: number[], what: string): Record<string, number> =>
  Object.fromEntries(names.map((name, code) => [name, at(table, code, what)]));
const expected = {
  begtyp: byName(begtyp, "us_begtyp"),
  endtyp: byName(endtyp, "us_endtyp"),
  tables: {
    male: sexTables("us_maltar", "us_maldip", "us_maleloc"),
    female: sexTables("us_femtar", "us_femdip", "us_femloc"),
  },
};

if (argv.includes("--check")) {
  const current = (frontend.parameters.policy.formant_drawing ?? {}) as Record<string, unknown>;
  const differences: string[] = [];
  const compare = (wanted: unknown, actual: unknown, where: string): void => {
    if (wanted !== null && typeof wanted === "object") {
      if (actual === null || typeof actual !== "object") {
        differences.push(`${where}: missing or not a table`);
        return;
      }
      const keys = new Set([...Object.keys(wanted), ...Object.keys(actual)]);
      for (const key of keys) {
        compare(
          (wanted as Record<string, unknown>)[key],
          (actual as Record<string, unknown>)[key],
          `${where}.${key}`,
        );
      }
      return;
    }
    if (wanted !== actual) {
      differences.push(`${where}: DECtalk ${String(wanted)}, frontend ${String(actual)}`);
    }
  };
  for (const [key, table] of Object.entries(expected)) compare(table, current[key], key);
  for (const difference of differences) process.stdout.write(`${difference}\n`);
  process.stdout.write(
    differences.length === 0
      ? "formant_drawing tables match p_us_rom.h\n"
      : `${differences.length} differences\n`,
  );
  process.exit(differences.length === 0 ? 0 : 1);
}

const flow = (value: unknown): string => yaml.dump(value, { flowLevel: 0, lineWidth: -1 }).trim();
const lines: string[] = [
  "      # Generated from DECtalk 4.63 dapi/src/PH/p_us_rom.h by",
  "      # scripts/oracle/export-dectalk-formant-tables.ts --write. Do not edit:",
  "      # change the script and run it again.",
];
const block = (indent: string, key: string, source: string, table: object): void => {
  lines.push(`${indent}# ${source}`);
  lines.push(`${indent}${key}:`);
  for (const [name, row] of Object.entries(table)) lines.push(`${indent}  ${name}: ${flow(row)}`);
};
block("      ", "begtyp", `p_us_rom.h:${romLines.us_begtyp} us_begtyp`, expected.begtyp);
block("      ", "endtyp", `p_us_rom.h:${romLines.us_endtyp} us_endtyp`, expected.endtyp);
lines.push("      tables:");
for (const [sex, tar, dip, loc] of [
  ["male", "us_maltar", "us_maldip", "us_maleloc"],
  ["female", "us_femtar", "us_femdip", "us_femloc"],
] as const) {
  const tables = expected.tables[sex];
  lines.push(`        ${sex}:`);
  block("          ", "target", `p_us_rom.h:${romLines[tar]} ${tar}`, tables.target);
  block("          ", "diphthong", `p_us_rom.h:${romLines[dip]} ${dip}`, tables.diphthong);
  block(
    "          ",
    "locus",
    `p_us_rom.h:${romLines[loc]} ${loc} through p_us_rom.h:${romLines.us_plocu} us_plocu`,
    tables.locus,
  );
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
