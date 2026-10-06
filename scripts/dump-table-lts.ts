#!/usr/bin/env node

/**
 * dump-table-lts.ts
 * =================
 * Prints the raw output of the table letter-to-sound interpreter
 * (src/g2p/table-lts.ts) for each word: one phone per cell as
 * STRESSED/UNSTRESSED with its stress code and flags, before DECtalk's
 * adjustment passes.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/dump-table-lts.ts --table <lts-table.json> word [word ...]
 */

import fs from "node:fs";
import { applyLtsRules, type LtsTable } from "../src/g2p/table-lts.ts";
import { US_ALLOPHONE_NAMES } from "./oracle/allophones.ts";

const args = process.argv.slice(2);
const tableFlag = args.indexOf("--table");
if (tableFlag < 0 || !args[tableFlag + 1]) throw new Error("--table <file> is required");
const table = JSON.parse(fs.readFileSync(args[tableFlag + 1], "utf8")) as LtsTable;
const words = args.filter((_arg, index) => index !== tableFlag && index !== tableFlag + 1);

const STRESS = ["", "1", "2", "3", "4", "5"];
const FLAGS: Array<[number, string]> = [
  [0x01, "-"],
  [0x02, "*"],
  [0x04, "#"],
  [0x08, "+"],
  [0x10, "="],
];
const name = (code: number): string => US_ALLOPHONE_NAMES[code] ?? `#${code.toString()}`;

for (const word of words) {
  const cells = applyLtsRules(word, table).map((phone) => {
    const marks = FLAGS.filter(([bit]) => (phone.flag & bit) !== 0)
      .map(([, mark]) => mark)
      .join("");
    const pair =
      phone.uphone === 0 ? name(phone.sphone) : `${name(phone.sphone)}/${name(phone.uphone)}`;
    const stress = STRESS[phone.stress - 122] ?? `?${phone.stress.toString()}`;
    return `${marks}${pair}${stress === "" ? "" : `[${stress}]`}`;
  });
  console.log(`${word}\t${cells.join(" ")}`);
}
