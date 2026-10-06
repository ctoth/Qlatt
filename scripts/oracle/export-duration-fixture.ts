#!/usr/bin/env node

/**
 * export-duration-fixture.ts
 * ==========================
 * Record DECtalk 4.63's duration computation, rule by rule, for every entry of
 * an oracle corpus, as a checked-in fixture. The duration port
 * (public/rules/frontends/dectalk-english/phases/duration.yaml) is checked
 * against it without say.exe.
 *
 * It needs an INSTRUMENTED build of say.exe: p_us_tim.c compiled with
 * /DMSDBG5 (DECtalk's own final-duration prints) plus the `QD` state prints
 * added by scripts/oracle/dectalk-debug/p_us_tim-qd.patch. Build it from a COPY
 * of the DECtalk tree, never in the tree that holds the oracle say.exe: the
 * prints go to stdout, which the phoneme-log capture reads.
 *
 * Output lines consumed, per allophone, in order:
 *   QD phone n=.. ph=.. struc=.. bou=.. stress=.. fea=.. nallotot=.. durinh=.. durmin=..
 *   QD after=<rule> prcnt=.. deldur=.. durmin=..       (state after that rule)
 *   QD final n=.. code=.. struc=.. durxx=<frames>      (final duration)
 * A silence prints only the `QD final` line: Rule 1 sets its pause and skips
 * the rest. `QD final` comes after the /h/ cap (p_us_tim.c:936-940), which
 * DECtalk's own MSDBG5 print precedes, so it is the value the synthesizer uses.
 *
 * `prcnt` is the multiplicative term in 1/128 units, `deldur` the additive
 * term in frames, `durinh`/`durmin` the inherent and minimum durations in
 * frames; final = ((prcnt*(durinh-durmin))>>7) + durmin + deldur
 * (p_us_tim.c:897-927).
 *
 * Usage:
 *   DECTALK_DEBUG_SAY_EXE=<copy>/samples/SAY/build/us/static/say.exe \
 *   DECTALK_DEBUG_WORKDIR=<copy>/dapi/src/dic \
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-duration-fixture.ts \
 *     [--corpus test/oracle-corpora/dectalk-us-v1.json] [--out <file>]
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OracleCorpusDocument } from "./types";

type RuleState = { prcnt: number; deldur: number; durmin: number };
type Allophone =
  | { kind: "silence"; struc: number; frames: number }
  | {
      kind: "phone";
      n: number;
      ph: number;
      struc: number;
      bou: number;
      stress: number;
      fea: number;
      nallotot: number;
      durinh: number;
      durmin: number;
      after: Record<string, RuleState>;
      frames: number;
    };

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const exePath = process.env.DECTALK_DEBUG_SAY_EXE;
const workDir = process.env.DECTALK_DEBUG_WORKDIR;
if (!exePath || !workDir) {
  throw new Error("Set DECTALK_DEBUG_SAY_EXE and DECTALK_DEBUG_WORKDIR to the instrumented build");
}
const corpusPath = path.resolve(
  flag("corpus") ?? path.join(repoRoot, "test", "oracle-corpora", "dectalk-us-v1.json"),
);
const corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8")) as OracleCorpusDocument;
const outPath = path.resolve(
  flag("out") ??
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", `${corpus.corpusId}.durations.json`),
);

const numbers = (line: string): Record<string, number> =>
  Object.fromEntries(
    [...line.matchAll(/([A-Za-z]+)=(-?\d+)/g)].map((match) => [match[1], Number(match[2])]),
  );

/**
 * DECtalk times one clause at a time: allophone numbering restarts at 0 for
 * each clause, and every cross-allophone reference in the rules (previous,
 * next, next-but-one, clause length) stays inside the clause.
 */
function parse(stdout: string, id: string): Allophone[][] {
  const clauses: Allophone[][] = [];
  let allophones: Allophone[] = [];
  let open: Extract<Allophone, { kind: "phone" }> | undefined;
  for (const line of stdout.split(/\r?\n/)) {
    if (line.startsWith("QD phone")) {
      const value = numbers(line);
      open = {
        kind: "phone",
        n: value.n,
        ph: value.ph,
        struc: value.struc,
        bou: value.bou,
        stress: value.stress,
        fea: value.fea,
        nallotot: value.nallotot,
        durinh: value.durinh,
        durmin: value.durmin,
        after: {},
        frames: Number.NaN,
      };
    } else if (line.startsWith("QD after")) {
      if (!open) throw new Error(`E_DURATION_TRACE: ${id}: state line before a phone line`);
      const value = numbers(line);
      open.after[String(value.after)] = {
        prcnt: value.prcnt,
        deldur: value.deldur,
        durmin: value.durmin,
      };
    } else if (line.startsWith("QD final")) {
      // Printed at break3 for every allophone, after the HX cap (936-940) and
      // on the early exits (193-205 user duration, 713-717 [s]/[th]+[sh]).
      const value = numbers(line);
      if (value.n === 0 && allophones.length > 0) {
        clauses.push(allophones);
        allophones = [];
      }
      if (value.n !== allophones.length) {
        throw new Error(`E_DURATION_TRACE: ${id}: allophone ${value.n} out of order`);
      }
      if (open) {
        open.frames = value.durxx;
        allophones.push(open);
        open = undefined;
      } else {
        // Rule 1 (silence) skips the phone line. allofeats[] is 32 bits wide;
        // the rules read it through a 16-bit `short`.
        allophones.push({ kind: "silence", struc: (value.struc << 16) >> 16, frames: value.durxx });
      }
    }
  }
  if (open) throw new Error(`E_DURATION_TRACE: ${id}: phone ${open.n} has no final duration`);
  if (allophones.length > 0) clauses.push(allophones);
  if (clauses.length === 0) throw new Error(`E_DURATION_TRACE: ${id}: no duration output`);
  return clauses;
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-durations-"));
const entries: Record<string, { text: string; clauses: Allophone[][] }> = {};
try {
  for (const entry of corpus.entries) {
    const rate = entry.rate ?? corpus.defaults?.rate ?? 180;
    const stdout = execFileSync(
      exePath,
      ["-w", path.join(tempDir, "out.wav"), `[:np] [:ra ${rate}] ${entry.text}`],
      { cwd: workDir, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    entries[entry.id] = { text: entry.text, clauses: parse(stdout, entry.id) };
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

const fixture = {
  schemaVersion: "v2",
  corpusId: corpus.corpusId,
  engine: "DECtalk 4.63 say.exe, p_us_tim.c built with /DMSDBG5 and QD state prints",
  entries,
};
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(fixture)}\n`, "utf8");
process.stdout.write(`wrote ${outPath} (${Object.keys(entries).length} entries)\n`);
