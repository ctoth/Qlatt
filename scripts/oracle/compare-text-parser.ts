#!/usr/bin/env node

/**
 * compare-text-parser.ts
 * ======================
 * Runs the text parser port (src/text-parser/interpreter.ts with the table of
 * scripts/build-dectalk-text-parser.ts) over every text of the recorded
 * fixture (scripts/oracle/export-text-parser-fixture.ts) and compares its
 * output with what DECtalk's parser handed to the letter-to-sound stage.
 *
 * DECtalk runs the punctuation section and then the main section on each
 * clause (CMD/cm_text.c:882-889 section 1, mode 1 << punct_mode;
 * :983-996 section 2, mode modeflag | MODE_CITATION); the same here, on the
 * whole text. The fixture has one string per clause; they are joined. Two
 * counts are printed: texts equal as recorded, and texts equal once runs of
 * white space are collapsed, since DECtalk's clause cutting (not ported) adds
 * spaces at clause ends.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-text-parser.ts [--limit N] [--only <substring>]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rewriteText, type TextParserTable } from "../../src/text-parser/interpreter.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const limit = Number(flag("limit") ?? Number.POSITIVE_INFINITY);
const only = flag("only");

const table = JSON.parse(
  fs.readFileSync(
    path.join(
      repoRoot,
      "public",
      "rules",
      "frontends",
      "dectalk-english",
      "text-parser-table.json",
    ),
    "utf8",
  ),
) as TextParserTable;
const fixture = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", "dectalk-us-text-parser-v1.json"),
    "utf8",
  ),
) as { entries: Record<string, string[] | null> };

// CMD/cm_text.c: US English is language bit 0; the default punctuation mode
// "some" is mode bit 1; the main rules run with MODE_CITATION (INCLUDE/esc.h).
const LANGUAGE = 0x01;
const PUNCTUATION_MODE = 0x02;
const MAIN_MODE = 0x0100;

/** A byte outside printable ASCII as the trace writes it. */
const visible = (text: string): string =>
  [...text]
    .map((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && code < 0x7f ? char : `\\x${code.toString(16).padStart(2, "0")}`;
    })
    .join("");
const collapsed = (text: string): string => text.replace(/\s+/g, " ").trim();

/** With --hits: each rule that hits, with its .par line, as it happens. */
const showHits = argv.includes("--hits");
let hitsShown = 0;
const onHit = (hit: {
  rule: { number?: number; line?: number };
  before: string;
  after: string;
}): void => {
  hitsShown += 1;
  if (!showHits || hitsShown > 200) return;
  console.error(
    `  R${hit.rule.number} (line ${hit.rule.line}): "${visible(hit.before)}" -> "${visible(hit.after)}"`,
  );
};

function port(text: string): string {
  hitsShown = 0;
  const punctuated = rewriteText(table, text, {
    language: LANGUAGE,
    mode: PUNCTUATION_MODE,
    section: 1,
    onHit,
  });
  return rewriteText(table, punctuated, {
    language: LANGUAGE,
    mode: MAIN_MODE,
    section: 2,
    onHit,
  });
}

let total = 0;
let equal = 0;
let equalCollapsed = 0;
let errors = 0;
let shown = 0;
for (const [text, clauses] of Object.entries(fixture.entries)) {
  if (clauses === null || clauses.length === 0) continue;
  if (only && !text.includes(only)) continue;
  total += 1;
  if (argv.includes("--progress")) console.error(text);
  const theirs = clauses.join("");
  let mine: string;
  try {
    mine = visible(port(text));
  } catch (error) {
    errors += 1;
    mine = `ERROR ${error instanceof Error ? error.message : String(error)}`;
  }
  if (mine === theirs) equal += 1;
  if (collapsed(mine) === collapsed(theirs)) {
    equalCollapsed += 1;
    continue;
  }
  if (shown < limit) {
    console.log(`${text}\n  DECtalk: ${theirs}\n  port:    ${mine}`);
    shown += 1;
  }
}
console.log(JSON.stringify({ texts: total, equal, equalCollapsed, errors }));
