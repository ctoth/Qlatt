/**
 * text-layers.ts
 * ==============
 * For each text, side by side: what DECtalk 4.63's text stage does with it
 * and what the dectalk-english frontend has at the same point.
 *
 *   T   each clause as DECtalk's command parser hands it to letter-to-sound
 *   D   the symbols DECtalk's phonemic stage receives, every mark kept
 *   d   the same as compared (messy-sweep-layers.ts comparedSymbols)
 *   q   the frontend's symbols at that point (frontendSymbols)
 *   =   "same" or "differs" (d against q)
 *   w   the frontend's words with what d and q leave out: the phrase a word
 *       starts, as "(vp)" or "(pp)" before it, and a clause break its rules
 *       put before a word, as ", /"
 *
 * Usage (instrumented say.exe as for trace-text.ts):
 *   DECTALK_SAY_EXE=... DECTALK_WORKDIR=... \
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/text-layers.ts \
 *     [--corpus <corpus.json> [--id <entry id>]...] ["text" ...]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { textToKlattTrackDetailed } from "../../../src/tts-frontend";
import { comparedSymbols, frontendSymbols } from "./messy-sweep-layers";
import { requiredEnvironment, runTextTrace } from "./text-trace";

/** The frontend's words in order, each with the phrase it starts. */
function frontendWords(text: string): string {
  const { utterance } = textToKlattTrackDetailed(text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  return utterance
    .relation("Word")
    .listItems()
    .map((word) => {
      const phrase = word.get("phrase_start");
      return `${word.get("clause_break_before") === true ? ", / " : ""}${
        typeof phrase === "string" ? `(${phrase}) ` : ""
      }${String(word.get("text"))}`;
    })
    .join(" _ ");
}

const args = process.argv.slice(2);
const ids: string[] = [];
const texts: Array<{ id: string; text: string }> = [];
let corpusPath: string | undefined;
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index] as string;
  if (arg === "--corpus") {
    index += 1;
    corpusPath = args[index];
  } else if (arg === "--id") {
    index += 1;
    ids.push(args[index] as string);
  } else {
    texts.push({ id: "text", text: arg });
  }
}
if (corpusPath) {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as {
    entries: Array<{ id: string; text: string }>;
  };
  texts.push(...corpus.entries.filter((entry) => ids.length === 0 || ids.includes(entry.id)));
}
if (texts.length === 0) throw new Error("give a text, or --corpus <corpus.json>");

const exe = requiredEnvironment("DECTALK_SAY_EXE");
const workDir = requiredEnvironment("DECTALK_WORKDIR");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-text-layers-"));
try {
  for (const { id, text } of texts) {
    const trace = runTextTrace(text, exe, workDir, scratch);
    const compared = comparedSymbols(trace.symbolClauses).join(" ");
    let frontend: string;
    try {
      frontend = frontendSymbols(text).join(" ");
    } catch (error) {
      frontend = `ERROR ${error instanceof Error ? error.message : String(error)}`;
    }
    console.log(`${id}  ${text}`);
    for (const clause of trace.parserClauses) {
      // The host's empty clauses at the text's end say nothing.
      if (clause.replace(/\\x0[ab]/g, "").trim().length > 0) console.log(`  T ${clause}`);
    }
    for (const clause of trace.symbolClauses) console.log(`  D ${clause.join(" ")}`);
    console.log(`  d ${compared}`);
    console.log(`  q ${frontend}`);
    console.log(`  = ${compared === frontend ? "same" : "differs"}`);
    if (!frontend.startsWith("ERROR")) console.log(`  w ${frontendWords(text)}`);
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
