#!/usr/bin/env node

/**
 * show-normalized.ts
 * ==================
 * Prints what a frontend's text stage makes of each entry of a corpus: the
 * normalized word string (`normalizeText`), beside the entry's text. With
 * --oracle-root it also prints DECtalk's phoneme log for the entry
 * (`<oracle-root>/<id>/oracle/oracle.phonemes.txt`, written by
 * scripts/oracle/run-corpus.ts), so the two expansions can be read together.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/show-normalized.ts --corpus <corpus.json> \
 *     [--oracle-root <dir>] [--frontend dectalk-english]
 *
 * A reading aid: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { normalizeText } from "../../src/tts-frontend.ts";
import type { OracleCorpusDocument } from "./types.ts";

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const corpusFlag = flag("corpus");
if (!corpusFlag) throw new Error("--corpus is required");
const corpus = JSON.parse(
  fs.readFileSync(path.resolve(corpusFlag), "utf8"),
) as OracleCorpusDocument;
const oracleRoot = flag("oracle-root");
const frontendId = flag("frontend") ?? corpus.defaults?.frontendId ?? "dectalk-english";

for (const entry of corpus.entries) {
  console.log(`${entry.id}  ${entry.text}`);
  let normalized: string;
  try {
    normalized = normalizeText(entry.text, entry.frontendId ?? frontendId);
  } catch (error) {
    normalized = `ERROR ${error instanceof Error ? error.message : String(error)}`;
  }
  console.log(`  ours:    ${normalized}`);
  if (oracleRoot) {
    const logPath = path.join(path.resolve(oracleRoot), entry.id, "oracle", "oracle.phonemes.txt");
    const log = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, "utf8").replace(/\s+/g, " ").trim()
      : "(no phoneme log)";
    console.log(`  dectalk: ${log}`);
  }
}
