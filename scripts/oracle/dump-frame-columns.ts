#!/usr/bin/env node

/**
 * dump-frame-columns.ts
 * =====================
 * Print, packet by packet, what DECtalk sent and what the dectalk-english
 * track holds for chosen frame-gate parameters of one corpus phrase. Rows
 * where nothing changes are folded into one line with a packet range.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/dump-frame-columns.ts --corpus dectalk-us-v1 --id g2p-cat \
 *     --columns AG,PS [--diff-only]
 *
 * Columns are FRAME_PARAMETERS labels (scripts/oracle/frame-parameters.ts).
 * Each cell is `DECtalk|track`; `.` for a value the side does not have.
 * `phone` is DECtalk's allophone index and name for the packet, `t` the frame
 * within that allophone.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend";
import { DECTALK_FRAME_CORPUS_FILES } from "./allophones";
import { DECTALK_NATIVE_SAMPLE_RATE_HZ, DECTALK_SAMPLES_PER_FRAME } from "./dectalk-trace";
import { decodeFrameFixtureEntry } from "./frame-fixture";
import { FRAME_GATE_REFERENCE_WPM, loadFrameFixture } from "./frame-gate";
import {
  eventIndexAt,
  FRAME_PARAMETERS,
  PHONE_BY_CODE,
  type TrackEvent,
  trackValueOf,
} from "./frame-parameters";
import type { OracleCorpusDocument } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const corpusId = flag("corpus") ?? "dectalk-us-v1";
const id = flag("id");
const labels = (flag("columns") ?? "AG,PS").split(",");
const diffOnly = argv.includes("--diff-only");
if (!id) throw new Error("--id <phraseId> is required");

const parameters = labels.map((label) => {
  const parameter = FRAME_PARAMETERS.find((candidate) => candidate.label === label);
  if (!parameter) throw new Error(`unknown column '${label}'`);
  return parameter;
});

const corpusFile = DECTALK_FRAME_CORPUS_FILES.find((fileName) => {
  const document = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", fileName), "utf8"),
  ) as OracleCorpusDocument;
  return document.corpusId === corpusId;
});
if (!corpusFile) throw new Error(`unknown corpus '${corpusId}'`);
const corpus = JSON.parse(
  fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", corpusFile), "utf8"),
) as OracleCorpusDocument;
const entry = corpus.entries.find((candidate) => candidate.id === id);
if (!entry) throw new Error(`corpus '${corpusId}' has no entry '${id}'`);
const recorded = loadFrameFixture(repoRoot, corpusId).entries[id];
if (!recorded) throw new Error(`fixture has no entry '${id}'`);

const frames = decodeFrameFixtureEntry(recorded);
const { track } = textToKlattTrackDetailed(
  entry.text,
  undefined,
  corpus.defaults?.transitionMs ?? 30,
  {
    frontendId: "dectalk-english",
    // A voice corpus is spoken by its voice, as the gate does.
    ...(corpus.defaults?.voiceId ? { speaker: corpus.defaults.voiceId } : {}),
    // And at the entry's own rate, when it names one.
    ...(entry.rate === undefined ? {} : { rate: entry.rate / FRAME_GATE_REFERENCE_WPM }),
  },
);
const events = track as readonly TrackEvent[];
const packetSec = DECTALK_SAMPLES_PER_FRAME / DECTALK_NATIVE_SAMPLE_RATE_HZ;

type Row = { phone: string; cells: string[]; differs: boolean };
const rows: Row[] = [];
let phoneStart = 0;
frames.forEach((frame, index) => {
  if (index > 0 && frame.phoneIndex !== frames[index - 1]?.phoneIndex) phoneStart = index;
  const event = events[eventIndexAt(events, index * packetSec)];
  let differs = false;
  const cells = parameters.map((parameter) => {
    const dectalk = parameter.oracleValue(frame);
    const here = trackValueOf(event, parameter);
    if (dectalk != null && (here == null || Math.abs(here - dectalk) > 0.5)) differs = true;
    return `${dectalk ?? "."}|${here == null ? "." : Math.round(here * 10) / 10}`;
  });
  rows.push({
    phone: `${frame.phoneIndex}:${PHONE_BY_CODE[frame.out.PH] ?? frame.out.PH} t${index - phoneStart}`,
    cells,
    differs,
  });
});

console.log(`${id}: "${entry.text}", ${frames.length} packets; cells are DECtalk|track`);
console.log(`packets    phone           ${labels.map((label) => label.padEnd(14)).join("")}`);
let runStart = 0;
for (let index = 1; index <= rows.length; index += 1) {
  const previous = rows[index - 1] as Row;
  const current = rows[index];
  const samePhone = current?.phone.split(" ")[0] === previous.phone.split(" ")[0];
  if (current && samePhone && current.cells.join() === previous.cells.join()) continue;
  const first = rows[runStart] as Row;
  if (!diffOnly || first.differs) {
    const range = runStart === index - 1 ? `${runStart}` : `${runStart}-${index - 1}`;
    console.log(
      `${range.padEnd(10)} ${first.phone.padEnd(15)} ${first.cells.map((cell) => cell.padEnd(14)).join("")}`,
    );
  }
  runStart = index;
}
