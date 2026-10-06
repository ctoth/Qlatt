#!/usr/bin/env node

/**
 * compare-duration-frames.ts
 * ==========================
 * Compares the dectalk-english duration rules with DECtalk's own record, one
 * allophone at a time, for every clause whose allophone sequence already
 * equals DECtalk's (other clauses are skipped and counted).
 *
 * For each phone it compares the final frame count and, from the Segment's
 * write history, the state (prcnt, deldur, durmin) after each rule at which
 * DECtalk recorded one (rules 2, 3, 5, 6, 7, 8, 9, 13, 16, 24). A rule here is
 * named dectalk_timing_<n>_..., so "the state after rule n" is the last write
 * by a rule numbered n or lower. The first rule at which a phone differs is
 * tallied, which names the rule to look at.
 *
 * DECtalk's record: test/fixtures/dectalk-oracle/<corpus>.durations.json.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/compare-duration-frames.ts [--verbose] [--id <phraseId>]
 *
 * A measurement tool: exit code 0.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../../src/tts-frontend.ts";
import type { OracleCorpusDocument } from "./types";

// DECtalk 4.63 INCLUDE/l_all_ph.h, `#define US_<NAME> <index>`.
const US_NAMES = [
  "SIL", "IY", "IH", "EY", "EH", "AE", "AA", "AY", "AW", "AH",
  "AO", "OW", "OY", "UH", "UW", "RR", "YU", "AX", "IX", "IR",
  "ER", "AR", "OR", "UR", "W", "Y", "R", "LL", "HX", "RX",
  "LX", "M", "N", "NX", "EL", "DZ", "EN", "F", "V", "TH",
  "DH", "S", "Z", "SH", "ZH", "P", "B", "T", "D", "K",
  "G", "DX", "TX", "Q", "CH", "JH", "DF", "TZ", "CZ",
]; // biome-ignore format: ten per row, as in the header
const PORT_TO_DECTALK: Readonly<Record<string, string>> = {
  HH: "HX",
  NG: "NX",
  L: "LL",
  GS: "Q",
};

type State = { prcnt: number; deldur: number; durmin: number };
type Recorded = {
  kind: string;
  ph?: number;
  frames: number;
  durinh?: number;
  durmin?: number;
  after?: Record<string, State>;
};
type Mine = {
  name: string;
  frames: number;
  durinh: number;
  stateAfter: (rule: number) => State;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const verbose = argv.includes("--verbose");
const onlyId = argv.includes("--id") ? argv[argv.indexOf("--id") + 1] : undefined;

const FIELDS = {
  prcnt: "timing_percent",
  deldur: "timing_added_frames",
  durmin: "timing_minimum_frames",
} as const;

/** The number in dectalk_timing_<n>_...; setup counts as 0, unnumbered as 25. */
function ruleNumber(ruleId: string | undefined): number {
  if (!ruleId || ruleId === "dectalk_timing_setup") return 0;
  const match = /^dectalk_timing_(\d+)_/.exec(ruleId);
  return match ? Number(match[1]) : 25;
}

function qlattClauses(text: string, transitionMs: number): Mine[][] {
  const { utterance } = textToKlattTrackDetailed(text, undefined, transitionMs, {
    frontendId: "dectalk-english",
  });
  const clauses: Mine[][] = [[]];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    if (phoneme === "SIL") {
      if (item.get("punctuationSymbol") != null && clauses[clauses.length - 1].length > 0) {
        clauses.push([]);
      }
      continue;
    }
    const type = item.get("type");
    if (type === "stop_release" || type === "stop_aspiration") continue;
    const bare = phoneme.replace(/[0-9]$/, "");
    clauses[clauses.length - 1].push({
      name: PORT_TO_DECTALK[bare] ?? bare,
      frames: Number(item.get("timing_frames")),
      durinh: Number(item.get("timing_inherent_frames")),
      stateAfter: (rule) => {
        const state = {} as State;
        for (const [key, field] of Object.entries(FIELDS) as [keyof State, string][]) {
          const writes = item.writes(field).filter((write) => ruleNumber(write.ruleId) <= rule);
          state[key] = Number(writes.at(-1)?.value);
        }
        return state;
      },
    });
  }
  return clauses.filter((clause) => clause.length > 0);
}

