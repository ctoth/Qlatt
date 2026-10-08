#!/usr/bin/env node

/**
 * compare-text-parser.ts
 * ======================
 * Runs the text parser port (src/text-parser, with the table of
 * scripts/build-dectalk-text-parser.ts) over every text of the recorded
 * fixture (scripts/oracle/export-text-parser-fixture.ts) and compares its
 * clauses with what DECtalk's parser handed to the letter-to-sound stage.
 *
 * The port is run as scripts/oracle/text-parser-port.ts describes. Two
 * counts are printed: texts whose clauses are equal as recorded, and texts
 * equal once the clauses are joined and runs of white space collapsed.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-text-parser.ts [--limit N] [--only <substring>]
 *       [--hits] [--progress] [--no-dictionary]
 *
 *   --hits           list each rule that hits, with its line of the rule text
 *   --progress       name each text before it is run
 *   --no-dictionary  run without the frontend's dictionary
 *
 * A measurement tool: exit code 0.
 */

import { recordedClauses, textParserPort, visible } from "./text-parser-port.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const limit = Number(flag("limit") ?? Number.POSITIVE_INFINITY);
const only = flag("only");

const collapsed = (text: string): string => text.replace(/\s+/g, " ").trim();

const showHits = argv.includes("--hits");
const port = textParserPort({
  dictionary: !argv.includes("--no-dictionary"),
  onHit: (hit) => {
    if (!showHits) return;
    console.error(
      `  R${hit.rule.number} (line ${hit.rule.line}): "${visible(hit.before)}" -> "${visible(hit.after)}"`,
    );
  },
});

let total = 0;
let equal = 0;
let equalCollapsed = 0;
let errors = 0;
let shown = 0;
for (const [text, clauses] of Object.entries(recordedClauses())) {
  if (clauses === null || clauses.length === 0) continue;
  if (only && !text.includes(only)) continue;
  total += 1;
  if (argv.includes("--progress")) console.error(text);
  let mine: string[];
  try {
    mine = port(text);
  } catch (error) {
    errors += 1;
    mine = [`ERROR ${error instanceof Error ? error.message : String(error)}`];
  }
  const same = JSON.stringify(mine) === JSON.stringify(clauses);
  if (same) equal += 1;
  if (collapsed(mine.join("")) === collapsed(clauses.join(""))) equalCollapsed += 1;
  if (!same && shown < limit) {
    console.log(
      `${text}\n  DECtalk: ${JSON.stringify(clauses)}\n  port:    ${JSON.stringify(mine)}`,
    );
    shown += 1;
  }
}
console.log(JSON.stringify({ texts: total, equal, equalCollapsed, errors }));
