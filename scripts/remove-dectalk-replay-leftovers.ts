#!/usr/bin/env node

/**
 * remove-dectalk-replay-leftovers.ts
 * ==================================
 * One-off bulk deletion that follows the removal of the word-keyed "cake" and
 * "the" trace-replay rules from the dectalk-english frontend. It deletes only
 * what those rules left behind, and refuses to write unless the result is
 * exactly the input minus the intended pieces.
 *
 *   1. frontend.yaml: every policy key at the 6-space level whose name starts
 *      with `cake_` or `the_`, with its value and the comment lines directly
 *      above it. Check: the YAML parses to the old data with those keys
 *      removed and nothing else changed.
 *   2. lts-rules.yaml: each whole-word entry introduced by a comment of the
 *      form `# DECtalk 4.63 -lp oracle for "<phrase>" ...`. Check: the parsed
 *      rule lists lose exactly those entries.
 *   3. test/dectalk-e2e.test.ts: the `it(...)` blocks whose titles are listed,
 *      one per line, in --titles <file>. Check: every title is found exactly
 *      once and the file loses exactly those blocks.
 *
 * Run on a clean tree so `git diff` is the record. Delete this script after
 * its change is committed.
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/remove-dectalk-replay-leftovers.ts --titles <file> [--write]
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as yaml from "js-yaml";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const titlesIndex = argv.indexOf("--titles");
if (titlesIndex < 0 || !argv[titlesIndex + 1]) throw new Error("--titles <file> is required");
const write = argv.includes("--write");
const frontendDir = path.join(repoRoot, "public", "rules", "frontends", "dectalk-english");

type PlainObject = Record<string, unknown>;
const isPlainObject = (value: unknown): value is PlainObject =>
  value != null && typeof value === "object" && !Array.isArray(value);

// ---------------------------------------------------------------------------
// 1. frontend.yaml policy keys
// ---------------------------------------------------------------------------
// The families the deleted replay rules read. `the_iy_prevocalic_lengthening`
// is a real duration rule's parameter and must not match.
const REPLAY_KEY =
  /^ {6}(cake_[a-z0-9_]*|the_dh_[a-z0-9_]*|the_ax_[a-z0-9_]*|the_tl_db|the_terminal_silence_[a-z0-9_]*):/;
const frontendPath = path.join(frontendDir, "frontend.yaml");
const frontendBefore = fs.readFileSync(frontendPath, "utf8");
const frontendEol = frontendBefore.includes("\r\n") ? "\r\n" : "\n";
const frontendLines = frontendBefore.split(/\r?\n/);
const dropLine = new Array<boolean>(frontendLines.length).fill(false);
const removedKeys: string[] = [];
for (let index = 0; index < frontendLines.length; index += 1) {
  const match = REPLAY_KEY.exec(frontendLines[index]);
  if (!match) continue;
  removedKeys.push(match[1]);
  // The key, then its value: every following line that is blank or indented
  // deeper than the key.
  let end = index + 1;
  while (end < frontendLines.length && /^(?: {7,}\S|\s*$)/.test(frontendLines[end])) end += 1;
  // Trailing blank lines belong to whatever follows.
  while (end > index + 1 && /^\s*$/.test(frontendLines[end - 1])) end -= 1;
  // Comment lines directly above the key describe it.
  let start = index;
  while (start > 0 && /^ {6}#/.test(frontendLines[start - 1]) && !dropLine[start - 1]) start -= 1;
  for (let line = start; line < end; line += 1) dropLine[line] = true;
}
const frontendAfter = frontendLines.filter((_, index) => !dropLine[index]).join(frontendEol);

function withoutKeys(value: unknown, keys: ReadonlySet<string>, removed: string[]): unknown {
  if (Array.isArray(value)) return value.map((entry) => withoutKeys(entry, keys, removed));
  if (!isPlainObject(value)) return value;
  const out: PlainObject = {};
  for (const [key, child] of Object.entries(value)) {
    if (keys.has(key)) {
      removed.push(key);
      continue;
    }
    out[key] = withoutKeys(child, keys, removed);
  }
  return out;
}
const actuallyRemoved: string[] = [];
const expectedFrontend = withoutKeys(
  yaml.load(frontendBefore),
  new Set(removedKeys),
  actuallyRemoved,
);
assert.deepEqual(yaml.load(frontendAfter), expectedFrontend, "frontend.yaml changed elsewhere");
assert.deepEqual(
  [...actuallyRemoved].sort(),
  [...removedKeys].sort(),
  "a removed key name also exists at another level",
);
// No remaining rule, function or phase list may still name a removed key.
const stillReferenced: string[] = [];
const ruleFiles = [
  path.join(frontendDir, "pipeline.yaml"),
  ...fs
    .readdirSync(path.join(frontendDir, "phases"))
    .filter((name) => name.endsWith(".yaml"))
    .map((name) => path.join(frontendDir, "phases", name)),
];
for (const file of ruleFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const key of removedKeys) {
    if (new RegExp(`\\.${key}\\b`).test(text)) stillReferenced.push(`${path.basename(file)}: ${key}`);
  }
}
assert.deepEqual(stillReferenced, [], "a removed policy key is still referenced by a rule");

// ---------------------------------------------------------------------------
// 2. lts-rules.yaml whole-word entries
// ---------------------------------------------------------------------------
const ltsPath = path.join(frontendDir, "lts-rules.yaml");
const ltsBefore = fs.readFileSync(ltsPath, "utf8");
const ltsEol = ltsBefore.includes("\r\n") ? "\r\n" : "\n";
const ltsLines = ltsBefore.split(/\r?\n/);
const dropLts = new Array<boolean>(ltsLines.length).fill(false);
const removedWords: string[] = [];
for (let index = 0; index < ltsLines.length; index += 1) {
  if (!/^\s*#.*-lp oracle for\s+"/.test(ltsLines[index])) continue;
  const entryIndent = /^(\s*)- left:/.exec(ltsLines[index + 1] ?? "");
  assert.ok(entryIndent, `lts-rules.yaml:${index + 2} is not an entry start`);
  let end = index + 2;
  const deeper = new RegExp(`^${entryIndent[1]} {2}\\S`);
  while (end < ltsLines.length && deeper.test(ltsLines[end])) end += 1;
  const block = ltsLines.slice(index + 1, end).join("\n");
  assert.ok(/left: ' '/.test(block) && /right: ' '/.test(block), `entry at ${index + 2} is not whole-word`);
  removedWords.push(/letters:\s*(\S+)/.exec(block)?.[1] ?? "?");
  for (let line = index; line < end; line += 1) dropLts[line] = true;
}
const ltsAfter = ltsLines.filter((_, index) => !dropLts[index]).join(ltsEol);

function countEntries(value: unknown, letters: Map<string, number>): void {
  if (Array.isArray(value)) {
    for (const entry of value) countEntries(entry, letters);
  } else if (isPlainObject(value)) {
    if (typeof value.letters === "string" && "phonemes" in value) {
      const key = `${String(value.left)}|${value.letters}|${String(value.right)}`;
      letters.set(key, (letters.get(key) ?? 0) + 1);
    }
    for (const child of Object.values(value)) countEntries(child, letters);
  }
}
const ltsCountsBefore = new Map<string, number>();
const ltsCountsAfter = new Map<string, number>();
countEntries(yaml.load(ltsBefore), ltsCountsBefore);
countEntries(yaml.load(ltsAfter), ltsCountsAfter);
for (const word of removedWords) {
  const key = ` |${word}| `;
  ltsCountsBefore.set(key, (ltsCountsBefore.get(key) ?? 0) - 1);
  if (ltsCountsBefore.get(key) === 0) ltsCountsBefore.delete(key);
}
assert.deepEqual(
  [...ltsCountsAfter].sort(),
  [...ltsCountsBefore].sort(),
  "lts-rules.yaml lost or gained an entry other than the whole-word ones",
);

// ---------------------------------------------------------------------------
// 3. test/dectalk-e2e.test.ts blocks
// ---------------------------------------------------------------------------
const titles = fs
  .readFileSync(path.resolve(argv[titlesIndex + 1]), "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0);
const testPath = path.join(repoRoot, "test", "dectalk-e2e.test.ts");
const testBefore = fs.readFileSync(testPath, "utf8");
const testEol = testBefore.includes("\r\n") ? "\r\n" : "\n";
const testLines = testBefore.split(/\r?\n/);
const dropTest = new Array<boolean>(testLines.length).fill(false);
const wanted = new Set(titles);
const found: string[] = [];
for (let index = 0; index < testLines.length; index += 1) {
  const match = /^ {2}it\("((?:[^"\\]|\\.)*)"/.exec(testLines[index]);
  if (!match || !wanted.has(match[1])) continue;
  found.push(match[1]);
  let end = index;
  while (end < testLines.length && !/^ {2}\}(?:, \d+)?\);\s*$/.test(testLines[end])) end += 1;
  assert.ok(end < testLines.length, `no end for test '${match[1]}'`);
  end += 1;
  // One blank separator line goes with the block.
  if (/^\s*$/.test(testLines[end] ?? "x")) end += 1;
  for (let line = index; line < end; line += 1) {
    assert.ok(line === index || !/^ {2}it\("/.test(testLines[line]), `test '${match[1]}' ran into another test`);
    dropTest[line] = true;
  }
}
assert.deepEqual([...found].sort(), [...titles].sort(), "a listed test title was not found exactly once");
const testAfter = testLines.filter((_, index) => !dropTest[index]).join(testEol);
const countTests = (text: string): number => (text.match(/^ {2}it(?:\.each\([^)]*\))?\(/gm) ?? []).length;
assert.equal(countTests(testBefore) - countTests(testAfter), titles.length, "test count mismatch");

const lineCount = (text: string): number => text.split(/\r?\n/).length;
console.log(
  JSON.stringify(
    {
      frontendKeysRemoved: removedKeys.length,
      frontendLinesRemoved: lineCount(frontendBefore) - lineCount(frontendAfter),
      ltsEntriesRemoved: removedWords,
      ltsLinesRemoved: lineCount(ltsBefore) - lineCount(ltsAfter),
      testsRemoved: titles.length,
      testLinesRemoved: lineCount(testBefore) - lineCount(testAfter),
      written: write,
    },
    null,
    2,
  ),
);
if (write) {
  fs.writeFileSync(frontendPath, frontendAfter, "utf8");
  fs.writeFileSync(ltsPath, ltsAfter, "utf8");
  fs.writeFileSync(testPath, testAfter, "utf8");
}
