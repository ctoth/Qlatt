#!/usr/bin/env node

/**
 * check-dectalk-timing-policy.ts
 * ==============================
 * Checks the tables under `parameters.policy.timing` of the dectalk-english
 * frontend, which were transcribed by hand, against DECtalk 4.63's source:
 *
 *   phonemes        INCLUDE/l_all_ph.h  `#define US_<name> <code>` (code 0 is SIL)
 *   inherent_ms     PH/p_us_rom.h       us_inhdr
 *   minimum_ms      PH/p_us_rom.h       us_mindur
 *   features        PH/p_us_rom.h       us_featb, bit names from PH/ph_defs.h:315-333
 *   syllabic_codes  the codes whose us_featb word has FSYLL
 *
 * and `syllabic_indices_past_table` against the built say.exe (what stands
 * after us_featb is the program's, not the source's; see
 * dectalk-debug/featb-past-table.ts).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/check-dectalk-timing-policy.ts [--dectalk C:/Users/Q/src/dectalk/463]
 *     [--say-exe <say.exe>]
 *
 * Prints every difference. Exit code 1 if there is one.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";
import { wordsPastTable } from "./dectalk-debug/featb-past-table.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const dectalkFlag = argv.indexOf("--dectalk");
const dectalkRoot = path.resolve(
  (dectalkFlag >= 0 ? argv[dectalkFlag + 1] : undefined) ??
    process.env.DECTALK_SOURCE_ROOT ??
    "C:/Users/Q/src/dectalk/463",
);
const sayExeFlag = argv.indexOf("--say-exe");
const sayExe = path.resolve(
  (sayExeFlag >= 0 ? argv[sayExeFlag + 1] : undefined) ??
    path.join(dectalkRoot, "samples", "SAY", "build", "us", "static", "say.exe"),
);

// PH/ph_defs.h:315-333.
const FEATURE_BITS: ReadonlyArray<[number, string]> = [
  [0o1, "syllabic"],
  [0o2, "voiced"],
  [0o4, "vowel"],
  [0o10, "son1"],
  [0o20, "sonorant"],
  [0o40, "obstruent"],
  [0o100, "plosive"],
  [0o200, "nasal"],
  [0o400, "consonant"],
  [0o1000, "sonorant_consonant"],
  [0o2000, "son2"],
  [0o4000, "burst"],
  [0o10000, "stress_mark"],
  [0o20000, "stop"],
  [0o40000, "semivowel"],
  [0o100000, "diphthong"],
];

const rom = fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "PH", "p_us_rom.h"), "utf8");
function romTable(name: string): number[] {
  const match = new RegExp(`const\\s+short\\s+${name}\\s*\\[\\]\\s*=\\s*\\{([^}]*)\\}`).exec(rom);
  if (!match) throw new Error(`E_ROM_TABLE_MISSING: ${name}`);
  return match[1]
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*#.*$/gm, "")
    .split(",")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
    .map(Number);
}
const header = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "INCLUDE", "l_all_ph.h"),
  "utf8",
);
const names: string[] = ["SIL"];
for (const match of header.matchAll(/^#define\s+US_([A-Z]+)\s+(\d+)\b/gm)) {
  const code = Number(match[2]);
  if (code > 0 && code < 59 && names[code] === undefined) names[code] = match[1];
}

const frontend = yaml.load(
  fs.readFileSync(
    path.join(repoRoot, "public", "rules", "frontends", "dectalk-english", "frontend.yaml"),
    "utf8",
  ),
) as { parameters: { policy: { timing: Record<string, unknown> } } };
const timing = frontend.parameters.policy.timing;

const differences: string[] = [];
const expectEqual = (label: string, ours: unknown, theirs: unknown): void => {
  if (JSON.stringify(ours) !== JSON.stringify(theirs)) {
    differences.push(`${label}: policy ${JSON.stringify(ours)}, DECtalk ${JSON.stringify(theirs)}`);
  }
};

expectEqual("phonemes", timing.phonemes, names);
const inherent = romTable("us_inhdr");
const minimum = romTable("us_mindur");
const featb = romTable("us_featb");
const oursInherent = timing.inherent_ms as Record<string, number>;
const oursMinimum = timing.minimum_ms as Record<string, number>;
const oursFeatures = timing.features as Record<string, string[]>;
names.forEach((name, code) => {
  expectEqual(`inherent_ms.${name}`, oursInherent[name], inherent[code]);
  expectEqual(`minimum_ms.${name}`, oursMinimum[name], minimum[code]);
  const bits = FEATURE_BITS.filter(([bit]) => (featb[code] & bit) !== 0).map(([, label]) => label);
  expectEqual(`features.${name}`, oursFeatures[name], bits);
});
for (const table of [oursInherent, oursMinimum, oursFeatures]) {
  for (const key of Object.keys(table)) {
    if (!names.includes(key)) differences.push(`'${key}' is not a DECtalk allophone name`);
  }
}
expectEqual(
  "syllabic_codes",
  timing.syllabic_codes,
  // Every word of the table, the codes past the last allophone too (all 0).
  featb.flatMap((word, code) => ((word & 0o1) !== 0 ? [code] : [])),
);
// What Rule 9 reads past the table's end is in the executable, not the source.
let pastTable = "not checked: no say.exe";
if (fs.existsSync(sayExe)) {
  const { offsets, words } = wordsPastTable(sayExe, featb);
  if (offsets.length !== 1) {
    differences.push(
      `syllabic_indices_past_table: us_featb found ${offsets.length.toString()} times in ${sayExe}`,
    );
  } else {
    expectEqual(
      "syllabic_indices_past_table",
      timing.syllabic_indices_past_table,
      words.flatMap((word, at) => ((word & 0o1) !== 0 ? [featb.length + at] : [])),
    );
    pastTable = sayExe;
  }
}

for (const difference of differences) console.log(difference);
console.log(
  JSON.stringify({ allophones: names.length, pastTable, differences: differences.length }),
);
process.exit(differences.length > 0 ? 1 : 0);
