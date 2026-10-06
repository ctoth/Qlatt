#!/usr/bin/env node

/**
 * export-frame-fixture.ts
 * =======================
 * Record the parameter packets DECtalk 4.63's phonetic stage emits for every
 * entry of an oracle corpus, as a checked-in fixture. The frontend's track is
 * checked against it, packet by packet, without say.exe
 * (test/dectalk-frame-gate.test.ts).
 *
 * It runs the oracle say.exe with `-lt <file>`, the packet trace written in
 * ph_claus.c:695-744 (one JSON line a packet: 71 samples at 11025 Hz). The
 * same command line the scoreboard uses (adapters/render-dectalk.ts): voice
 * tag, `[:ra <rate>]`, then the text.
 *
 * What a packet holds, and what it does not, is set out in
 * frame-parameters.ts. In short: these are the phonetic stage's outputs. In
 * this build (HLSYN, dectalkf.h:114) the synthesizer reads F1-F3, B2, B3, T0
 * and A2 (as a code) from them and recomputes AV, AP, A3-A6, AB, TLT and B1
 * from area parameters the trace does not carry (VTM/vtmiont.c:660-683,
 * 1198-1199, 1300-1319).
 *
 * Those area parameters (AG, AL, AN, ABLADE, PS, CNK, DC, UE, with F4, ATB
 * and PLACE) are recorded too, as oracle-only columns, from the `P` record
 * that the instrumented copy of the tree writes to the file named by
 * QVTM_TRACE: the whole packet as the VTM receives it. So say.exe here must
 * be that copy's (built as scripts/oracle/dectalk-debug/vtm-trace.md on
 * branch dsp/dectalk-vtm describes; its audio is byte-identical to the stock
 * build's and it keeps `-lt`). Every word both traces carry is checked to be
 * equal on every packet.
 *
 * Usage:
 *   DECTALK_SAY_EXE=<copy>/samples/SAY/build/us/static/say.exe \
 *   DECTALK_WORKDIR=<copy>/dapi/src/dic \
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-frame-fixture.ts [--corpus <corpusId>] [--out <file>]
 * Without --corpus it writes the fixture of every corpus in DECTALK_CORPUS_FILES.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectedCorpusFiles } from "./allophones";
import { parseDectalkTraceFile } from "./dectalk-trace";
import {
  encodeFrameFixtureEntry,
  FRAME_FIXTURE_AREA_COLUMNS,
  FRAME_FIXTURE_COLUMNS,
  type FrameFixture,
  type FrameFixtureEntry,
} from "./frame-fixture";
import type { OracleCorpusDocument } from "./types";

// DECtalk voice-selection commands, as in adapters/render-dectalk.ts.
const VOICE_PREFIX: Readonly<Record<string, string>> = {
  paul: "[:np]",
  betty: "[:nb]",
  harry: "[:nh]",
  frank: "[:nf]",
  dennis: "[:nd]",
  kit: "[:nk]",
  ursula: "[:nu]",
  rita: "[:nr]",
  wendy: "[:nw]",
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const exePath = process.env.DECTALK_SAY_EXE;
const workDir = process.env.DECTALK_WORKDIR;
if (!exePath || !workDir) {
  throw new Error(
    "Set DECTALK_SAY_EXE and DECTALK_WORKDIR to the oracle say.exe and its dic directory",
  );
}
const corpusFiles = selectedCorpusFiles(argv);
if (flag("out") && corpusFiles.length !== 1) {
  throw new Error("--out needs --corpus: one output file holds one corpus");
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-frames-"));
try {
  for (const corpusFile of corpusFiles) {
    const corpus = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", corpusFile), "utf8"),
    ) as OracleCorpusDocument;
    const entries: Record<string, FrameFixtureEntry> = {};
    for (const entry of corpus.entries) {
      const voice =
        VOICE_PREFIX[(entry.voiceId ?? corpus.defaults?.voiceId ?? "paul").toLowerCase()];
      if (!voice) throw new Error(`E_FRAME_FIXTURE_VOICE: ${entry.id}`);
      const rate = entry.rate ?? corpus.defaults?.rate ?? 180;
      // The trace is appended to; every phrase gets a file of its own.
      const tracePath = path.join(tempDir, `${entry.id}.trace.jsonl`);
      const packetPath = path.join(tempDir, `${entry.id}.qvtm.txt`);
      execFileSync(
        exePath,
        [
          "-w",
          path.join(tempDir, "out.wav"),
          "-lt",
          tracePath,
          `${voice} [:ra ${rate}] ${entry.text}`,
        ],
        {
          cwd: workDir,
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024,
          env: { ...process.env, QVTM_TRACE: packetPath },
        },
      );
      const { frames } = parseDectalkTraceFile(tracePath);
      if (frames.length === 0) throw new Error(`E_FRAME_FIXTURE_EMPTY: ${entry.id}: no packets`);
      frames.forEach((frame, index) => {
        if (frame.frame !== index) {
          throw new Error(`E_FRAME_FIXTURE_ORDER: ${entry.id}: packet ${frame.frame} at ${index}`);
        }
      });
      if (!fs.existsSync(packetPath)) {
        throw new Error(
          `E_FRAME_FIXTURE_NO_P: ${entry.id}: say.exe wrote no QVTM_TRACE file; DECTALK_SAY_EXE must be the instrumented copy`,
        );
      }
      // `P <lang> 0 <45 words>`: the packet as the VTM receives it.
      const packetWords = fs
        .readFileSync(packetPath, "utf8")
        .split(/\r?\n/u)
        .filter((line) => line.startsWith("P "))
        .map((line) => line.trim().split(/\s+/u).slice(3).map(Number));
      try {
        entries[entry.id] = encodeFrameFixtureEntry(entry.text, frames, packetWords);
      } catch (error) {
        throw new Error(`${entry.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const fixture: FrameFixture = {
      schemaVersion: "v2",
      corpusId: corpus.corpusId,
      engine:
        "DECtalk 4.63 say.exe: -lt packet trace (ph_claus.c:695-744) and the P record of the QVTM_TRACE copy",
      columns: [...FRAME_FIXTURE_COLUMNS, ...FRAME_FIXTURE_AREA_COLUMNS],
      entries,
    };
    const outPath = path.resolve(
      flag("out") ??
        path.join(repoRoot, "test", "fixtures", "dectalk-oracle", `${corpus.corpusId}.frames.json`),
    );
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(fixture)}\n`, "utf8");
    const packets = Object.values(entries).reduce((sum, entry) => sum + entry.packets, 0);
    process.stdout.write(
      `wrote ${outPath} (${Object.keys(entries).length} entries, ${packets} packets)\n`,
    );
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
