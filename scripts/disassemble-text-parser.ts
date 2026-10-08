#!/usr/bin/env node

/**
 * disassemble-text-parser.ts
 * ==========================
 * Prints a text parser table's compiled rules in words: for each rule its
 * number, its line and text in the rule source, its language and mode masks,
 * where it goes on a hit and on a miss, and one line per element of its body
 * (src/text-parser/disassemble.ts).
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/disassemble-text-parser.ts [--table <table.json>] [--rule <R number>]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listRule } from "../src/text-parser/disassemble.ts";
import type { TextParserTable } from "../src/text-parser/interpreter.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const tablePath = path.resolve(
  flag("table") ??
    path.join(
      repoRoot,
      "public",
      "rules",
      "frontends",
      "dectalk-english",
      "text-parser-table.json",
    ),
);
const only = flag("rule");
const table = JSON.parse(fs.readFileSync(tablePath, "utf8")) as TextParserTable;
const mask = (value: number | undefined): string =>
  `0x${(value ?? 0).toString(16).padStart(8, "0")}`;
const numberOf = (index: number | undefined): string =>
  index === undefined ? "" : `entry ${index} (R${table.rules[index]?.number ?? "-"})`;

table.sections.forEach((start, section) => {
  if (!only) console.log(`section ${section} starts at entry ${start}`);
});
for (const rule of table.rules) {
  if (only && String(rule.number) !== only) continue;
  if (rule.kind !== "rule") {
    console.log(
      `\nentry ${rule.index}: ${rule.kind.toUpperCase()}${rule.target !== undefined ? ` ${numberOf(rule.target)}` : ""}`,
    );
    continue;
  }
  const ways = [
    rule.dictionary === "miss" ? "only for a word the dictionary does not have" : "",
    rule.dictionary === "hit" ? "only for a word the dictionary has" : "",
    rule.dictionary === "abbreviation"
      ? "only for a word the dictionary has as an abbreviation"
      : "",
    rule.hit !== undefined ? `on a hit go to ${numberOf(rule.hit)}` : "",
    rule.miss !== undefined ? `on a miss go to ${numberOf(rule.miss)}` : "",
    rule.callHit !== undefined ? `on a hit call ${numberOf(rule.callHit)}` : "",
    rule.callMiss !== undefined ? `on a miss call ${numberOf(rule.callMiss)}` : "",
    rule.copyHit !== undefined
      ? `on a hit keep the output and go to ${numberOf(rule.copyHit)}`
      : "",
  ].filter((way) => way.length > 0);
  console.log(
    `\nentry ${rule.index}: R${rule.number}, line ${rule.line ?? "?"}; language ${mask(rule.language)}, mode ${mask(rule.mode)}`,
  );
  if (rule.text) console.log(`  ${rule.text}`);
  for (const way of ways) console.log(`  ${way}`);
  for (const element of listRule(table, rule)) {
    console.log(
      `  ${String(element.offset).padStart(3)}  ${"  ".repeat(element.depth)}${element.text}`,
    );
  }
}
