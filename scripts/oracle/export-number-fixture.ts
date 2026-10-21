#!/usr/bin/env node

/**
 * export-number-fixture.ts
 * ========================
 * Records how DECtalk 4.63 speaks numbers written in digits, as its phoneme
 * log (`say.exe -lp`) prints them: the phones, stress marks, word boundaries,
 * verb-phrase starts and pauses its number routine sends (LTS/l_us_pr1.c).
 *
 * Number list, fixed without looking at any result:
 *   - 0 to 120;
 *   - every 37th number from 121 to 5,000 and every 9,973rd from 5,000 to
 *     2,000,000;
 *   - round numbers and their neighbours for each group name (hundred,
 *     thousand, million, billion, trillion, quadrillion);
 *   - grouped forms ("1,234,567"), leading zeros ("007") and digit strings
 *     longer than DECtalk reads as one number.
 *
 * One number per run, so each log holds exactly one number.
 *
 * Usage (needs DECTALK_SAY_EXE and DECTALK_WORKDIR; see
 * scripts/oracle/adapters/render-dectalk.ts):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-number-fixture.ts [--out <file>]
 *     scripts/oracle/export-number-fixture.ts --list <texts.txt> --out <file>
 *
 * Output: test/fixtures/dectalk-oracle/dectalk-us-numbers-v1.phonemes.json
 *
 * --list records the texts of a list file instead (one per line), for
 * number-like tokens the text stage reads in its own ways: money, times,
 * decimals (test/oracle-corpora/dectalk-us-number-tokens-v1.txt). A text
 * say.exe refuses is recorded as null.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const outIndex = argv.indexOf("--out");
const exePath = process.env.DECTALK_SAY_EXE;
const workDir = process.env.DECTALK_WORKDIR;
if (!exePath || !workDir) throw new Error("Set DECTALK_SAY_EXE and DECTALK_WORKDIR");
const outPath = path.resolve(
  outIndex >= 0
    ? argv[outIndex + 1]
    : path.join(
        repoRoot,
        "test",
        "fixtures",
        "dectalk-oracle",
        "dectalk-us-numbers-v1.phonemes.json",
      ),
);

const listIndex = argv.indexOf("--list");
/** With --list: the texts of a list file, one per line; `#` lines and blank lines skipped. */
const listed: string[] | undefined =
  listIndex >= 0
    ? fs
        .readFileSync(path.resolve(argv[listIndex + 1]), "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"))
    : undefined;
if (listed && outIndex < 0) throw new Error("--list needs --out");

const numbers: string[] = [];
for (let n = 0; n <= 120; n += 1) numbers.push(n.toString());
for (let n = 121; n <= 5000; n += 37) numbers.push(n.toString());
for (let n = 5000; n <= 2_000_000; n += 9973) numbers.push(n.toString());
for (const zeros of [2, 3, 6, 9, 12, 15]) {
  const unit = 10n ** BigInt(zeros);
  for (const value of [unit - 1n, unit, unit + 1n, unit + 5n, unit + 20n, unit * 2n, unit * 15n]) {
    numbers.push(value.toString());
  }
  numbers.push((unit + unit / 2n).toString(), (unit * 7n + unit / 10n).toString());
}
numbers.push(
  "1,234,567", "12,345", "1,000", "1,005", "1,500,000", "1,000,005", "999,999,999,999,999,999",
  "007", "00", "0123", "000123", "0001234567",
  "1234567890123456789", "12345678901234567890", "1,234,567,890,123,456,789,012",
); // biome-ignore format: a list

/** DECtalk's log for one number, line breaks removed, the final ". " kept. */
function logOf(text: string): string {
  const logPath = path.join(os.tmpdir(), `qlatt-number-${process.pid.toString()}.txt`);
  fs.rmSync(logPath, { force: true });
  const result = spawnSync(exePath as string, ["-lp", logPath, text], {
    cwd: workDir,
    encoding: "utf8",
  });
  if (result.status !== 0 || !fs.existsSync(logPath)) {
    throw new Error(`E_SAY_FAILED: '${text}' status ${String(result.status)}`);
  }
  const log = fs.readFileSync(logPath, "utf8").replace(/[\r\n]/g, "");
  fs.rmSync(logPath, { force: true });
  return log;
}

const entries: Record<string, string | null> = {};
if (listed) {
  // A listed text may be one say.exe will not take as its text argument (it
  // reads a leading "-" as an option): that entry is recorded as null.
  for (const text of [...new Set(listed)]) {
    try {
      entries[text] = logOf(text);
    } catch {
      entries[text] = null;
    }
  }
} else {
  for (const text of [...new Set(numbers)]) entries[text] = logOf(text);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      schemaVersion: "v1",
      source: "DECtalk 4.63 say.exe -lp, one number per run, line breaks removed",
      encoding:
        'two characters per symbol: a phone name, "\' " primary stress, "  " word boundary, ") " verb-phrase start, ", " pause, ". " end',
      entries,
    },
    null,
    1,
  )}\n`,
);
console.log(
  JSON.stringify({ numbers: Object.keys(entries).length, out: path.relative(repoRoot, outPath) }),
);
