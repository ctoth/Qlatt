#!/usr/bin/env node

/**
 * list-parameter-gaps.ts
 * ======================
 * One line per corpus phrase for one parameter of the frame gate: how many
 * packets differ from DECtalk's, the largest difference, where the first one
 * is, and the facts about the phrase that F0 mechanisms turn on: clauses,
 * words, and whether DECtalk's intonation routine leaves its loop early
 * (Segment `intonation_stops`, Ph_inton2.c:809-819).
 *
 *   --param <name>      default F0
 *   --corpus <corpusId> default all
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import { selectedCorpusFiles } from "./allophones";
import { comparePhraseFrames, loadFrameFixture } from "./frame-gate";
import type { OracleCorpusDocument } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const paramIndex = argv.indexOf("--param");
const param = paramIndex >= 0 ? (argv[paramIndex + 1] as string) : "F0";

for (const corpusFile of selectedCorpusFiles(argv)) {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", corpusFile), "utf8"),
  ) as OracleCorpusDocument;
  const fixture = loadFrameFixture(repoRoot, corpus.corpusId);
  process.stdout.write(`\n${corpus.corpusId} ${param}\n`);
  process.stdout.write("differ\tof\tmax\tmean\tfirst\tclauses\twords\tstops\tid\ttext\n");
  for (const entry of corpus.entries) {
    const result = comparePhraseFrames(corpus, fixture, entry.id, entry.text);
    const summary = result.comparison.parameters[param];
    if (!summary) throw new Error(`Unknown parameter ${param}`);
    const { utterance } = textToKlattTrackDetailed(entry.text, undefined, 30, {
      frontendId: "dectalk-english",
    });
    const segments = utterance
      .relation("Segment")
      .listItems()
      .filter((item) => item.get("active") !== false);
    const clauses = segments.filter(
      (item) => item.get("phoneme") === "SIL" && item.get("punctuationSymbol") != null,
    ).length;
    const stops = segments.some((item) => item.get("intonation_stops") === true);
    const words = entry.text.trim().split(/\s+/u).length;
    process.stdout.write(
      `${summary.mismatched}\t${summary.compared}\t${summary.maxAbs.toFixed(1)}\t${(summary.sumAbs / Math.max(1, summary.compared)).toFixed(2)}\t${summary.firstMismatch?.packet ?? "-"}\t${clauses}\t${words}\t${stops ? "stop" : "-"}\t${entry.id}\t${entry.text}\n`,
    );
  }
}
