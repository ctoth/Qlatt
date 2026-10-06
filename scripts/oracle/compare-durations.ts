#!/usr/bin/env node

/**
 * compare-durations.ts
 * ====================
 * Compare allophone durations, in DECtalk controller frames, between the
 * dectalk-english frontend and DECtalk 4.63's own frame trace, for every entry
 * of one or more oracle corpora. No audio is rendered.
 *
 * DECtalk side: frames of `oracle.trace.jsonl` grouped by `phoneIndex`; the
 * number of frames in a group is that allophone's duration (p_us_tim.c stores
 * `allodurs[]` in frames). Group 0 is the clause-initial silence, which this
 * frontend emits as a lowering edge rather than a Segment, so it is skipped.
 *
 * Qlatt side: active Segment items in order. A stop is one DECtalk allophone
 * but several Segments here (closure, release, aspiration); consecutive
 * Segments named `X`, `X_REL`, `X_ASP`... are summed. Durations are divided by
 * the frontend's controller frame period.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-durations.ts \
 *     --run <corpus.json>=<oracle-root> [--run <corpus.json>=<oracle-root> ...] \
 *     [--verbose] [--json]
 *
 * <oracle-root> is the directory that directly contains the phrase folders.
 * A measurement tool: exit code is 0 unless an input is missing.
 */

import fs from "node:fs";
import path from "node:path";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import {
  DECTALK_NOMINAL_CONTROL_FRAME_PERIOD_SEC,
  parseDectalkTraceFile,
} from "./dectalk-trace.ts";
import type { OracleCorpusDocument } from "./types";

type Allophone = { label: string; frames: number };
type PhraseResult = {
  id: string;
  text: string;
  status: "compared" | "count_mismatch" | "error";
  message?: string;
  dectalk: Allophone[];
  qlatt: Allophone[];
};

const argv = process.argv.slice(2);
const runs: Array<{ corpusPath: string; oracleRoot: string }> = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] !== "--run") continue;
  const [corpusPath, oracleRoot] = (argv[i + 1] ?? "").split("=");
  if (!corpusPath || !oracleRoot) throw new Error("--run expects <corpus.json>=<oracle-root>");
  runs.push({ corpusPath: path.resolve(corpusPath), oracleRoot: path.resolve(oracleRoot) });
}
if (runs.length === 0) {
  throw new Error(
    "Usage: compare-durations --run <corpus.json>=<oracle-root> [...] [--verbose] [--json]",
  );
}
const verbose = argv.includes("--verbose");
const asJson = argv.includes("--json");
const frameMs = DECTALK_NOMINAL_CONTROL_FRAME_PERIOD_SEC * 1000;

function dectalkAllophones(tracePath: string): Allophone[] {
  const { frames } = parseDectalkTraceFile(tracePath);
  const groups: Allophone[] = [];
  let currentIndex: number | undefined;
  for (const frame of frames) {
    if (frame.phoneIndex !== currentIndex) {
      currentIndex = frame.phoneIndex;
      groups.push({ label: `#${frame.phoneIndex}`, frames: 0 });
    }
    groups[groups.length - 1].frames += 1;
  }
  return groups.slice(1);
}

function qlattAllophones(text: string, transitionMs: number): Allophone[] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, transitionMs, {
    frontendId: "dectalk-english",
  });
  const allophones: Allophone[] = [];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    const duration = Number(item.get("duration"));
    const previous = allophones[allophones.length - 1];
    if (previous && phoneme.startsWith(`${previous.label.split("+")[0]}_`)) {
      previous.label = `${previous.label}+${phoneme}`;
      previous.frames += duration / frameMs;
    } else {
      allophones.push({ label: phoneme, frames: duration / frameMs });
    }
  }
  return allophones;
}

const results: PhraseResult[] = [];
for (const run of runs) {
  const corpus = JSON.parse(fs.readFileSync(run.corpusPath, "utf8")) as OracleCorpusDocument;
  for (const entry of corpus.entries) {
    const tracePath = path.join(run.oracleRoot, entry.id, "oracle", "oracle.trace.jsonl");
    const base = { id: entry.id, text: entry.text };
    if (!fs.existsSync(tracePath)) throw new Error(`E_ORACLE_TRACE_MISSING: ${tracePath}`);
    const dectalk = dectalkAllophones(tracePath);
    try {
      const qlatt = qlattAllophones(entry.text, corpus.defaults?.transitionMs ?? 30);
      results.push({
        ...base,
        status: dectalk.length === qlatt.length ? "compared" : "count_mismatch",
        dectalk,
        qlatt,
      });
    } catch (error) {
      results.push({
        ...base,
        status: "error",
        message: error instanceof Error ? error.message : String(error),
        dectalk,
        qlatt: [],
      });
    }
  }
}

let compared = 0;
let exact = 0;
let fractional = 0;
let absSum = 0;
const histogram = new Map<number, number>();
for (const result of results) {
  if (result.status !== "compared") continue;
  result.qlatt.forEach((ours, index) => {
    const theirs = result.dectalk[index].frames;
    const delta = ours.frames - theirs;
    compared += 1;
    if (Math.abs(delta) < 1e-6) exact += 1;
    if (Math.abs(ours.frames - Math.round(ours.frames)) > 1e-6) fractional += 1;
    absSum += Math.abs(delta);
    const bucket = Math.round(delta);
    histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
  });
}
const summary = {
  phrases: results.length,
  phrasesCompared: results.filter((result) => result.status === "compared").length,
  phrasesCountMismatch: results.filter((result) => result.status === "count_mismatch").length,
  phrasesError: results.filter((result) => result.status === "error").length,
  allophonesCompared: compared,
  exact,
  exactFraction: compared ? exact / compared : null,
  notWholeFrames: fractional,
  meanAbsDeltaFrames: compared ? absSum / compared : null,
  deltaHistogram: Object.fromEntries([...histogram].sort((a, b) => a[0] - b[0])),
};

if (asJson) {
  console.log(JSON.stringify({ summary, results }, null, 2));
} else {
  for (const result of results) {
    if (result.status === "error") {
      console.log(`${result.id}\tERROR\t${result.message}`);
      continue;
    }
    if (result.status === "count_mismatch") {
      console.log(
        `${result.id}\tCOUNT\tdectalk=${result.dectalk.length} qlatt=${result.qlatt.length}` +
          `\t${result.qlatt.map((a) => a.label).join(" ")}`,
      );
      continue;
    }
    if (!verbose) continue;
    console.log(
      `${result.id}\t` +
        result.qlatt
          .map((ours, index) => {
            const theirs = result.dectalk[index].frames;
            return `${ours.label}:${Number(ours.frames.toFixed(2))}/${theirs}`;
          })
          .join(" "),
    );
  }
  console.log(JSON.stringify(summary));
}
