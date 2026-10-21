/**
 * text-trace.ts
 * =============
 * Runs the instrumented DECtalk 4.63 say.exe on a text and returns what its
 * text stage did, from the lines the instrumented copy appends to the file
 * named by QPH_TRACE (README.md of this directory):
 *
 *   `T <text>`     each clause as the command parser hands it to
 *                  letter-to-sound (CMD/cm_text.c output_buf, after the
 *                  CMD/par_*.c rule parser); a byte outside printable ASCII
 *                  is written \xNN
 *   `S <symbols>`  the symbols the phonemic stage receives for each clause
 *                  (PH/ph_sort.c)
 *
 * Used by trace-text.ts (prints them) and messy-sweep-layers.ts (classifies).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
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

/** A phone by its name, a stress or boundary symbol by its mark. */
export function symbolName(code: number): string {
  if (code >= 0x100) return PHONES[code - 0x100] ?? `?${code.toString(16)}`;
  return CONTROL[code] ?? `<${code.toString()}>`;
}

export interface TextTrace {
  /** The `T` lines in order: one per clause the parser hands on, as traced. */
  parserClauses: string[];
  /** The `S` lines in order: the symbols of each clause, by name. */
  symbolClauses: string[][];
}

export function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

/** Speak `text` (no pause between words off, 180 words per minute) and read the trace. */
export function runTextTrace(
  text: string,
  exe: string,
  workDir: string,
  scratch: string,
): TextTrace {
  const traceFile = path.join(scratch, "trace.txt");
  const wavFile = path.join(scratch, "out.wav");
  fs.rmSync(traceFile, { force: true });
  const run = spawnSync(exe, ["-w", wavFile, `[:np] [:ra 180] ${text}`], {
    cwd: workDir,
    env: { ...process.env, QPH_TRACE: traceFile },
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`say.exe exited ${String(run.status)}: ${run.stderr}`);
  if (!fs.existsSync(traceFile)) {
    throw new Error("say.exe wrote no trace: is it the instrumented build?");
  }
  const parserClauses: string[] = [];
  const symbolClauses: string[][] = [];
  for (const line of fs.readFileSync(traceFile, "utf8").split(/\r?\n/)) {
    if (line.startsWith("T ")) {
      parserClauses.push(line.slice(2));
    } else if (line.startsWith("S ")) {
      symbolClauses.push(
        line
          .slice(2)
          .trim()
          .split(/\s+/)
          .map((hex) => symbolName(Number.parseInt(hex, 16))),
      );
    }
  }
  return { parserClauses, symbolClauses };
}
