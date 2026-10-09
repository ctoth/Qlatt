/**
 * command-probe.ts
 * ================
 * What DECtalk 4.63 does with a text that holds in-text commands
 * ("[:rate 300]", "[:nb]", "[:dv ap 200]", "[:phoneme arpabet speak on]"):
 * the text is given to the instrumented say.exe exactly as written, with no
 * command added in front, and both of its traces are read.
 *
 * Printed for each text:
 *   T      each clause the command parser hands to letter-to-sound
 *          (QPH_TRACE, CMD/cm_text.c; README.md of this directory)
 *   S      the symbols the phonemic stage receives for each clause
 *   run    one line per stretch of packets between two speaker definitions
 *          the synthesizer is given (QVTM_TRACE, vtm-trace.md): how many
 *          packets, how many of them voiced (AV > 0), the mean and the range
 *          of the pitch word OUT_T0 over the voiced ones, the volume
 *          attenuation, and the speaker definition words that differ from
 *          the stretch before
 *   total  packets in all
 *
 * A measurement tool: exit code 0 unless say.exe fails.
 *
 * Usage (instrumented say.exe as for trace-text.ts):
 *   DECTALK_SAY_EXE=... DECTALK_WORKDIR=... \
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/command-probe.ts [--file <one text per line>] "text" ...
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { requiredEnvironment, symbolName } from "./text-trace";

// PH/ph_defs.h:568-569.
const OUT_T0 = 9;
const OUT_AV = 10;

const args = process.argv.slice(2);
const texts: string[] = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--file") {
    index += 1;
    texts.push(
      ...fs
        .readFileSync(args[index] as string, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0 && !line.startsWith("#")),
    );
  } else {
    texts.push(args[index] as string);
  }
}
if (texts.length === 0) throw new Error("give a text or --file <texts>");

const exe = requiredEnvironment("DECTALK_SAY_EXE");
const workDir = requiredEnvironment("DECTALK_WORKDIR");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-command-probe-"));

type Run = { spdef: number[]; packets: number[][]; volAtt: number[] };

try {
  for (const text of texts) {
    const phTrace = path.join(scratch, "ph.txt");
    const vtmTrace = path.join(scratch, "vtm.txt");
    fs.rmSync(phTrace, { force: true });
    fs.rmSync(vtmTrace, { force: true });
    const say = spawnSync(exe, ["-w", path.join(scratch, "out.wav"), text], {
      cwd: workDir,
      env: { ...process.env, QPH_TRACE: phTrace, QVTM_TRACE: vtmTrace },
      encoding: "utf8",
    });
    console.log(`in     ${text}`);
    if (say.status !== 0) {
      console.log(`       say.exe exited ${String(say.status)}: ${say.stderr.trim()}`);
      continue;
    }
    const phLines = fs.existsSync(phTrace) ? fs.readFileSync(phTrace, "utf8").split(/\r?\n/) : [];
    for (const line of phLines) {
      if (line.startsWith("T ")) {
        const clause = line.slice(2);
        // The host's empty clauses at the text's end say nothing.
        if (clause.replace(/\\x0[ab]/g, "").trim().length > 0) console.log(`T      ${clause}`);
      } else if (line.startsWith("S ")) {
        const symbols = line
          .slice(2)
          .trim()
          .split(/\s+/)
          .map((hex) => symbolName(Number.parseInt(hex, 16)));
        console.log(`S      ${symbols.join(" ")}`);
      }
    }
    const runs: Run[] = [];
    const vtmLines = fs.existsSync(vtmTrace)
      ? fs.readFileSync(vtmTrace, "utf8").split(/\r?\n/)
      : [];
    for (const line of vtmLines) {
      const fields = line.trim().split(/\s+/);
      if (fields[0] === "S") {
        runs.push({ spdef: fields.slice(3).map(Number), packets: [], volAtt: [] });
      } else if (fields[0] === "F") {
        if (runs.length === 0) runs.push({ spdef: [], packets: [], volAtt: [] });
        const run = runs.at(-1) as Run;
        run.volAtt.push(Number(fields[1]));
        run.packets.push(fields.slice(3).map(Number));
      }
    }
    let total = 0;
    runs.forEach((run, index) => {
      total += run.packets.length;
      const voiced = run.packets.filter((packet) => (packet[OUT_AV] ?? 0) > 0);
      const pitch = voiced.map((packet) => packet[OUT_T0] ?? 0);
      const mean =
        pitch.length > 0
          ? Math.round(pitch.reduce((sum, value) => sum + value, 0) / pitch.length)
          : 0;
      const before = runs[index - 1]?.spdef ?? [];
      const changed = run.spdef.flatMap((word, at) =>
        index > 0 && before[at] !== word
          ? [`[${at.toString()}] ${String(before[at])}>${word.toString()}`]
          : [],
      );
      console.log(
        `run    ${run.packets.length.toString()} packets, ${voiced.length.toString()} voiced, T0 mean ${mean.toString()}` +
          ` (${pitch.length > 0 ? `${Math.min(...pitch).toString()}-${Math.max(...pitch).toString()}` : "none"})` +
          `, volume attenuation ${[...new Set(run.volAtt)].join("/")}` +
          (changed.length > 0 ? `, speaker words ${changed.join(" ")}` : ""),
      );
    });
    console.log(`total  ${total.toString()} packets`);
    console.log("");
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
