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

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { requiredEnvironment as required, runTextTrace } from "./text-trace";

function trace(text: string, exe: string, workDir: string, scratch: string): string[] {
  const { parserClauses, symbolClauses } = runTextTrace(text, exe, workDir, scratch);
  return [
    `in    ${text}`,
    ...parserClauses.map((clause) => `text  ${clause}`),
    ...symbolClauses.map((clause) => `ph    ${clause.join(" ")}`),
  ];
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
