/**
 * Print the two tables of DECtalk 4.63 LTS/proverbs.h that the text stage's
 * sentence parse reads (scripts/dectalk-proverbs.ts): the word list, by
 * index, and the word sequences it takes as one conjunction.
 *
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/dump-proverbs.ts [--dectalk C:/Users/Q/src/dectalk/463]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { conjunctionIndexRows, proverbWords } from "../../dectalk-proverbs.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const dectalkRoot = flag("dectalk") ?? "C:/Users/Q/src/dectalk/463";
const source = fs.readFileSync(
  path.join(dectalkRoot, "dapi", "src", "LTS", "proverbs.h"),
  "latin1",
);

const words = proverbWords(source);
console.log(`${words.length.toString()} words`);
console.log(words.map((word, index) => `${index.toString()}:${word}`).join(" "));
const rows = conjunctionIndexRows(source);
console.log(`${rows.length.toString()} conjunction sequences`);
for (const row of rows) {
  console.log(`  ${row.join(",")}\t${row.map((index) => words[index] ?? "?").join(" ")}`);
}