let clausesCompared = 0;
let clausesSkipped = 0;
let phones = 0;
let framesEqual = 0;
let statesEqual = 0;
let absoluteError = 0;
const firstDivergence = new Map<string, number>();
for (const file of ["dectalk-us-v1.json", "dectalk-us-heldout-v1.json"]) {
  const corpus = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", file), "utf8"),
  ) as OracleCorpusDocument;
  const fixture = JSON.parse(
    fs.readFileSync(
      path.join(
        repoRoot,
        "test",
        "fixtures",
        "dectalk-oracle",
        `${corpus.corpusId}.durations.json`,
      ),
      "utf8",
    ),
  ) as { entries: Record<string, { clauses: Recorded[][] }> };
  for (const entry of corpus.entries) {
    if (onlyId && entry.id !== onlyId) continue;
    const dectalk = fixture.entries[entry.id].clauses.map((clause) =>
      clause.filter((allophone) => allophone.kind === "phone"),
    );
    let qlatt: Mine[][];
    try {
      qlatt = qlattClauses(entry.text, corpus.defaults?.transitionMs ?? 30);
    } catch (error) {
      clausesSkipped += dectalk.length;
      if (verbose) console.log(`${entry.id}: threw ${String(error).split("\n")[0]}`);
      continue;
    }
    dectalk.forEach((theirs, clauseIndex) => {
      const ours = qlatt[clauseIndex] ?? [];
      const sameSequence =
        theirs.length === ours.length &&
        theirs.every((phone, i) => US_NAMES[phone.ph as number] === ours[i].name);
      if (!sameSequence) {
        clausesSkipped += 1;
        return;
      }
      clausesCompared += 1;
      theirs.forEach((recorded, i) => {
        const mine = ours[i];
        phones += 1;
        absoluteError += Math.abs(mine.frames - recorded.frames);
        if (mine.frames === recorded.frames) framesEqual += 1;
        let diverged: string | undefined;
        let detail = "";
        if (mine.durinh !== recorded.durinh) {
          diverged = "inherent";
          detail = `durinh DECtalk ${recorded.durinh} port ${mine.durinh}`;
        }
        const rules = Object.keys(recorded.after ?? {}).sort((a, b) => Number(a) - Number(b));
        for (const rule of rules) {
          if (diverged) break;
          const theirState = (recorded.after as Record<string, State>)[rule];
          const myState = mine.stateAfter(Number(rule));
          if (
            theirState.prcnt !== myState.prcnt ||
            theirState.deldur !== myState.deldur ||
            theirState.durmin !== myState.durmin
          ) {
            diverged = rule;
            detail = `DECtalk ${JSON.stringify(theirState)} port ${JSON.stringify(myState)}`;
          }
        }
        if (!diverged && mine.frames !== recorded.frames) {
          diverged = "final";
          detail = `frames DECtalk ${recorded.frames} port ${mine.frames}`;
        }
        if (!diverged) {
          statesEqual += 1;
          return;
        }
        firstDivergence.set(diverged, (firstDivergence.get(diverged) ?? 0) + 1);
        if (verbose) {
          console.log(
            `${entry.id}[${clauseIndex}] #${i + 1} ${mine.name} first differs at ${diverged}: ${detail}`,
          );
        }
      });
    });
  }
}
console.log(
  JSON.stringify({
    clausesCompared,
    clausesSkipped,
    phones,
    framesEqual,
    statesEqual,
    meanAbsoluteFrameError: phones > 0 ? Number((absoluteError / phones).toFixed(3)) : null,
    firstDivergenceByRule: Object.fromEntries(
      [...firstDivergence].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })),
    ),
  }),
);
