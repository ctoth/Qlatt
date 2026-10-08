/**
 * trace-text.ts
 * =============
 * Prints, for each text, what DECtalk 4.63's text stage does with it:
 *
 *   text  each clause as the command parser hands it to letter-to-sound
 *         (CMD/cm_text.c output_buf, after the CMD/par_*.c rule parser);
 *         a byte outside printable ASCII is written \xNN
 *   ph    the symbols the phonemic stage receives for each clause
 *         (phones by name; stress and boundary symbols of INCLUDE/l_com_ph.h)
 *
 * It needs the instrumented say.exe described in README.md of this directory:
 * the build that appends `T <text>` (CMD/cm_text.c, each parsed clause) and
 * `S <symbols>` (PH/ph_sort.c, each clause) lines to the file named by the
 * environment variable QPH_TRACE.
 *
 * Usage:
 *   DECTALK_SAY_EXE=<instrumented>/samples/SAY/build/us/static/say.exe \
 *   DECTALK_WORKDIR=<instrumented>/dapi/src/dic \
 *   node --no-warnings --loader ts-node/esm/transpile-only \
 *     --experimental-specifier-resolution=node \
 *     scripts/oracle/dectalk-debug/trace-text.ts [--file <one text per line>] "text" ...
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// INCLUDE/l_com_ph.h:45-67.
const CONTROL: Record<number, string> = {
  100: "~",
  101: "`3",
  102: "`",
  103: "'",
  104: '"',
  105: "/",
  106: "\\",
  107: "/\\",
  108: "-",
  109: "*",
  110: "#",
  111: "_",
  112: "(pp)",
  113: "(vp)",
  114: "(rel)",
  115: ",",
  116: ".",
  117: "?",
  118: "!",
  119: "+",
  120: "(special)",
};

// The phone codes of the US phone font (PH/ph_defs.h), in order.
const PHONES =
  "SIL IY IH EY EH AE AA AY AW AH AO OW OY UH UW RR YU AX IX IR ER AR OR UR W Y R LL HX RX LX M N NX EL DZ EN F V TH DH S Z SH ZH P B T D K G DX TX Q CH JH DF TZ CZ".split(
    " ",
  );

function symbolName(code: number): string {
  if (code >= 0x100) return PHONES[code - 0x100] ?? `?${code.toString(16)}`;
  return CONTROL[code] ?? `<${code.toString()}>`;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function trace(text: string, exe: string, workDir: string, scratch: string): string[] {
  const traceFile = path.join(scratch, "trace.txt");
  const wavFile = path.join(scratch, "out.wav");
  fs.rmSync(traceFile, { force: true });
  const run = spawnSync(exe, ["-w", wavFile, `[:np] [:ra 180] ${text}`], {
    cwd: workDir,
    env: { ...process.env, QPH_TRACE: traceFile },
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`say.exe exited ${String(run.status)}: ${run.stderr}`);
  if (!fs.existsSync(traceFile))
    throw new Error("say.exe wrote no trace: is it the instrumented build?");
  const lines = fs.readFileSync(traceFile, "utf8").split(/\r?\n/);
  const out = [`in    ${text}`];
  for (const line of lines) {
    if (line.startsWith("T ")) {
      out.push(`text  ${line.slice(2)}`);
    } else if (line.startsWith("S ")) {
      out.push(
        `ph    ${line
          .slice(2)
          .trim()
          .split(/\s+/)
          .map((hex) => symbolName(Number.parseInt(hex, 16)))
          .join(" ")}`,
      );
    }
  }
  return out;
}

function main(): void {
  const args = process.argv.slice(2);
  const texts: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--file") {
      index += 1;
      texts.push(
        ...fs
          .readFileSync(args[index], "utf8")
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0),
      );
    } else {
      texts.push(args[index]);
    }
  }
  if (texts.length === 0) throw new Error("give a text or --file <texts>");
  const exe = required("DECTALK_SAY_EXE");
  const workDir = required("DECTALK_WORKDIR");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "dectalk-trace-text-"));
  try {
    for (const text of texts) {
      console.log(trace(text, exe, workDir, scratch).join("\n"));
      console.log("");
    }
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

main();
