#!/usr/bin/env node

/**
 * export-dectalk-vtm-fixture.ts
 * =============================
 * Record what DECtalk 4.63's vocal tract model is given and what it produces,
 * as fixtures for `crates/dectalk-vtm/tests/oracle.rs`.
 *
 * For each phrase it runs two builds of say.exe on the same text:
 *
 *   1. the INSTRUMENTED build (scripts/oracle/dectalk-debug/vtm-trace.md),
 *      which appends every VTM event to the file named by QVTM_TRACE:
 *        S <uiSampleRate> <uiSampleRateChange> <51 speaker definition words>
 *        F <vol_att> <uiSampleRate> <45 frame words>   (before the generator)
 *        W <bDoTuning> 0 <samples of that frame>       (after the generator)
 *   2. the STOCK build, whose WAV is the oracle.
 *
 * It refuses to write a fixture unless the two WAV files are byte-identical
 * and the `W` samples of the trace equal the WAV's samples: the trace then
 * provably describes the stock binary's audio.
 *
 * Written per phrase into the output directory:
 *   <id>.frames.txt   the S and F lines, in order
 *   <id>.wav          the stock say.exe WAV
 *
 * Usage:
 *   DECTALK_VTM_SAY_EXE=<copy>/samples/SAY/build/us/static/say.exe \
 *   DECTALK_VTM_WORKDIR=<copy>/dapi/src/dic \
 *   DECTALK_SAY_EXE=<stock>/samples/SAY/build/us/static/say.exe \
 *   DECTALK_WORKDIR=<stock>/dapi/src/dic \
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-dectalk-vtm-fixture.ts \
 *     [--corpus test/oracle-corpora/dectalk-us-v1.json --out-dir <dir>]
 *
 * Without --corpus it regenerates the checked-in fixtures (CHECKED_IN below)
 * in crates/dectalk-vtm/tests/fixtures. With --corpus it exports every corpus
 * entry (voice paul, the corpus default rate) into --out-dir, which the Rust
 * test replays when DECTALK_VTM_FIXTURE_DIR points at it.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { OracleCorpusDocument } from "./types";

/**
 * `hl` selects the hlsyn fixture `<id>.hl.txt`: "compact" keeps the S, H, P and
 * L lines; "full" adds X and T (the HLFrame and HLState as float bits), which
 * let the Rust test check the port's internal state bit for bit.
 */
type Phrase = { id: string; text: string; hl?: "compact" | "full" };

/** The fixtures kept in the repository: id and the exact text given to say.exe. */
const CHECKED_IN: Phrase[] = [
  { id: "paul-cat", text: "[:np] [:ra 180] cat.", hl: "compact" },
  { id: "paul-judge", text: "[:np] [:ra 180] judge.", hl: "compact" },
  { id: "paul-moon", text: "[:np] [:ra 180] moon.", hl: "compact" },
  { id: "betty-she", text: "[:nb] [:ra 180] she.", hl: "compact" },
  { id: "wendy-hello", text: "[:nw] [:ra 180] hello.", hl: "compact" },
  // A second speaker definition packet arrives in the middle of the audio.
  { id: "paul-harry-switch", text: "[:np] [:ra 180] one. [:nh] two.", hl: "compact" },
  // vol_att other than 100 (CMD/cm_copt.c:1652-1654).
  { id: "paul-volume-att", text: "[:np] [:ra 180] [:volume att 60] cat.", hl: "compact" },
  // Nonzero t0jit in the speaker definition (PH/ph_vset.c:763, voice
  // parameter LA).
  { id: "paul-jitter", text: "[:np] [:ra 180] [:dv la 30] moon.", hl: "compact" },
];

/** Words per event line after the tag and its two leading numbers. */
const SPDEF_PARS = 51; // INCLUDE/cmd.h:209 (SPDEF) + 1
const VOICE_PARS = 45; // PH/ph_defs.h:382
/**
 * Frame words that hold uninitialised memory: PH does not write them and they
 * differ from run to run. Nothing after the trace point reads them
 * (speech_waveform_generator reads words 0-17, 20, 21, 24, 35; vtmiont.c's
 * hlsyn block reads 1, 2, 9, 11, 12, 15-17, 22, 25-32, 36, 37; OutputData reads
 * 17-19), so the exporter writes them as 0 to keep fixtures reproducible.
 * Word 34 (OUT_BNP) is uninitialised in the PH packet and set from the
 * low-level frame before the generator runs.
 */
