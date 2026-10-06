#!/usr/bin/env node

/**
 * summarize-area-words.ts
 * =======================
 * What the recorded frame fixtures hold for the packet words DECtalk's
 * synthesizer builds voicing and noise from (frame-fixture.ts,
 * FRAME_FIXTURE_AREA_WORDS): for every corpus and word, the range, how many
 * distinct values occur, how many packets differ from the packet before, and
 * the commonest values. A word that never changes is a speaker constant; the
 * others have to be computed per frame by a port of ph_draw.c.
 *
 *   --corpus <corpusId>   one corpus instead of all
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectedCorpusFiles } from "./allophones";
import { decodeFrameFixtureAreaColumn, FRAME_FIXTURE_AREA_COLUMNS } from "./frame-fixture";
import { loadFrameFixture } from "./frame-gate";
import type { OracleCorpusDocument } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

for (const corpusFile of selectedCorpusFiles(process.argv.slice(2))) {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", corpusFile), "utf8"),
  ) as OracleCorpusDocument;
  const fixture = loadFrameFixture(repoRoot, corpus.corpusId);
  process.stdout.write(`\n${corpus.corpusId}\n`);
  process.stdout.write(
    "  word      packets      min      max  distinct  changes  commonest (value x packets)\n",
  );
  for (const column of FRAME_FIXTURE_AREA_COLUMNS) {
    const counts = new Map<number, number>();
    let packets = 0;
    let changes = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const entry of Object.values(fixture.entries)) {
      const values = decodeFrameFixtureAreaColumn(entry, column);
      values.forEach((value, index) => {
        packets += 1;
        counts.set(value, (counts.get(value) ?? 0) + 1);
        if (value < min) min = value;
        if (value > max) max = value;
        if (index > 0 && value !== values[index - 1]) changes += 1;
      });
    }
    const commonest = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => `${value} x ${count}`)
      .join(", ");
    process.stdout.write(
      `  ${column.padEnd(7)} ${String(packets).padStart(9)} ${String(min).padStart(8)} ${String(max).padStart(8)} ${String(counts.size).padStart(9)} ${String(changes).padStart(8)}  ${commonest}\n`,
    );
  }
}
