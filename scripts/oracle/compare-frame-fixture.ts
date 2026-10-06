#!/usr/bin/env node

/**
 * compare-frame-fixture.ts
 * ========================
 * Compares the dectalk-english track with DECtalk's recorded parameter
 * packets (test/fixtures/dectalk-oracle/<corpus>.frames.json) for every corpus
 * phrase, without say.exe, and prints per corpus and parameter: packets
 * compared, packets that differ, mean absolute difference, and how many
 * phrases match on every packet.
 *
 *   --corpus <corpusId>   one corpus instead of all
 *   --id <phraseId>       also print that phrase's first mismatch per parameter
 *   --json <file>         write the per-corpus table as JSON
 *   --write-gaps          rewrite <corpus>.frame-gaps.json from this run
 *
 * --write-gaps is how the gap list test/dectalk-frame-gate.test.ts ratchets
 * against is brought up to date after a rule change. Read the diff it makes:
 * a name that appears is a regression.
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectedCorpusFiles } from "./allophones";
import {
  comparePhraseFrames,
  FRAME_GAP_NAMES,
  type FrameGapList,
  frameGapListPath,
  loadFrameFixture,
} from "./frame-gate";
import { FRAME_PARAMETERS } from "./frame-parameters";
import type { OracleCorpusDocument } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const onlyId = flag("id");
const writeGaps = argv.includes("--write-gaps");
if (writeGaps && onlyId) throw new Error("--write-gaps covers whole corpora; drop --id");

type Row = {
  name: string;
  compared: number;
  mismatched: number;
  meanAbs: number;
  maxAbs: number;
  phrasesMatching: number;
};
const report: Record<string, { phrases: number; packets: number; rows: Row[] }> = {};

for (const corpusFile of selectedCorpusFiles(argv)) {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", corpusFile), "utf8"),
  ) as OracleCorpusDocument;
  const fixture = loadFrameFixture(repoRoot, corpus.corpusId);
  const totals = new Map(
    FRAME_PARAMETERS.map((parameter) => [
      parameter.label,
      { compared: 0, mismatched: 0, sumAbs: 0, maxAbs: 0 },
    ]),
  );
  const phrasesWithGap = new Map(FRAME_GAP_NAMES.map((name) => [name, 0]));
  const gapList: FrameGapList = {};
  let phrases = 0;
  let packets = 0;
  for (const entry of corpus.entries) {
    if (onlyId && entry.id !== onlyId) continue;
    const result = comparePhraseFrames(corpus, fixture, entry.id, entry.text);
    phrases += 1;
    packets += result.comparison.packets;
    if (result.gaps.length > 0) gapList[entry.id] = result.gaps;
    for (const gap of result.gaps) phrasesWithGap.set(gap, (phrasesWithGap.get(gap) ?? 0) + 1);
    for (const parameter of FRAME_PARAMETERS) {
      const summary = result.comparison.parameters[parameter.label];
      const total = totals.get(parameter.label);
      if (!summary || !total) continue;
      total.compared += summary.compared;
      total.mismatched += summary.mismatched;
      total.sumAbs += summary.sumAbs;
      total.maxAbs = Math.max(total.maxAbs, summary.maxAbs);
    }
    if (onlyId) {
      process.stdout.write(
        `${entry.id}: ${result.comparison.packets} packets, track ends at ${result.trackPackets.toFixed(2)}; ` +
          `Segment label differs on ${result.comparison.segmentLabelsDiffer}\n`,
      );
      for (const parameter of FRAME_PARAMETERS) {
        const summary = result.comparison.parameters[parameter.label];
        if (!summary) continue;
        const first = summary.firstMismatch;
        process.stdout.write(
          `  ${parameter.label.padEnd(4)} differs on ${String(summary.mismatched).padStart(4)} of ${summary.compared}` +
            (first
              ? `; first at packet ${first.packet}: DECtalk ${first.dectalk}, here ${Number(first.qlatt.toFixed(2))}`
              : "") +
            "\n",
        );
      }
    }
  }

  const rows: Row[] = [
    ...["length", "segments"].map((name) => ({
      name,
      compared: 0,
      mismatched: 0,
      meanAbs: 0,
      maxAbs: 0,
      phrasesMatching: phrases - (phrasesWithGap.get(name) ?? 0),
    })),
    ...FRAME_PARAMETERS.map((parameter) => {
      const total = totals.get(parameter.label) ?? {
        compared: 0,
        mismatched: 0,
        sumAbs: 0,
        maxAbs: 0,
      };
      return {
        name: parameter.label,
        compared: total.compared,
        mismatched: total.mismatched,
        meanAbs: total.compared > 0 ? total.sumAbs / total.compared : 0,
        maxAbs: total.maxAbs,
        phrasesMatching: phrases - (phrasesWithGap.get(parameter.label) ?? 0),
      };
    }),
  ];
  report[corpus.corpusId] = { phrases, packets, rows };
  process.stdout.write(`\n${corpus.corpusId}: ${phrases} phrases, ${packets} packets\n`);
  process.stdout.write("  name      packets  differ  mean abs   max abs  phrases matching\n");
  for (const row of rows) {
    process.stdout.write(
      `  ${row.name.padEnd(8)} ${String(row.compared).padStart(8)} ${String(row.mismatched).padStart(7)} ` +
        `${row.meanAbs.toFixed(2).padStart(9)} ${row.maxAbs.toFixed(1).padStart(9)}  ${row.phrasesMatching}/${phrases}\n`,
    );
  }
  if (writeGaps) {
    const outPath = frameGapListPath(repoRoot, corpus.corpusId);
    const lines = Object.entries(gapList).map(
      ([id, gaps]) => `  ${JSON.stringify(id)}: ${JSON.stringify(gaps)}`,
    );
    fs.writeFileSync(outPath, `{\n${lines.join(",\n")}\n}\n`, "utf8");
    process.stdout.write(`wrote ${outPath} (${lines.length} phrases with gaps)\n`);
  }
}

const jsonPath = flag("json");
if (jsonPath) {
  fs.mkdirSync(path.dirname(path.resolve(jsonPath)), { recursive: true });
  fs.writeFileSync(path.resolve(jsonPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");
}
