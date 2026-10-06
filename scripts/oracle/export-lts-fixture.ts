#!/usr/bin/env node

/**
 * export-lts-fixture.ts
 * =====================
 * Records how DECtalk 4.63 pronounces words that are NOT in its dictionary,
 * i.e. the output of its letter-to-sound rules and the stress assignment that
 * follows them, as its phoneme log (`say.exe -lp`) prints it.
 *
 * Word list, chosen without looking at any result:
 *   - every word of public/cmu-dictionary.json that is 3 to 10 lowercase
 *     letters and is not a key of public/dectalk-dictionary.json, in
 *     alphabetical order, every Nth one so that about `--count` remain
 *     (default 400);
 *   - plus the words the oracle gate lists as letter-to-sound gaps.
 *
 * Each batch is spoken as one comma-separated list, so DECtalk prints one
 * clause per word and no word can be read as an abbreviation.
 *
 * Usage (needs DECTALK_SAY_EXE and DECTALK_WORKDIR; see
 * scripts/oracle/adapters/render-dectalk.ts):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-lts-fixture.ts [--count 400] [--out <file>]
 *
 * Output: test/fixtures/dectalk-oracle/dectalk-us-lts-v1.phonemes.json
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const exePath = process.env.DECTALK_SAY_EXE;
const workDir = process.env.DECTALK_WORKDIR;
if (!exePath || !workDir) throw new Error("Set DECTALK_SAY_EXE and DECTALK_WORKDIR");
const count = Number(flag("count") ?? 400);
const outPath = path.resolve(
  flag("out") ??
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", "dectalk-us-lts-v1.phonemes.json"),
);

// Words the oracle gate names as letter-to-sound gaps, and their neighbours.
const GATE_WORDS = [
  "barked", "yaks", "yelled", "lorries", "zones", "cape", "coke", "mainly",
  "thieves", "thrilled", "tapped", "bark", "yak", "yell", "lorry", "zone",
]; // biome-ignore format: a word list

const readKeys = (file: string): string[] =>
  Object.keys(JSON.parse(fs.readFileSync(path.join(repoRoot, "public", file), "utf8")) as object);
const inDectalkDictionary = new Set(readKeys("dectalk-dictionary.json"));
const candidates = readKeys("cmu-dictionary.json")
  .map((word) => word.toLowerCase())
  .filter((word) => /^[a-z]{3,10}$/.test(word) && !inDectalkDictionary.has(word))
  .sort();
const step = Math.max(1, Math.floor(candidates.length / count));
const sampled = candidates.filter((_word, index) => index % step === 0);
const words = [...new Set([...GATE_WORDS, ...sampled])];

function speak(batch: readonly string[]): string[] {
  const logPath = path.join(os.tmpdir(), `qlatt-lts-${process.pid.toString()}.txt`);
  fs.rmSync(logPath, { force: true });
  const result = spawnSync(exePath as string, ["-lp", logPath, `${batch.join(", ")}.`], {
    cwd: workDir,
    encoding: "utf8",
  });
  if (result.status !== 0 || !fs.existsSync(logPath)) {
    throw new Error(`E_SAY_FAILED: status ${String(result.status)} ${result.stderr ?? ""}`);
  }
  const lines = fs
    .readFileSync(logPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/[,.]\s*$/, "").trim())
    .filter((line) => line.length > 0);
  fs.rmSync(logPath, { force: true });
  return lines;
}

const entries: Record<string, string> = {};
const BATCH = 40;
for (let start = 0; start < words.length; start += BATCH) {
  const batch = words.slice(start, start + BATCH);
  let lines = speak(batch);
  if (lines.length !== batch.length) {
    // A word that DECtalk splits or merges breaks the one-clause-per-word
    // pairing for its batch; say those words one at a time.
    lines = batch.map((word) => speak([word]).join(" | "));
  }
  batch.forEach((word, index) => {
    entries[word] = lines[index];
  });
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      schemaVersion: "v1",
      source: "DECtalk 4.63 say.exe -lp, voice default, one comma-separated clause per word",
      selection: {
        from: "public/cmu-dictionary.json keys, 3-10 lowercase letters, not in public/dectalk-dictionary.json",
        everyNth: step,
        candidates: candidates.length,
        gateWords: GATE_WORDS,
      },
      entries: Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    1,
  )}\n`,
);
console.log(JSON.stringify({ words: words.length, out: path.relative(repoRoot, outPath) }));
