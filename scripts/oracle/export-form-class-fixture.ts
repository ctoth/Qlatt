#!/usr/bin/env node

/**
 * export-form-class-fixture.ts
 * ============================
 * Records the form class word DECtalk 4.63 gives a word, as its form log
 * prints it (`[:log form on]`, LTS/ls_suff.c ls_suff_print_fc), one word per
 * run so that each log holds exactly one word's classes.
 *
 * Word list, chosen without looking at any result:
 *   - every word of the letter-to-sound fixture
 *     (test/fixtures/dectalk-oracle/dectalk-us-lts-v1.phonemes.json): words
 *     that are not in DECtalk's dictionary, so their class comes from a suffix
 *     rule or is unknown;
 *   - every Nth key of public/dectalk-dictionary.json that is 2 to 10
 *     lowercase letters, in alphabetical order, so that about `--count`
 *     remain (default 300);
 *   - the function words the clause rules read (`FUNCTION_WORDS`).
 *
 * The log's strings are turned back into bit numbers: they print in bit order
 * and "conj" stands for two bits (6 and 24), so each string is matched at the
 * first position after the previous one.
 *
 * Usage (needs DECTALK_SAY_EXE and DECTALK_WORKDIR; see
 * scripts/oracle/adapters/render-dectalk.ts):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-form-class-fixture.ts [--count 300] [--out <file>]
 *
 * Output: test/fixtures/dectalk-oracle/dectalk-us-form-classes-v1.json
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
const count = Number(flag("count") ?? 300);
const outPath = path.resolve(
  flag("out") ??
    path.join(repoRoot, "test", "fixtures", "dectalk-oracle", "dectalk-us-form-classes-v1.json"),
);

// LTS/ls_suff.c:366-398 form_class_strings[], by bit.
const LOG_STRINGS = [
  "adj", "adv", "art", "aux", "be", "bev", "conj", "ed", "have", "ing", "noun",
  "pos", "prep", "pron", "subj", "that", "to", "verb", "who", "neg", "intr",
  "ref", "part", "func", "conj", "char", "refr", "unused", "unused", "mark",
  "cont",
]; // biome-ignore format: a table in source order

const FUNCTION_WORDS = [
  "and", "are", "be", "been", "being", "but", "can", "do", "for", "had",
  "have", "is", "may", "must", "to", "up", "was", "were", "will", "would",
]; // biome-ignore format: a word list

const readJson = <T>(...parts: string[]): T =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, ...parts), "utf8")) as T;
const ltsWords = Object.keys(
  readJson<{ entries: Record<string, string> }>(
    "test",
    "fixtures",
    "dectalk-oracle",
    "dectalk-us-lts-v1.phonemes.json",
  ).entries,
);
const dictionaryWords = Object.keys(
  readJson<Record<string, string>>("public", "dectalk-dictionary.json"),
)
  .filter((word) => /^[a-z]{2,10}$/.test(word))
  .sort();
const step = Math.max(1, Math.floor(dictionaryWords.length / count));
const sampled = dictionaryWords.filter((_word, index) => index % step === 0);
const words = [...new Set([...FUNCTION_WORDS, ...ltsWords, ...sampled])].sort();

/** The bit numbers of one word's form log, or null when the log is not one word's. */
function formClassBits(word: string): number[] | null {
  const logPath = path.join(os.tmpdir(), `qlatt-form-${process.pid.toString()}.txt`);
  fs.rmSync(logPath, { force: true });
  const result = spawnSync(exePath as string, ["-lp", logPath, `[:log form on] ${word}`], {
    cwd: workDir,
    encoding: "utf8",
  });
  if (result.status !== 0 || !fs.existsSync(logPath)) {
    throw new Error(`E_SAY_FAILED: '${word}' status ${String(result.status)}`);
  }
  const log = fs.readFileSync(logPath, "utf8");
  fs.rmSync(logPath, { force: true });
  const forms = [...log.matchAll(/\[:form([^\]]*)\]/g)];
  if (forms.length !== 1) return null;
  const body = forms[0][1];
  if (/unknown/.test(body)) return /^\s*1 : unknown\.\s*$/.test(body) ? [] : null;
  const bits: number[] = [];
  let from = 0;
  for (const match of body.matchAll(/(\S+) fc/g)) {
    const bit = LOG_STRINGS.indexOf(match[1], from);
    if (bit < 0) return null;
    bits.push(bit);
    from = bit + 1;
  }
  return bits;
}

const entries: Record<string, number[]> = {};
const skipped: string[] = [];
for (const word of words) {
  const bits = formClassBits(word);
  if (bits === null) skipped.push(word);
  else entries[word] = bits;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  `${JSON.stringify(
    {
      schemaVersion: "v1",
      source: "DECtalk 4.63 say.exe -lp with [:log form on], one word per run",
      encoding: "bit numbers of the form class word (INCLUDE/fc_def.tab); [] is unknown",
      selection: {
        ltsFixtureWords: ltsWords.length,
        dictionaryEveryNth: step,
        functionWords: FUNCTION_WORDS,
      },
      skipped,
      entries: Object.fromEntries(
        Object.entries(entries).map(([word, bits]) => [word, bits.join(" ")]),
      ),
    },
    null,
    1,
  )}\n`,
);
console.log(
  JSON.stringify({
    words: words.length,
    recorded: Object.keys(entries).length,
    skipped: skipped.length,
    out: path.relative(repoRoot, outPath),
  }),
);
