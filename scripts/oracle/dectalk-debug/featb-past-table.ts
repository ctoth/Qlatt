#!/usr/bin/env node

/**
 * featb-past-table.ts
 * ===================
 * What DECtalk 4.63's duration Rule 9 reads when a clause is longer than its
 * feature table.
 *
 * PH/p_us_tim.c:539 tests `phone_feature(pDph_t, nphon + 1) & FSYLL`, where
 * nphon is the allophone's position in the clause, not an allophone code, and
 * phone_feature(a, b) is all_featb[b >> 8][b & 0xff] (PH/ph_aloph.c:146,
 * PH/ph_romi.c:214-222: tables 0 and 1 are both us_featb). us_featb has 100
 * words (PH/p_us_rom.h:1047-1150), so a position of 99 or more reads the
 * memory after the table. The source does not say what is there; the program
 * does. This script finds us_featb in a built say.exe by its 100 words and
 * prints the words at indices 100 to 255 and which of them have FSYLL (bit 1).
 *
 * Usage:
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/featb-past-table.ts \
 *     [--dectalk C:/Users/Q/src/dectalk/463] [--say-exe <say.exe>]
 *
 * Prints one JSON object: where the table was found, the words after it, and
 * the indices with FSYLL. Exit code 1 if the table is not found exactly once.
 */

import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const at = argv.indexOf(`--${name}`);
  return at < 0 ? undefined : argv[at + 1];
};
const dectalkRoot = path.resolve(
  flag("dectalk") ?? process.env.DECTALK_SOURCE_ROOT ?? "C:/Users/Q/src/dectalk/463",
);
const sayExe = path.resolve(
  flag("say-exe") ??
    process.env.DECTALK_SAY_EXE ??
    path.join(dectalkRoot, "samples", "SAY", "build", "us", "static", "say.exe"),
);

/** The words of us_featb, from the source. */
export function sourceFeatureTable(root: string): number[] {
  const rom = fs.readFileSync(path.join(root, "dapi", "src", "PH", "p_us_rom.h"), "utf8");
  const match = /const\s+short\s+us_featb\s*\[\]\s*=\s*\{([^}]*)\}/.exec(rom);
  if (!match) throw new Error("E_ROM_TABLE_MISSING: us_featb");
  return (match[1] as string)
    .replace(/^\s*#.*$/gm, "")
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word !== "")
    .map(Number);
}

/**
 * The 16-bit words a position index reads past the table's end, up to index
 * 255 (the index is `b & 0xff`), from the executable's own data.
 */
export function wordsPastTable(
  exe: string,
  table: readonly number[],
): {
  offsets: number[];
  words: number[];
} {
  const bytes = fs.readFileSync(exe);
  const pattern = Buffer.alloc(table.length * 2);
  table.forEach((word, index) => {
    pattern.writeInt16LE(word, index * 2);
  });
  const offsets: number[] = [];
  for (let at = bytes.indexOf(pattern); at >= 0; at = bytes.indexOf(pattern, at + 1)) {
    offsets.push(at);
  }
  const first = offsets[0];
  const words: number[] = [];
  if (first !== undefined) {
    for (let index = table.length; index < 256; index += 1) {
      words.push(bytes.readInt16LE(first + index * 2));
    }
  }
  return { offsets, words };
}

function main(): void {
  const table = sourceFeatureTable(dectalkRoot);
  const { offsets, words } = wordsPastTable(sayExe, table);
  const syllabic = words.flatMap((word, at) => ((word & 0o1) !== 0 ? [table.length + at] : []));
  console.log(
    JSON.stringify({
      sayExe,
      tableWords: table.length,
      foundAt: offsets,
      wordsPastTable: words,
      syllabicIndices: syllabic,
    }),
  );
  process.exit(offsets.length === 1 ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith("featb-past-table.ts")) main();
