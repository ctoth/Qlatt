#!/usr/bin/env node

/**
 * export-homograph-fixture.ts
 * ===========================
 * Records which of its two dictionary entries DECtalk 4.63 speaks for each
 * homograph ("house" the noun or "house" the verb), in a fixed set of short
 * sentences, as its phoneme log (`say.exe -lp`) prints the word.
 *
 * The words are the 254 of dic/Dic_us.txt with a primary (`P`) and a
 * secondary (`S`) row. The sentences (`CONTEXTS`) were fixed from the rule
 * table of LTS/ls_homo.h, one or two per kind of context it reads, before
 * any result was looked at: the word alone, after an article, "to", a
 * pronoun, a form of "be", "have", an auxiliary, a preposition, an
 * adjective, an interjection, a verb, a noun, an adverb after an article,
 * a question word, and first in a sentence with and without a verb after it.
 *
 * One run per word, the sentences separated by periods: DECtalk reads the
 * words up to each punctuation mark on their own (LTS/ls_task.c:365-406).
 *
 * Usage (needs DECTALK_SAY_EXE and DECTALK_WORKDIR; see
 * scripts/oracle/adapters/render-dectalk.ts):
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/oracle/export-homograph-fixture.ts [--dectalk <tree>] [--out <file>]
 *
 * Output: test/fixtures/dectalk-oracle/dectalk-us-homographs-v1.phonemes.json
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { selectDictionaryRows } from "../build-dectalk-dict";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};
const exePath = process.env.DECTALK_SAY_EXE;
const workDir = process.env.DECTALK_WORKDIR;
if (!exePath || !workDir) throw new Error("Set DECTALK_SAY_EXE and DECTALK_WORKDIR");
const dectalkRoot = flag("dectalk") ?? "C:/Users/Q/src/dectalk/463";
const outPath = path.resolve(
  flag("out") ??
    path.join(
      repoRoot,
      "test",
      "fixtures",
      "dectalk-oracle",
      "dectalk-us-homographs-v1.phonemes.json",
    ),
);

/** Each sentence's words, `*` standing for the homograph. */
export const CONTEXTS: Readonly<Record<string, readonly string[]>> = {
  alone: ["*"],
  "after-article": ["the", "*"],
  "after-to": ["to", "*"],
  "after-pronoun": ["they", "*"],
  "after-be": ["it", "is", "*"],
  "after-have": ["they", "have", "*"],
  "after-auxiliary": ["they", "will", "*"],
  "after-preposition": ["in", "*"],
  "after-adjective": ["big", "*"],
  "after-interjection": ["please", "*"],
  "after-verb": ["go", "*"],
  "after-noun": ["cat", "*"],
  "after-article-adverb": ["the", "very", "*"],
  "after-question-word": ["how", "*"],
  "first-no-verb-after": ["*", "the", "cat"],
  "first-verb-after": ["*", "it", "and", "go"],
};

// Symbols of the log that stand between words, not in them.
const BETWEEN_WORDS = new Set(["  ", ") ", "( ", "^ ", ", "]);

/** The log's sentences, each as its words, each word as its two-character symbols joined. */
function sentencesOf(log: string): string[][] {
  const sentences: string[][] = [];
  let words: string[] = [];
  let word = "";
  const endWord = () => {
    if (word !== "") words.push(word);
    word = "";
  };
  for (let i = 0; i < log.length; i += 2) {
    const symbol = log.slice(i, i + 2).padEnd(2, " ");
    if (symbol === ". ") {
      endWord();
      sentences.push(words);
      words = [];
    } else if (BETWEEN_WORDS.has(symbol)) {
      endWord();
    } else {
      word += symbol;
    }
  }
  endWord();
  if (words.length > 0) sentences.push(words);
  return sentences;
}

function logOf(text: string): string {
  const logPath = path.join(os.tmpdir(), `qlatt-homograph-${process.pid.toString()}.txt`);
  const wavPath = path.join(os.tmpdir(), `qlatt-homograph-${process.pid.toString()}.wav`);
  fs.rmSync(logPath, { force: true });
  const result = spawnSync(exePath as string, ["-w", wavPath, "-lp", logPath, text], {
    cwd: workDir,
    encoding: "utf8",
  });
  if (result.status !== 0 || !fs.existsSync(logPath)) {
    throw new Error(`E_SAY_FAILED: '${text}' status ${String(result.status)}`);
  }
  const log = fs.readFileSync(logPath, "utf8").replace(/[\r\n]/g, "");
  fs.rmSync(logPath, { force: true });
  fs.rmSync(wavPath, { force: true });
  return log;
}

function main(): void {
  const rows = selectDictionaryRows(
    fs.readFileSync(path.join(dectalkRoot, "dapi", "src", "dic", "Dic_us.txt"), "utf8"),
  );
  const contextIds = Object.keys(CONTEXTS);
  const entries: Record<string, Record<string, string>> = {};
  const skipped: Record<string, string> = {};
  for (const word of [...rows.secondary.keys()].sort()) {
    const text = contextIds
      .map((id) => `${CONTEXTS[id].map((part) => (part === "*" ? word : part)).join(" ")}.`)
      .join(" ");
    const sentences = sentencesOf(logOf(text));
    if (sentences.length !== contextIds.length) {
      throw new Error(
        `E_LOG_SENTENCES: '${word}' gave ${sentences.length.toString()} sentences for ${contextIds.length.toString()}`,
      );
    }
    // A word DECtalk does not speak as one word (it spells "apo" out) cannot
    // be found in the log by its place; it is listed, not recorded.
    const odd = contextIds.find((id, index) => sentences[index].length !== CONTEXTS[id].length);
    if (odd !== undefined) {
      const index = contextIds.indexOf(odd);
      skipped[word] =
        `${odd}: ${sentences[index].length.toString()} words in the log for ${CONTEXTS[odd].length.toString()}`;
      continue;
    }
    entries[word] = {};
    contextIds.forEach((id, index) => {
      entries[word][id] = sentences[index][CONTEXTS[id].indexOf("*")];
    });
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    `${JSON.stringify(
      {
        schemaVersion: "v1",
        source:
          "DECtalk 4.63 say.exe -lp, one run per word, one sentence per context; the homograph's own symbols",
        encoding:
          'two characters per symbol: a phone name, "\' " primary and "` " secondary stress',
        contexts: CONTEXTS,
        skipped,
        entries,
      },
      null,
      1,
    )}\n`,
  );
  console.log(
    JSON.stringify({
      words: Object.keys(entries).length,
      skipped,
      contexts: contextIds.length,
      out: path.relative(repoRoot, outPath),
    }),
  );
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) main();
