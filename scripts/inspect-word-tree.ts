#!/usr/bin/env node

/**
 * inspect-word-tree.ts
 * ====================
 * Checks that the SylStructure tree agrees with the Segment relation about
 * which word each phone belongs to.
 *
 * For every active Segment it prints the `word` string feature, the tree's
 * Word ancestor (id and text), and the Syllable ancestor. It then reports:
 *
 *   orphan      a non-silence segment with no Word ancestor
 *   mismatch    the Word ancestor's text differs from the segment's `word`
 *   scattered   a Word whose segments are not one contiguous run of the
 *               Segment relation
 *   punctuation a punctuation silence that sits inside a Word
 *
 * Usage:
 *   node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node \
 *     scripts/inspect-word-tree.ts [--frontend dectalk-english] [--verbose] "text" ...
 *
 * With no text it reads both DECtalk oracle corpora. Exit code 1 when any
 * finding is reported.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { textToKlattTrackDetailed } from "../src/tts-frontend.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const verbose = args.includes("--verbose");
const frontendFlag = args.indexOf("--frontend");
const frontendId = frontendFlag >= 0 ? args[frontendFlag + 1] : "dectalk-english";
const texts = args.filter(
  (arg, index) => !arg.startsWith("--") && (frontendFlag < 0 || index !== frontendFlag + 1),
);

if (texts.length === 0) {
  for (const file of ["dectalk-us-v1.json", "dectalk-us-heldout-v1.json"]) {
    const corpus = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "test", "oracle-corpora", file), "utf8"),
    ) as { entries: Array<{ text: string }> };
    for (const entry of corpus.entries) texts.push(entry.text);
  }
}

let findings = 0;
for (const text of texts) {
  let utterance: ReturnType<typeof textToKlattTrackDetailed>["utterance"];
  try {
    utterance = textToKlattTrackDetailed(text, undefined, 30, { frontendId }).utterance;
  } catch (error) {
    findings += 1;
    console.log(`${JSON.stringify(text)}: threw ${String(error)}`);
    continue;
  }
  const structure = utterance.relation("SylStructure");
  const ancestor = (item: Parameters<typeof structure.node>[0], type: string) => {
    let node = structure.node(item) ?? null;
    while (node) {
      if (node.item.type === type) return node.item;
      node = node.parent;
    }
    return undefined;
  };
  const rows: Array<{ phoneme: string; word: string; wordId: string; treeText: string }> = [];
  const problems: string[] = [];
  for (const item of utterance.relation("Segment").listItems()) {
    if (item.get("active") === false) continue;
    const phoneme = String(item.get("phoneme"));
    const word = item.get("word");
    const treeWord = ancestor(item, "word");
    const syllable = ancestor(item, "syllable");
    rows.push({
      phoneme,
      word: typeof word === "string" ? word : "",
      wordId: treeWord?.id ?? "-",
      treeText: String(treeWord?.get("text") ?? ""),
    });
    if (verbose) {
      console.log(
        `  ${item.id.padEnd(14)} ${phoneme.padEnd(8)} word=${JSON.stringify(word ?? null)} ` +
          `tree=${treeWord?.id ?? "-"}:${String(treeWord?.get("text") ?? "")} ` +
          `syl=${syllable?.id ?? "-"}`,
      );
    }
    // A punctuation silence carries its mark as `word` and belongs to no Word.
    if (item.get("punctuationSymbol") != null) {
      if (treeWord) problems.push(`punctuation ${String(word)} inside ${treeWord.id}`);
      continue;
    }
    if (typeof word !== "string" || word === "") continue;
    if (!treeWord) problems.push(`orphan ${phoneme} (word ${word})`);
    else if (String(treeWord.get("text")).toLowerCase() !== word.toLowerCase())
      problems.push(`mismatch ${phoneme}: word ${word}, tree ${String(treeWord.get("text"))}`);
  }
  const seen = new Set<string>();
  let previous = "-";
  for (const row of rows) {
    if (row.wordId === "-") {
      previous = "-";
      continue;
    }
    if (row.wordId !== previous && seen.has(row.wordId))
      problems.push(`scattered ${row.wordId}:${row.treeText} resumes at ${row.phoneme}`);
    seen.add(row.wordId);
    previous = row.wordId;
  }
  if (problems.length > 0) {
    findings += problems.length;
    console.log(JSON.stringify(text));
    for (const problem of problems) console.log(`  ${problem}`);
  }
}
console.log(JSON.stringify({ texts: texts.length, findings }));
process.exit(findings > 0 ? 1 : 0);