const UNREAD_FRAME_WORDS: Record<string, number[]> = {
  P: [23, 33, 34, 38, 39, 40, 41, 42, 43, 44],
  F: [23, 33, 38, 39, 40, 41, 42, 43, 44],
  // Speaker definition: SPD_CHIP (PH/ph_defs.h:693-720) has 24 words and its
  // word 20 is `notused`; the packet's remaining 27 words are never set.
  S: [20, ...Array.from({ length: 27 }, (_, index) => 24 + index)],
};

function maskUnreadWords(line: string): string {
  const fields = line.split(" ");
  for (const index of UNREAD_FRAME_WORDS[fields[0]] ?? []) fields[3 + index] = "0";
  return fields.join(" ");
}

/** The hlsyn records: PH packet, HLSpeaker, HLFrame, previous HLFrame, previous HLState, LLFrame, HLState. */
const HL_WORDS: Record<string, number> = { P: 45, H: 174, X: 15, O: 15, Q: 17, L: 48, T: 17 };

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return path.resolve(value);
};
const tracedExe = required("DECTALK_VTM_SAY_EXE");
const tracedWorkDir = required("DECTALK_VTM_WORKDIR");
const stockExe = required("DECTALK_SAY_EXE");
const stockWorkDir = required("DECTALK_WORKDIR");
if (tracedExe === stockExe) {
  throw new Error("DECTALK_VTM_SAY_EXE and DECTALK_SAY_EXE name the same file");
}

function phrasesAndOutDir(): { phrases: Phrase[]; outDir: string } {
  const corpusFlag = flag("corpus");
  if (!corpusFlag) {
    return {
      phrases: CHECKED_IN,
      outDir: path.resolve(
        flag("out-dir") ?? path.join(repoRoot, "crates", "dectalk-vtm", "tests", "fixtures"),
      ),
    };
  }
  const outDirFlag = flag("out-dir");
  if (!outDirFlag) throw new Error("--corpus needs --out-dir");
  const corpus = JSON.parse(
    fs.readFileSync(path.resolve(corpusFlag), "utf8"),
  ) as OracleCorpusDocument;
  const rate = corpus.defaults?.rate;
  if (rate == null) throw new Error(`E_VTM_FIXTURE: ${corpusFlag} has no defaults.rate`);
  return {
    phrases: corpus.entries.map((entry) => ({
      id: entry.id,
      text: `[:np] [:ra ${Math.round(rate)}] ${entry.text}`,
      hl: "full" as const,
    })),
    outDir: path.resolve(outDirFlag),
  };
}

/** The 16-bit samples of a WAV file's `data` chunk. */
function wavSamples(bytes: Buffer, label: string): number[] {
  if (bytes.toString("latin1", 0, 4) !== "RIFF" || bytes.toString("latin1", 8, 12) !== "WAVE") {
    throw new Error(`E_VTM_FIXTURE: ${label}: not a RIFF/WAVE file`);
  }
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("latin1", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "data") {
      const end = Math.min(start + size, bytes.length);
      const samples: number[] = [];
      for (let at = start; at + 2 <= end; at += 2) samples.push(bytes.readInt16LE(at));
      return samples;
    }
    offset = start + size + (size & 1);
  }
  throw new Error(`E_VTM_FIXTURE: ${label}: no data chunk`);
}

