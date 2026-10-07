#!/usr/bin/env node

/**
 * show-frame-columns.ts
 * =====================
 * Packet-by-packet view of one corpus phrase without say.exe: DECtalk's
 * recorded value (frame fixture) beside the dectalk-english track's, for the
 * named gate parameters, with DECtalk's controller phone and this frontend's
 * Segment label.
 *
 *   --id <phraseId>       required
 *   --params F0,F1,...    gate parameter names (frame-parameters.ts); default F0
 *   --frames A-B          packets to print; default all
 *   --diff                only packets where some listed parameter differs
 *
 * Each cell is `dectalk/here`. A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import { DECTALK_CORPUS_FILES } from "./allophones";
import { dectalkFrameStartSec } from "./dectalk-trace";
import { decodeFrameFixtureEntry } from "./frame-fixture";
import { loadFrameFixture } from "./frame-gate";
import {
  eventIndexAt,
  FRAME_PARAMETERS,
  oracleSourceClockPhoneCode,
  parameterTolerance,
  phoneCodeToQlatt,
  qlattValue,
  type TrackEvent,
} from "./frame-parameters";
import type { OracleCorpusDocument } from "./types";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const id = flag("id");
if (!id)
  throw new Error(
    "Usage: show-frame-columns --id <phraseId> [--params F0,F1] [--frames A-B] [--diff]",
  );
const columns = (flag("params") ?? "F0").split(",").map((label) => {
  const parameter = FRAME_PARAMETERS.find((entry) => entry.label === label);
  if (!parameter) throw new Error(`Unknown parameter ${label}`);
  return parameter;
});
const [first, last] = (flag("frames") ?? "0-1000000").split("-").map(Number) as [number, number];
const diffOnly = argv.includes("--diff");
const show = (value: number | null): string =>
  value == null ? "-" : Number.isInteger(value) ? String(value) : value.toFixed(1);

for (const corpusFile of DECTALK_CORPUS_FILES) {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", corpusFile), "utf8"),
  ) as OracleCorpusDocument;
  const entry = corpus.entries.find((candidate) => candidate.id === id);
  if (!entry) continue;
  const recorded = loadFrameFixture(repoRoot, corpus.corpusId).entries[id];
  if (!recorded) throw new Error(`E_FRAME_FIXTURE_MISSING: ${id}`);
  const frames = decodeFrameFixtureEntry(recorded);
  const { track } = textToKlattTrackDetailed(entry.text, undefined, 30, {
    frontendId: "dectalk-english",
  });
  const events = track as readonly TrackEvent[];
  process.stdout.write(`${id}: "${entry.text}"\n`);
  process.stdout.write(
    `packet\tdectalk\there\t${columns.map((column) => column.label).join("\t")}\n`,
  );
  frames.forEach((frame, index) => {
    if (index < first || index > last) return;
    const event = events[eventIndexAt(events, dectalkFrameStartSec(frame.frame))];
    let differs = false;
    const cells = columns.map((column) => {
      const dectalk = column.oracleValue(frame);
      const here = qlattValue(event, column.qlatt);
      if (dectalk != null && here != null && Math.abs(here - dectalk) > parameterTolerance(column)) {
        differs = true;
      }
      return `${show(dectalk)}/${show(here)}`;
    });
    if (diffOnly && !differs) return;
    process.stdout.write(
      `${index}\t${phoneCodeToQlatt(oracleSourceClockPhoneCode(frames, index)) ?? "?"}\t${event?.phoneme ?? "-"}\t${cells.join("\t")}\n`,
    );
  });
}
