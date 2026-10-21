#!/usr/bin/env node

/**
 * export-text-parser-fixture.ts
 * =============================
 * Records what DECtalk 4.63's command text parser (CMD/cm_text.c with the
 * rules of CMD/par_rule2.par) makes of a text before the letter-to-sound
 * stage sees it: for each text, the clauses as cm_text.c hands them on.
 *
 * It needs the instrumented say.exe whose QPH_TRACE file gets a `T <text>`
 * line per clause (the text of output_buf where cm_text.c switches to
 * PAR_OUTPUT_CHARS; scripts/oracle/dectalk-debug). Bytes outside printable
 * ASCII arrive as `\xNN`, as the trace writes them.
 *
 * Inputs are list files (one text per line, `#` lines and blank lines
 * skipped) and oracle corpus JSON files (each entry's text). A text is
 * recorded once however many inputs hold it.
 *
 * say.exe adds clauses of white space and line ends when it finishes; those
 * are left out.
 *
 * Usage:
 *   DECTALK_VTM_SAY_EXE=<copy>/samples/SAY/build/us/static/say.exe \
 *   DECTALK_VTM_WORKDIR=<copy>/dapi/src/dic \
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-text-parser-fixture.ts --out <fixture.json> <input> ...
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const exe = process.env.DECTALK_VTM_SAY_EXE;
const workDir = process.env.DECTALK_VTM_WORKDIR;
if (!exe || !workDir) throw new Error("Set DECTALK_VTM_SAY_EXE and DECTALK_VTM_WORKDIR");
const argv = process.argv.slice(2);
const outIndex = argv.indexOf("--out");
if (outIndex < 0) throw new Error("--out <fixture.json> is required");
const outPath = path.resolve(argv[outIndex + 1]);
const inputs = argv.filter((_, index) => index !== outIndex && index !== outIndex + 1);
if (inputs.length === 0) throw new Error("Give at least one list or corpus file");

const texts: string[] = [];
for (const input of inputs) {
  const body = fs.readFileSync(path.resolve(input), "utf8");
  if (input.endsWith(".json")) {
    for (const entry of (JSON.parse(body) as { entries: { text: string }[] }).entries) {
      texts.push(entry.text);
    }
  } else {
    for (const line of body.split(/\r?\n/)) {
      const text = line.trim();
      if (text.length > 0 && !text.startsWith("#")) texts.push(text);
    }
  }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "text-parser-"));
const tracePath = path.join(tmp, "trace.txt");
/** say.exe's closing flush: white space and the line-end bytes only. */
const FLUSH = /^(?:\s|\\x0[ab])*$/;

const entries: Record<string, string[] | null> = {};
try {
  for (const text of new Set(texts)) {
    fs.rmSync(tracePath, { force: true });
    try {
      execFileSync(exe, ["-w", path.join(tmp, "out.wav"), text], {
        cwd: workDir,
        env: { ...process.env, QPH_TRACE: tracePath },
        stdio: ["ignore", "ignore", "ignore"],
      });
      entries[text] = fs
        .readFileSync(tracePath, "utf8")
        .split(/\r?\n/)
        .filter((line) => line.startsWith("T "))
        .map((line) => line.slice(2))
        .filter((clause) => !FLUSH.test(clause));
    } catch {
      // A text say.exe will not take as its argument (a leading "-").
      entries[text] = null;
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      schemaVersion: "v1",
      source:
        "DECtalk 4.63 say.exe, instrumented: the text of each clause as CMD/cm_text.c hands it to the letter-to-sound stage",
      encoding: "one string per clause; a byte outside printable ASCII is written \\xNN",
      inputs: inputs.map((input) => path.basename(input)),
      entries,
    },
    null,
    1,
  )}\n`,
);
console.log(
  JSON.stringify({
    texts: Object.keys(entries).length,
    out: path.relative(process.cwd(), outPath),
  }),
);