function exportPhrase(phrase: Phrase, outDir: string, tmpDir: string): string {
  const tracePath = path.join(tmpDir, `${phrase.id}.qvtm`);
  const tracedWav = path.join(tmpDir, `${phrase.id}.traced.wav`);
  const stockWav = path.join(tmpDir, `${phrase.id}.stock.wav`);
  for (const stale of [tracePath, tracedWav, stockWav]) fs.rmSync(stale, { force: true });

  execFileSync(tracedExe, ["-w", tracedWav, phrase.text], {
    cwd: tracedWorkDir,
    env: { ...process.env, QVTM_TRACE: tracePath },
    stdio: ["ignore", "ignore", "inherit"],
  });
  const stockEnv = { ...process.env };
  delete stockEnv.QVTM_TRACE;
  execFileSync(stockExe, ["-w", stockWav, phrase.text], {
    cwd: stockWorkDir,
    env: stockEnv,
    stdio: ["ignore", "ignore", "inherit"],
  });

  const tracedBytes = fs.readFileSync(tracedWav);
  const stockBytes = fs.readFileSync(stockWav);
  if (!tracedBytes.equals(stockBytes)) {
    throw new Error(
      `E_VTM_FIXTURE: ${phrase.id}: the instrumented build's WAV differs from the stock build's`,
    );
  }
  if (!fs.existsSync(tracePath)) {
    throw new Error(
      `E_VTM_FIXTURE: ${phrase.id}: no trace written; is DECTALK_VTM_SAY_EXE the instrumented build?`,
    );
  }

  const events: string[] = [];
  const hlEvents: string[] = [];
  const traceSamples: number[] = [];
  let frames = 0;
  let speakers = 0;
  for (const line of fs.readFileSync(tracePath, "utf8").split(/\r?\n/)) {
    if (line.length === 0) continue;
    const fields = line.split(" ");
    const tag = fields[0];
    const words = fields.slice(3);
    if (tag === "S") {
      if (words.length !== SPDEF_PARS) {
        throw new Error(`E_VTM_FIXTURE: ${phrase.id}: S line has ${words.length} words`);
      }
      speakers += 1;
      events.push(maskUnreadWords(line));
      hlEvents.push(maskUnreadWords(line));
    } else if (tag === "F") {
      if (words.length !== VOICE_PARS) {
        throw new Error(`E_VTM_FIXTURE: ${phrase.id}: F line has ${words.length} words`);
      }
      frames += 1;
      events.push(maskUnreadWords(line));
    } else if (tag === "W") {
      if (fields[1] !== "0") {
        throw new Error(`E_VTM_FIXTURE: ${phrase.id}: bDoTuning was set; the port assumes FALSE`);
      }
      for (const word of words) traceSamples.push(Number(word));
    } else if (tag in HL_WORDS) {
      if (words.length !== HL_WORDS[tag]) {
        throw new Error(`E_VTM_FIXTURE: ${phrase.id}: ${tag} line has ${words.length} words`);
      }
      if (tag === "P" || tag === "H" || tag === "L") hlEvents.push(maskUnreadWords(line));
      else if (phrase.hl === "full" && (tag === "X" || tag === "T")) hlEvents.push(line);
    } else {
      throw new Error(`E_VTM_FIXTURE: ${phrase.id}: unknown trace line ${JSON.stringify(line)}`);
    }
  }

  const samples = wavSamples(stockBytes, phrase.id);
  if (samples.length !== traceSamples.length) {
    throw new Error(
      `E_VTM_FIXTURE: ${phrase.id}: trace has ${traceSamples.length} samples, WAV has ${samples.length}`,
    );
  }
  const firstDifference = samples.findIndex((sample, index) => sample !== traceSamples[index]);
  if (firstDifference >= 0) {
    throw new Error(
      `E_VTM_FIXTURE: ${phrase.id}: trace and WAV differ at sample ${firstDifference}`,
    );
  }

  const header = [
    "# DECtalk 4.63 vocal tract model input, written by scripts/oracle/export-dectalk-vtm-fixture.ts",
    `# say.exe text: ${phrase.text}`,
    "# S <uiSampleRate> <uiSampleRateChange> <51 speaker definition words>",
    "# F <vol_att> <uiSampleRate> <45 frame words>",
  ];
  fs.writeFileSync(
    path.join(outDir, `${phrase.id}.frames.txt`),
    `${[...header, ...events].join("\n")}\n`,
  );
  fs.writeFileSync(path.join(outDir, `${phrase.id}.wav`), stockBytes);

  const hlPath = path.join(outDir, `${phrase.id}.hl.txt`);
  if (phrase.hl) {
    const hlHeader = [
      "# DECtalk 4.63 hlsyn input and output, written by scripts/oracle/export-dectalk-vtm-fixture.ts",
      `# say.exe text: ${phrase.text}`,
      "# S <uiSampleRate> <uiSampleRateChange> <51 speaker definition words>",
      "# H <sizeof> 0 <174 words: HLSpeaker float bits, in effect from the next frame>",
      "# P <lang_curr> 0 <45 PH packet words, before hlsyn>",
      "# L 0 0 <48 LLFrame words, right after HLSynthesizeLLFrame>",
      ...(phrase.hl === "full"
        ? [
            "# X <sizeof> 0 <15 words: HLFrame built from the packet (float bits; word 1 is place)>",
            "# T 0 0 <17 words: HLState after the call (float bits; word 2 is loc)>",
          ]
        : []),
    ];
    fs.writeFileSync(hlPath, `${[...hlHeader, ...hlEvents].join("\n")}\n`);
  } else {
    fs.rmSync(hlPath, { force: true });
  }
  return `${phrase.id}: speakers=${speakers} frames=${frames} samples=${samples.length}`;
}

const { phrases, outDir } = phrasesAndOutDir();
fs.mkdirSync(outDir, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-vtm-"));
try {
  for (const phrase of phrases) {
    console.log(exportPhrase(phrase, outDir, tmpDir));
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
console.log(`${phrases.length} fixtures written to ${outDir}`);
